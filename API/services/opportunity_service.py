from services.llm_service import generate_llm_response
from utils.prompts import OPPORTUNITY_AGENT_PROMPT
from utils.helpers import parse_llm_json

def analyze_opportunity_with_ai(invoice_data: dict, benchmark_data: dict) -> dict:
    """
    Simulates the Opportunity Agent analyzing an invoice against benchmarks.
    """
    user_input = f"""
    Invoice Data: {invoice_data}
    Benchmark Data: {benchmark_data}
    
    Calculate the variance and provide a risk and savings potential analysis.
    """
    
    raw_response = generate_llm_response(OPPORTUNITY_AGENT_PROMPT, user_input)
    parsed_json = parse_llm_json(raw_response)
    
    # Fallback default if LLM fails
    if not parsed_json or "variance_amount" not in parsed_json:
        parsed_json = {
            "variance_amount": 0.0,
            "savings_potential": 0.0,
            "confidence_score": 50,
            "risk_level": "Medium",
            "explanation": "Default fallback logic applied due to LLM parsing error."
        }
        
    return parsed_json
