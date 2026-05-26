from database.connection import get_db_connection
from database.queries import GET_DASHBOARD_SAVINGS

def get_savings_dashboard_metrics():
    """
    Retrieves and calculates savings KPIs from the database.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute(GET_DASHBOARD_SAVINGS)
    result = cursor.fetchone()
    
    cursor.close()
    conn.close()
    
    if result:
        return {
            "planned_savings": float(result.get("total_planned") or 0),
            "realized_savings": float(result.get("total_realized") or 0),
            "savings_leakage": float((result.get("total_planned") or 0) - (result.get("total_realized") or 0))
        }
    return {
        "planned_savings": 0.0,
        "realized_savings": 0.0,
        "savings_leakage": 0.0
    }
