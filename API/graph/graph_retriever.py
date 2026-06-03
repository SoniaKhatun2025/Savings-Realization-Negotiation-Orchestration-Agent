from graph.graph_storage import load_graph
from graph.utils import normalize_supplier_name

def get_supplier_graph_context(supplier_name: str) -> str:
    """
    Retrieves and summarizes the structural Knowledge Graph topology for a supplier into natural language.
    This provides rich relational context for chatbot reasoning.
    """
    if not supplier_name:
        return ""
        
    try:
        # Load supplier graph
        graph = load_graph(supplier_name)
        
        # If there are no nodes, return empty string
        if not graph.nodes:
            return ""
            
        lines = []
        lines.append(f"KNOWLEDGE GRAPH RELATIONSHIP SNAPSHOT FOR VENDOR: {supplier_name}")
        
        # 1. Summarize Categories and Sourcing areas
        categories = []
        for node in graph.nodes:
            if node.type == "Category":
                categories.append(node.properties.get("name", "Unknown Category"))
                
        if categories:
            lines.append(f"- Supplier '{supplier_name}' is associated with category areas: {', '.join(categories)}.")
            
        # 2. Map Nodes by ID for lookup
        node_map = {node.id: node for node in graph.nodes}
        
        # 3. Traversal relationships
        for edge in graph.edges:
            src = node_map.get(edge.source)
            tgt = node_map.get(edge.target)
            
            if not src or not tgt:
                continue
                
            # Document upload mappings
            if edge.relationship == "HAS_INVOICE":
                amount = tgt.properties.get("amount", 0.0)
                benchmark = tgt.properties.get("benchmark", 0.0)
                lines.append(f"- Has Invoice '{tgt.id}' (Amount: ${amount:,.2f}, Benchmark: ${benchmark:,.2f}) uploaded as file: {tgt.properties.get('filename', 'invoice.pdf')}.")
            elif edge.relationship == "HAS_CONTRACT":
                lines.append(f"- Has Contract '{tgt.id}' uploaded as file: {tgt.properties.get('filename', 'contract.pdf')}.")
                
            # Benchmark exclusions
            elif edge.relationship == "EXCEEDS_BENCHMARK":
                variance = edge.properties.get("variance", 0.0)
                lines.append(f"- Invoice '{src.id}' violates benchmark values, exceeding baseline '{tgt.id}' by ${variance:,.2f}.")
                
            # Opportunity mappings
            elif edge.relationship == "GENERATED_OPPORTUNITY":
                savings = tgt.properties.get("savings_potential", 0.0)
                status = tgt.properties.get("status", "Pending Analysis")
                lines.append(f"- Pricing anomaly in Invoice '{src.id}' automatically generated Savings Opportunity '{tgt.id}' with a potential savings value of ${savings:,.2f} (Current Status: {status}).")
            elif edge.relationship == "HAS_OPPORTUNITY" and not any(e.relationship == "GENERATED_OPPORTUNITY" and e.target == tgt.id for e in graph.edges):
                savings = tgt.properties.get("savings_potential", 0.0)
                lines.append(f"- Linked to Opportunity '{tgt.id}' (Potential savings: ${savings:,.2f}, Status: {tgt.properties.get('status', 'Open')}).")
                
            # Negotiation playbook mappings
            elif edge.relationship == "HAS_NEGOTIATION_PLAYBOOK":
                target = tgt.properties.get("target_price", 0.0)
                walkaway = tgt.properties.get("walkaway_price", 0.0)
                savings = tgt.properties.get("expected_savings", 0.0)
                status = tgt.properties.get("status", "Assigned")
                lines.append(f"- Opportunity '{src.id}' triggers AI Negotiation Playbook '{tgt.id}' (Target Negotiation Price: ${target:,.2f}, Walkaway Threshold: ${walkaway:,.2f}, Target Savings: ${savings:,.2f}, Status: {status}).")
                
            # Savings ledger outcomes
            elif edge.relationship == "EXPECTS_SAVINGS":
                amount = tgt.properties.get("realized_savings", 0.0)
                status = tgt.properties.get("status", "Pending Validation")
                lines.append(f"- Negotiation playbook '{src.id}' generated a realized financial savings outcome '{tgt.id}' of ${amount:,.2f} (Validation Status: {status}).")
                
        # If no relations were processed but nodes exist, do basic node listing
        if len(lines) == 1:
            for node in graph.nodes:
                if node.type != "Supplier":
                    lines.append(f"- Contains related entity '{node.id}' of type '{node.type}' (Properties: {node.properties}).")
                    
        return "\n".join(lines)
    except Exception as e:
        print(f"Error compiling graph context for '{supplier_name}': {e}")
        return ""
