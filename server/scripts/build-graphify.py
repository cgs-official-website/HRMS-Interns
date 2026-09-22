import os
import sys
import json
from pathlib import Path

# Fix Windows console encoding
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from graphify.detect import detect
from graphify.extract import collect_files, extract
from graphify.build import build_from_json
from graphify.cluster import cluster, score_all
from graphify.analyze import god_nodes, surprising_connections, suggest_questions
from graphify.report import generate
from graphify.export import to_json, to_html

def build_graph_for(folder_path, label=""):
    folder = Path(folder_path).resolve()
    out_dir = folder / "graphify-out"
    out_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"\n==================================================")
    print(f"GRAPHIFY GENERATOR FOR: {folder.name.upper()} ({label})")
    print(f"==================================================")

    # 1. Detect
    detection = detect(folder)
    print(f"Detected {detection['total_files']} files ({detection['total_words']} words)")

    # 2. Extract AST
    code_files = []
    for f in detection.get('files', {}).get('code', []):
        p = Path(f)
        code_files.extend(collect_files(p) if p.is_dir() else [p])

    if code_files:
        ast_result = extract(code_files, cache_root=folder)
        print(f"Extracted {len(ast_result['nodes'])} AST nodes, {len(ast_result['edges'])} edges")
    else:
        ast_result = {'nodes': [], 'edges': [], 'input_tokens': 0, 'output_tokens': 0}
        print("No code files detected.")

    extraction = {
        'nodes': ast_result['nodes'],
        'edges': ast_result['edges'],
        'hyperedges': [],
        'input_tokens': 0,
        'output_tokens': 0
    }

    if len(extraction['nodes']) == 0:
        print("No nodes to graph.")
        return

    # 3. Build & Cluster
    G = build_from_json(extraction, root=str(folder), directed=False)
    communities = cluster(G)
    cohesion = score_all(G, communities)
    gods = god_nodes(G)
    surprises = surprising_connections(G, communities)
    labels = {cid: f"Community {cid}" for cid in communities}
    questions = suggest_questions(G, communities, labels)

    # 4. Export JSON & HTML & Report
    json_path = out_dir / "graph.json"
    to_json(G, communities, str(json_path), community_labels=labels)
    
    html_path = out_dir / "graph.html"
    to_html(G, communities, str(html_path), community_labels=labels)

    report = generate(G, communities, cohesion, labels, gods, surprises, detection, {'input': 0, 'output': 0}, str(folder), suggested_questions=questions)
    (out_dir / "GRAPH_REPORT.md").write_text(report, encoding="utf-8")

    print(f"Generated Knowledge Graph in: {out_dir}")
    print(f"- {html_path.name} (Interactive Visualizer)")
    print(f"- {json_path.name} (GraphRAG Data)")
    print(f"- GRAPH_REPORT.md (Architecture Report)")

if __name__ == "__main__":
    # Frontend
    build_graph_for(r"c:\HRMS\client", "Frontend React + Vite")
    # Backend
    build_graph_for(r"c:\HRMS\server", "Backend Express + PostgreSQL")
