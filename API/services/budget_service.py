from database.connection import get_db_connection
from database.queries import (
    CREATE_BUDGET,
    UPDATE_BUDGET,
    GET_BUDGETS,
    GET_BUDGET_BY_CATEGORY_YEAR,
)

def create_budget(category: str, fiscal_year: int, allocated_amount: float):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        CREATE_BUDGET,
        (category, fiscal_year, allocated_amount),
    )
    try:
        conn.commit()
    except:
        pass
    
    cur.execute(
        GET_BUDGET_BY_CATEGORY_YEAR,
        (category, fiscal_year),
    )
    budget = cur.fetchone()
    conn.close()
    return budget

def update_budget(budget_id: int, allocated_amount: float, actual_spend: float):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        UPDATE_BUDGET,
        (allocated_amount, actual_spend, budget_id),
    )
    try:
        conn.commit()
    except:
        pass
    
    cur.execute("SELECT * FROM budgets WHERE id = %s", (budget_id,))
    budget = cur.fetchone()
    conn.close()
    return budget

def list_budgets():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(GET_BUDGETS)
    budgets = cur.fetchall()
    conn.close()
    return budgets
