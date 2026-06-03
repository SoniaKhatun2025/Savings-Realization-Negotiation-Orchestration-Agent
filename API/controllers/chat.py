from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from utils.auth_deps import get_current_user
from utils.helpers import format_api_response
from database.models import ChatRequest
from services.chat_service import process_chat_query, process_chat_stream
from services.memory_service import save_message, get_chat_history, clear_chat_history

router = APIRouter(prefix="/chat", tags=["AI Assistant"])

@router.post("", response_model=dict)
@router.post("/query", response_model=dict)
def chat_with_assistant(req: ChatRequest, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    query_text = req.query or req.message
    if not query_text:
        raise HTTPException(status_code=400, detail="Either 'message' or 'query' must be provided.")
    
    # 1. Retrieve prior chat history context
    history = get_chat_history(user_id)
    
    # 2. Save current user message
    save_message(user_id, query_text, "User")
    
    # 3. Call RAG Chat Service with historical context
    ai_response = process_chat_query(query_text, history, user_id)
    
    # 4. Save AI response message
    save_message(user_id, ai_response, "AI")
    
    return format_api_response(data={"response": ai_response})

@router.post("/stream")
def chat_stream_assistant(req: ChatRequest, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    query_text = req.query or req.message
    if not query_text:
        raise HTTPException(status_code=400, detail="Either 'message' or 'query' must be provided.")
    
    # 1. Retrieve prior chat history context
    history = get_chat_history(user_id)
    
    # 2. Save current user message
    save_message(user_id, query_text, "User")
    
    # 3. Return StreamingResponse
    return StreamingResponse(process_chat_stream(query_text, history, user_id), media_type="text/plain")

@router.get("/history")
def get_history(current_user: dict = Depends(get_current_user)):
    history = get_chat_history(current_user["id"])
    return format_api_response(data=history)

@router.delete("/history")
def delete_history(current_user: dict = Depends(get_current_user)):
    clear_chat_history(current_user["id"])
    return format_api_response(message="Chat history cleared successfully.")

