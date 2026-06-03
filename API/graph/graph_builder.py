from typing import Dict, Any, List
from graph.graph_models import SupplierGraph, Node, Edge
from graph.graph_storage import load_graph, save_graph
from graph.utils import normalize_supplier_name

def add_node(graph: SupplierGraph, node_id: str, node_type: str, properties: Dict[str, Any] = None) -> Node:
    """
    Safely adds a node to the graph if it doesn't exist, preventing duplicates.
    If the node already exists, merges properties.
    """
    properties = properties or {}
    
    # Check for existing node
    for node in graph.nodes:
        if node.id == node_id:
            # Merge and update properties
            node.properties.update(properties)
            return node
            
    # Create new node
    new_node = Node(id=node_id, type=node_type, properties=properties)
    graph.nodes.append(new_node)
    return new_node

def add_edge(graph: SupplierGraph, source: str, target: str, relationship: str, properties: Dict[str, Any] = None) -> Edge:
    """
    Safely adds a directed edge (relationship) between two nodes if it doesn't exist, preventing duplicates.
    """
    properties = properties or {}
    
    # Check if edge already exists
    for edge in graph.edges:
        if edge.source == source and edge.target == target and edge.relationship == relationship:
            edge.properties.update(properties)
            return edge
            
    # Create new edge
    new_edge = Edge(source=source, target=target, relationship=relationship, properties=properties)
    graph.edges.append(new_edge)
    return new_edge

def update_supplier_document_graph(
    supplier_name: str, 
    doc_id: str, 
    doc_type: str, 
    metadata: Dict[str, Any]
) -> bool:
    """
    Fires on new document uploads.
    Creates Supplier, Category, Document, and Opportunity nodes, and maps their relationships.
    """
    if not supplier_name:
        return False
        
    try:
        # 1. Load existing graph
        graph = load_graph(supplier_name)
        
        # 2. Add Supplier node
        supplier_node_id = normalize_supplier_name(supplier_name)
        add_node(graph, supplier_node_id, "Supplier", {
            "name": supplier_name,
            "category": metadata.get("category", "General Procurement")
        })
        
        # 3. Add Category node and connect
        category_name = metadata.get("category", "General Procurement")
        category_node_id = f"CAT-{normalize_supplier_name(category_name)}"
        add_node(graph, category_node_id, "Category", {"name": category_name})
        add_edge(graph, supplier_node_id, category_node_id, "BELONGS_TO_CATEGORY")
        
        # 4. Add Document (Invoice / Contract) node
        doc_properties = {
            "filename": metadata.get("filename", ""),
            "uploaded_at": metadata.get("uploaded_at", ""),
            "uploaded_by": metadata.get("uploaded_by", "")
        }
        if doc_type == "Invoice":
            doc_properties.update({
                "amount": metadata.get("current_spend", 0.0),
                "benchmark": metadata.get("benchmark_spend", 0.0)
            })
            
        doc_node_id = f"DOC-{doc_id}"
        add_node(graph, doc_node_id, doc_type, doc_properties)
        
        # Connect Supplier to Document
        rel_type = "HAS_CONTRACT" if doc_type == "Contract" else "HAS_INVOICE"
        add_edge(graph, supplier_node_id, doc_node_id, rel_type)
        
        # 5. Connect Invoice to Benchmark if benchmark price is violated
        if doc_type == "Invoice" and metadata.get("variance_amount", 0.0) > 0:
            bm_node_id = f"BM-{normalize_supplier_name(category_name)}"
            add_node(graph, bm_node_id, "Benchmark", {
                "category": category_name,
                "benchmark_value": metadata.get("benchmark_spend", 0.0)
            })
            add_edge(graph, doc_node_id, bm_node_id, "EXCEEDS_BENCHMARK", {
                "variance": metadata.get("variance_amount", 0.0)
            })
            
        # 6. Add Opportunity if pricing anomaly triggered it
        opportunity_id = metadata.get("opportunity_id")
        if opportunity_id:
            opp_properties = {
                "current_spend": metadata.get("current_spend", 0.0),
                "benchmark_spend": metadata.get("benchmark_spend", 0.0),
                "savings_potential": metadata.get("savings_potential", 0.0),
                "confidence_score": metadata.get("confidence_score", 90),
                "priority_score": metadata.get("priority_score", 80),
                "status": "Pending Analysis"
            }
            add_node(graph, opportunity_id, "Opportunity", opp_properties)
            add_edge(graph, supplier_node_id, opportunity_id, "HAS_OPPORTUNITY")
            
            if doc_type == "Invoice":
                add_edge(graph, doc_node_id, opportunity_id, "GENERATED_OPPORTUNITY")
                
        # 7. Save graph
        return save_graph(supplier_name, graph)
    except Exception as e:
        print(f"Error updating document graph for '{supplier_name}': {e}")
        return False

def update_negotiation_graph(
    supplier_name: str,
    opportunity_id: str,
    negotiation_id: int,
    playbook_data: Dict[str, Any]
) -> bool:
    """
    Fires when a negotiation playbook is generated or updated.
    Creates Negotiation node and links: Opportunity -> HAS_NEGOTIATION_PLAYBOOK -> Negotiation
    """
    if not supplier_name:
        return False
        
    try:
        graph = load_graph(supplier_name)
        supplier_node_id = normalize_supplier_name(supplier_name)
        
        # Ensure Supplier node exists to prevent empty canvas or orphaned graphs
        add_node(graph, supplier_node_id, "Supplier", {
            "name": supplier_name,
            "category": "General Procurement"
        })
        
        # 1. Add Negotiation node
        neg_node_id = f"NEG-{negotiation_id}"
        neg_properties = {
            "target_price": playbook_data.get("target_price", 0.0),
            "walkaway_price": playbook_data.get("walkaway_price", 0.0),
            "expected_savings": playbook_data.get("expected_savings", 0.0),
            "status": playbook_data.get("status", "Assigned")
        }
        add_node(graph, neg_node_id, "Negotiation", neg_properties)
        add_edge(graph, supplier_node_id, neg_node_id, "HAS_NEGOTIATION")
        
        # 2. Connect Opportunity to Negotiation
        if opportunity_id:
            # Ensure opportunity exists
            add_node(graph, opportunity_id, "Opportunity")
            add_edge(graph, opportunity_id, neg_node_id, "HAS_NEGOTIATION_PLAYBOOK")
            
        return save_graph(supplier_name, graph)
    except Exception as e:
        print(f"Error updating negotiation playbook graph for '{supplier_name}': {e}")
        return False

def update_savings_graph(
    supplier_name: str,
    negotiation_id: int,
    opportunity_id: str,
    realised_savings: float,
    status: str
) -> bool:
    """
    Fires when negotiation outcomes are submitted or validated.
    Creates Savings node and links: Negotiation -> EXPECTS_SAVINGS -> Savings
    """
    if not supplier_name:
        return False
        
    try:
        graph = load_graph(supplier_name)
        supplier_node_id = normalize_supplier_name(supplier_name)
        
        # Ensure Supplier node exists to prevent empty canvas or orphaned graphs
        add_node(graph, supplier_node_id, "Supplier", {
            "name": supplier_name,
            "category": "General Procurement"
        })
        
        neg_node_id = f"NEG-{negotiation_id}"
        savings_node_id = f"SAV-{negotiation_id}"
        
        # 1. Add Savings node
        savings_properties = {
            "realized_savings": realised_savings,
            "status": status
        }
        add_node(graph, savings_node_id, "Savings", savings_properties)
        
        # Ensure negotiation node exists
        add_node(graph, neg_node_id, "Negotiation")
        
        # 2. Connect Negotiation to Savings
        add_edge(graph, neg_node_id, savings_node_id, "EXPECTS_SAVINGS")
        
        # Update status in Negotiation properties if relevant
        for node in graph.nodes:
            if node.id == neg_node_id:
                node.properties["status"] = "Pending Approval" if status == "Pending Validation" else "Completed"
                
        # Update status in Opportunity properties if relevant
        if opportunity_id:
            for node in graph.nodes:
                if node.id == opportunity_id:
                    node.properties["status"] = "Completed" if status == "Validated" else "In Progress"
                    
        return save_graph(supplier_name, graph)
    except Exception as e:
        print(f"Error updating savings outcome graph for '{supplier_name}': {e}")
        return False
