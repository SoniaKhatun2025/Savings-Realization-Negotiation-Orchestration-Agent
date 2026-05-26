import json

def format_api_response(data=None, message="Success", status_code=200):
    """
    Standardize the API JSON responses.
    """
    return {
        "status_code": status_code,
        "message": message,
        "data": data
    }

def parse_llm_json(llm_output: str) -> dict:
    """
    Safely parse JSON output from the LLM, stripping markdown blocks if present.
    """
    try:
        # Strip ```json and ``` if the LLM output them
        clean_str = llm_output.strip()
        if clean_str.startswith("```json"):
            clean_str = clean_str[7:]
        if clean_str.startswith("```"):
            clean_str = clean_str[3:]
        if clean_str.endswith("```"):
            clean_str = clean_str[:-3]
            
        return json.loads(clean_str.strip())
    except Exception as e:
        print(f"Error parsing LLM JSON: {e}")
        print(f"Raw Output: {llm_output}")
        # Return empty safe defaults if parsing fails
        return {}
