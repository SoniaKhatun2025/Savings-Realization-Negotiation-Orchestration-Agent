import os
from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader, CSVLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from services.vector_store import add_documents_to_store

def process_uploaded_file(file_path: str, filename: str):
    """
    Orchestrates the RAG ingestion pipeline: Load -> Chunk -> Embed -> Store.
    """
    ext = os.path.splitext(filename)[1].lower()
    
    # 1. Document Loading
    loader = None
    if ext == '.pdf':
        loader = PyPDFLoader(file_path)
    elif ext == '.docx':
        loader = Docx2txtLoader(file_path)
    elif ext == '.csv':
        loader = CSVLoader(file_path)
    else:
        raise ValueError(f"Unsupported file extension: {ext}")
        
    documents = loader.load()
    
    # 2. Text Chunking
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len,
    )
    chunks = text_splitter.split_documents(documents)
    
    # Add metadata
    for chunk in chunks:
        chunk.metadata["source_file"] = filename
        
    # 3. Store in ChromaDB
    add_documents_to_store(chunks)
    
    return len(chunks)
