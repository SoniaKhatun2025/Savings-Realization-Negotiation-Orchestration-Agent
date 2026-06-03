from fastapi import APIRouter, Depends, HTTPException, status
from utils.auth_deps import require_role
from utils.helpers import format_api_response
from services.dashboard_service import get_cpo_dashboard
from services.approval_service import create_approval, get_approval_status, update_approval
from services.email_service import send_notification_email
from database.connection import get_db_connection
from database.queries import VALIDATE_SAVINGS_AGAINST_BUDGET

router = APIRouter(prefix="/cpo", tags=["CPO"])
router_dashboard = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/dashboard")
def dashboard(current_user: dict = Depends(require_role(["CPO"]))):
    data = get_cpo_dashboard()
    return format_api_response(data=data)

@router.post("/approve/{negotiation_id}")
def approve_negotiation(
    negotiation_id: int,
    comment: str = "",
    current_user: dict = Depends(require_role(["CPO"]))
):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Verify negotiation exists
    cursor.execute("SELECT expected_savings, realised_savings, buyer_id, opportunity_id FROM negotiations WHERE id = %s", (negotiation_id,))
    neg = cursor.fetchone()
    if not neg:
        conn.close()
        raise HTTPException(status_code=404, detail="Negotiation not found")
        
    realised_savings = float(neg["realised_savings"] or 0.0)
    expected_savings = float(neg["expected_savings"] or 0.0)
    
    # Start atomic transaction
    conn.autocommit(False)
    try:
        # 1. Update approvals status to 'approved'
        cursor.execute("SELECT id FROM approvals WHERE negotiation_id = %s", (negotiation_id,))
        existing_app = cursor.fetchone()
        if existing_app:
            cursor.execute("""
                UPDATE approvals
                SET status = 'approved', comment = %s, approved_by = %s, decided_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (comment, current_user["id"], existing_app["id"]))
        else:
            cursor.execute("""
                INSERT INTO approvals (negotiation_id, approved_by, status, comment, decided_at)
                VALUES (%s, %s, 'approved', %s, CURRENT_TIMESTAMP)
            """, (negotiation_id, current_user["id"], comment))
            
        # 2. Check if Finance has already validated this savings record
        cursor.execute("SELECT id, validated_by_id FROM savings_tracker WHERE negotiation_id = %s", (negotiation_id,))
        existing_tracker = cursor.fetchone()
        
        is_finance_validated = existing_tracker is not None and existing_tracker["validated_by_id"] is not None
        
        if is_finance_validated:
            # Both CPO approved and Finance validated are complete!
            cursor.execute("""
                UPDATE negotiations
                SET status_id = (SELECT id FROM statuses WHERE category='Negotiation' AND name='Completed')
                WHERE id = %s
            """, (negotiation_id,))
            
            cursor.execute("""
                UPDATE savings_tracker
                SET status_id = (SELECT id FROM statuses WHERE category='Savings' AND name='Validated')
                WHERE id = %s
            """, (existing_tracker["id"],))
            
            # Update opportunity status to Completed
            cursor.execute("SELECT opportunity_id FROM negotiations WHERE id = %s", (negotiation_id,))
            opp_row = cursor.fetchone()
            if opp_row:
                cursor.execute("""
                    UPDATE opportunities 
                    SET status_id = (SELECT id FROM statuses WHERE category='Opportunity' AND name='Completed')
                    WHERE id = %s
                """, (opp_row["opportunity_id"],))
        else:
            # Finance has not validated yet. We wait.
            pass
        # Send Notification to Buyer
        if neg.get("buyer_id"):
            title = "CPO Approved"
            msg = f"CPO has approved the negotiation for Contract ID: {neg['opportunity_id']}."
            cursor.execute("INSERT INTO notifications (user_id, title, message, opportunity_id) VALUES (%s, %s, %s, %s)", (neg["buyer_id"], title, msg, neg["opportunity_id"]))
            cursor.execute("SELECT email FROM users WHERE id = %s", (neg["buyer_id"],))
            email_row = cursor.fetchone()
            if email_row and email_row.get("email"):
                send_notification_email(email_row["email"], f"{title} for Contract ID: {neg['opportunity_id']}", msg)

        # Commit the transaction successfully
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Database approval transaction failed: {str(e)}")
    finally:
        conn.close()
        
    return format_api_response(message="Negotiation approved and savings validated")

@router_dashboard.get("/executive")
def executive_dashboard(current_user: dict = Depends(require_role(["CPO", "Admin"]))):
    data = get_cpo_dashboard()
    return format_api_response(data=data)

@router_dashboard.get("/buyer")
def buyer_dashboard(current_user: dict = Depends(require_role(["Buyer", "Category Manager", "CPO"]))):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Fetch assigned negotiations
    cursor.execute("""
        SELECT n.*, s.name as supplier_name, o.category, stat.name as status_name
        FROM negotiations n
        JOIN suppliers s ON n.supplier_id = s.id
        JOIN opportunities o ON n.opportunity_id = o.id
        JOIN statuses stat ON n.status_id = stat.id
        WHERE n.buyer_id = %s
    """, (current_user["id"],))
    negs = cursor.fetchall()
    
    # 2. Fetch active tasks
    cursor.execute("""
        SELECT t.*, o.category, s.name as supplier_name, o.savings_potential
        FROM tasks t
        JOIN opportunities o ON t.opportunity_id = o.id
        JOIN suppliers s ON o.supplier_id = s.id
        WHERE t.buyer_id = %s AND t.status != 'CLOSED'
    """, (current_user["id"],))
    tasks = cursor.fetchall()
    
    # 3. Fetch notifications
    cursor.execute("SELECT * FROM notifications WHERE user_id = %s AND is_read = FALSE ORDER BY created_at DESC LIMIT 5", (current_user["id"],))
    notifs = cursor.fetchall()
    
    conn.close()
    return format_api_response(data={
        "assigned_negotiations": negs,
        "active_tasks": tasks,
        "unread_notifications": notifs
    })

@router_dashboard.get("/finance")
def finance_dashboard(current_user: dict = Depends(require_role(["Finance Controller", "CPO"]))):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT n.id as negotiation_id, o.id as opportunity_id, o.category, s.name as supplier_name, 
               n.expected_savings, n.realised_savings, stat.name as status
        FROM negotiations n
        JOIN opportunities o ON n.opportunity_id = o.id
        JOIN suppliers s ON n.supplier_id = s.id
        JOIN statuses stat ON n.status_id = stat.id
        LEFT JOIN savings_tracker st ON n.id = st.negotiation_id
        WHERE stat.name = 'Pending Approval' AND (st.validated_by_id IS NULL OR st.id IS NULL)
    """)
    validation_queue = cursor.fetchall()
    
    # 2. Fetch budget actual vs target variance
    cursor.execute(VALIDATE_SAVINGS_AGAINST_BUDGET)
    budget_variance = cursor.fetchall()
    
    # 3. Fetch monthly savings trend
    from database.queries import GET_MONTHLY_SAVINGS_TREND
    cursor.execute(GET_MONTHLY_SAVINGS_TREND)
    trend = cursor.fetchall()
    
    conn.close()
    return format_api_response(data={
        "validation_queue": validation_queue,
        "budget_variance": budget_variance,
        "savings_trend": trend
    })

