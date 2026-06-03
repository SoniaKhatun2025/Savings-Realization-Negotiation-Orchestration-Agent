from database.connection import get_db_connection
from database.queries import (
    CREATE_APPROVAL,
    UPDATE_APPROVAL_STATUS,
    GET_APPROVAL_BY_NEGOTIATION,
)

def create_approval(negotiation_id: int, approved_by: int, comment: str = ""):
    """
    Inserts a new approval record or returns the existing pending one.
    """
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Check if approval already exists
    cur.execute(GET_APPROVAL_BY_NEGOTIATION, (negotiation_id,))
    existing = cur.fetchone()
    if existing:
        conn.close()
        return existing
        
    cur.execute(
        CREATE_APPROVAL,
        (negotiation_id, approved_by, comment),
    )
    # Check if connection needs commit or if autocommit handles it. connection.py sets autocommit=True, but let's be safe.
    try:
        conn.commit()
    except:
        pass
    
    cur.execute(GET_APPROVAL_BY_NEGOTIATION, (negotiation_id,))
    approval = cur.fetchone()
    conn.close()
    return approval

def update_approval(approval_id: int, status: str, comment: str = ""):
    """
    Updates approval status (approved / rejected) and optional comment.
    """
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        UPDATE_APPROVAL_STATUS,
        (status, comment, approval_id),
    )
    try:
        conn.commit()
    except:
        pass
    
    cur.execute("SELECT * FROM approvals WHERE id = %s", (approval_id,))
    approval = cur.fetchone()
    conn.close()
    return approval

def get_approval_status(negotiation_id: int):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(GET_APPROVAL_BY_NEGOTIATION, (negotiation_id,))
    approval = cur.fetchone()
    conn.close()
    return approval
