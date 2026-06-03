from database.connection import get_db_connection
from database.queries import GET_DASHBOARD_SAVINGS, GET_MONTHLY_SAVINGS_TREND, GET_TOP_SAVINGS_CATEGORIES

def get_savings_dashboard_metrics():
    """
    Retrieves and calculates savings KPIs from the database.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get overall totals
    cursor.execute(GET_DASHBOARD_SAVINGS)
    result = cursor.fetchone()
    
    # Get monthly trend
    cursor.execute(GET_MONTHLY_SAVINGS_TREND)
    monthly_trend = cursor.fetchall()
    
    # Get top categories
    cursor.execute(GET_TOP_SAVINGS_CATEGORIES)
    top_categories = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    data = {
        "planned_savings": 0.0,
        "realized_savings": 0.0,
        "savings_leakage": 0.0,
        "monthly_trend": monthly_trend if monthly_trend else [],
        "top_categories": top_categories if top_categories else []
    }
    
    if result:
        data["planned_savings"] = float(result.get("total_planned") or 0)
        data["realized_savings"] = float(result.get("total_realized") or 0)
        data["savings_leakage"] = float((result.get("total_planned") or 0) - (result.get("total_realized") or 0))
        
    return data
