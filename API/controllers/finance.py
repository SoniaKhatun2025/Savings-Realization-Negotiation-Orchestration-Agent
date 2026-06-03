from fastapi import APIRouter, Depends, HTTPException
from utils.auth_deps import require_role
from utils.helpers import format_api_response
from services.budget_service import (
    create_budget,
    update_budget,
    list_budgets,
)
from database.connection import get_db_connection
from database.queries import VALIDATE_SAVINGS_AGAINST_BUDGET
from database.models import BudgetCreate, BudgetUpdate, ValidateSavingsRequest
from utils.helpers import log_audit_event
from services.email_service import send_notification_email

router = APIRouter(prefix="/finance", tags=["Finance Controller"])
router_savings = APIRouter(prefix="/savings", tags=["Savings"])

@router.post("/budget")
def add_budget(req: BudgetCreate, current_user: dict = Depends(require_role(["Finance Controller"]))):
    budget = create_budget(req.category, req.fiscal_year, req.allocated_amount)
    
    if budget:
        budget = {
            "id": budget["id"],
            "category": budget["category"],
            "fiscal_year": budget["fiscal_year"],
            "allocated_amount": float(budget["allocated_amount"] or 0.0),
            "actual_spend": float(budget["actual_spend"] or 0.0),
            "created_at": str(budget["created_at"])
        }
    return format_api_response(data=budget, message="Budget created successfully")

@router.put("/budget/{budget_id}")
def edit_budget(budget_id: int, req: BudgetUpdate, current_user: dict = Depends(require_role(["Finance Controller"]))):
    budget = update_budget(budget_id, req.allocated_amount, req.actual_spend)
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
        
    budget = {
        "id": budget["id"],
        "category": budget["category"],
        "fiscal_year": budget["fiscal_year"],
        "allocated_amount": float(budget["allocated_amount"] or 0.0),
        "actual_spend": float(budget["actual_spend"] or 0.0),
        "created_at": str(budget["created_at"])
    }
    return format_api_response(data=budget, message="Budget updated successfully")

@router.get("/budgets")
def get_budgets(current_user: dict = Depends(require_role(["Finance Controller"]))):
    budgets = list_budgets()
    formatted = []
    for b in budgets:
        formatted.append({
            "id": b["id"],
            "category": b["category"],
            "fiscal_year": b["fiscal_year"],
            "allocated_amount": float(b["allocated_amount"] or 0.0),
            "actual_spend": float(b["actual_spend"] or 0.0),
            "created_at": str(b["created_at"])
        })
    return format_api_response(data=formatted)

@router.get("/validate")
def validate_savings(current_user: dict = Depends(require_role(["Finance Controller"]))):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(VALIDATE_SAVINGS_AGAINST_BUDGET)
    mismatches = cur.fetchall()
    
    formatted = []
    for m in mismatches:
        formatted.append({
            "category": m["category"],
            "fiscal_year": m["fiscal_year"],
            "allocated_amount": float(m["allocated_amount"] or 0.0),
            "realized": float(m["realized"] or 0.0),
            "variance": float(m["variance"] or 0.0)
        })
        
    conn.close()
    return format_api_response(data=formatted)

@router_savings.post("/validate")
def validate_savings_endpoint(req: ValidateSavingsRequest, current_user: dict = Depends(require_role(["Finance Controller"]))):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Verify opportunity exists
    cursor.execute("SELECT id, supplier_id, category, current_spend, benchmark_spend, assigned_buyer_id FROM opportunities WHERE id = %s", (req.opportunity_id,))
    opp = cursor.fetchone()
    if not opp:
        conn.close()
        raise HTTPException(status_code=404, detail="Opportunity not found")
        
    # 2. Find related negotiation if any
    cursor.execute("SELECT id, expected_savings FROM negotiations WHERE opportunity_id = %s LIMIT 1", (req.opportunity_id,))
    neg = cursor.fetchone()
    
    # Start transaction
    conn.autocommit(False)
    try:
        # 3. Insert into savings_ledger
        cursor.execute("""
            INSERT INTO savings_ledger (opportunity_id, validated_amount, validated_by, status)
            VALUES (%s, %s, %s, 'Approved')
        """, (req.opportunity_id, req.validated_amount, current_user["id"]))
        ledger_id = cursor.lastrowid
        
        # 4. Create or Update savings_tracker
        is_cpo_approved = False
        if neg:
            # Check CPO approval status
            cursor.execute("SELECT status FROM approvals WHERE negotiation_id = %s", (neg["id"],))
            app_row = cursor.fetchone()
            is_cpo_approved = app_row is not None and app_row["status"] == "approved"
            
            cursor.execute("SELECT id FROM savings_tracker WHERE negotiation_id = %s", (neg["id"],))
            existing_tracker = cursor.fetchone()
            
            status_name = "Validated" if is_cpo_approved else "Pending Validation"
            
            if existing_tracker:
                cursor.execute("""
                    UPDATE savings_tracker 
                    SET realized_savings = %s, 
                        status_id = (SELECT id FROM statuses WHERE category='Savings' AND name=%s),
                        validated_by_id = %s,
                        validated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                """, (req.validated_amount, status_name, current_user["id"], existing_tracker["id"]))
            else:
                cursor.execute("""
                    INSERT INTO savings_tracker (negotiation_id, planned_savings, realized_savings, status_id, validated_by_id, validated_at)
                    VALUES (%s, %s, %s, (SELECT id FROM statuses WHERE category='Savings' AND name=%s), %s, CURRENT_TIMESTAMP)
                """, (neg["id"], neg["expected_savings"], req.validated_amount, status_name, current_user["id"]))
        
        # 5. Update opportunity and negotiation status if CPO has approved or if no negotiation exists
        if not neg or is_cpo_approved:
            cursor.execute("""
                UPDATE opportunities 
                SET status_id = (SELECT id FROM statuses WHERE category='Opportunity' AND name='Completed')
                WHERE id = %s
            """, (req.opportunity_id,))
            
            if neg:
                cursor.execute("""
                    UPDATE negotiations
                    SET status_id = (SELECT id FROM statuses WHERE category='Negotiation' AND name='Completed'),
                        actual_price = %s,
                        realised_savings = %s
                    WHERE id = %s
                """, (float(opp["current_spend"] or 0.0) - req.validated_amount, req.validated_amount, neg["id"]))
        else:
            if neg:
                cursor.execute("""
                    UPDATE negotiations
                    SET actual_price = %s,
                        realised_savings = %s
                    WHERE id = %s
                """, (float(opp["current_spend"] or 0.0) - req.validated_amount, req.validated_amount, neg["id"]))
            
        # 7. Create notification for buyer and CPO
        notif_msg = f"Savings of Rs.{req.validated_amount:,.2f} for opportunity {req.opportunity_id} have been officially validated by Finance."
        if opp["assigned_buyer_id"]:
            cursor.execute("INSERT INTO notifications (user_id, title, message, opportunity_id) VALUES (%s, %s, %s, %s)",
                           (opp["assigned_buyer_id"], "Savings Validated", notif_msg, req.opportunity_id))
            cursor.execute("SELECT email FROM users WHERE id = %s", (opp["assigned_buyer_id"],))
            buyer_row = cursor.fetchone()
            if buyer_row and buyer_row.get("email"):
                send_notification_email(buyer_row["email"], f"Savings Validated for Contract ID: {req.opportunity_id}", notif_msg)
            
        # Find CPO user ID to notify
        cursor.execute("SELECT u.id, u.email FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = 'CPO'")
        cpo_users = cursor.fetchall()
        for cpo_user in cpo_users:
            cursor.execute("INSERT INTO notifications (user_id, title, message, opportunity_id) VALUES (%s, %s, %s, %s)",
                           (cpo_user["id"], "Savings Validated", notif_msg, req.opportunity_id))
            if cpo_user.get("email"):
                send_notification_email(cpo_user["email"], f"Savings Validated for Contract ID: {req.opportunity_id}", notif_msg)
            
        conn.commit()
        
        # Update Knowledge Graph safely
        try:
            cursor.execute("SELECT name FROM suppliers WHERE id = %s", (opp["supplier_id"],))
            supplier_row = cursor.fetchone()
            if supplier_row and neg:
                from graph import update_savings_graph
                update_savings_graph(
                    supplier_name=supplier_row["name"],
                    negotiation_id=neg["id"],
                    opportunity_id=req.opportunity_id,
                    realised_savings=float(req.validated_amount),
                    status="Validated"
                )
        except Exception as graph_err:
            print(f"Graph update failed in finance validation: {graph_err}")
            
    except Exception as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=500, detail=f"Failed to validate savings: {str(e)}")
        
    conn.close()
    
    # Log to audit_logs after closing connection
    log_audit_event(current_user["id"], "Validate Savings", "/api/savings/validate", 
                    {"opportunity_id": req.opportunity_id, "validated_amount": req.validated_amount, "ledger_id": ledger_id})
                    
    return format_api_response(data={"ledger_id": ledger_id, "status": "Approved"}, message="Savings validated and ledger updated successfully")

