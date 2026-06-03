from database.connection import get_db_connection
from database.queries import GET_DASHBOARD_SAVINGS

def get_cpo_dashboard():
    """
    Returns aggregated data for the CPO dashboard:
    - total planned vs realized savings
    - top 5 opportunities by savings potential
    - pending approvals count
    """
    conn = get_db_connection()
    cur = conn.cursor()
    
    # 1. Savings aggregation
    cur.execute(GET_DASHBOARD_SAVINGS)
    savings = cur.fetchone()
    if not savings:
        savings = {"total_planned": 0.0, "total_realized": 0.0}
    else:
        savings = {
            "total_planned": float(savings.get("total_planned") or 0.0),
            "total_realized": float(savings.get("total_realized") or 0.0)
        }
    
    # 2. Top opportunities
    cur.execute("SELECT id, category, supplier_id, current_spend, savings_potential FROM opportunities ORDER BY savings_potential DESC LIMIT 5")
    top_opps = cur.fetchall()
    
    formatted_opps = []
    for opp in top_opps:
        formatted_opps.append({
            "id": opp["id"],
            "category": opp["category"],
            "supplier_id": opp["supplier_id"],
            "current_spend": float(opp["current_spend"] or 0.0),
            "savings_potential": float(opp["savings_potential"] or 0.0)
        })
        
    # 3. Pending approvals details
    cur.execute("""
        SELECT a.id as approval_id, a.negotiation_id, a.comment as approval_comment,
               n.expected_savings, n.target_price, n.walkaway_price,
               s.name as supplier_name, o.category
        FROM approvals a
        JOIN negotiations n ON a.negotiation_id = n.id
        JOIN suppliers s ON n.supplier_id = s.id
        JOIN opportunities o ON n.opportunity_id = o.id
        WHERE a.status = 'pending'
    """)
    pending_list = cur.fetchall()
    
    formatted_pending = []
    for p in pending_list:
        formatted_pending.append({
            "approval_id": p["approval_id"],
            "negotiation_id": p["negotiation_id"],
            "supplier_name": p["supplier_name"],
            "category": p["category"],
            "expected_savings": float(p["expected_savings"] or 0.0),
            "target_price": float(p["target_price"] or 0.0),
            "walkaway_price": float(p["walkaway_price"] or 0.0),
            "comment": p["approval_comment"]
        })
        
    conn.close()
    return {
        "savings": savings,
        "top_opportunities": formatted_opps,
        "pending_approvals": len(formatted_pending),
        "pending_list": formatted_pending
    }
