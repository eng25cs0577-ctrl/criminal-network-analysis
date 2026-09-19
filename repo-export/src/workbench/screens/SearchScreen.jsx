// src/workbench/screens/SearchScreen.jsx
import React, { useState } from 'react';
import { SEARCH_FACETS, SEARCH_RESULTS } from '../caseData';
import { gradeBadgeClass } from '../graphModel';

export function SearchScreen({ query, onOpenResult }) {
  const [facet, setFacet] = useState('All records');

  return (
    <div className="wb-scroll">
      <div style={{ font: '600 17px/1.2 var(--font-ui)' }}>Search</div>
      <div style={{ font: '400 11.5px/1.4 var(--font-ui)', color: 'var(--text-tertiary)', margin: '3px 0 16px' }}>
        {query ? `Matches for “${query}” · ` : 'Recent query “dastur” · '}
        38 records across 6 sources · 3 below confidence floor hidden
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div className="panel" style={{ width: 210, flexShrink: 0, padding: 13 }}>
          <div className="section-title" style={{ marginBottom: 9 }}>Record type</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 16 }}>
            {SEARCH_FACETS.map((f) => (
              <button
                key={f.label}
                type="button"
                onClick={() => setFacet(f.label)}
                className={`wb-chip${facet === f.label ? ' active' : ''}`}
                style={{
                  cursor: 'pointer', padding: '7px 9px', font: '500 11.5px var(--font-ui)',
                  borderColor: facet === f.label ? 'var(--accent-gold)' : 'transparent',
                  background: facet === f.label ? 'rgba(201,162,39,.1)' : 'var(--bg-elevated)',
                  color: facet === f.label ? 'var(--accent-gold-light)' : 'var(--text-secondary)',
                }}
              >
                <span style={{ flex: 1, textAlign: 'left' }}>{f.label}</span>
                <span className="mono" style={{ color: 'var(--text-tertiary)' }}>{f.count}</span>
              </button>
            ))}
          </div>
          <div className="section-title" style={{ marginBottom: 9 }}>Min. confidence</div>
          <div style={{ font: '500 11px/1.5 var(--font-mono)', color: 'var(--text-secondary)' }}>
            B2 and above · 3 excluded
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 280, display: 'flex', flexDirection: 'column', gap: 9 }}>
          {SEARCH_RESULTS.map((r) => (
            <button key={r.title} type="button" className="wb-result" onClick={() => onOpenResult(r)}>
              <span className="wb-kind">{r.kind}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', font: '600 13px/1.3 var(--font-ui)', color: 'var(--text-primary)' }}>{r.title}</span>
                <span style={{ display: 'block', font: '400 11.5px/1.5 var(--font-ui)', color: 'var(--text-secondary)', marginTop: 4 }}>{r.snippet}</span>
                <span style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span className="wb-prov-src">{r.source}</span>
                  <span className={gradeBadgeClass(r.grade)}>{r.grade}</span>
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
