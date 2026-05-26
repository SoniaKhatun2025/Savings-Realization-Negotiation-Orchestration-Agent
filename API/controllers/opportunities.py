from fastapi import APIRouter, Depends
from utils.auth_deps import require_role
from utils.helpers import format_api_response
from database.connection import get_db_connection
from database.queries import GET_ALL_OPPORTUNITIES
from services.opportunity_service import analyze_opportunity_with_ai

router = APIRouter(prefix="/opportunities", tags=["Opportunities"])

@router.get("/list")
def list_opportunities(current_user: dict = Depends(require_role(["Buyer", "Category Manager", "CPO"]))):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(GET_ALL_OPPORTUNITIES)
    ops = cursor.fetchall()
    conn.close()
    return format_api_response(data=ops)

@router.post("/analyze")
def trigger_opportunity_analysis(invoice_data: dict, benchmark_data: dict, current_user: dict = Depends(require_role(["Category Manager"]))):
    # Call the LLM Agent to calculate savings logic
    analysis = analyze_opportunity_with_ai(invoice_data, benchmark_data)
    return format_api_response(data=analysis, message="AI Opportunity Analysis Complete")
