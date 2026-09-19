// src/workbench/graphModel.js
// Network model for the intelligence workbench.
// Mirrors backend/graph_data.py: 4 communities x 6 members + 1 unresolved
// coordinator, degree/betweenness metrics, flagged anomaly nodes.

export const CELLS = [
  { label: 'CELL A · Docklands', color: '#3b82f6', cx: 235, cy: 175 },
  { label: 'CELL B · Transport', color: '#06b6d4', cx: 785, cy: 175 },
  { label: 'CELL C · Finance', color: '#a855f7', cx: 235, cy: 485 },
  { label: 'CELL D · Recruitment', color: '#22c55e', cx: 785, cy: 485 },
];

export const NAMES = [
  ['R. Nadkarni', 'S. Bhat', 'T. Qureshi', 'M. Iyer', 'A. Pillai', 'Z. Rahman'],
  ['K. Deshmukh', 'F. Sheikh', 'P. Menon', 'V. Rathi', 'O. Yadav', 'N. Kulkarni'],
  ['R. Jhaveri', 'A. Shroff', 'D. Chawla', 'I. Vora', 'S. Bafna', 'M. Trivedi'],
  ['S. Dara', 'R. Sathe', 'N. Warde', 'A. Fernandes', 'G. Suryavanshi', 'F. Baig'],
];

// Cross-community edges (the bridges the coordinator hides behind).
export const CROSS = [[24, 0], [24, 12], [7, 15], [19, 3]];

export const COORDINATOR_ID = 24;
export const VIEWBOX = { w: 1020, h: 660 };

export const CLEARANCE_LEVELS = ['L2 · Restricted', 'L4 · Confidential', 'L6 · Secret'];
const CLEARANCE_VALUE = { 'L2 · Restricted': 2, 'L4 · Confidential': 4, 'L6 · Secret': 6 };

export function clearanceValue(label) {
  return CLEARANCE_VALUE[label] ?? 4;
}

/** Redact a value the analyst is not cleared to see. */
export function redact(value, requiredLevel, clearanceLabel) {
  return clearanceValue(clearanceLabel) >= requiredLevel ? value : '████████ redacted';
}

export const LAYOUTS = ['community', 'radial', 'hierarchy'];

/**
 * Build positioned nodes + edges for a layout.
 * Positions are in VIEWBOX units so the SVG can scale freely.
 */
export function buildGraph(layout = 'community') {
  const nodes = [];

  for (let g = 0; g < 4; g += 1) {
    for (let i = 0; i < 6; i += 1) {
      const id = g * 6 + i;
      const angle = ((i * 60 + g * 14) * Math.PI) / 180;
      let x;
      let y;

      if (layout === 'community') {
        x = CELLS[g].cx + 88 * Math.cos(angle);
        y = CELLS[g].cy + 88 * Math.sin(angle);
      } else if (layout === 'radial') {
        const t = (id / 24) * 2 * Math.PI;
        x = 510 + 265 * Math.cos(t);
        y = 330 + 245 * Math.sin(t);
      } else {
        x = 90 + id * 36.5;
        y = 470 + (i % 2) * 90;
      }

      const ox = layout === 'community' ? Math.cos(angle) : (x - 510) / 300;
      const oy = layout === 'community' ? Math.sin(angle) : (y - 330) / 260;

      nodes.push({
        id,
        name: NAMES[g][i],
        group: g,
        role: i === 0 ? 'cell lead' : 'member',
        x,
        y,
        ox,
        oy,
      });
    }
  }

  nodes.push({
    id: COORDINATOR_ID,
    name: "UNRESOLVED · 'DASTUR'",
    group: -1,
    role: 'suspected coordinator',
    x: 510,
    y: layout === 'hierarchy' ? 90 : 330,
    ox: 0,
    oy: -1,
  });

  if (layout === 'hierarchy') {
    nodes.forEach((n) => {
      if (n.role === 'cell lead') n.y = 250;
    });
  }

  const edges = [];
  for (let g = 0; g < 4; g += 1) {
    for (let i = 0; i < 6; i += 1) {
      for (let j = i + 1; j < 6; j += 1) {
        // Deterministic ~95% internal density, matching the backend generator.
        if ((i * 3 + j * 7 + g * 5) % 20 < 19) {
          edges.push({ source: g * 6 + i, target: g * 6 + j, kind: 'internal' });
        }
      }
    }
  }
  CROSS.forEach(([source, target]) => edges.push({ source, target, kind: 'cross' }));

  const degree = {};
  const adjacency = {};
  edges.forEach((e) => {
    degree[e.source] = (degree[e.source] || 0) + 1;
    degree[e.target] = (degree[e.target] || 0) + 1;
    (adjacency[e.source] = adjacency[e.source] || []).push(e.target);
    (adjacency[e.target] = adjacency[e.target] || []).push(e.source);
  });

  nodes.forEach((n) => {
    n.degree = degree[n.id] || 0;
    const crossCount = CROSS.flat().filter((v) => v === n.id).length;
    n.betweenness =
      n.id === COORDINATOR_ID
        ? 0.386
        : Number((crossCount * 0.121 + n.degree * 0.0043).toFixed(3));
    // Same heuristic as the backend: high betweenness + low degree.
    n.flagged = n.id === COORDINATOR_ID || (n.betweenness >= 0.12 && n.degree <= 5);
  });

  return { nodes, edges, adjacency };
}

/** Shortest chain of association between two entities. */
export function shortestPath(adjacency, from, to) {
  const queue = [[from]];
  const seen = new Set([from]);
  while (queue.length) {
    const path = queue.shift();
    const tail = path[path.length - 1];
    if (tail === to) return path;
    (adjacency[tail] || []).forEach((next) => {
      if (!seen.has(next)) {
        seen.add(next);
        queue.push(path.concat(next));
      }
    });
  }
  return null;
}

/**
 * Normalise a /api/graph payload into the shape the UI renders.
 * Backend nodes carry no coordinates, so we lay them out client-side.
 */
export function fromApiGraph(payload, layout = 'community') {
  if (!payload?.nodes?.length) return buildGraph(layout);
  const positioned = buildGraph(layout);
  const byId = Object.fromEntries(positioned.nodes.map((n) => [n.id, n]));
  const nodes = payload.nodes.map((n) => ({
    ...byId[n.id],
    ...n,
    x: byId[n.id]?.x ?? 510,
    y: byId[n.id]?.y ?? 330,
    ox: byId[n.id]?.ox ?? 0,
    oy: byId[n.id]?.oy ?? -1,
  }));
  const adjacency = {};
  payload.edges.forEach((e) => {
    (adjacency[e.source] = adjacency[e.source] || []).push(e.target);
    (adjacency[e.target] = adjacency[e.target] || []).push(e.source);
  });
  return { nodes, edges: payload.edges, adjacency };
}

/** Admiralty-scale grade → badge class from styles.css. */
export function gradeBadgeClass(grade = '') {
  if (/^A|^B1/.test(grade)) return 'badge badge-green';
  if (/^B|^C/.test(grade)) return 'badge badge-amber';
  return 'badge badge-red';
}

export function riskBadgeClass(risk) {
  if (risk === 'Critical' || risk === 'High') return 'badge badge-red';
  if (risk === 'Medium') return 'badge badge-amber';
  return 'badge badge-green';
}

export function cellColor(node) {
  return node.group < 0 ? '#c9a227' : CELLS[node.group].color;
}

export function displayName(node) {
  return node.group < 0 ? "UNRESOLVED · 'DASTUR'" : node.name;
}
