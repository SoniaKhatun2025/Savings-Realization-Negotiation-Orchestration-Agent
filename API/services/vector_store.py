import os
import logging
# pyrefly: ignore [missing-import]
from langchain_huggingface import HuggingFaceEmbeddings

logger = logging.getLogger(__name__)

# Qdrant configuration
QDRANT_HOST = os.getenv("QDRANT_HOST", "http://localhost")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", 6333))
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY", "")
QDRANT_COLLECTION = os.getenv("QDRANT_COLLECTION", "procurement_knowledge")
QDRANT_PREFER_GRPC = os.getenv("QDRANT_PREFER_GRPC", "False").lower() in ("true", "1", "yes")

# Chroma fallback configuration
CHROMA_PATH = os.getenv("CHROMA_PATH", "./chroma_store")

_embeddings_instance = None

def get_embeddings():
    global _embeddings_instance
    if _embeddings_instance is None:
        # pyrefly: ignore [missing-import]
        from langchain_huggingface import HuggingFaceEmbeddings
        _embeddings_instance = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    return _embeddings_instance

_vector_store_instance = None
_is_qdrant_active = False

def get_vector_store():
    """
    Initializes and caches the Vector Store.
    Tries Qdrant first. If connection fails, falls back to Chroma.
    """
    global _vector_store_instance, _is_qdrant_active
    if _vector_store_instance is not None:
        return _vector_store_instance, _is_qdrant_active
        
    embeddings = get_embeddings()
    
    # Try Qdrant
    try:
        # pyrefly: ignore [missing-import]
        from langchain_qdrant import Qdrant
        # pyrefly: ignore [missing-import]
        from qdrant_client import QdrantClient
        
        host = QDRANT_HOST
        if not host.startswith("http://") and not host.startswith("https://") and host != "localhost":
            host = f"http://{host}"
            
        client = QdrantClient(
            url=host,
            port=QDRANT_PORT if "localhost" in host or host.startswith("http://localhost") else None,
            api_key=QDRANT_API_KEY if QDRANT_API_KEY else None,
            prefer_grpc=QDRANT_PREFER_GRPC
        )
        
        client.get_collections()
        logger.info(f"Successfully connected to Qdrant at {host}:{QDRANT_PORT}")
        
        _vector_store_instance = Qdrant(
            client=client,
            collection_name=QDRANT_COLLECTION,
            embeddings=embeddings
        )
        _is_qdrant_active = True
        return _vector_store_instance, _is_qdrant_active
        
    except Exception as e:
        logger.warning(f"Failed to connect to Qdrant ({e}). Falling back to local Chroma store.")
        
    try:
        # pyrefly: ignore [missing-import]
        from langchain_community.vectorstores import Chroma
        _vector_store_instance = Chroma(
            persist_directory=CHROMA_PATH,
            embedding_function=embeddings,
            collection_name="procurement_knowledge"
        )
        _is_qdrant_active = False
        return _vector_store_instance, _is_qdrant_active
    except Exception as e:
        logger.critical(f"Failed to initialize any vector store (Chroma/Qdrant): {e}")
        raise e

def add_documents_to_store(docs):
    """
    Adds a list of LangChain Document objects to Qdrant/Chroma AND OpenSearch index.
    """
    # 1. Store in Vector DB
    store, is_qdrant = get_vector_store()
    store.add_documents(docs)
    if is_qdrant:
        logger.info(f"Added {len(docs)} documents to Qdrant collection '{QDRANT_COLLECTION}'.")
    else:
        logger.info(f"Added {len(docs)} documents to fallback ChromaDB store.")

    # 2. Store in OpenSearch (BM25 sparse index)
    try:
        from services.search_index import add_documents_to_index
        add_documents_to_index(docs)
    except Exception as e:
        logger.warning(f"Failed to sync documents to OpenSearch sparse index: {e}")

def reciprocal_rank_fusion(results_vector: list, results_lexical: list, k: int = 5, rr_k: int = 60):
    """
    RRF algorithm to fuse ranking scores from semantic and lexical search results.
    """
    rrf_scores = {}
    
    def get_doc_id(doc):
        source = doc.metadata.get("source_file", doc.metadata.get("source", ""))
        page = doc.metadata.get("page", 0)
        return (doc.page_content, source, page)
        
    doc_map = {}
    
    # Process vector results
    for rank, doc in enumerate(results_vector):
        doc_id = get_doc_id(doc)
        doc_map[doc_id] = doc
        rrf_scores[doc_id] = rrf_scores.get(doc_id, 0.0) + 1.0 / (rr_k + (rank + 1))
        
    # Process lexical results
    for rank, doc in enumerate(results_lexical):
        doc_id = get_doc_id(doc)
        doc_map[doc_id] = doc
        rrf_scores[doc_id] = rrf_scores.get(doc_id, 0.0) + 1.0 / (rr_k + (rank + 1))
        
    # Sort docs by RRF score descending
    sorted_doc_ids = sorted(rrf_scores.items(), key=lambda item: item[1], reverse=True)
    
    return [doc_map[doc_id] for doc_id, score in sorted_doc_ids[:k]]

def search_documents(query: str, k: int = 5):
    """
    Performs a Hybrid Retrieval (Qdrant/Chroma semantic search + OpenSearch BM25) fused using RRF.
    """
    # 1. Fetch semantic search results
    store, is_qdrant = get_vector_store()
    results_vector = store.similarity_search(query, k=k)
    logger.info(f"Semantic search returned {len(results_vector)} matches.")

    # 2. Fetch lexical search results
    results_lexical = []
    try:
        from services.search_index import search_sparse_index
        results_lexical = search_sparse_index(query, k=k)
        logger.info(f"Lexical search returned {len(results_lexical)} matches.")
    except Exception as e:
        logger.warning(f"Failed to query OpenSearch BM25: {e}")

    # 3. Apply Reciprocal Rank Fusion if both are active
    if results_lexical:
        fused_results = reciprocal_rank_fusion(results_vector, results_lexical, k=k)
        logger.info(f"Reciprocal Rank Fusion (RRF) fused results returning top {len(fused_results)} matches.")
        return fused_results
        
    return results_vector
