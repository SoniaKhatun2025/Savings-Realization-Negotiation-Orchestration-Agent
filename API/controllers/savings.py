from fastapi import APIRouter, Depends
from utils.auth_deps import require_role
from utils.helpers import format_api_response
from services.savings_service import get_savings_dashboard_metrics
from database.connection import get_db_connection

router = APIRouter(prefix="/savings", tags=["Savings"])

@router.get("/dashboard")
def savings_dashboard(current_user: dict = Depends(require_role(["Buyer", "Finance Controller", "CPO", "Category Manager"]))):
    metrics = get_savings_dashboard_metrics()
    return format_api_response(data=metrics)

@router.get("/tracker")
def get_savings_tracker(current_user: dict = Depends(require_role(["Buyer", "Finance Controller", "CPO", "Category Manager"]))):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Fetch planned and realized savings aggregates per opportunity
    cursor.execute("""
        SELECT 
            o.id as opportunity_id,
            o.category,
            s.name as supplier_name,
            o.current_spend,
            o.benchmark_spend,
            o.savings_potential as planned_savings,
            COALESCE(st.realized_savings, 0.0) as realized_savings,
            stat.name as status,
            st_stat.name as savings_status
        FROM opportunities o
        JOIN suppliers s ON o.supplier_id = s.id
        LEFT JOIN negotiations n ON o.id = n.opportunity_id
        LEFT JOIN savings_tracker st ON n.id = st.negotiation_id
        LEFT JOIN statuses st_stat ON st.status_id = st_stat.id
        JOIN statuses stat ON o.status_id = stat.id
        ORDER BY o.created_at DESC
    """)
    records = cursor.fetchall()
    
    # Calculate global metrics
    planned_total = 0.0
    realized_total = 0.0
    pending_total = 0.0
    rejected_total = 0.0
    
    formatted_records = []
    for r in records:
        planned = float(r["planned_savings"] or 0.0)
        realized = float(r["realized_savings"] or 0.0)
        
        # Classify pending and rejected
        status_name = r["status"]
        savings_status = r["savings_status"]
        pending = 0.0
        rejected = 0.0
        
        if savings_status == "Validated":
            realized_total += realized
        elif status_name == "Escalated":
            rejected += planned
            rejected_total += planned
        else:
            pending = planned - realized
            pending_total += pending
            
        planned_total += planned
        
        formatted_records.append({
            "opportunity_id": r["opportunity_id"],
            "category": r["category"],
            "supplier_name": r["supplier_name"],
            "current_spend": float(r["current_spend"] or 0.0),
            "benchmark_spend": float(r["benchmark_spend"] or 0.0),
            "planned_savings": planned,
            "realized_savings": realized,
            "pending_savings": pending,
            "rejected_savings": rejected,
            "status": status_name
        })
        
    conn.close()
    
    return format_api_response(data={
        "metrics": {
            "planned": planned_total,
            "realized": realized_total,
            "pending": pending_total,
            "rejected": rejected_total
        },
        "opportunities": formatted_records
    })

