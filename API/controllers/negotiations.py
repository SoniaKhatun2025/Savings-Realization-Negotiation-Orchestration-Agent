from fastapi import APIRouter, Depends, HTTPException
from utils.auth_deps import require_role
from utils.helpers import format_api_response, log_audit_event
from database.connection import get_db_connection
from database.queries import GET_OPPORTUNITY_BY_ID, CREATE_NEGOTIATION, GET_NEGOTIATIONS_BY_BUYER
from database.models import NegotiationCreate, RecordOutcomeRequest, DraftEmailRequest
from services.negotiation_service import generate_negotiation_playbook, update_outcome, draft_supplier_email
from services.email_service import send_notification_email
import json

router = APIRouter(prefix="/negotiations", tags=["Negotiations"])
router_singular = APIRouter(prefix="/negotiation", tags=["Negotiation (Singular)"])

@router.get("/list")
def list_negotiations(current_user: dict = Depends(require_role(["Buyer", "Category Manager"]))):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(GET_NEGOTIATIONS_BY_BUYER, (current_user["id"],))
    negs = cursor.fetchall()
    conn.close()
    
    # Parse the JSON string talking points
    for neg in negs:
        if neg.get("talking_points"):
            try:
                neg["talking_points"] = json.loads(neg["talking_points"])
            except:
                pass
                
    return format_api_response(data=negs)

@router.post("/create")
def create_negotiation(req: NegotiationCreate, current_user: dict = Depends(require_role(["Category Manager", "Buyer"]))):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute(GET_OPPORTUNITY_BY_ID, (req.opportunity_id,))
    opp = cursor.fetchone()
    if not opp:
        conn.close()
        raise HTTPException(status_code=404, detail="Opportunity not found")
        
    # Check if negotiation already exists for this opportunity
    cursor.execute("SELECT id FROM negotiations WHERE opportunity_id = %s", (req.opportunity_id,))
    existing = cursor.fetchone()
    if existing:
        conn.close()
        return format_api_response(data={"negotiation_id": existing["id"]}, message="Negotiation already active")
        
    # Generate Playbook via AI
    playbook = generate_negotiation_playbook(opp, {"history": "Past performance indicates willingness to discount."})
    
    # Save to DB
    cursor.execute(CREATE_NEGOTIATION, (
        opp["id"],
        opp["supplier_id"],
        opp["assigned_buyer_id"] or current_user["id"],
        playbook["target_price"],
        playbook["walkaway_price"],
        playbook["expected_savings"],
        playbook["ai_confidence_explanation"],
        json.dumps(playbook["talking_points"])
    ))
    negotiation_id = cursor.lastrowid
    try:
        conn.commit()
    except:
        pass
        
    # Update Knowledge Graph safely
    try:
        from graph import update_negotiation_graph
        update_negotiation_graph(
            supplier_name=opp.get("supplier_name", "Unknown Supplier"),
            opportunity_id=opp["id"],
            negotiation_id=negotiation_id,
            playbook_data={
                "target_price": float(playbook["target_price"] or 0.0),
                "walkaway_price": float(playbook["walkaway_price"] or 0.0),
                "expected_savings": float(playbook["expected_savings"] or 0.0),
                "status": "Assigned"
            }
        )
    except Exception as graph_err:
        print(f"Graph update failed in create_negotiation: {graph_err}")
    
    log_audit_event(current_user["id"], "Create Negotiation Playbook", "/api/negotiations/create", {"opportunity_id": req.opportunity_id})
    conn.close()
    return format_api_response(data=playbook, message="Negotiation Playbook Generated")

@router.put("/outcome/{negotiation_id}")
def record_outcome(
    negotiation_id: int,
    req: RecordOutcomeRequest,
    current_user: dict = Depends(require_role(["Buyer"]))
):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Verify negotiation exists and get expected_savings
    cursor.execute("SELECT expected_savings FROM negotiations WHERE id = %s", (negotiation_id,))
    neg = cursor.fetchone()
    if not neg:
        conn.close()
        raise HTTPException(status_code=404, detail="Negotiation not found")
        
    expected_savings = float(neg["expected_savings"] or 0.0)
    
    # Enable transaction
    conn.autocommit(False)
    try:
        # 2. Update negotiation actual price, realized savings, comment and set status to 'Pending Approval'
        cursor.execute("""
            UPDATE negotiations
            SET actual_price = %s,
                realised_savings = %s,
                comment = %s,
                status_id = (SELECT id FROM statuses WHERE category='Negotiation' AND name='Pending Approval')
            WHERE id = %s
        """, (req.actual_price, req.realised_savings, req.comment, negotiation_id))
        
        # 3. Create or update approval request with pending status
        cursor.execute("SELECT id FROM approvals WHERE negotiation_id = %s", (negotiation_id,))
        existing_app = cursor.fetchone()
        if existing_app:
            cursor.execute("""
                UPDATE approvals 
                SET status = 'pending', comment = %s, decided_at = NULL 
                WHERE id = %s
            """, (req.comment or "", existing_app["id"]))
        else:
            cursor.execute("""
                INSERT INTO approvals (negotiation_id, approved_by, status, comment)
                VALUES (%s, %s, 'pending', %s)
            """, (negotiation_id, current_user["id"], req.comment or ""))
            
        # 4. Insert or update savings tracker record
        cursor.execute("SELECT id FROM savings_tracker WHERE negotiation_id = %s", (negotiation_id,))
        existing_tracker = cursor.fetchone()
        if existing_tracker:
            cursor.execute("""
                UPDATE savings_tracker
                SET planned_savings = %s,
                    realized_savings = %s,
                    status_id = (SELECT id FROM statuses WHERE category='Savings' AND name='Pending Validation'),
                    validated_by_id = NULL,
                    validated_at = NULL
                WHERE id = %s
            """, (expected_savings, req.realised_savings, existing_tracker["id"]))
        else:
            cursor.execute("""
                INSERT INTO savings_tracker (negotiation_id, planned_savings, realized_savings, status_id)
                VALUES (%s, %s, %s, (SELECT id FROM statuses WHERE category='Savings' AND name='Pending Validation'))
            """, (negotiation_id, expected_savings, req.realised_savings))

        # 5. Send notifications to Finance Controller and CPO
        cursor.execute("SELECT opportunity_id FROM negotiations WHERE id = %s", (negotiation_id,))
        opp_row = cursor.fetchone()
        if opp_row:
            opp_id = opp_row["opportunity_id"]
            cursor.execute("SELECT id, role_id, email FROM users WHERE role_id IN (SELECT id FROM roles WHERE name IN ('Finance Controller', 'CPO'))")
            approvers = cursor.fetchall()
            for approver in approvers:
                title = "Approval Required"
                message = f"A negotiation outcome for Contract ID: {opp_id} has been recorded and requires your approval. Realized Savings: Rs.{req.realised_savings}"
                cursor.execute("""
                    INSERT INTO notifications (user_id, title, message, opportunity_id)
                    VALUES (%s, %s, %s, %s)
                """, (approver["id"], title, message, opp_id))
                
                # Send the email notification
                if approver.get("email"):
                    send_notification_email(approver["email"], title, message)

        conn.commit()
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Database outcome transaction failed: {str(e)}")
        
    # Fetch updated negotiation details and supplier information to update Knowledge Graph
    try:
        cursor.execute("""
            SELECT o.id as opportunity_id, s.name as supplier_name 
            FROM negotiations n
            JOIN opportunities o ON n.opportunity_id = o.id
            JOIN suppliers s ON n.supplier_id = s.id
            WHERE n.id = %s
        """, (negotiation_id,))
        s_info = cursor.fetchone()
        if s_info:
            from graph import update_savings_graph
            update_savings_graph(
                supplier_name=s_info["supplier_name"],
                negotiation_id=negotiation_id,
                opportunity_id=s_info["opportunity_id"],
                realised_savings=float(req.realised_savings),
                status="Pending Validation"
            )
    except Exception as graph_err:
        print(f"Graph update failed in record_outcome: {graph_err}")
        
    cursor.execute("SELECT * FROM negotiations WHERE id = %s", (negotiation_id,))
    updated_neg = cursor.fetchone()
    log_audit_event(current_user["id"], "Record Outcome", f"/api/negotiations/outcome/{negotiation_id}", {"negotiation_id": negotiation_id})
    conn.close()
    
    if updated_neg:
        updated_neg = {
            "id": updated_neg["id"],
            "opportunity_id": updated_neg["opportunity_id"],
            "supplier_id": updated_neg["supplier_id"],
            "buyer_id": updated_neg["buyer_id"],
            "target_price": float(updated_neg["target_price"] or 0.0),
            "walkaway_price": float(updated_neg["walkaway_price"] or 0.0),
            "expected_savings": float(updated_neg["expected_savings"] or 0.0),
            "actual_price": float(updated_neg["actual_price"]) if updated_neg.get("actual_price") is not None else None,
            "realised_savings": float(updated_neg["realised_savings"]) if updated_neg.get("realised_savings") is not None else None,
            "comment": updated_neg.get("comment"),
            "status_id": updated_neg["status_id"]
        }
    
    return format_api_response(data=updated_neg, message="Outcome recorded, pending CPO approval")

from pydantic import BaseModel
class NegotiationStatusUpdate(BaseModel):
    status_name: str

@router.put("/status/{negotiation_id}")
def update_negotiation_status(
    negotiation_id: int,
    req: NegotiationStatusUpdate,
    current_user: dict = Depends(require_role(["Buyer", "Category Manager", "CPO"]))
):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, opportunity_id, buyer_id FROM negotiations WHERE id = %s", (negotiation_id,))
    neg = cursor.fetchone()
    if not neg:
        conn.close()
        raise HTTPException(status_code=404, detail="Negotiation not found")
        
    cursor.execute("SELECT id FROM statuses WHERE category='Negotiation' AND name=%s", (req.status_name,))
    status_row = cursor.fetchone()
    if not status_row:
        conn.close()
        raise HTTPException(status_code=400, detail=f"Invalid negotiation status: {req.status_name}")
        
    cursor.execute("""
        UPDATE negotiations
        SET status_id = %s
        WHERE id = %s
    """, (status_row["id"], negotiation_id))
    
    task_status = "OPEN"
    if req.status_name in ["Negotiating", "Supplier Responded"]:
        task_status = "IN_PROGRESS"
    elif req.status_name == "Outreach Sent":
        task_status = "NEGOTIATING"
    elif req.status_name in ["Pending Approval", "Completed"]:
        task_status = "CLOSED"
        
    cursor.execute("""
        UPDATE tasks 
        SET status = %s 
        WHERE opportunity_id = %s AND buyer_id = %s
    """, (task_status, neg["opportunity_id"], neg["buyer_id"]))
    
    conn.commit()
    conn.close()
    
    log_audit_event(current_user["id"], "Update Negotiation Status", f"/api/negotiations/status/{negotiation_id}", {"status": req.status_name})
    return format_api_response(message=f"Negotiation status updated to {req.status_name} successfully")

@router_singular.post("/playbook")
def generate_playbook(req: NegotiationCreate, current_user: dict = Depends(require_role(["Category Manager", "Buyer", "CPO"]))):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute(GET_OPPORTUNITY_BY_ID, (req.opportunity_id,))
    opp = cursor.fetchone()
    if not opp:
        conn.close()
        raise HTTPException(status_code=404, detail="Opportunity not found")
        
    playbook = generate_negotiation_playbook(opp, {"history": "Past performance indicates willingness to discount."})
    
    # Check if negotiation already exists for this opportunity
    cursor.execute("SELECT id FROM negotiations WHERE opportunity_id = %s", (req.opportunity_id,))
    existing = cursor.fetchone()
    
    if not existing:
        cursor.execute(CREATE_NEGOTIATION, (
            opp["id"],
            opp["supplier_id"],
            opp["assigned_buyer_id"] or current_user["id"],
            playbook["target_price"],
            playbook["walkaway_price"],
            playbook["expected_savings"],
            playbook["ai_confidence_explanation"],
            json.dumps(playbook["talking_points"])
        ))
        negotiation_id = cursor.lastrowid
        try:
            conn.commit()
        except:
            pass
    else:
        negotiation_id = existing["id"]
        
    # Update Knowledge Graph safely
    try:
        from graph import update_negotiation_graph
        update_negotiation_graph(
            supplier_name=opp.get("supplier_name", "Unknown Supplier"),
            opportunity_id=opp["id"],
            negotiation_id=negotiation_id,
            playbook_data={
                "target_price": float(playbook["target_price"] or 0.0),
                "walkaway_price": float(playbook["walkaway_price"] or 0.0),
                "expected_savings": float(playbook["expected_savings"] or 0.0),
                "status": "Assigned"
            }
        )
    except Exception as graph_err:
        print(f"Graph update failed in generate_playbook: {graph_err}")
    
    log_audit_event(current_user["id"], "Generate Playbook", "/api/negotiation/playbook", {"opportunity_id": req.opportunity_id})
    conn.close()
    return format_api_response(data=playbook, message="Negotiation Playbook Generated")

@router_singular.post("/draft-email")
def get_draft_email(req: DraftEmailRequest, current_user: dict = Depends(require_role(["Buyer", "Category Manager", "CPO"]))):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute(GET_OPPORTUNITY_BY_ID, (req.opportunity_id,))
    opp = cursor.fetchone()
    if not opp:
        conn.close()
        raise HTTPException(status_code=404, detail="Opportunity not found")
        
    # Fetch the playbook details from negotiations table if it exists, otherwise generate a temp one
    cursor.execute("SELECT target_price, walkaway_price, expected_savings, talking_points FROM negotiations WHERE opportunity_id = %s", (req.opportunity_id,))
    neg = cursor.fetchone()
    
    if neg:
        playbook_data = {
            "target_price": float(neg["target_price"] or 0.0),
            "walkaway_price": float(neg["walkaway_price"] or 0.0),
            "expected_savings": float(neg["expected_savings"] or 0.0),
            "talking_points": json.loads(neg["talking_points"]) if neg["talking_points"] else []
        }
    else:
        playbook_data = generate_negotiation_playbook(opp, {"history": "Default pricing analysis."})
        
    email_draft = draft_supplier_email(opp, playbook_data)
    log_audit_event(current_user["id"], "Draft Email", "/api/negotiation/draft-email", {"opportunity_id": req.opportunity_id})
    conn.close()
    
    return format_api_response(data=email_draft, message="Email draft generated successfully")


