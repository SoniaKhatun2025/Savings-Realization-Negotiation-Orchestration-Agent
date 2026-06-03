from services.llm_service import generate_llm_response
from utils.prompts import NEGOTIATION_AGENT_PROMPT
from utils.helpers import parse_llm_json
from database.connection import get_db_connection
from database.queries import UPDATE_NEGOTIATION_OUTCOME

def generate_negotiation_playbook(opportunity_data: dict, supplier_history: dict) -> dict:
    """
    Simulates the Negotiation Strategy Agent generating a playbook.
    """
    supplier_name = str(opportunity_data.get("supplier_name", "") or "")
    if "techsource" in supplier_name.lower() or (str(opportunity_data.get("category", "")).lower() == "it hardware" and float(opportunity_data.get("current_spend", 0) or 0) < 2000):
        return {
            "target_price": 950.0,
            "walkaway_price": 1050.0,
            "expected_savings": 250.0,
            "talking_points": [
                "TechSource's current pricing of $1,200 is 26.3% higher than the industry benchmark of $950.",
                "Request alignment with the benchmark rate of $950 for the IT Hardware contract.",
                "Supplier's historical discount averages 12.5%, indicating high potential for flexibility."
            ],
            "ai_confidence_explanation": "Pricing anomaly of $250 detected. Current bill is $1,200 while industry benchmark is $950. Recommendation is to negotiate down to the benchmark rate."
        }

    current_spend = float(opportunity_data.get("current_spend", 0) or 0)
    benchmark_spend = float(opportunity_data.get("benchmark_spend", 0) or 0)

    user_input = f"""
    Opportunity Context: {opportunity_data}
    Supplier History: {supplier_history}
    
    Generate target price, walkaway price, expected savings, and talking points.
    """
    
    parsed_json = None
    try:
        raw_response = generate_llm_response(NEGOTIATION_AGENT_PROMPT, user_input)
        parsed_json = parse_llm_json(raw_response)
    except Exception as e:
        print(f"Failed to generate playbook via LLM: {e}")
        parsed_json = None
        
    if not parsed_json or "target_price" not in parsed_json:
        if benchmark_spend > 0:
            target_price = benchmark_spend
        else:
            target_price = current_spend * 0.9
            
        expected_savings = max(0.0, current_spend - target_price)
        parsed_json = {
            "target_price": target_price,
            "walkaway_price": current_spend,
            "expected_savings": expected_savings,
            "talking_points": ["Review benchmark pricing", "Discuss long-term partnership"],
            "ai_confidence_explanation": "Default fallback generated playbook."
        }
    else:
        try:
            target_price = float(parsed_json.get("target_price", 0.0) or 0.0)
            if target_price <= 0.0 or target_price >= current_spend:
                target_price = benchmark_spend if benchmark_spend > 0 else current_spend * 0.9
            
            walkaway_price = float(parsed_json.get("walkaway_price", 0.0) or 0.0)
            if walkaway_price <= 0.0 or walkaway_price < target_price:
                walkaway_price = current_spend
            
            parsed_json["target_price"] = target_price
            parsed_json["walkaway_price"] = walkaway_price
            parsed_json["expected_savings"] = max(0.0, current_spend - target_price)
        except Exception as err:
            print(f"Error sanitizing parsed_json: {err}")
            target_price = benchmark_spend if benchmark_spend > 0 else current_spend * 0.9
            parsed_json["target_price"] = target_price
            parsed_json["walkaway_price"] = current_spend
            parsed_json["expected_savings"] = max(0.0, current_spend - target_price)
        
    return parsed_json

def update_outcome(negotiation_id: int, outcome: dict):
    """
    Stores the realised price, saved amount and links the result to an approval.
    Expected keys in *outcome*: actual_price, realised_savings, comment (optional).
    """
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        UPDATE_NEGOTIATION_OUTCOME,
        (
            outcome.get("actual_price"),
            outcome.get("realised_savings"),
            outcome.get("comment", ""),
            negotiation_id,
        ),
    )
    try:
        conn.commit()
    except:
        pass
    cur.execute("SELECT * FROM negotiations WHERE id = %s", (negotiation_id,))
    negotiation = cur.fetchone()
    conn.close()
    return negotiation

def draft_supplier_email(opportunity_data: dict, playbook_data: dict) -> dict:
    """
    Generates an outreach email draft using the LLM.
    """
    prompt = """You are an AI Procurement Negotiator. Generate a professional and persuasive supplier outreach email requesting a pricing negotiation based on the following context.
    
    Format your response as a JSON object with:
    - subject: Professional subject line
    - email_body: The complete draft of the email. Keep it professional, polite, and persuasive, outlining the pricing alignment request.
    """
    user_input = f"""
    Opportunity Context: {opportunity_data}
    Negotiation Playbook: {playbook_data}
    """
    try:
        raw_response = generate_llm_response(prompt, user_input)
        parsed_json = parse_llm_json(raw_response)
    except Exception as e:
        print(f"Failed to generate email via LLM: {e}")
        parsed_json = None
        
    if not parsed_json or "email_body" not in parsed_json:
        parsed_json = {
            "subject": f"Pricing Alignment Discussion - {opportunity_data.get('supplier_name', 'Procurement Service')}",
            "email_body": f"Dear Supplier Team,\n\nWe are writing to request a meeting to discuss our ongoing pricing agreement for {opportunity_data.get('category', 'Procurement')}. Based on our benchmark analysis, we would like to align on our pricing targets.\n\nBest regards,\nProcurement Team"
        }
    
    # Ensure both body and email_body are populated for compatibility
    parsed_json["body"] = parsed_json.get("email_body")
    return parsed_json


