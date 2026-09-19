// src/workbench/screens/CasesScreen.jsx
import React, { useState } from 'react';
import { CASES, CASE_FILTERS, KPIS } from '../caseData';
import { riskBadgeClass } from '../graphModel';

export function CasesScreen({ onOpenCase, onInspectAnomaly }) {
  const [filter, setFilter] = useState('All');
  const rows = CASES.filter((c) => filter === 'All' || c.risk === filter);

  return (
    <div className="wb-scroll">
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', marginBottom: 16 }}>
        <div>
          <div style={{ font: '600 17px/1.2 var(--font-ui)' }}>Case worklist</div>
          <div style={{ font: '400 11.5px/1.4 var(--font-ui)', color: 'var(--text-tertiary)', marginTop: 3 }}>
            Cases assigned to you and your station, ranked by network risk delta.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="button" className="btn btn-secondary">Ingest source</button>
          <button type="button" className="btn btn-primary">New case</button>
        </div>
      </div>

      <div className="wb-grid-auto" style={{ marginBottom: 18 }}>
        {KPIS.map((k) => (
          <div key={k.label} className="stat-card">
            <div className="stat-value">{k.value}</div>
            <div className="stat-label">{k.label}</div>
            <div style={{ font: '400 10.5px/1.3 var(--font-mono)', color: 'var(--text-secondary)', marginTop: 6 }}>{k.detail}</div>
          </div>
        ))}
      </div>

      <div className="alert-banner">
        <span className="alert-icon" style={{ font: '700 12px/1.3 var(--font-mono)' }}>!</span>
        <div className="alert-text">
          Anomaly detector raised <strong>1 hidden-coordinator candidate</strong> in Op. Low Tide —
          high betweenness (0.386) with low degree (2), bridging Cell A and Cell C. Identity
          unresolved across 3 sources.
        </div>
        <button
          type="button"
          className="btn btn-sm"
          style={{ background: 'transparent', border: '1px solid rgba(239,68,68,.3)', color: '#fca5a5', flexShrink: 0 }}
          onClick={onInspectAnomaly}
        >
          Inspect in graph
        </button>
      </div>

      <div className="panel">
        <div className="panel-header" style={{ flexWrap: 'wrap', gap: 10 }}>
          <span className="panel-title">Open cases</span>
          <div style={{ flex: 1 }} />
          {CASE_FILTERS.map((f) => (
            <button key={f} type="button" className={`wb-pill${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
              {f}
            </button>
          ))}
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Case</th>
                <th>Title</th>
                <th>Type</th>
                <th>Risk</th>
                <th>Entities</th>
                <th>Lead officer</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.no} onClick={() => onOpenCase(c)} style={{ cursor: 'pointer' }}>
                  <td className="mono" style={{ color: 'var(--accent-gold-light)', whiteSpace: 'nowrap' }}>{c.no}</td>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{c.title}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{c.type}</td>
                  <td><span className={riskBadgeClass(c.risk)}>{c.risk}</span></td>
                  <td className="mono">{c.entities}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{c.officer}</td>
                  <td className="mono" style={{ color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>{c.updated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
