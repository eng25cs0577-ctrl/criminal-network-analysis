// src/workbench/screens/AuditScreen.jsx
import React from 'react';
import { AUDIT_KPIS, AUDIT_LOG } from '../caseData';

function actionBadgeClass(action) {
  if (action === 'DENIED') return 'badge badge-red';
  if (action === 'EXPORT' || action === 'MERGE') return 'badge badge-amber';
  return 'badge badge-green';
}

export function AuditScreen() {
  return (
    <div className="wb-scroll">
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', marginBottom: 16 }}>
        <div>
          <div style={{ font: '600 17px/1.2 var(--font-ui)' }}>Access &amp; audit</div>
          <div style={{ font: '400 11.5px/1.4 var(--font-ui)', color: 'var(--text-tertiary)', marginTop: 3 }}>
            Immutable log of every read, export and merge. Retained 7 years; supervisor-visible only.
          </div>
        </div>
        <button type="button" className="btn btn-secondary">Export log (CSV)</button>
      </div>

      <div className="wb-grid-auto" style={{ marginBottom: 18 }}>
        {AUDIT_KPIS.map((k) => (
          <div key={k.label} className="stat-card">
            <div className="stat-value" style={{ fontSize: 20 }}>{k.value}</div>
            <div className="stat-label">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="panel">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Officer</th>
                <th>Action</th>
                <th>Target</th>
                <th>Clearance</th>
                <th>Stated reason</th>
              </tr>
            </thead>
            <tbody>
              {AUDIT_LOG.map((r) => (
                <tr key={r.ts + r.action}>
                  <td className="mono" style={{ color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>{r.ts}</td>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 500, whiteSpace: 'nowrap' }}>{r.who}</td>
                  <td><span className={actionBadgeClass(r.action)}>{r.action}</span></td>
                  <td>{r.target}</td>
                  <td className="mono" style={{ whiteSpace: 'nowrap' }}>{r.clearance}</td>
                  <td>{r.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
