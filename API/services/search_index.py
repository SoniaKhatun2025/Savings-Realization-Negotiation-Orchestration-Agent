import os
import logging
# pyrefly: ignore [missing-import]
from opensearchpy import OpenSearch
# pyrefly: ignore [missing-import]
from langchain_core.documents import Document

logger = logging.getLogger(__name__)

# Load config
OPENSEARCH_HOST = os.getenv("OPENSEARCH_HOST", "http://localhost")
OPENSEARCH_PORT = int(os.getenv("OPENSEARCH_PORT", 9200))
OPENSEARCH_USER = os.getenv("OPENSEARCH_USER", "admin")
OPENSEARCH_PASSWORD = os.getenv("OPENSEARCH_PASSWORD", "admin")
OPENSEARCH_INDEX = os.getenv("OPENSEARCH_INDEX", "procurement_knowledge")
OPENSEARCH_USE_SSL = os.getenv("OPENSEARCH_USE_SSL", "False").lower() in ("true", "1", "yes")
OPENSEARCH_VERIFY_CERTS = os.getenv("OPENSEARCH_VERIFY_CERTS", "False").lower() in ("true", "1", "yes")

_opensearch_client = None

def get_opensearch_client():
    global _opensearch_client
    if _opensearch_client is not None:
        return _opensearch_client
        
    try:
        hosts = [{"host": OPENSEARCH_HOST.replace("http://", "").replace("https://", ""), "port": OPENSEARCH_PORT}]
        auth = (OPENSEARCH_USER, OPENSEARCH_PASSWORD)
        
        client = OpenSearch(
            hosts=hosts,
            http_auth=auth,
            use_ssl=OPENSEARCH_USE_SSL,
            verify_certs=OPENSEARCH_VERIFY_CERTS,
            ssl_assert_hostname=False,
            ssl_show_warn=False,
            timeout=5  # Quick timeout to fallback gracefully
        )
        
        # Test connection & Ensure index exists
        if not client.indices.exists(index=OPENSEARCH_INDEX):
            # Create index with BM25 configuration
            settings = {
                "settings": {
                    "index": {
                        "number_of_shards": 1,
                        "number_of_replicas": 0
                    }
                },
                "mappings": {
                    "properties": {
                        "text": {"type": "text", "analyzer": "english"},
                        "metadata": {"type": "object"}
                    }
                }
            }
            client.indices.create(index=OPENSEARCH_INDEX, body=settings)
            logger.info(f"OpenSearch index '{OPENSEARCH_INDEX}' created successfully.")
            
        _opensearch_client = client
        return _opensearch_client
    except Exception as e:
        logger.warning(f"OpenSearch connection failed: {e}. Falling back to semantic-only retrieval.")
        return None

def add_documents_to_index(docs: list[Document]):
    """
    Indexes document chunks into OpenSearch for sparse BM25 retrieval.
    """
    client = get_opensearch_client()
    if client is None:
        return
        
    try:
        for doc in docs:
            body = {
                "text": doc.page_content,
                "metadata": doc.metadata
            }
            client.index(index=OPENSEARCH_INDEX, body=body)
        logger.info(f"Indexed {len(docs)} document chunks into OpenSearch.")
    except Exception as e:
        logger.error(f"Failed to add documents to OpenSearch index: {e}")

def search_sparse_index(query: str, k: int = 5) -> list[Document]:
    """
    Performs a lexical BM25 search in OpenSearch.
    """
    client = get_opensearch_client()
    if client is None:
        return []
        
    try:
        body = {
            "size": k,
            "query": {
                "match": {
                    "text": query
                }
            }
        }
        res = client.search(index=OPENSEARCH_INDEX, body=body)
        hits = res.get("hits", {}).get("hits", [])
        
        results = []
        for hit in hits:
            source = hit.get("_source", {})
            results.append(Document(
                page_content=source.get("text", ""),
                metadata=source.get("metadata", {})
            ))
        return results
    except Exception as e:
        logger.error(f"OpenSearch query failed: {e}")
        return []
