from services.vector_store import search_documents
from services.llm_service import generate_llm_response
from utils.prompts import CHAT_AGENT_PROMPT

def process_chat_query(user_query: str) -> str:
    """
    Retrieves context from ChromaDB and passes it to the LLM to answer the query.
    """
    # 1. Retrieve similar documents
    retrieved_docs = search_documents(user_query, k=4)
    
    # 2. Build context string
    context_text = "\n\n".join([doc.page_content for doc in retrieved_docs])
    
    # 3. Format prompt
    formatted_prompt = CHAT_AGENT_PROMPT.replace("{context}", context_text).replace("{query}", user_query)
    
    # 4. Generate Answer via Ollama
    answer = generate_llm_response(formatted_prompt, user_query)
    
    return answer
