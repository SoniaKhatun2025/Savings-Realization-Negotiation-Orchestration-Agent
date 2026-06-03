"""
Knowledge Graph Visualizer for NexusProcure.
Generates:
1. Interactive Vis-Network HTML (.html) that can be opened in any browser (animations, dragging, zooming).
2. Mermaid Markdown (.mmd) for native visualization in VS Code (using Mermaid extensions).
"""
import os
import json
import sys

# Ensure parent directory is in path to allow seamless imports of other backend modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from graph.graph_storage import load_graph
except ImportError:
    try:
        from graph_storage import load_graph
    except ImportError:
        load_graph = None

GRAPH_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "generated_graphs")

# Colors for different node types
NODE_COLORS = {
    "Supplier": "#38bdf8",     # Sky blue
    "Category": "#a78bfa",     # Violet
    "Invoice": "#f87171",      # Red
    "Contract": "#4ade80",     # Green
    "Opportunity": "#fbbf24",  # Amber/Yellow
    "Negotiation": "#f472b6",  # Pink
    "Savings": "#2dd4bf",      # Teal
    "Benchmark": "#94a3b8",    # Slate gray
    "Other": "#e2e8f0"         # Light gray
}

# Icon/Shape maps for Vis.js
NODE_SHAPES = {
    "Supplier": "circle",
    "Category": "database",
    "Invoice": "hexagon",
    "Contract": "square",
    "Opportunity": "diamond",
    "Negotiation": "box",
    "Savings": "star",
    "Benchmark": "triangle",
    "Other": "dot"
}

# Border colors matching node styles
NODE_BORDERS = {
    "Supplier": "#0369a1",     # Darker blue
    "Category": "#6d28d9",     # Darker violet
    "Invoice": "#b91c1c",      # Darker red
    "Contract": "#15803d",     # Darker green
    "Opportunity": "#b45309",  # Darker amber
    "Negotiation": "#be185d",  # Darker pink
    "Savings": "#0f766e",      # Darker teal
    "Benchmark": "#475569",    # Darker slate
    "Other": "#94a3b8"
}

HTML_TEMPLATE = """<!DOCTYPE html>
<html>
<head>
    <title>Knowledge Graph - {supplier_name}</title>
    <script type="text/javascript" src="https://unpkg.com/vis-network/standalone/umd/vis-network.min.js"></script>
    <style type="text/css">
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #0f172a;
            color: #f8fafc;
            margin: 0;
            padding: 0;
            display: flex;
            flex-direction: column;
            height: 100vh;
            overflow: hidden;
        }}
        header {{
            background-color: #1e293b;
            padding: 15px 20px;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #334155;
            z-index: 10;
        }}
        h1 {{ margin: 0; font-size: 20px; font-weight: 600; color: #38bdf8; }}
        .subtitle {{ font-size: 12px; color: #94a3b8; margin-top: 4px; }}
        #network {{
            width: 100%;
            height: calc(100vh - 80px);
            min-height: 500px;
            background-color: #0f172a;
        }}
        #info-panel {{
            position: absolute;
            bottom: 20px;
            right: 20px;
            width: 320px;
            max-height: 400px;
            background-color: rgba(30, 41, 59, 0.95);
            border: 1px solid #334155;
            border-radius: 12px;
            padding: 16px;
            box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.3);
            overflow-y: auto;
            backdrop-filter: blur(8px);
            z-index: 10;
        }}
        h3 {{ margin-top: 0; color: #38bdf8; border-bottom: 1px solid #334155; padding-bottom: 8px; font-size: 16px; }}
        .prop-row {{ display: flex; justify-content: space-between; font-size: 13px; margin: 8px 0; }}
        .prop-label {{ color: #94a3b8; font-weight: 500; }}
        .prop-value {{ color: #f8fafc; font-weight: 600; text-align: right; word-break: break-all; max-width: 180px; }}
        .legend {{
            position: absolute;
            top: 100px;
            left: 20px;
            background-color: rgba(30, 41, 59, 0.9);
            border: 1px solid #334155;
            border-radius: 8px;
            padding: 12px;
            font-size: 12px;
            z-index: 10;
        }}
        .legend-item {{ display: flex; align-items: center; margin: 6px 0; }}
        .legend-color {{ width: 12px; height: 12px; border-radius: 50%; margin-right: 8px; }}
    </style>
</head>
<body>
    <header>
        <div>
            <h1>NexusProcure Knowledge Graph</h1>
            <div class="subtitle">Interactive Supplier Profile & Sourcing Network: <strong>{supplier_name}</strong></div>
        </div>
        <div style="font-size: 12px; color: #94a3b8;">Click & drag nodes to explore relationships. Zoom with scroll.</div>
    </header>
    
    <div class="legend">
        <strong style="display:block; margin-bottom: 8px; color: #38bdf8;">Node Legend</strong>
        {legend_items}
    </div>

    <div id="network"></div>

    <div id="info-panel">
        <h3>Node Inspector</h3>
        <div id="info-content">
            <p style="color: #94a3b8; font-size: 13px;">Select any node in the graph network to inspect its detailed metadata and properties.</p>
        </div>
    </div>

    <script type="text/javascript">
        // Node details lookup
        const nodeDetails = {node_details_json};

        // Create Vis-Network datasets
        const nodes = new vis.DataSet({nodes_json});
        const edges = new vis.DataSet({edges_json});

        // Network Configuration
        const container = document.getElementById('network');
        const data = {{ nodes: nodes, edges: edges }};
        const options = {{
            nodes: {{
                font: {{ color: '#f8fafc', size: 10, face: 'Segoe UI' }},
                borderWidth: 2,
                shadow: true
            }},
            edges: {{
                color: {{ color: '#475569', highlight: '#38bdf8', hover: '#38bdf8' }},
                arrows: {{ to: {{ enabled: true, scaleFactor: 0.6 }} }},
                font: {{ size: 8, strokeWidth: 0, color: '#94a3b8', face: 'Segoe UI' }},
                width: 1.2,
                smooth: {{ type: 'curvedCW', roundness: 0.2 }}
            }},
            physics: {{
                barnesHut: {{
                    gravitationalConstant: -7000,
                    centralGravity: 0.3,
                    springLength: 220,
                    springConstant: 0.04,
                    damping: 0.09
                }},
                stabilization: {{ iterations: 150 }}
            }},
            interaction: {{ hover: true }}
        }};

        const network = new vis.Network(container, data, options);

        // Select Node Listener
        network.on("selectNode", function (params) {{
            const nodeId = params.nodes[0];
            const detail = nodeDetails[nodeId];
            if (!detail) return;

            let html = `<h3>${{detail.type}}: ${{nodeId}}</h3>`;
            
            // Format properties beautifully
            if (detail.properties && Object.keys(detail.properties).length > 0) {{
                for (const [key, value] of Object.entries(detail.properties)) {{
                    let displayVal = value;
                    if (typeof value === 'object') {{
                        displayVal = JSON.stringify(value);
                    }} else if (typeof value === 'number') {{
                        // Currency format if it looks like spend or savings
                        if (key.includes('spend') || key.includes('amount') || key.includes('potential') || key.includes('savings') || key.includes('price')) {{
                            displayVal = '$' + value.toLocaleString();
                        }}
                    }}
                    
                    // Human readable key labels
                    const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                    
                    html += `
                        <div class="prop-row">
                            <span class="prop-label">${{label}}</span>
                            <span class="prop-value">${{displayVal}}</span>
                        </div>
                    `;
                }}
            }} else {{
                html += `<p style="color: #94a3b8; font-size: 13px;">No explicit properties recorded for this node.</p>`;
            }}

            document.getElementById('info-content').innerHTML = html;
        }});

        // Deselect Listener
        network.on("deselectNode", function (params) {{
            document.getElementById('info-content').innerHTML = `
                <p style="color: #94a3b8; font-size: 13px;">Select any node in the graph network to inspect its detailed metadata and properties.</p>
            `;
        }});
    </script>
</body>
</html>
"""

def generate_mermaid_markdown(graph_data) -> str:
    """Generates Mermaid Markdown flowchart from JSON graph data."""
    lines = ["flowchart TD"]
    
    # 1. Define nodes with shapes and styling based on type
    for node in graph_data.get("nodes", []):
        nid = node["id"]
        ntype = node["type"]
        props = node.get("properties", {})
        label = props.get("name", nid)
        
        # Format a brief metric summary to put on the Mermaid node
        metrics = []
        if ntype == "Opportunity":
            spend = props.get("current_spend")
            sav = props.get("savings_potential")
            if spend is not None:
                metrics.append(f"Spend: ${int(spend):,}")
            if sav is not None:
                metrics.append(f"Savings: ${int(sav):,}")
        elif ntype == "Negotiation":
            target = props.get("target_price")
            exp_sav = props.get("expected_savings")
            if target is not None:
                metrics.append(f"Target: ${int(target):,}")
            if exp_sav is not None:
                metrics.append(f"Exp Sav: ${int(exp_sav):,}")
        elif ntype == "Savings":
            realized = props.get("realized_savings")
            if realized is not None:
                metrics.append(f"Realized: ${int(realized):,}")
        elif ntype in ["Invoice", "Contract", "Pricing Sheet"]:
            amt = props.get("amount") or props.get("current_spend")
            if amt is not None:
                metrics.append(f"Amt: ${int(amt):,}")
        elif ntype == "Benchmark":
            val = props.get("benchmark_value") or props.get("benchmark_spend")
            if val is not None:
                metrics.append(f"Val: ${int(val):,}")
                
        if metrics:
            display_label = f"{label} [{ntype}]\\n" + " | ".join(metrics)
        else:
            display_label = f"{label} [{ntype}]"
            
        # Determine shape syntax
        if ntype == "Supplier":
            shape = f'("{display_label}")'
        elif ntype == "Category":
            shape = f'[("{display_label}")]'
        elif ntype == "Opportunity":
            shape = f'{nid}{{"{display_label}"}}'
        elif ntype == "Negotiation":
            shape = f'["{display_label}"]'
        elif ntype == "Savings":
            shape = f'{nid}(("{display_label}"))'
        else:
            shape = f'["{display_label}"]'
            
        lines.append(f"    {nid}{shape}")
        
    # 2. Define relationships/edges
    for edge in graph_data.get("edges", []):
        src = edge["source"]
        target = edge["target"]
        rel = edge["relationship"]
        lines.append(f"    {src} -->|{rel}| {target}")
        
    # 3. Define styling classes/colors
    for ntype, color in NODE_COLORS.items():
        lines.append(f"    classDef {ntype.lower()} fill:{color},stroke:#334155,stroke-width:2px,color:#0f172a;")
        
    # Apply styling classes to nodes
    for node in graph_data.get("nodes", []):
        nid = node["id"]
        ntype = node["type"]
        lines.append(f"    class {nid} {ntype.lower()}")
        
    return "\n".join(lines)


def format_compact_in(val) -> str:
    if val is None:
        return ""
    val_float = float(val)
    if val_float >= 1_000_000:
        return f"₹{val_float / 1_000_000:.1f}M"
    elif val_float >= 1_000:
        return f"₹{val_float / 1_000:.0f}k"
    else:
        return f"₹{val_float:.0f}"

def get_rich_node_label(node_id: str, node_type: str, props: dict) -> str:
    """Generates a text label containing key metrics to display directly on the graph node."""
    name = props.get("name", node_id)
    lines = [name]
    
    if node_type == "Supplier":
        cat = props.get("category")
        disc = props.get("historical_discount")
        sub_info = []
        if cat:
            sub_info.append(cat)
        if disc is not None:
            sub_info.append(f"Disc: {disc}%")
        if sub_info:
            lines.append(" | ".join(sub_info))
            
    elif node_type == "Opportunity":
        spend = props.get("current_spend")
        potential = props.get("savings_potential")
        status = props.get("status")
        if spend is not None or potential is not None:
            spend_str = format_compact_in(spend) if spend is not None else "—"
            pot_str = format_compact_in(potential) if potential is not None else "—"
            lines.append(f"Spend: {spend_str} | Sav: {pot_str}")
        if status:
            lines.append(f"Status: {status}")
            
    elif node_type == "Negotiation":
        target = props.get("target_price")
        exp_sav = props.get("expected_savings")
        status = props.get("status")
        if target is not None or exp_sav is not None:
            target_str = format_compact_in(target) if target is not None else "—"
            sav_str = format_compact_in(exp_sav) if exp_sav is not None else "—"
            lines.append(f"Tgt: {target_str} | Exp: {sav_str}")
        if status:
            lines.append(f"Status: {status}")
            
    elif node_type == "Savings":
        realized = props.get("realized_savings")
        planned = props.get("planned_savings")
        status = props.get("status")
        if realized is not None:
            lines.append(f"Realized: {format_compact_in(realized)}")
        elif planned is not None:
            lines.append(f"Planned: {format_compact_in(planned)}")
        if status:
            lines.append(f"Status: {status}")
            
    elif node_type in ["Invoice", "Contract", "Pricing Sheet"]:
        amt = props.get("amount") or props.get("current_spend")
        filename = props.get("filename")
        sub_info = []
        if amt is not None:
            sub_info.append(format_compact_in(amt))
        if filename:
            short_name = filename if len(filename) <= 12 else filename[:9] + "..."
            sub_info.append(short_name)
        if sub_info:
            lines.append(" | ".join(sub_info))
            
    elif node_type == "Benchmark":
        val = props.get("benchmark_value") or props.get("benchmark_spend")
        if val is not None:
            lines.append(f"Val: {format_compact_in(val)}")
            
    return "\n".join(lines)


def generate_interactive_html(supplier_name: str, graph_data) -> str:
    """Generates a standalone Vis.js interactive graph network page."""
    nodes = []
    node_details = {}
    
    # Process nodes
    for node in graph_data.get("nodes", []):
        nid = node["id"]
        ntype = node["type"]
        props = node.get("properties", {})
        
        rich_label = get_rich_node_label(nid, ntype, props)
        
        nodes.append({
            "id": nid,
            "label": rich_label,
            "color": {
                "background": NODE_COLORS.get(ntype, "#e2e8f0"),
                "border": NODE_BORDERS.get(ntype, "#334155"),
                "highlight": {
                    "background": "#38bdf8",
                    "border": "#0284c7"
                }
            },
            "shape": NODE_SHAPES.get(ntype, "dot"),
            "size": 18 if ntype in ["Benchmark", "Other"] else (22 if ntype in ["Savings", "Opportunity", "Invoice", "Contract"] else 25)
        })
        
        node_details[nid] = {
            "type": ntype,
            "properties": props
        }
        
    # Process edges
    edges = []
    for edge in graph_data.get("edges", []):
        edges.append({
            "from": edge["source"],
            "to": edge["target"],
            "label": edge["relationship"]
        })
        
    # Legend HTML elements
    legend_items = []
    for ntype, color in NODE_COLORS.items():
        # Check if this node type is present in graph to avoid cluttered legend
        if any(n["type"] == ntype for n in graph_data.get("nodes", [])):
            legend_items.append(f"""
                <div class="legend-item">
                    <div class="legend-color" style="background-color: {color};"></div>
                    <span>{ntype}</span>
                </div>
            """)
            
    return HTML_TEMPLATE.format(
        supplier_name=supplier_name,
        legend_items="\n".join(legend_items),
        node_details_json=json.dumps(node_details, ensure_ascii=False),
        nodes_json=json.dumps(nodes, ensure_ascii=False),
        edges_json=json.dumps(edges, ensure_ascii=False)
    )


def main():
    if not os.path.exists(GRAPH_DIR):
        print(f"Error: Graph storage directory '{GRAPH_DIR}' does not exist.")
        sys.exit(1)
        
    # List all available supplier graph files
    graph_files = [f for f in os.listdir(GRAPH_DIR) if f.endswith(".json")]
    
    if not graph_files:
        print("No knowledge graphs found under API/graph/supplier_graphs/ directory.")
        sys.exit(0)
        
    # Parse CLI argument
    selected_file = None
    if len(sys.argv) > 1:
        arg_name = sys.argv[1].replace(".json", "")
        for gf in graph_files:
            if gf.lower().startswith(arg_name.lower()):
                selected_file = gf
                break
        if not selected_file:
            print(f"Error: Supplier graph matching '{sys.argv[1]}' was not found.")
            
    if not selected_file:
        print("\n--- AVAILABLE KNOWLEDGE GRAPHS ---")
        for i, gf in enumerate(graph_files):
            print(f" [{i+1}] {gf.replace('.json', '')}")
            
        try:
            choice = input("\nEnter choice number to visualize (or press Ctrl+C to exit): ")
            idx = int(choice) - 1
            if 0 <= idx < len(graph_files):
                selected_file = graph_files[idx]
            else:
                print("Invalid choice.")
                sys.exit(1)
        except (KeyboardInterrupt, ValueError):
            print("\nExiting.")
            sys.exit(0)
            
    # Load selected graph dynamically syncing with MySQL Database
    supplier_name = selected_file.replace(".json", "")
    full_path = os.path.join(GRAPH_DIR, selected_file)
    
    print(f"\nLoading graph: {full_path}...")
    if load_graph:
        try:
            # load_graph will fetch the JSON, call sync_graph_with_db and return fully populated graph
            graph = load_graph(supplier_name)
            graph_data = {
                "supplier": graph.supplier,
                "nodes": [n.model_dump() for n in graph.nodes],
                "edges": [e.model_dump() for e in graph.edges]
            }
            # Save the synced graph back to JSON file to keep it updated
            from graph_storage import save_graph
            save_graph(supplier_name, graph)
            print("  [OK] Graph dynamically synced with MySQL Database successfully!")
        except Exception as sync_err:
            print(f"  [Warning] DB sync failed during loading, falling back to local file: {sync_err}")
            with open(full_path, "r", encoding="utf-8") as f:
                graph_data = json.load(f)
    else:
        with open(full_path, "r", encoding="utf-8") as f:
            graph_data = json.load(f)
        
    # 1. Export Mermaid MMD
    mmd_content = generate_mermaid_markdown(graph_data)
    mmd_path = os.path.join(GRAPH_DIR, f"{supplier_name}_mermaid.mmd")
    with open(mmd_path, "w", encoding="utf-8") as f:
        f.write(mmd_content)
    print(f"  [OK] Exported Mermaid flowchart: {mmd_path}")
    print("       (View natively in VS Code using 'Mermaid Preview' extension!)")
    
    # 2. Export vis.js interactive HTML page
    html_content = generate_interactive_html(graph_data.get("supplier", supplier_name), graph_data)
    html_path = os.path.join(GRAPH_DIR, f"{supplier_name}_interactive.html")
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"  [OK] Exported Interactive Network: {html_path}")
    print("       (Double-click this .html file to open in any web browser with animations!)")


if __name__ == "__main__":
    main()
