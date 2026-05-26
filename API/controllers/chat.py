from fastapi import APIRouter, Depends
from utils.auth_deps import get_current_user
from utils.helpers import format_api_response
from database.models import ChatRequest
from services.chat_service import process_chat_query
from services.memory_service import save_message, get_chat_history

router = APIRouter(prefix="/chat", tags=["AI Assistant"])

@router.post("/query", response_model=dict)
def chat_with_assistant(req: ChatRequest, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    
    # Save user message
    save_message(user_id, req.message, "User")
    
    # Call RAG Chat Service
    ai_response = process_chat_query(req.message)
    
    # Save AI message
    save_message(user_id, ai_response, "AI")
    
    return format_api_response(data={"response": ai_response})

@router.get("/history")
def get_history(current_user: dict = Depends(get_current_user)):
    history = get_chat_history(current_user["id"])
    return format_api_response(data=history)
