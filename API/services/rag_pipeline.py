import os
# pyrefly: ignore [missing-import]
from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader, CSVLoader
# pyrefly: ignore [missing-import]
from langchain_text_splitters import RecursiveCharacterTextSplitter
from services.vector_store import add_documents_to_store

def process_uploaded_file(file_path: str, filename: str):
    """
    Orchestrates the RAG ingestion pipeline: Load -> Chunk -> Embed -> Store.
    """
    ext = os.path.splitext(filename)[1].lower()
    
    # 1. Document Loading
    documents = []
    if ext == '.pdf':
        from services.ocr_service import extract_pages_from_pdf
        # pyrefly: ignore [missing-import]
        from langchain_core.documents import Document
        
        pages = extract_pages_from_pdf(file_path)
        for i, page_text in enumerate(pages):
            documents.append(Document(
                page_content=page_text,
                metadata={"source": file_path, "page": i}
            ))
    else:
        if ext == '.docx':
            loader = Docx2txtLoader(file_path)
            documents = loader.load()
        elif ext == '.csv':
            loader = CSVLoader(file_path)
            documents = loader.load()
        elif ext == '.txt':
            # pyrefly: ignore [missing-import]
            from langchain_community.document_loaders import TextLoader
            loader = TextLoader(file_path, encoding='utf-8')
            documents = loader.load()
        elif ext == '.xlsx':
            import pandas as pd
            # pyrefly: ignore [missing-import]
            from langchain_core.documents import Document
            df = pd.read_excel(file_path)
            content = df.to_csv(index=False)
            documents = [Document(
                page_content=content,
                metadata={"source": file_path}
            )]
        else:
            raise ValueError(f"Unsupported file extension: {ext}")
    
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
    
    # Extract text sample for LLM classification
    text_sample = ""
    if documents:
        text_sample = documents[0].page_content[:2000]
    
    return len(chunks), text_sample
