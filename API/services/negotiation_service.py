from services.llm_service import generate_llm_response
from utils.prompts import NEGOTIATION_AGENT_PROMPT
from utils.helpers import parse_llm_json

def generate_negotiation_playbook(opportunity_data: dict, supplier_history: dict) -> dict:
    """
    Simulates the Negotiation Strategy Agent generating a playbook.
    """
    user_input = f"""
    Opportunity Context: {opportunity_data}
    Supplier History: {supplier_history}
    
    Generate target price, walkaway price, expected savings, and talking points.
    """
    
    raw_response = generate_llm_response(NEGOTIATION_AGENT_PROMPT, user_input)
    parsed_json = parse_llm_json(raw_response)
    
    if not parsed_json or "target_price" not in parsed_json:
        parsed_json = {
            "target_price": opportunity_data.get("current_spend", 0) * 0.9,
            "walkaway_price": opportunity_data.get("current_spend", 0),
            "expected_savings": opportunity_data.get("savings_potential", 0),
            "talking_points": ["Review benchmark pricing", "Discuss long-term partnership"],
            "ai_confidence_explanation": "Default fallback generated playbook."
        }
        
    return parsed_json
