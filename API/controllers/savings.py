from fastapi import APIRouter, Depends
from utils.auth_deps import require_role
from utils.helpers import format_api_response
from services.savings_service import get_savings_dashboard_metrics

router = APIRouter(prefix="/savings", tags=["Savings"])

@router.get("/dashboard")
def savings_dashboard(current_user: dict = Depends(require_role(["Buyer", "Finance Controller", "CPO", "Category Manager"]))):
    metrics = get_savings_dashboard_metrics()
    return format_api_response(data=metrics)
