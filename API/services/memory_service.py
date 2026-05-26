from database.connection import get_db_connection
from database.queries import SAVE_CHAT_MESSAGE, GET_CHAT_HISTORY

def save_message(user_id: int, message: str, sender: str):
    """
    Saves a chat message to the DB (sender can be 'User' or 'AI').
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(SAVE_CHAT_MESSAGE, (user_id, message, sender))
    conn.close()

def get_chat_history(user_id: int):
    """
    Retrieves the chat history for a specific user.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(GET_CHAT_HISTORY, (user_id,))
    results = cursor.fetchall()
    conn.close()
    return results
