from fastapi import APIRouter, Depends, HTTPException
from utils.auth_deps import require_role
from utils.helpers import format_api_response
from database.connection import get_db_connection
from database.queries import GET_OPPORTUNITY_BY_ID, CREATE_NEGOTIATION, GET_NEGOTIATIONS_BY_BUYER
from database.models import NegotiationCreate
from services.negotiation_service import generate_negotiation_playbook
import json

router = APIRouter(prefix="/negotiations", tags=["Negotiations"])

@router.get("/list")
def list_negotiations(current_user: dict = Depends(require_role(["Buyer"]))):
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
    
    conn.close()
    return format_api_response(data=playbook, message="Negotiation Playbook Generated")
