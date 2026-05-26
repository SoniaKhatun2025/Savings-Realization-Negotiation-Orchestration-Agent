from fastapi import APIRouter, UploadFile, File, Depends, BackgroundTasks
from utils.auth_deps import require_role
from database.connection import get_db_connection
from database.queries import CREATE_DOCUMENT, UPDATE_DOCUMENT_STATUS
from utils.helpers import format_api_response
from services.rag_pipeline import process_uploaded_file
import os
import shutil

router = APIRouter(prefix="/knowledge", tags=["Knowledge Base"])

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")

def background_document_processing(file_path: str, filename: str, doc_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(UPDATE_DOCUMENT_STATUS, ('Processing', 'In Progress', doc_id))
        
        # Run RAG Pipeline
        num_chunks = process_uploaded_file(file_path, filename)
        
        cursor.execute(UPDATE_DOCUMENT_STATUS, ('Indexed', f'Complete ({num_chunks} chunks)', doc_id))
    except Exception as e:
        cursor.execute(UPDATE_DOCUMENT_STATUS, ('Failed', f'Error: {str(e)}', doc_id))
    finally:
        conn.close()

@router.post("/upload")
def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    doc_type: str = "Other",
    current_user: dict = Depends(require_role(["Buyer", "CPO"]))
):
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Save to DB
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(CREATE_DOCUMENT, (file.filename, doc_type, current_user["id"]))
    doc_id = cursor.lastrowid
    conn.close()
    
    # Process asynchronously
    background_tasks.add_task(background_document_processing, file_path, file.filename, doc_id)
    
    return format_api_response(message="Document uploaded and processing started")

@router.get("/documents")
def get_documents(current_user: dict = Depends(require_role(["Buyer", "CPO"]))):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM uploaded_documents ORDER BY uploaded_at DESC")
    docs = cursor.fetchall()
    conn.close()
    return format_api_response(data=docs)
