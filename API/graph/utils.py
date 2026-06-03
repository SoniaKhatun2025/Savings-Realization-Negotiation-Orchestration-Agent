import re

def normalize_supplier_name(name: str) -> str:
    """
    Normalizes supplier name to create a safe, consistent key for filename storage.
    Example: 'TechSource India Pvt Ltd' -> 'techsource_india_pvt_ltd'
             'Dell Technologies' -> 'dell_technologies'
    """
    if not name:
        return "unknown_supplier"
        
    # Lowercase
    clean = name.strip().lower()
    
    # Remove common corporate suffixes (Inc., Ltd., Pvt., Co.)
    suffixes = [
        r'\bpvt\b', r'\bltd\b', r'\binc\b', r'\bcorp\b', r'\bco\b', 
        r'\bcorporation\b', r'\blimited\b', r'\bpvt\.\s*ltd\b', r'\bprivated\b'
    ]
    for suffix in suffixes:
        clean = re.sub(suffix, '', clean)
        
    # Replace non-alphanumeric characters with underscores
    clean = re.sub(r'[^a-z0-9]+', '_', clean)
    
    # Remove leading/trailing underscores
    clean = clean.strip('_')
    
    # Compress multiple consecutive underscores
    clean = re.sub(r'_{2,}', '_', clean)
    
    return clean or "unknown_supplier"
