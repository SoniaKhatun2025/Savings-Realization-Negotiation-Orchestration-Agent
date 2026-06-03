import os
import sys

# Ensure parent directory is in path to allow imports of database, etc.
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from graph.graph_storage import load_graph, save_graph
except ImportError:
    from graph_storage import load_graph, save_graph

GRAPH_DIR = os.path.dirname(os.path.abspath(__file__))
GENERATED_GRAPHS_DIR = os.path.join(GRAPH_DIR, "generated_graphs")

def main():
    if not os.path.exists(GENERATED_GRAPHS_DIR):
        print(f"Error: Directory '{GENERATED_GRAPHS_DIR}' does not exist.")
        sys.exit(1)
        
    # List all available supplier graph JSON files
    graph_files = [f for f in os.listdir(GENERATED_GRAPHS_DIR) if f.endswith(".json")]
    
    if not graph_files:
        print("No JSON files found to regenerate.")
        sys.exit(0)
        
    print(f"Found {len(graph_files)} supplier graphs to update using the new visualize_graph styling...")
    
    for gf in graph_files:
        supplier_key = gf.replace(".json", "")
        print(f"\nUpdating graph: {supplier_key}...")
        try:
            # load_graph will fetch/sync the latest from MySQL DB
            graph = load_graph(supplier_key)
            
            # 1. Save and compile using display name (e.g., "Dell Technologies")
            display_name = graph.supplier if graph.supplier else supplier_key
            success_disp = save_graph(display_name, graph)
            
            # 2. Save and compile using normalized key (e.g., "dell_technologies")
            success_norm = save_graph(supplier_key, graph)
            
            if success_disp and success_norm:
                print(f"  [SUCCESS] Updated files for display name '{display_name}' and key '{supplier_key}'")
            else:
                print(f"  [WARNING] Save status: Display name={success_disp}, Key={success_norm}")
        except Exception as e:
            print(f"  [ERROR] Failed processing {supplier_key}: {e}")
            
    print("\nAll existing graphs have been successfully regenerated and updated!")

if __name__ == "__main__":
    main()
