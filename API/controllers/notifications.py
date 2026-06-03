from fastapi import APIRouter, Depends, HTTPException
from utils.auth_deps import require_role
from database.connection import get_db_connection
from database.queries import GET_UNREAD_NOTIFICATIONS, MARK_NOTIFICATION_READ
from utils.helpers import format_api_response

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("/unread")
def get_unread(current_user: dict = Depends(require_role(["Buyer", "CPO", "Category Manager", "Finance Controller"]))):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(GET_UNREAD_NOTIFICATIONS, (current_user["id"],))
    notifications = cursor.fetchall()
    conn.close()
    return format_api_response(data=notifications)

@router.post("/{notification_id}/read")
def mark_read(notification_id: int, current_user: dict = Depends(require_role(["Buyer", "CPO", "Category Manager", "Finance Controller"]))):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(MARK_NOTIFICATION_READ, (notification_id, current_user["id"]))
    conn.commit()
    conn.close()
    return format_api_response(message="Notification marked as read")
