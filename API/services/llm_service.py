import os
# pyrefly: ignore [missing-import]
from langchain_ollama import ChatOllama
from langchain_core.messages import HumanMessage, SystemMessage

# Load settings from env
OLLAMA_BASE_URL = os.getenv("MISTRAL_ENDPOINT", "http://localhost:11434")
MODEL_NAME = os.getenv("OLLAMA_MODEL", "mistral-small:latest")

# Initialize ChatOllama instance
chat_model = ChatOllama(
    base_url=OLLAMA_BASE_URL,
    model=MODEL_NAME,
    temperature=0.2, # Low temperature for more deterministic analysis
)

def generate_llm_response(system_prompt: str, user_input: str) -> str:
    """
    Generic wrapper to call Ollama Chat model with a system prompt.
    """
    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_input)
    ]
    
    response = chat_model.invoke(messages)
    return response.content
