// src/pages/WorkbenchPage.jsx
// Intelligence workbench: case worklist, network graph, entity dossier,
// map (incl. live tracking), search and audit log.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../AuthContext';
import { apiGetGraph, apiGetPath } from '../api';
import {
  CLEARANCE_LEVELS,
  COORDINATOR_ID,
  buildGraph,
  fromApiGraph,
  shortestPath,
} from '../workbench/graphModel';
import { CasesScreen } from '../workbench/screens/CasesScreen';
import { GraphScreen } from '../workbench/screens/GraphScreen';
import { EntityScreen } from '../workbench/screens/EntityScreen';
import { MapScreen } from '../workbench/screens/MapScreen';
import { SearchScreen } from '../workbench/screens/SearchScreen';
import { AuditScreen } from '../workbench/screens/AuditScreen';
import '../workbench.css';

const SCREENS = [
  { key: 'cases', code: 'CA', label: 'Cases' },
  { key: 'graph', code: 'NG', label: 'Graph' },
  { key: 'entity', code: 'EN', label: 'Entity' },
  { key: 'map', code: 'MP', label: 'Map' },
  { key: 'search', code: 'SR', label: 'Search' },
  { key: 'audit', code: 'AD', label: 'Audit' },
];

export function WorkbenchPage() {
  const { user, logout } = useAuth();
  const [screen, setScreen] = useState('graph');
  const [layout, setLayout] = useState('community');
  const [apiGraph, setApiGraph] = useState(null);
  const [selectedId, setSelectedId] = useState(COORDINATOR_ID);
  const [hidden, setHidden] = useState({});
  const [path, setPath] = useState(null);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [clearance, setClearance] = useState(CLEARANCE_LEVELS[1]);

  // Live backend when /api/graph answers; deterministic mock otherwise.
  useEffect(() => {
    let cancelled = false;
    apiGetGraph()
      .then((payload) => {
        if (!cancelled) setApiGraph(payload);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const graph = useMemo(
    () => (apiGraph ? fromApiGraph(apiGraph, layout) : buildGraph(layout)),
    [apiGraph, layout],
  );

  const selected = useMemo(
    () => graph.nodes.find((n) => n.id === selectedId) || graph.nodes[graph.nodes.length - 1],
    [graph, selectedId],
  );

  const select = useCallback((id) => {
    setSelectedId(id);
    setPath(null);
  }, []);

  const tracePath = useCallback(async () => {
    try {
      const res = await apiGetPath(selectedId, COORDINATOR_ID);
      if (res?.found && res.path?.length) {
        setPath(res.path);
        return;
      }
    } catch {
      // fall through to the local traversal
    }
    setPath(shortestPath(graph.adjacency, selectedId, COORDINATOR_ID));
  }, [graph, selectedId]);

  const toggleLayer = useCallback((key) => {
    setHidden((h) => ({ ...h, [key]: !h[key] }));
  }, []);

  return (
    <div className="wb-shell">
      <header className="toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div
            style={{
              width: 26, height: 26, borderRadius: 5, display: 'flex', alignItems: 'center',
              justifyContent: 'center', background: 'linear-gradient(135deg,#c9a227,#e8c547)',
              font: '700 11px/1 var(--font-mono)', color: 'var(--bg-base)',
            }}
          >
            CN
          </div>
          <div>
            <div style={{ font: '600 12.5px/1.15 var(--font-ui)' }}>Criminal Network Analyser</div>
            <div style={{ font: '500 9px/1.2 var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '.09em' }}>
              SIH26189 · INTEL WORKBENCH
            </div>
          </div>
        </div>

        <div className="toolbar-divider" />

        <div className="wb-chip" style={{ padding: '5px 10px', borderColor: 'var(--border-default)' }}>
          <span style={{ color: 'var(--text-tertiary)', letterSpacing: '.08em' }}>CASE</span>
          <span style={{ color: 'var(--accent-gold-light)', fontSize: 11.5 }}>#20411 · OP. LOW TIDE</span>
        </div>

        <div style={{ flex: 1, minWidth: 60, display: 'flex', justifyContent: 'center' }}>
          <input
            className="input"
            style={{ maxWidth: 380 }}
            value={query}
            placeholder="Search entities, phones, cases…"
            onChange={(e) => {
              setQuery(e.target.value);
              setScreen('search');
            }}
          />
        </div>

        {/* Clearance drives redaction across every screen. */}
        <select
          className="input"
          style={{ width: 'auto' }}
          value={clearance}
          onChange={(e) => setClearance(e.target.value)}
        >
          {CLEARANCE_LEVELS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ font: '500 11px/1.2 var(--font-ui)', color: 'var(--text-secondary)' }}>
            {user?.email || 'Insp. L. Gupta'}
          </div>
          <button type="button" className="btn btn-ghost" onClick={logout}>Sign out</button>
        </div>
      </header>

      <div className="wb-body">
        <nav className="wb-rail">
          {SCREENS.map((s) => (
            <button
              key={s.key}
              type="button"
              className={`wb-rail-btn${screen === s.key ? ' active' : ''}`}
              onClick={() => setScreen(s.key)}
            >
              <span className="wb-rail-code">{s.code}</span>
              <span className="wb-rail-label">{s.label}</span>
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <div style={{ padding: '0 12px' }}>
            <div style={{ height: 1, background: 'var(--border-subtle)', marginBottom: 10 }} />
            <div style={{ font: '500 8px/1.35 var(--font-mono)', color: 'var(--text-muted)', textAlign: 'center', letterSpacing: '.06em' }}>
              ALL ACTIONS<br />LOGGED
            </div>
          </div>
        </nav>

        <main className="wb-screen">
          {screen === 'cases' && (
            <CasesScreen
              onOpenCase={() => { select(COORDINATOR_ID); setScreen('graph'); }}
              onInspectAnomaly={() => { select(COORDINATOR_ID); setScreen('graph'); }}
            />
          )}
          {screen === 'graph' && (
            <GraphScreen
              graph={graph}
              selected={selected}
              onSelect={select}
              layout={layout}
              onLayout={setLayout}
              hidden={hidden}
              onToggleLayer={toggleLayer}
              path={path}
              onTracePath={tracePath}
              toolsOpen={toolsOpen}
              onToggleTools={() => setToolsOpen((o) => !o)}
              clearance={clearance}
              onOpenEntity={() => setScreen('entity')}
              onOpenMap={() => setScreen('map')}
            />
          )}
          {screen === 'entity' && (
            <EntityScreen
              graph={graph}
              selected={selected}
              onSelect={select}
              clearance={clearance}
              onCentreInGraph={() => setScreen('graph')}
            />
          )}
          {screen === 'map' && <MapScreen selected={selected} />}
          {screen === 'search' && (
            <SearchScreen query={query} onOpenResult={() => setScreen('entity')} />
          )}
          {screen === 'audit' && <AuditScreen />}
        </main>
      </div>
    </div>
  );
}

export default WorkbenchPage;
