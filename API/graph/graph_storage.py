import os
import json
import tempfile
import threading
from typing import Dict, Any
from decimal import Decimal
from graph.graph_models import SupplierGraph, Node, Edge
from graph.utils import normalize_supplier_name

# Global lock to synchronize file writes across background tasks
_file_lock = threading.Lock()

GRAPH_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "generated_graphs")

def get_graph_path(supplier_name: str) -> str:
    """
    Returns the absolute file path for a supplier's graph.
    Creates the graph storage directory if it does not exist.
    """
    os.makedirs(GRAPH_DIR, exist_ok=True)
    safe_name = normalize_supplier_name(supplier_name)
    return os.path.join(GRAPH_DIR, f"{safe_name}.json")

def sync_graph_with_db(supplier_name: str, graph: SupplierGraph) -> None:
    """
    Queries the MySQL database to retrieve the latest properties for all nodes 
    in the graph (Supplier, Opportunities, Negotiations, Savings, Documents) and merges 
    them to ensure the graph shows all extracted spend, benchmark, and savings details.
    """
    from database.connection import get_db_connection
    
    # Local helpers to prevent circular imports with graph_builder
    def local_add_node(g, node_id, node_type, properties=None):
        properties = properties or {}
        for node in g.nodes:
            if node.id == node_id:
                node.properties.update(properties)
                return node
        new_node = Node(id=node_id, type=node_type, properties=properties)
        g.nodes.append(new_node)
        return new_node

    def local_add_edge(g, source, target, relationship, properties=None):
        properties = properties or {}
        for edge in g.edges:
            if edge.source == source and edge.target == target and edge.relationship == relationship:
                edge.properties.update(properties)
                return edge
        new_edge = Edge(source=source, target=target, relationship=relationship, properties=properties)
        g.edges.append(new_edge)
        return new_edge

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        supplier_node_id = normalize_supplier_name(supplier_name)
        
        # ── 1. Sync Supplier Node ──
        # Try both the original and space-replaced names to ensure perfect matching
        search_term_space = supplier_name.replace("_", " ")
        cursor.execute("""
            SELECT s.id, s.name, s.category, t.name as risk_level, s.historical_discount 
            FROM suppliers s
            LEFT JOIN types t ON s.risk_level_id = t.id
            WHERE s.name = %s OR LOWER(s.name) = LOWER(%s) OR LOWER(s.name) LIKE %s OR LOWER(s.name) LIKE %s OR s.id = %s
        """, (supplier_name, search_term_space, f"%{search_term_space}%", f"%{supplier_name[:5]}%", supplier_name))
        sup_db = cursor.fetchone()
        
        sup_props = {
            "name": supplier_name,
            "category": "General Procurement"
        }
        db_supplier_id = None
        if sup_db:
            db_supplier_id = sup_db["id"]
            sup_props.update({
                "name": sup_db["name"],
                "category": sup_db["category"],
                "risk_level": sup_db["risk_level"] or "Medium",
                "historical_discount": float(sup_db["historical_discount"] or 0)
            })
        local_add_node(graph, supplier_node_id, "Supplier", sup_props)
        
        if db_supplier_id:
            # ── 2. Sync Opportunity Nodes ──
            cursor.execute("""
                SELECT o.*, stat.name as status_name, t.name as risk_level
                FROM opportunities o
                JOIN statuses stat ON o.status_id = stat.id
                LEFT JOIN types t ON o.risk_level_id = t.id
                WHERE o.supplier_id = %s
            """, (db_supplier_id,))
            opps_db = cursor.fetchall()
            
            for opp in opps_db:
                opp_id = opp["id"]
                opp_props = {
                    "category": opp["category"],
                    "current_spend": float(opp["current_spend"] or 0),
                    "benchmark_spend": float(opp["benchmark_spend"] or 0),
                    "variance_amount": float(opp["variance_amount"] or 0),
                    "savings_potential": float(opp["savings_potential"] or 0),
                    "confidence_score": opp["confidence_score"],
                    "risk_level": opp["risk_level"] or "Medium",
                    "priority_score": opp["priority_score"],
                    "status": opp["status_name"]
                }
                local_add_node(graph, opp_id, "Opportunity", opp_props)
                local_add_edge(graph, supplier_node_id, opp_id, "HAS_OPPORTUNITY")
                
            # ── 3. Sync Negotiation Nodes ──
            cursor.execute("""
                SELECT n.*, stat.name as status_name
                FROM negotiations n
                JOIN statuses stat ON n.status_id = stat.id
                WHERE n.supplier_id = %s
            """, (db_supplier_id,))
            negs_db = cursor.fetchall()
            
            for neg in negs_db:
                neg_id = f"NEG-{neg['id']}"
                neg_props = {
                    "target_price": float(neg["target_price"] or 0),
                    "walkaway_price": float(neg["walkaway_price"] or 0),
                    "expected_savings": float(neg["expected_savings"] or 0),
                    "actual_price": float(neg["actual_price"]) if neg["actual_price"] else None,
                    "realised_savings": float(neg["realised_savings"]) if neg["realised_savings"] else None,
                    "status": neg["status_name"],
                    "talking_points": neg["talking_points"]
                }
                local_add_node(graph, neg_id, "Negotiation", neg_props)
                local_add_edge(graph, supplier_node_id, neg_id, "HAS_NEGOTIATION")
                
                if neg["opportunity_id"]:
                    local_add_edge(graph, neg["opportunity_id"], neg_id, "HAS_NEGOTIATION_PLAYBOOK")
                    
            # ── 4. Sync Savings Nodes ──
            cursor.execute("""
                SELECT s.*, stat.name as status_name
                FROM savings_tracker s
                JOIN statuses stat ON s.status_id = stat.id
                JOIN negotiations n ON s.negotiation_id = n.id
                WHERE n.supplier_id = %s
            """, (db_supplier_id,))
            savings_db = cursor.fetchall()
            
            for sav in savings_db:
                sav_id = f"SAV-{sav['negotiation_id']}"
                sav_props = {
                    "planned_savings": float(sav["planned_savings"] or 0),
                    "realized_savings": float(sav["realized_savings"] or 0),
                    "status": sav["status_name"]
                }
                local_add_node(graph, sav_id, "Savings", sav_props)
                local_add_edge(graph, f"NEG-{sav['negotiation_id']}", sav_id, "EXPECTS_SAVINGS")
                
            # ── 5. Sync Document Nodes ──
            # Look for documents with filenames matching the first word of supplier name (handles both space and underscores)
            first_word = supplier_name.replace("_", " ").split()[0]
            search_pattern = f"%{first_word}%"
            cursor.execute("""
                SELECT d.id, d.filename, t.name as doc_type, stat.name as status_name, d.extraction_status, d.uploaded_at
                FROM uploaded_documents d
                JOIN types t ON d.doc_type_id = t.id
                JOIN statuses stat ON d.processing_status_id = stat.id
                WHERE d.filename LIKE %s
            """, (search_pattern,))
            docs_db = cursor.fetchall()
            
            for doc in docs_db:
                doc_id = f"DOC-{doc['id']}"
                doc_props = {
                    "filename": doc["filename"],
                    "doc_type": doc["doc_type"],
                    "status": doc["status_name"],
                    "extraction_status": doc["extraction_status"],
                    "uploaded_at": str(doc["uploaded_at"])
                }
                local_add_node(graph, doc_id, doc["doc_type"], doc_props)
                local_add_edge(graph, supplier_node_id, doc_id, "HAS_DOCUMENT")
                
        conn.close()
    except Exception as e:
        print(f"Safe DB sync warning for supplier '{supplier_name}': {e}")

def load_graph(supplier_name: str) -> SupplierGraph:
    """
    Loads and parses the SupplierGraph from file system, then syncs it 
    dynamically with the MySQL database to populate all transaction data.
    """
    file_path = get_graph_path(supplier_name)
    
    with _file_lock:
        if not os.path.exists(file_path):
            graph = SupplierGraph(supplier=supplier_name)
            # Fetch latest data from database
            sync_graph_with_db(supplier_name, graph)
            return graph
            
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                
            # Parse lists into Node and Edge models
            nodes = [Node(**n) for n in data.get("nodes", [])]
            edges = [Edge(**e) for e in data.get("edges", [])]
            
            graph = SupplierGraph(
                supplier=data.get("supplier", supplier_name),
                nodes=nodes,
                edges=edges
            )
            
            # Enrich graph dynamically with database values
            sync_graph_with_db(supplier_name, graph)
            
            return graph
        except Exception as e:
            print(f"Error loading graph for '{supplier_name}', auto-recovering: {e}")
            graph = SupplierGraph(supplier=supplier_name)
            sync_graph_with_db(supplier_name, graph)
            return graph

def save_graph(supplier_name: str, graph: SupplierGraph) -> bool:
    """
    Persists the SupplierGraph to the file system using atomic writes.
    """
    file_path = get_graph_path(supplier_name)
    
    # Sync with DB before saving to ensure we save the fully enriched graph!
    sync_graph_with_db(supplier_name, graph)
    
    with _file_lock:
        try:
            # Prepare serialization data
            serialized = {
                "supplier": graph.supplier,
                "nodes": [n.model_dump() for n in graph.nodes],
                "edges": [e.model_dump() for e in graph.edges]
            }
            
            # Atomic write pattern: Write to temp file in same directory first
            dir_name = os.path.dirname(file_path)
            with tempfile.NamedTemporaryFile("w", dir=dir_name, delete=False, suffix=".tmp", encoding="utf-8") as temp_file:
                json.dump(serialized, temp_file, indent=2, ensure_ascii=False)
                temp_file_path = temp_file.name
                
            # Atomically replace target file
            os.replace(temp_file_path, file_path)
            
            # ── Auto-Compile Interactive HTML and Mermaid MMD files in real-time! ──
            try:
                from graph.visualize_graph import generate_interactive_html, generate_mermaid_markdown
            except ImportError:
                try:
                    from visualize_graph import generate_interactive_html, generate_mermaid_markdown
                except ImportError:
                    generate_interactive_html = None
                    generate_mermaid_markdown = None
                    
            if generate_interactive_html and generate_mermaid_markdown:
                try:
                    # 1. Compile Vis.js interactive HTML
                    html_content = generate_interactive_html(graph.supplier, serialized)
                    html_path = os.path.join(dir_name, f"{supplier_name}_interactive.html")
                    with open(html_path, "w", encoding="utf-8") as hf:
                        hf.write(html_content)
                        
                    # 2. Compile Mermaid markdown chart
                    mmd_content = generate_mermaid_markdown(serialized)
                    mmd_path = os.path.join(dir_name, f"{supplier_name}_mermaid.mmd")
                    with open(mmd_path, "w", encoding="utf-8") as mf:
                        mf.write(mmd_content)
                        
                    print(f"  [Auto-Compile] Generated HTML and Mermaid graphs for '{supplier_name}' successfully!")
                except Exception as compile_err:
                    print(f"  [Auto-Compile Warning] HTML/Mermaid compilation skipped/failed: {compile_err}")
            
            return True
        except Exception as e:
            print(f"Failed atomic write for graph of '{supplier_name}': {e}")
            try:
                if 'temp_file_path' in locals() and os.path.exists(temp_file_path):
                    os.remove(temp_file_path)
            except:
                pass
            return False
