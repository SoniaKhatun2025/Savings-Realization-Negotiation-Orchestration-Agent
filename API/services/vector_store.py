import os
from langchain_community.vectorstores import Chroma
# pyrefly: ignore [missing-import]
from langchain_huggingface import HuggingFaceEmbeddings

CHROMA_PATH = os.getenv("CHROMA_PATH", "./chroma_store")

_embeddings_instance = None

def get_embeddings():
    global _embeddings_instance
    if _embeddings_instance is None:
        # pyrefly: ignore [missing-import]
        from langchain_huggingface import HuggingFaceEmbeddings
        _embeddings_instance = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    return _embeddings_instance

def get_vector_store():
    """
    Initializes or retrieves the persistent ChromaDB collection.
    """
    return Chroma(
        persist_directory=CHROMA_PATH,
        embedding_function=get_embeddings(),
        collection_name="procurement_knowledge"
    )

def add_documents_to_store(docs):
    """
    Adds a list of LangChain Document objects to ChromaDB.
    """
    db = get_vector_store()
    db.add_documents(docs)
    # db.persist()  # Deprecated in newer Chroma versions, persists automatically

def search_documents(query: str, k: int = 5):
    """
    Performs a similarity search in ChromaDB.
    """
    db = get_vector_store()
    results = db.similarity_search(query, k=k)
    return results
