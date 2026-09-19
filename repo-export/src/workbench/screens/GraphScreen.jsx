// src/workbench/screens/GraphScreen.jsx
import React, { useMemo } from 'react';
import {
  CELLS,
  COORDINATOR_ID,
  LAYOUTS,
  VIEWBOX,
  cellColor,
  displayName,
  gradeBadgeClass,
} from '../graphModel';
import {
  entityBadges,
  entityFields,
  entityHeader,
  entityProvenance,
  entityStats,
} from '../entityModel';

/** Place a label along the node's outward vector so labels never collide. */
function labelStyle(node, radius, hot) {
  const ox = node.ox || 0;
  const oy = node.oy || 0;
  const d = radius + 8;
  const side = Math.abs(ox) > 0.45 ? (ox > 0 ? 'right' : 'left') : oy >= 0 ? 'below' : 'above';
  const lx = node.x + (side === 'right' ? d : side === 'left' ? -d : 0);
  const ly = node.y + (side === 'below' ? d + 4 : side === 'above' ? -d - 4 : 0);
  const transform =
    side === 'right'
      ? 'translateY(-50%)'
      : side === 'left'
      ? 'translate(-100%,-50%)'
      : side === 'above'
      ? 'translate(-50%,-100%)'
      : 'translateX(-50%)';
  return {
    left: `${((lx / VIEWBOX.w) * 100).toFixed(2)}%`,
    top: `${((ly / VIEWBOX.h) * 100).toFixed(2)}%`,
    transform,
    color: hot ? '#e8c547' : undefined,
  };
}

export function GraphScreen({
  graph,
  selected,
  onSelect,
  layout,
  onLayout,
  hidden,
  onToggleLayer,
  path,
  onTracePath,
  toolsOpen,
  onToggleTools,
  clearance,
  onOpenEntity,
  onOpenMap,
}) {
  const { nodes, edges, adjacency } = graph;
  const byId = useMemo(() => Object.fromEntries(nodes.map((n) => [n.id, n])), [nodes]);

  const isVisible = (node) => !(node.group >= 0 && hidden[`g${node.group}`]);
  const pathSet = new Set(path || []);
  const pathEdges = new Set(
    (path || []).slice(1).map((v, i) => [path[i], v].sort((a, b) => a - b).join('-')),
  );

  const visibleNodes = nodes.filter(isVisible).map((node) => {
    const active = node.id === selected.id;
    const inPath = pathSet.has(node.id);
    const radius = 8 + Math.min(node.degree, 6) * 1.1 + (node.group < 0 ? 4 : 0);
    return { node, active, inPath, radius };
  });

  const visibleEdges = edges
    .filter(
      (e) =>
        isVisible(byId[e.source]) &&
        isVisible(byId[e.target]) &&
        !(hidden.cross && e.kind === 'cross'),
    )
    .map((e) => {
      const a = byId[e.source];
      const b = byId[e.target];
      const key = [e.source, e.target].sort((x, y) => x - y).join('-');
      const hot = pathEdges.has(key);
      return {
        key: `${key}-${e.kind}`,
        x1: a.x,
        y1: a.y,
        x2: b.x,
        y2: b.y,
        stroke: hot ? '#e8c547' : e.kind === 'cross' ? '#c9a227' : '#2e3d54',
        width: hot ? 3 : e.kind === 'cross' ? 1.8 : 1.2,
        dash: e.kind === 'cross' ? '6 5' : '0',
      };
    });

  const topBetweenness = [...nodes].sort((a, b) => b.betweenness - a.betweenness).slice(0, 6);
  const header = entityHeader(selected);
  const fields = entityFields(selected, clearance);
  const provenance = entityProvenance(selected);

  const pathLabel = path
    ? path.map((id) => (byId[id].group < 0 ? "'DASTUR'" : byId[id].name)).join(' → ')
    : selected.id === COORDINATOR_ID
    ? 'Select any cell member, then trace.'
    : 'No path traced yet.';

  return (
    <div className="wb-graph-row">
      {toolsOpen && (
        <div className="wb-tools">
          <div className="section-title" style={{ marginBottom: 10 }}>Layers</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
            {CELLS.map((cell, i) => (
              <button
                key={cell.label}
                type="button"
                onClick={() => onToggleLayer(`g${i}`)}
                className="wb-chip"
                style={{ width: '100%', cursor: 'pointer', opacity: hidden[`g${i}`] ? 0.4 : 1, padding: '8px 10px' }}
              >
                <span className="wb-swatch" style={{ background: cell.color }} />
                <span style={{ flex: 1, textAlign: 'left' }}>{cell.label.replace('CELL ', 'Cell ')}</span>
                <span style={{ color: 'var(--text-tertiary)' }}>6</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => onToggleLayer('cross')}
              className="wb-chip"
              style={{ width: '100%', cursor: 'pointer', opacity: hidden.cross ? 0.4 : 1, padding: '8px 10px' }}
            >
              <span className="wb-swatch" style={{ background: '#c9a227' }} />
              <span style={{ flex: 1, textAlign: 'left' }}>Cross-cell links</span>
              <span style={{ color: 'var(--text-tertiary)' }}>4</span>
            </button>
          </div>

          <div className="section-title" style={{ marginBottom: 10 }}>Path finder</div>
          <div className="panel" style={{ padding: 11, marginBottom: 20 }}>
            <div style={{ font: '400 11px/1.45 var(--font-ui)', color: 'var(--text-secondary)', marginBottom: 9 }}>
              Trace the shortest chain from the selected node to the unresolved coordinator.
            </div>
            <button type="button" className="btn btn-primary" style={{ width: '100%' }} onClick={onTracePath}>
              Trace path →
            </button>
            <div style={{ marginTop: 9, font: "500 10.5px/1.5 var(--font-mono)", color: 'var(--accent-gold-light)', wordBreak: 'break-word' }}>
              {pathLabel}
            </div>
          </div>

          <div className="section-title" style={{ marginBottom: 10 }}>Top betweenness</div>
          {topBetweenness.map((node, i) => (
            <button
              key={node.id}
              type="button"
              onClick={() => onSelect(node.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 9, padding: '8px 4px', width: '100%',
                background: 'transparent', border: 'none', borderBottom: '1px solid var(--border-subtle)',
                cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
              }}
            >
              <span className={`rank-badge${i === 0 ? ' gold' : ''}`}>{i + 1}</span>
              <span style={{ flex: 1, minWidth: 0, font: '500 11.5px/1.25 var(--font-ui)', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {displayName(node)}
              </span>
              <span className="data-value">{node.betweenness.toFixed(3)}</span>
            </button>
          ))}
        </div>
      )}

      <div className="wb-canvas-col">
        <div className="toolbar" style={{ height: 'auto', padding: '9px 14px' }}>
          <button type="button" className={`wb-pill${toolsOpen ? ' active' : ''}`} onClick={onToggleTools}>
            ◧ Tools
          </button>
          <div style={{ font: '600 11px/1 var(--font-ui)', whiteSpace: 'nowrap' }}>Network workspace</div>
          <div className="toolbar-divider" />
          <div style={{ display: 'flex', gap: 4 }}>
            {LAYOUTS.map((l) => (
              <button key={l} type="button" className={`wb-pill${layout === l ? ' active' : ''}`} style={{ borderColor: layout === l ? undefined : 'transparent', textTransform: 'capitalize' }} onClick={() => onLayout(l)}>
                {l}
              </button>
            ))}
          </div>
          <div style={{ flex: 1 }} />
          <div className="status-indicator" style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
            <span className="status-dot" />
            {nodes.length} nodes · {visibleEdges.length} edges
          </div>
        </div>

        <div className="wb-legend">
          {CELLS.map((cell) => (
            <div key={cell.label} className="wb-chip">
              <span className="wb-swatch" style={{ background: cell.color }} />
              {cell.label}
            </div>
          ))}
          <div className="wb-chip">
            <span className="wb-swatch" style={{ background: '#c9a227' }} />
            UNRESOLVED COORDINATOR
          </div>
        </div>

        <div className="wb-canvas-wrap">
          <div className="wb-canvas-box">
            <svg className="wb-canvas-svg" viewBox={`0 0 ${VIEWBOX.w} ${VIEWBOX.h}`} preserveAspectRatio="none">
              <defs>
                <pattern id="wbGrid" width="34" height="34" patternUnits="userSpaceOnUse">
                  <path d="M34 0H0v34" fill="none" stroke="#131a26" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width={VIEWBOX.w} height={VIEWBOX.h} fill="url(#wbGrid)" />
              {visibleEdges.map((e) => (
                <line key={e.key} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke={e.stroke} strokeWidth={e.width} strokeDasharray={e.dash} />
              ))}
              {visibleNodes.map(({ node, active, inPath, radius }) => (
                <g key={node.id} onClick={() => onSelect(node.id)} style={{ cursor: 'pointer' }}>
                  {(node.flagged || active) && (
                    <circle cx={node.x} cy={node.y} r={radius + 9} fill={active ? 'rgba(232,197,71,.18)' : 'rgba(239,68,68,.14)'} />
                  )}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={radius}
                    fill={cellColor(node)}
                    stroke={active ? '#e8c547' : inPath ? '#c9a227' : '#0a0e16'}
                    strokeWidth={active ? 3 : inPath ? 2 : 1.5}
                  />
                </g>
              ))}
            </svg>
            <div className="wb-label-layer">
              {visibleNodes.map(({ node, active, inPath, radius }) => (
                <div
                  key={node.id}
                  className={`wb-node-label${active || inPath ? ' hot' : ''}`}
                  style={labelStyle(node, radius, active || inPath)}
                >
                  {node.group < 0 ? "'DASTUR'" : node.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="wb-inspector">
        <div className="panel-header">
          <span className="panel-title">Selection</span>
          <span style={{ font: '500 9.5px/1 var(--font-mono)', color: 'var(--text-muted)' }}>{header.idLabel}</span>
        </div>
        <div style={{ padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, marginBottom: 13 }}>
            <div
              style={{
                width: 42, height: 42, borderRadius: 6, flexShrink: 0, border: '1px solid var(--border-default)',
                background: selected.group < 0 ? 'rgba(201,162,39,.15)' : 'rgba(59,130,246,.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                font: '700 13px var(--font-mono)',
              }}
            >
              {header.initials}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ font: '600 14px/1.25 var(--font-ui)' }}>{header.name}</div>
              <div style={{ font: '500 10.5px/1.4 var(--font-mono)', color: 'var(--text-tertiary)' }}>
                {header.cell} · {header.role}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 14 }}>
            {entityBadges(selected).map((b) => (
              <span key={b.label} className={b.className}>{b.label}</span>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
            {entityStats(selected).map((s) => (
              <div key={s.label} className="stat-card" style={{ padding: '9px 10px' }}>
                <div className="stat-value" style={{ fontSize: 17 }}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="section-title" style={{ marginBottom: 9 }}>Attributes</div>
          <div style={{ marginBottom: 16 }}>
            {fields.map((f) => (
              <div key={f.key} className="wb-attr">
                <span className="wb-attr-key">{f.key}</span>
                <span className={`wb-attr-val${/redacted/.test(f.value) ? ' redacted' : ''}`}>{f.value}</span>
              </div>
            ))}
          </div>

          <div className="section-title" style={{ marginBottom: 9 }}>Provenance</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 16 }}>
            {provenance.map((p) => (
              <div key={p.claim} className="wb-prov">
                <div className="wb-prov-claim">{p.claim}</div>
                <div className="wb-prov-meta">
                  <span className="wb-prov-src">{p.source}</span>
                  <span className={gradeBadgeClass(p.grade)}>{p.grade}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-primary" style={{ flex: 1, minWidth: 120 }} onClick={onOpenEntity}>
              Open full dossier
            </button>
            <button type="button" className="btn btn-secondary" onClick={onOpenMap}>Movement</button>
          </div>
        </div>
      </div>
    </div>
  );
}
