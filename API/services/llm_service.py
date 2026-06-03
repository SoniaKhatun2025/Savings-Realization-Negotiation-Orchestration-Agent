import os
# pyrefly: ignore [missing-import]
from langchain_ollama import ChatOllama
# pyrefly: ignore [missing-import]
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

def generate_llm_stream(system_prompt: str, user_input: str):
    """
    Streaming wrapper to call Ollama Chat model.
    Yields chunks of text as they are generated.
    """
    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_input)
    ]
    
    for chunk in chat_model.stream(messages):
        yield chunk.content

def is_ollama_running() -> bool:
    import requests
    try:
        response = requests.get(OLLAMA_BASE_URL, timeout=1)
        return response.status_code == 200
    except Exception:
        return False

def classify_document(text_sample: str) -> str:
    """
    Classifies a document text sample into one of the valid procurement document types.
    """
    if not is_ollama_running():
        raise Exception("Ollama server is not running.")
        
    from utils.prompts import CLASSIFICATION_AGENT_PROMPT
    prompt = CLASSIFICATION_AGENT_PROMPT.replace("{text_sample}", text_sample)
    
    messages = [
        HumanMessage(content=prompt)
    ]
    
    response = chat_model.invoke(messages)
    # Clean up the response just in case the LLM includes spaces or periods
    category = response.content.strip().replace(".", "")
    
    valid_categories = ["Contract", "Benchmark", "Invoice", "Policy", "Pricing Sheet", "RFQ", "Other"]
    if category not in valid_categories:
        # Fallback if LLM hallucinates
        for valid in valid_categories:
            if valid.lower() in category.lower():
                return valid
        return "Other"
        
    return category

def detect_anomaly(text_sample: str) -> dict:
    if not is_ollama_running():
        raise Exception("Ollama server is not running.")
        
    import json
    from utils.prompts import ANOMALY_DETECTION_PROMPT
    prompt = ANOMALY_DETECTION_PROMPT.replace("{text_sample}", text_sample)
    
    messages = [HumanMessage(content=prompt)]
    response = chat_model.invoke(messages)
    
    try:
        content = response.content.strip()
        # Clean markdown code blocks if LLM adds them
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        
        return json.loads(content)
    except Exception as e:
        print(f"Failed to parse anomaly JSON: {e}")
        return None
