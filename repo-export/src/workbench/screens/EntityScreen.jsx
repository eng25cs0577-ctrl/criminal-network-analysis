// src/workbench/screens/EntityScreen.jsx
import React, { useState } from 'react';
import { cellColor, gradeBadgeClass } from '../graphModel';
import {
  entityBadges,
  entityFullFields,
  entityHeader,
  entityLinks,
  entityProvenance,
  entityStats,
} from '../entityModel';

const TABS = ['Overview', 'Timeline', 'Financials', 'Associates'];

export function EntityScreen({ graph, selected, onSelect, clearance, onCentreInGraph }) {
  const [tab, setTab] = useState('Overview');
  const byId = Object.fromEntries(graph.nodes.map((n) => [n.id, n]));
  const header = entityHeader(selected);
  const links = entityLinks(graph.adjacency, selected, byId);

  return (
    <div style={{ flex: 1, overflow: 'auto' }}>
      <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {/* Placeholder until custody photos are served from the records store. */}
          <svg viewBox="0 0 100 120" style={{ width: 88, height: 106, flexShrink: 0, border: '1px solid var(--border-default)', borderRadius: 6, background: 'var(--bg-base)' }}>
            <defs>
              <pattern id="wbStripe" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="4" height="8" fill="#131a26" />
              </pattern>
            </defs>
            <rect width="100" height="120" fill="url(#wbStripe)" />
            <text x="50" y="62" textAnchor="middle" fill="#4a5568" style={{ font: "500 6.5px var(--font-mono)" }}>
              custody photo
            </text>
          </svg>

          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
              <div style={{ font: '700 21px/1.15 var(--font-ui)' }}>{header.name}</div>
              {entityBadges(selected).map((b) => (
                <span key={b.label} className={b.className}>{b.label}</span>
              ))}
            </div>
            <div style={{ font: '500 11.5px/1.5 var(--font-mono)', color: 'var(--text-tertiary)', marginTop: 5 }}>
              {header.idLabel} · {header.cell} · {header.role} · resolved from {header.sourceCount} sources
            </div>
            <div style={{ display: 'flex', gap: 7, marginTop: 12, flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-primary" onClick={onCentreInGraph}>Centre in graph</button>
              <button type="button" className="btn btn-secondary">Add to watchlist</button>
              <button type="button" className="btn btn-secondary">Merge duplicate…</button>
              <button type="button" className="btn btn-ghost">Export to brief</button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(110px,1fr))', gap: 8, minWidth: 230 }}>
            {entityStats(selected).map((s) => (
              <div key={s.label} className="stat-card" style={{ padding: '10px 11px' }}>
                <div className="stat-value" style={{ fontSize: 18 }}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 2, marginTop: 16, marginBottom: -19, borderBottom: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              style={{
                padding: '9px 14px', border: 'none', background: 'transparent', cursor: 'pointer',
                fontFamily: 'inherit', font: '600 11.5px var(--font-ui)',
                color: tab === t ? 'var(--accent-gold-light)' : 'var(--text-tertiary)',
                boxShadow: tab === t ? 'inset 0 -2px 0 var(--accent-gold)' : 'none',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '20px 22px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 14, alignItems: 'start' }}>
        <div className="panel">
          <div className="panel-header"><span className="panel-title">Identity &amp; attributes</span></div>
          <div style={{ padding: '6px 14px 12px' }}>
            {entityFullFields(selected, clearance).map((f) => (
              <div key={f.key} className="wb-attr-wide">
                <span className="wb-attr-key">{f.key}</span>
                <span className="wb-spacer" />
                <span className={`wb-attr-val${/redacted/.test(f.value) ? ' redacted' : ''}`}>{f.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="panel">
            <div className="panel-header"><span className="panel-title">Linked entities</span></div>
            <div style={{ padding: '13px 14px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {links.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  className="entity-tag"
                  style={{ borderLeft: `3px solid ${cellColor(l.node)}`, cursor: 'pointer' }}
                  onClick={() => onSelect(l.id)}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-header"><span className="panel-title">Evidence &amp; provenance</span></div>
            <div style={{ padding: '13px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {entityProvenance(selected).map((p) => (
                <div key={p.claim} className="wb-prov">
                  <div className="wb-prov-claim">{p.claim}</div>
                  <div className="wb-prov-meta">
                    <span className="wb-prov-src">{p.source}</span>
                    <span className={gradeBadgeClass(p.grade)}>{p.grade}</span>
                  </div>
                </div>
              ))}
              <div style={{ font: '400 10.5px/1.5 var(--font-mono)', color: 'var(--text-muted)' }}>
                Every attribute above carries a source handle. Unsourced claims cannot be exported to
                a court brief.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
