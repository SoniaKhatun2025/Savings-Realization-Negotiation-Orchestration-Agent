from fastapi import APIRouter, Depends, HTTPException
from utils.auth_deps import require_role
from utils.helpers import format_api_response
from database.connection import get_db_connection
from database.queries import (
    GET_ALL_OPPORTUNITIES,
    ASSIGN_BUYER_TO_OPPORTUNITY,
)
from database.models import AssignBuyerRequest
from services.email_service import send_notification_email

router = APIRouter(prefix="/category-manager", tags=["Category Manager"])

@router.get("/opportunities")
def list_opportunities(category: str = None, current_user: dict = Depends(require_role(["Category Manager"]))):
    conn = get_db_connection()
    cur = conn.cursor()
    if category:
        cur.execute(
            "SELECT o.*, s.name as supplier_name, stat.name as status_name, u.name as buyer_name FROM opportunities o JOIN suppliers s ON o.supplier_id = s.id JOIN statuses stat ON o.status_id = stat.id LEFT JOIN users u ON o.assigned_buyer_id = u.id WHERE o.category = %s", (category,)
        )
    else:
        cur.execute(GET_ALL_OPPORTUNITIES)
    opps = cur.fetchall()
    
    formatted_opps = []
    for opp in opps:
        formatted_opps.append({
            "id": opp["id"],
            "category": opp["category"],
            "supplier_id": opp["supplier_id"],
            "supplier_name": opp.get("supplier_name"),
            "status_name": opp.get("status_name"),
            "current_spend": float(opp["current_spend"] or 0.0),
            "benchmark_spend": float(opp["benchmark_spend"] or 0.0),
            "variance_amount": float(opp["variance_amount"] or 0.0),
            "savings_potential": float(opp["savings_potential"] or 0.0),
            "confidence_score": opp["confidence_score"],
            "risk_level_id": opp["risk_level_id"],
            "priority_score": opp["priority_score"],
            "status_id": opp["status_id"],
            "assigned_buyer_id": opp["assigned_buyer_id"],
            "assigned_buyer_name": opp.get("buyer_name")
        })
        
    conn.close()
    return format_api_response(data=formatted_opps)

@router.post("/assign-buyer")
def assign_buyer(req: AssignBuyerRequest, current_user: dict = Depends(require_role(["Category Manager"]))):
    conn = get_db_connection()
    cur = conn.cursor()
    
    # 1. Verify opportunity exists
    cur.execute("SELECT id, supplier_id, category, current_spend, benchmark_spend, savings_potential FROM opportunities WHERE id = %s", (req.opportunity_id,))
    opp = cur.fetchone()
    if not opp:
        conn.close()
        raise HTTPException(status_code=404, detail="Opportunity not found")
        
    # 2. Verify buyer exists and is active and has role Buyer
    cur.execute("""
        SELECT u.id, u.name, u.email 
        FROM users u 
        JOIN roles r ON u.role_id = r.id 
        WHERE u.id = %s AND r.name = 'Buyer' AND u.status = 'Active'
    """, (req.buyer_id,))
    buyer = cur.fetchone()
    if not buyer:
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid buyer_id. User must exist and have the 'Buyer' role.")
        
    # Start transaction
    conn.autocommit(False)
    try:
        # 3. Update Opportunity (set assigned_buyer_id, priority_score, and set status to In Progress)
        cur.execute("""
            UPDATE opportunities 
            SET assigned_buyer_id = %s, 
                priority_score = %s,
                status_id = (SELECT id FROM statuses WHERE category='Opportunity' AND name='In Progress')
            WHERE id = %s
        """, (req.buyer_id, req.priority, req.opportunity_id))
        
        # 4. Create Task in tasks table if not exists
        cur.execute("SELECT id FROM tasks WHERE opportunity_id = %s AND buyer_id = %s AND status != 'CLOSED'", (req.opportunity_id, req.buyer_id))
        existing_task = cur.fetchone()
        if not existing_task:
            cur.execute("""
                INSERT INTO tasks (opportunity_id, buyer_id, status, sla_hours)
                VALUES (%s, %s, 'OPEN', 48)
            """, (req.opportunity_id, req.buyer_id))
            
        # 5. Create Negotiation if not exists
        cur.execute("SELECT id FROM negotiations WHERE opportunity_id = %s", (req.opportunity_id,))
        existing_neg = cur.fetchone()
        if not existing_neg:
            from services.negotiation_service import generate_negotiation_playbook
            import json
            
            # Fetch opportunity details with supplier_name
            cur.execute("""
                SELECT o.*, s.name as supplier_name 
                FROM opportunities o 
                JOIN suppliers s ON o.supplier_id = s.id 
                WHERE o.id = %s
            """, (req.opportunity_id,))
            opp_details = cur.fetchone()
            
            playbook = generate_negotiation_playbook(opp_details, {"history": "Past performance indicates willingness to discount."})
            
            from database.queries import CREATE_NEGOTIATION
            cur.execute(CREATE_NEGOTIATION, (
                opp_details["id"],
                opp_details["supplier_id"],
                req.buyer_id,
                playbook["target_price"],
                playbook["walkaway_price"],
                playbook["expected_savings"],
                playbook["ai_confidence_explanation"],
                json.dumps(playbook["talking_points"])
            ))
            negotiation_id = cur.lastrowid
            
            # Update Knowledge Graph safely
            try:
                from graph import update_negotiation_graph
                update_negotiation_graph(
                    supplier_name=opp_details.get("supplier_name", "Unknown Supplier"),
                    opportunity_id=opp_details["id"],
                    negotiation_id=negotiation_id,
                    playbook_data={
                        "target_price": float(playbook["target_price"] or 0.0),
                        "walkaway_price": float(playbook["walkaway_price"] or 0.0),
                        "expected_savings": float(playbook["expected_savings"] or 0.0),
                        "status": "Assigned"
                    }
                )
            except Exception as graph_err:
                print(f"Graph update failed in category manager: {graph_err}")
                
        # 6. Create Notification for the buyer
        notif_title = f"New Task Assigned: {opp['category']}"
        notif_msg = f"You have been assigned to negotiate opportunity {req.opportunity_id}."
        cur.execute("""
            INSERT INTO notifications (user_id, title, message, opportunity_id)
            VALUES (%s, %s, %s, %s)
        """, (req.buyer_id, notif_title, notif_msg, req.opportunity_id))
        
        if buyer.get("email"):
            send_notification_email(buyer["email"], f"New Task Assigned for Contract ID: {req.opportunity_id}", notif_msg)
        
        conn.commit()
    except Exception as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=500, detail=f"Database assignment transaction failed: {str(e)}")
        
    conn.close()
    return format_api_response(message="Buyer assigned, task/negotiation generated successfully")
