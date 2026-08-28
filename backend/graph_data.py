import networkx as nx
import random
from typing import Dict, List, Any


def generate_mock_crime_network(seed: int = 42) -> nx.Graph:
    random.seed(seed)
    G = nx.Graph()

    num_groups = 4
    group_size = 6
    internal_edge_prob = 0.95

    group_nodes = {}
    node_id = 0

    for g in range(num_groups):
        nodes = []
        for i in range(group_size):
            name = f"Suspect_{g}_{i}"
            G.add_node(node_id, name=name, group=g, role="member")
            nodes.append(node_id)
            node_id += 1
        group_nodes[g] = nodes

        for i in range(len(nodes)):
            for j in range(i + 1, len(nodes)):
                if random.random() < internal_edge_prob:
                    G.add_edge(nodes[i], nodes[j], weight=1.0, type="internal")

    coordinator_id = node_id
    G.add_node(coordinator_id, name="Hidden Coordinator", group=-1, role="coordinator")
    node_id += 1

    bridge_node_g0 = group_nodes[0][0]
    bridge_node_g2 = group_nodes[2][0]

    G.add_edge(coordinator_id, bridge_node_g0, weight=1.0, type="cross-group")
    G.add_edge(coordinator_id, bridge_node_g2, weight=1.0, type="cross-group")

    return G


def compute_graph_metrics(G: nx.Graph) -> Dict[int, Dict[str, Any]]:
    degree = dict(G.degree())
    betweenness = nx.betweenness_centrality(G, normalized=True, weight="weight")

    try:
        communities = list(nx.community.louvain_communities(G, weight="weight", seed=42))
    except Exception:
        communities = []

    community_map = {}
    for comm_id, comm in enumerate(communities):
        for node in comm:
            community_map[node] = comm_id

    degree_values = list(degree.values())
    betweenness_values = list(betweenness.values())

    degree_sorted = sorted(degree_values)
    betweenness_sorted = sorted(betweenness_values)

    deg_p50 = degree_sorted[int(len(degree_sorted) * 0.5)]
    bet_p85 = betweenness_sorted[int(len(betweenness_sorted) * 0.85)]

    metrics = {}
    for node in G.nodes():
        deg = degree[node]
        bet = betweenness[node]
        comm_id = community_map.get(node, -1)
        is_flagged = (bet >= bet_p85) and (deg <= deg_p50)

        metrics[node] = {
            "degree": deg,
            "betweenness": round(bet, 6),
            "community": comm_id,
            "flagged": is_flagged,
            "name": G.nodes[node].get("name", f"Node_{node}"),
            "role": G.nodes[node].get("role", "member"),
        }

    return metrics


def get_graph_data() -> Dict[str, Any]:
    G = generate_mock_crime_network()
    metrics = compute_graph_metrics(G)

    nodes = []
    for node_id, data in G.nodes(data=True):
        m = metrics[node_id]
        nodes.append({
            "id": node_id,
            "name": data.get("name", f"Node_{node_id}"),
            "group": data.get("group", -1),
            "role": data.get("role", "member"),
            "degree": m["degree"],
            "betweenness": m["betweenness"],
            "community": m["community"],
            "flagged": m["flagged"],
        })

    edges = []
    for u, v, data in G.edges(data=True):
        edges.append({
            "source": u,
            "target": v,
            "weight": data.get("weight", 1.0),
            "type": data.get("type", "internal"),
        })

    flagged_nodes = [n for n in nodes if n["flagged"]]
    top_betweenness = sorted(nodes, key=lambda x: x["betweenness"], reverse=True)[:10]

    community_sizes = {}
    for n in nodes:
        cid = n["community"]
        if cid >= 0:
            community_sizes[cid] = community_sizes.get(cid, 0) + 1

    print("\n=== GRAPH VALIDATION ===")
    print(f"Total nodes: {len(nodes)}")
    print(f"Total edges: {len(edges)}")
    print(f"Number of communities: {len(community_sizes)}")
    print(f"Community sizes: {community_sizes}")
    print("\nTop 10 by Betweenness Centrality:")
    print(f"{'Rank':<5} {'Name':<25} {'Betweenness':<15} {'Degree':<8} {'Community':<12} {'Flagged'}")
    print("-" * 85)
    for i, n in enumerate(top_betweenness, 1):
        print(f"{i:<5} {n['name']:<25} {n['betweenness']:<15} {n['degree']:<8} {n['community']:<12} {n['flagged']}")

    print(f"\nFlagged nodes (top 15% betweenness & bottom 50% degree):")
    for n in flagged_nodes:
        print(f"  - {n['name']} (id={n['id']}, betweenness={n['betweenness']}, degree={n['degree']}, community={n['community']})")

    return {
        "nodes": nodes,
        "edges": edges,
        "metrics": {
            "top_betweenness": top_betweenness,
            "flagged_nodes": flagged_nodes,
            "community_count": len(community_sizes),
            "community_sizes": community_sizes,
        },
        "raw_graph": G,
    }


def find_shortest_path(G: nx.Graph, source: int, target: int) -> List[int]:
    try:
        path = nx.shortest_path(G, source=source, target=target, weight="weight")
        return path
    except nx.NetworkXNoPath:
        return []
    except Exception:
        return []


def get_ai_context(graph_data: Dict[str, Any]) -> str:
    metrics = graph_data["metrics"]
    top_bet = metrics["top_betweenness"]
    flagged = metrics["flagged_nodes"]
    comm_count = metrics["community_count"]
    comm_sizes = metrics["community_sizes"]

    lines = [
        "CRIMINAL NETWORK ANALYSIS - CURRENT GRAPH STATE",
        f"Total Communities Detected: {comm_count}",
        f"Community Sizes: {comm_sizes}",
        "",
        "TOP 10 NODES BY BETWEENNESS CENTRALITY (with degree):",
    ]
    for i, n in enumerate(top_bet, 1):
        lines.append(f"  {i}. {n['name']} (id={n['id']}) - Betweenness: {n['betweenness']}, Degree: {n['degree']}, Community: {n['community']}")

    lines.append("")
    lines.append("FLAGGED NODES (High Betweenness + Low Degree - Potential Hidden Coordinators):")
    for n in flagged:
        lines.append(f"  - {n['name']} (id={n['id']}) - Betweenness: {n['betweenness']}, Degree: {n['degree']}, Community: {n['community']}")

    return "\n".join(lines)


if __name__ == "__main__":
    data = get_graph_data()