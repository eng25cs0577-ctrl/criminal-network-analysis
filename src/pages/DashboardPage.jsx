import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../AuthContext';
import ForceGraph2D from 'react-force-graph-2d';
import { apiGetGraph, apiGetPath, apiExtractEntities, apiAskAssistant } from '../api';

const COMMUNITY_COLORS = [
  '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4',
];

const COMMUNITY_LABELS = ['ALPHA', 'BRAVO', 'CHARLIE', 'DELTA', 'ECHO', 'FOXTROT'];

const Icons = {
  Overview: () => <svg className="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
  Network: () => <svg className="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.102 1.101m.758 4.899a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.102 1.101" /></svg>,
  Intel: () => <svg className="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 002-2V5a2 2 0 012-2h2a2 2 0 002 2v2a2 2 0 002 2h2a2 2 0 012 2v6a2 2 0 01-2 2H9z" /></svg>,
  Advisor: () => <svg className="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>,
  Shield: () => <svg className="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  User: () => <svg className="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  ChevronRight: () => <svg className="icon-xs" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>,
  Close: () => <svg className="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>,
  Menu: () => <svg className="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>,
  Alert: () => <svg className="icon-xs flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>,
  Check: () => <svg className="icon-xs" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Spin: () => <svg className="animate-spin icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>,
  MessageSquare: () => <svg className="icon icon-sm text-border-default" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>,
  Activity: () => <svg className="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 002-2V5a2 2 0 012-2h2a2 2 0 002 2v2a2 2 0 002 2h2a2 2 0 012 2v6a2 2 0 01-2 2H9z" /></svg>,
  Globe: () => <svg className="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>,
};

function getCommunityColor(id) { return COMMUNITY_COLORS[id % COMMUNITY_COLORS.length]; }
function getCommunityLabel(id) { return COMMUNITY_LABELS[id % COMMUNITY_LABELS.length]; }

export function DashboardPage() {
  const { user, logout } = useAuth();
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const [selectedNode, setSelectedNode] = useState(null);
  const [pathSource, setPathSource] = useState('');
  const [pathTarget, setPathTarget] = useState('');
  const [pathData, setPathData] = useState(null);
  const [pathLoading, setPathLoading] = useState(false);

  const [caseNotes, setCaseNotes] = useState('');
  const [extractedEntities, setExtractedEntities] = useState(null);
  const [extractLoading, setExtractLoading] = useState(false);
  const [extractError, setExtractError] = useState('');

  const [assistantQuestion, setAssistantQuestion] = useState('');
  const [assistantAnswer, setAssistantAnswer] = useState('');
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantError, setAssistantError] = useState('');
  const [chatHistory, setChatHistory] = useState([]);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const graphRef = useRef(null);

  const { nodes, edges, metrics } = graphData || {};
  const flaggedNodes = metrics?.flagged_nodes || [];
  const topBetweenness = metrics?.top_betweenness || [];
  const communityCount = metrics?.community_count || 0;
  const communitySizes = metrics?.community_sizes || {};

  const communityStats = useMemo(() =>
    Object.entries(communitySizes).map(([id, count]) => ({
      id: parseInt(id), label: getCommunityLabel(parseInt(id)), count,
      color: getCommunityColor(parseInt(id)),
    })), [communitySizes]);

  const networkStats = useMemo(() => ({
    totalNodes: nodes?.length || 0,
    totalEdges: edges?.length || 0,
    avgDegree: nodes?.length ? ((edges?.length || 0) * 2 / nodes.length).toFixed(1) : 0,
    density: nodes?.length > 1 ? ((edges?.length || 0) / (nodes.length * (nodes.length - 1) / 2)).toFixed(3) : 0,
    components: communityCount,
    flagged: flaggedNodes.length,
    topBetweenness: topBetweenness[0]?.betweenness || 0,
  }), [nodes, edges, communityCount, flaggedNodes, topBetweenness]);

  const fetchGraph = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiGetGraph();
      setGraphData(data);
      setLastUpdated(new Date());
      setError('');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchGraph();
    const interval = setInterval(fetchGraph, 30000);
    return () => clearInterval(interval);
  }, [fetchGraph]);

  const handleFindPath = async () => {
    const s = parseInt(pathSource), t = parseInt(pathTarget);
    if (isNaN(s) || isNaN(t)) return;
    setPathLoading(true);
    try {
      const data = await apiGetPath(s, t);
      setPathData(data);
      if (data.found && graphRef.current) {
        graphRef.current
          .resetProps()
          .linkWidth(l => {
            const src = l.source.id ?? l.source, tgt = l.target.id ?? l.target;
            return data.path.includes(src) && data.path.includes(tgt) ? 3 : 0.5;
          })
          .linkColor(l => {
            const src = l.source.id ?? l.source, tgt = l.target.id ?? l.target;
            return data.path.includes(src) && data.path.includes(tgt) ? '#c9a227' : '#1e293b';
          })
          .nodeColor(n => data.path.includes(n.id) ? '#e8c547' : getCommunityColor(n.community))
          .nodeRelSize(n => data.path.includes(n.id) ? 14 : (5 + n.betweenness * 90));
      }
    } catch (err) { setError(err.message); }
    finally { setPathLoading(false); }
  };

  const handleExtractEntities = async () => {
    if (!caseNotes.trim()) return;
    setExtractLoading(true); setExtractError('');
    try { const data = await apiExtractEntities(caseNotes); setExtractedEntities(data); }
    catch (err) { setExtractError(err.message); }
    finally { setExtractLoading(false); }
  };

  const handleAskAssistant = async () => {
    const q = assistantQuestion; if (!q.trim()) return;
    setAssistantQuestion(''); setAssistantLoading(true); setAssistantError('');
    try {
      const data = await apiAskAssistant(q);
      setAssistantAnswer(data.answer);
      setChatHistory(prev => [...prev, { role: 'user', content: q }, { role: 'assistant', content: data.answer }]);
    } catch (err) { setAssistantError(err.message); }
    finally { setAssistantLoading(false); }
  };

  const handleNodeClick = (node) => { setSelectedNode(node); setActiveTab('details'); };
  const handleBackgroundClick = () => {
    setSelectedNode(null); setPathData(null);
    if (graphRef.current) {
      graphRef.current
        .nodeColor(n => getCommunityColor(n.community))
        .linkColor('#1e293b')
        .linkWidth(0.5)
        .nodeRelSize(n => 5 + n.betweenness * 90);
    }
  };
  const clearPath = () => { setPathData(null); setPathSource(''); setPathTarget(''); handleBackgroundClick(); };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-bg-base">
      <div className="text-center">
        <div className="w-12 h-12 border-3 border-border-subtle border-t-accent-gold rounded-full animate-spin mx-auto mb-4" />
        <p className="text-text-tertiary font-mono text-xs uppercase tracking-wider">INITIALIZING TACTICAL DISPLAY</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-bg-base p-6">
      <div className="card border-accent-red/30 text-center max-w-md w-full">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-accent-red/10 flex items-center justify-center">
          <svg className="w-6 h-6 text-accent-red" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
        </div>
        <h3 className="text-lg font-semibold text-text-primary mb-2">CONNECTION ERROR</h3>
        <p className="text-text-secondary text-sm mb-4">{error}</p>
        <button className="btn btn-primary" onClick={fetchGraph}>RETRY CONNECTION</button>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-bg-base">
      <header className="toolbar relative z-10">
        <div className="toolbar-group flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent-gold to-accent-gold-light flex items-center justify-center shadow-glow">
            <svg className="w-5 h-5 text-bg-base" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h1 className="font-bold text-text-primary tracking-tight text-sm">CRIMINAL NETWORK ANALYSIS</h1>
            <p className="text-[9px] text-text-tertiary uppercase tracking-wider">AI-POWERED TACTICAL INTELLIGENCE PLATFORM</p>
          </div>
        </div>

        <div className="toolbar-divider" />

        <nav className="toolbar-group flex-1 justify-center" role="tablist" aria-label="Main sections">
          {[
            { id: 'overview', label: 'OVERVIEW', icon: Icons.Overview },
            { id: 'network', label: 'NETWORK', icon: Icons.Network },
            { id: 'intel', label: 'INTELLIGENCE', icon: Icons.Intel },
            { id: 'advisor', label: 'ADVISOR', icon: Icons.Advisor },
          ].map(tab => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-accent-gold/10 text-accent-gold border border-accent-gold/30'
                  : 'text-text-tertiary hover:text-text-secondary hover:bg-bg-elevated'
              }`}
            >
              {tab.icon()} {tab.label}
            </button>
          ))}
        </nav>

        <div className="toolbar-divider" />

        <div className="toolbar-group flex items-center gap-3">
          <div className="status-indicator">
            <span className="status-dot" />
            <span>SECURE</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-text-tertiary">
            <span className="text-accent-gold">{lastUpdated ? lastUpdated.toLocaleTimeString() : '--:--:--'}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
          </div>
          <div className="toolbar-divider h-5" />
          <span className="text-xs text-text-tertiary">OPERATOR:</span>
          <span className="text-xs font-mono text-accent-gold truncate max-w-[140px]">{user?.email}</span>
          <button onClick={logout} className="btn btn-ghost btn-sm px-3" data-tooltip="End session">END SESSION</button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative z-10">
        <aside
          className={`sidebar ${sidebarOpen ? 'open' : ''}`}
          style={{ display: sidebarOpen ? 'flex' : 'none' }}
        >
          <div className="h-full flex flex-col overflow-hidden">
            <div className="p-4 space-y-5 overflow-y-auto scrollbar-thin flex-1" role="region" aria-label="Analysis panels">
              {activeTab === 'overview' && (
                <>
                  <section className="section animate-fade-in">
                    <header className="section-header">
                      <h2 className="section-title">NETWORK SUMMARY</h2>
                    </header>
                    <div className="kpi-grid">
                      <div className="stat-card"><div className="stat-value text-accent-gold">{networkStats.totalNodes}</div><div className="stat-label">TOTAL NODES</div></div>
                      <div className="stat-card"><div className="stat-value text-accent-blue">{networkStats.totalEdges}</div><div className="stat-label">TOTAL LINKS</div></div>
                      <div className="stat-card"><div className="stat-value text-accent-green">{networkStats.components}</div><div className="stat-label">IDENTIFIED CELLS</div></div>
                      <div className="stat-card"><div className="stat-value text-accent-red">{networkStats.flagged}</div><div className="stat-label">FLAGGED TARGETS</div></div>
                    </div>
                    <div className="kpi-grid mt-3">
                      <div className="stat-card"><div className="stat-value text-accent-cyan">{networkStats.avgDegree}</div><div className="stat-label">AVG DEGREE</div></div>
                      <div className="stat-card"><div className="stat-value text-accent-purple">{networkStats.density}</div><div className="stat-label">NETWORK DENSITY</div></div>
                      <div className="stat-card"><div className="stat-value text-accent-amber">{networkStats.topBetweenness}</div><div className="stat-label">MAX BETWEENNESS</div></div>
                      <div className="stat-card"><div className="stat-value text-text-primary">{communityStats.length}</div><div className="stat-label">COMMUNITIES</div></div>
                    </div>
                  </section>

                  <section className="section animate-fade-in">
                    <header className="section-header">
                      <h2 className="section-title">CELL BREAKDOWN</h2>
                    </header>
                    <div className="space-y-2">
                      {communityStats.map(c => (
                        <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-bg-elevated border border-border-subtle hover:border-border-default transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${c.color}15` }}>
                              <span className="w-4 h-4 rounded" style={{ background: c.color }} />
                            </div>
                            <div>
                              <div className="font-medium text-text-primary text-sm">{c.label} CELL</div>
                              <div className="text-xs text-text-tertiary font-mono">COMMUNITY {c.id}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono text-accent-gold text-lg font-semibold">{c.count}</div>
                            <div className="text-xs text-text-tertiary">OPERATIVES</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="section animate-fade-in">
                    <header className="section-header">
                      <h2 className="section-title">HIGH-VALUE TARGETS</h2>
                      <span className="badge badge-red">PRIORITY</span>
                    </header>
                    <div className="space-y-2">
                      {flaggedNodes.length === 0 ? (
                        <div className="empty-state"><div className="title">NO PRIORITY TARGETS</div><div className="desc">All operatives within expected network parameters</div></div>
                      ) : (
                        flaggedNodes.map(n => (
                          <button key={n.id} onClick={() => handleNodeClick(n)} className="w-full p-3 rounded-lg bg-bg-elevated border border-accent-red/30 text-left hover:border-accent-red/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <span className="rank-badge gold">!</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-accent-red">{n.name}</span>
                                  <span className="badge badge-red badge-dot" />
                                </div>
                                <div className="flex flex-wrap gap-3 mt-1 text-xs text-text-tertiary font-mono">
                                  <span>BET: {n.betweenness}</span>
                                  <span>DEG: {n.degree}</span>
                                  <span className="px-2 py-0.5 rounded" style={{ background: `${getCommunityColor(n.community)}15`, color: getCommunityColor(n.community) }}>{getCommunityLabel(n.community)}</span>
                                </div>
                              </div>
                              <svg className="icon-xs text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </section>
                </>
              )}

              {activeTab === 'network' && (
                <>
                  <section className="section animate-fade-in">
                    <header className="section-header">
                      <h2 className="section-title">THREAT RANKING</h2>
                    </header>
                    <div className="space-y-1 max-h-[320px] overflow-y-auto scrollbar-thin">
                      {topBetweenness.map((n, i) => (
                        <button
                          key={n.id} onClick={() => handleNodeClick(n)}
                          className={`w-full p-3 rounded-lg bg-bg-elevated border transition-colors ${
                            n.flagged ? 'border-accent-red/30' : 'border-border-subtle hover:border-border-default'
                          } ${selectedNode?.id === n.id ? 'border-accent-gold/50 bg-accent-gold/5' : ''}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`rank-badge ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''}`}>{i + 1}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`font-medium ${n.flagged ? 'text-accent-red' : 'text-text-primary'}`}>{n.name}</span>
                                {n.flagged && <span className="badge badge-red badge-dot">HV</span>}
                              </div>
                              <div className="flex flex-wrap gap-3 mt-1 text-xs text-text-tertiary font-mono">
                                <span>BET: {n.betweenness}</span>
                                <span>DEG: {n.degree}</span>
                                <span className="px-2 py-0.5 rounded" style={{ background: `${getCommunityColor(n.community)}15`, color: getCommunityColor(n.community) }}>{getCommunityLabel(n.community)}</span>
                              </div>
                            </div>
                            <svg className="icon-xs text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="section animate-fade-in">
                    <header className="section-header flex items-center justify-between">
                      <h2 className="section-title">PATH TRACER</h2>
                      {pathData?.found && <span className="badge badge-green">TRACE COMPLETE</span>}
                    </header>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <input type="number" className="input" placeholder="SOURCE NODE ID" value={pathSource} onChange={e => setPathSource(e.target.value)} />
                        <input type="number" className="input" placeholder="TARGET NODE ID" value={pathTarget} onChange={e => setPathTarget(e.target.value)} />
                      </div>
                      <div className="flex gap-2">
                        <button className="btn btn-primary flex-1" onClick={handleFindPath} disabled={pathLoading || !pathSource || !pathTarget}>
                          {pathLoading ? 'TRACING...' : 'INITIATE TRACE'}
                        </button>
                        {pathData && <button className="btn btn-ghost btn-sm flex-1" onClick={clearPath}>CLEAR</button>}
                      </div>
                      {pathData?.found && (
                        <div className="p-3 rounded-lg bg-accent-green/10 border border-accent-green/20">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-accent-green uppercase tracking-wider">TRACE SUCCESSFUL</span>
                            <span className="text-xs font-mono text-accent-gold">{pathData.path.length} HOPS</span>
                          </div>
                          <div className="text-xs font-mono text-text-primary bg-bg-base p-2 rounded overflow-x-auto">{pathData.path.join(' → ')}</div>
                        </div>
                      )}
                      {pathData !== null && !pathData?.found && pathSource && pathTarget && (
                        <div className="p-3 rounded-lg bg-accent-red/10 border border-accent-red/20">
                          <span className="text-xs font-semibold text-accent-red uppercase tracking-wider">NO CONNECTION FOUND</span>
                        </div>
                      )}
                    </div>
                  </section>
                </>
              )}

              {activeTab === 'intel' && (
                <>
                  <section className="section animate-fade-in">
                    <header className="section-header">
                      <h2 className="section-title">EVIDENCE INTELLIGENCE</h2>
                      <span className="badge badge-cyan">NLP</span>
                    </header>
                    <textarea
                      className="input textarea bg-bg-base"
                      placeholder="PASTE FIR EXCERPT, SURVEILLANCE LOG, FINANCIAL RECORD, OR INTELLIGENCE REPORT..."
                      value={caseNotes} onChange={e => setCaseNotes(e.target.value)} rows={4}
                    />
                    <button className="btn btn-primary w-full" onClick={handleExtractEntities} disabled={extractLoading || !caseNotes.trim()}>
                      {extractLoading ? 'PROCESSING...' : 'EXTRACT ENTITIES'}
                    </button>
                    {extractError && <p className="text-accent-red text-xs mt-2">{extractError}</p>}
                    {extractedEntities && (
                      <div className="mt-4 space-y-3">
                        <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">EXTRACTED ENTITIES</h3>
                        <div className="grid gap-3">
                          {extractedEntities.people.length > 0 && (
                            <div className="card p-3"><div className="flex items-center justify-between mb-2"><span className="text-xs font-semibold text-accent-blue uppercase tracking-wider">PERSONNEL</span><span className="text-xs font-mono text-text-tertiary">{extractedEntities.people.length}</span></div><div className="entity-list">{extractedEntities.people.map((p,i)=><span key={i} className="entity-tag person">{p}</span>)}</div></div>
                          )}
                          {extractedEntities.phones.length > 0 && (
                            <div className="card p-3"><div className="flex items-center justify-between mb-2"><span className="text-xs font-semibold text-accent-green uppercase tracking-wider">COMMUNICATIONS</span><span className="text-xs font-mono text-text-tertiary">{extractedEntities.phones.length}</span></div><div className="entity-list">{extractedEntities.phones.map((p,i)=><span key={i} className="entity-tag phone mono text-xs">{p}</span>)}</div></div>
                          )}
                          {extractedEntities.vehicles.length > 0 && (
                            <div className="card p-3"><div className="flex items-center justify-between mb-2"><span className="text-xs font-semibold text-accent-amber uppercase tracking-wider">VEHICLES</span><span className="text-xs font-mono text-text-tertiary">{extractedEntities.vehicles.length}</span></div><div className="entity-list">{extractedEntities.vehicles.map((v,i)=><span key={i} className="entity-tag vehicle mono text-xs">{v}</span>)}</div></div>
                          )}
                          {extractedEntities.locations.length > 0 && (
                            <div className="card p-3"><div className="flex items-center justify-between mb-2"><span className="text-xs font-semibold text-accent-red uppercase tracking-wider">LOCATIONS</span><span className="text-xs font-mono text-text-tertiary">{extractedEntities.locations.length}</span></div><div className="entity-list">{extractedEntities.locations.map((l,i)=><span key={i} className="entity-tag location mono text-xs">{l}</span>)}</div></div>
                          )}
                        </div>
                        {extractedEntities.people.length===0 && extractedEntities.phones.length===0 && extractedEntities.vehicles.length===0 && extractedEntities.locations.length===0 && (
                          <div className="empty-state"><div className="title">NO ENTITIES DETECTED</div><div className="desc">Provided text does not contain recognizable entities</div></div>
                        )}
                      </div>
                    )}
                  </section>
                </>
              )}

              {activeTab === 'advisor' && (
                <>
                  <section className="section animate-fade-in flex-1 min-h-0">
                    <header className="section-header">
                      <h2 className="section-title">TACTICAL ADVISOR</h2>
                      <span className="badge badge-blue">AI</span>
                    </header>
                    <div className="panel flex-1 min-h-0 flex flex-col">
                      <div className="panel-body flex-1 overflow-y-auto scrollbar-thin" style={{ paddingBottom: '0' }}>
                        {chatHistory.length === 0 ? (
                          <div className="empty-state h-full">
                            <svg className="icon icon-sm text-border-default" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                            <div className="title">TACTICAL ADVISOR READY</div>
                            <div className="desc">Queries grounded in live network topology — no external knowledge</div>
                            <div className="mt-4 space-y-2 text-left max-w-xs text-xs text-text-tertiary">
                              <div className="flex items-center gap-2 p-2 rounded bg-bg-elevated border border-border-subtle"><span className="text-accent-gold font-mono">"</span><span>WHO IS THE PRIMARY COORDINATOR?</span></div>
                              <div className="flex items-center gap-2 p-2 rounded bg-bg-elevated border border-border-subtle"><span className="text-accent-gold font-mono">"</span><span>EXPLAIN WHY TARGET 24 IS FLAGGED</span></div>
                              <div className="flex items-center gap-2 p-2 rounded bg-bg-elevated border border-border-subtle"><span className="text-accent-gold font-mono">"</span><span>SHOW PATH BETWEEN CELL ALPHA AND DELTA</span></div>
                              <div className="flex items-center gap-2 p-2 rounded bg-bg-elevated border border-border-subtle"><span className="text-accent-gold font-mono">"</span><span>LIST ALL FLAGGED OPERATIVES WITH METRICS</span></div>
                            </div>
                          </div>
                        ) : (
                          chatHistory.map((msg, i) => (
                            <div key={i} className={`chat-message ${msg.role}`}>
                              <div className="chat-avatar">
                                {msg.role === 'assistant' ? (
                                  <svg className="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                ) : (
                                  <svg className="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                )}
                              </div>
                              <div className={`chat-bubble ${msg.role === 'user' ? 'bg-accent-blue/20 border-accent-blue/30 text-accent-blue' : ''}`}>
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                              </div>
                            </div>
                          ))
                        )}
                        {assistantLoading && (
                          <div className="chat-message assistant">
                            <div className="chat-avatar">
                              <svg className="icon-sm animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                            </div>
                            <div className="chat-bubble"><div className="flex gap-3"><div className="loading-skeleton h-4 w-28 rounded" /><div className="loading-skeleton h-4 w-36 rounded" /></div></div>
                          </div>
                        )}
                      </div>
                      <div className="panel-header border-t border-border-subtle">
                        <div className="flex gap-2 w-full">
                          <input type="text" className="input flex-1 bg-bg-base" placeholder="QUERY TACTICAL ADVISOR..." value={assistantQuestion} onChange={e => setAssistantQuestion(e.target.value)} onKeyDown={e => e.key === 'Enter' && !assistantLoading && handleAskAssistant()} disabled={assistantLoading} />
                          <button className="btn btn-primary px-4" onClick={handleAskAssistant} disabled={assistantLoading || !assistantQuestion.trim()}>{assistantLoading ? 'ANALYZING...' : 'SUBMIT'}</button>
                        </div>
                      </div>
                    </div>
                    {assistantError && <p className="text-accent-red text-xs mt-2 flex items-center gap-1.5"><svg className="icon-xs flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>{assistantError}</p>}
                  </section>
                </>
              )}
            </div>
          </div>
        </aside>

        <button className="fixed bottom-5 left-5 z-20 lg:hidden btn btn-primary p-3 shadow-lg" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle sidebar">
          <svg className="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>{sidebarOpen ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}</svg>
        </button>

        <div className="main-content relative flex flex-col">
          <ForceGraph2D
            ref={graphRef}
            graphData={{ nodes: nodes || [], links: edges || [] }}
            nodeId="id"
            nodeLabel="name"
            nodeColor={n => n.flagged ? '#dc2626' : getCommunityColor(n.community)}
            nodeRelSize={n => 5 + n.betweenness * 90}
            nodeCanvasObject={(node, ctx, globalScale) => {
              const size = (5 + node.betweenness * 90) * globalScale;
              if (node.flagged) {
                ctx.beginPath(); ctx.arc(0, 0, size * 1.4, 0, 2 * Math.PI);
                ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 2 * globalScale; ctx.stroke();
                ctx.beginPath(); ctx.arc(0, 0, size * 1.7, 0, 2 * Math.PI);
                ctx.strokeStyle = 'rgba(220, 38, 38, 0.25)'; ctx.lineWidth = 1 * globalScale;
                ctx.setLineDash([4 * globalScale, 4 * globalScale]); ctx.stroke(); ctx.setLineDash([]);
              }
              if (node.__selected) {
                ctx.beginPath(); ctx.arc(0, 0, size * 1.8, 0, 2 * Math.PI);
                ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 3 * globalScale; ctx.stroke();
              }
              if (node.flagged && !node.__selected) {
                const t = Date.now() / 500;
                ctx.beginPath(); ctx.arc(0, 0, size * (1.2 + Math.sin(t) * 0.1), 0, 2 * Math.PI);
                ctx.strokeStyle = 'rgba(220, 38, 38, 0.4)'; ctx.lineWidth = 1.5 * globalScale; ctx.stroke();
              }
            }}
            linkColor="#1e293b"
            linkWidth={0.5}
            linkDirectionalParticles={0}
            onNodeClick={handleNodeClick}
            onBackgroundClick={handleBackgroundClick}
            d3AlphaDecay={0.015}
            d3VelocityDecay={0.12}
            warmupTicks={150}
            cooldownTicks={80}
            cooldownTime={20000}
            backgroundColor="transparent"
          />

          <div className="fixed bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:bottom-4 lg:w-72 animate-fade-in">
            <div className="card p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">CELL LEGEND</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {communityStats.map(c => (
                  <div key={c.id} className="legend-item">
                    <span className="legend-color" style={{ background: c.color }} />
                    <span className="font-mono text-xs">{c.label}</span>
                    <span className="text-xs font-mono text-text-tertiary">({c.count})</span>
                  </div>
                ))}
                <div className="legend-item"><span className="w-2.5 h-2.5 rounded border-2 border-accent-red bg-transparent" /><span className="font-mono text-xs text-accent-red">FLAGGED</span></div>
                <div className="legend-item"><div className="w-2.5 h-2.5 rounded border-2 border-accent-gold bg-transparent relative flex items-center justify-center"><span className="w-1.5 h-1.5 rounded-full bg-accent-gold" /></div><span className="font-mono text-xs text-accent-gold">SELECTED</span></div>
              </div>
            </div>
          </div>

          {selectedNode && (
            <div className="fixed bottom-5 right-5 w-80 max-w-xs lg:bottom-20 lg:right-5 z-20 animate-fade-in">
              <div className="card border-accent-gold/30 shadow-xl">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-gold to-transparent" />
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-accent-gold text-base">{selectedNode.name}</h3>
                      {selectedNode.role === 'coordinator' && <span className="badge badge-red">HIGH VALUE TARGET</span>}
                    </div>
                    <p className="text-xs text-text-tertiary font-mono">TARGET ID: {selectedNode.id} • CELL: {getCommunityLabel(selectedNode.community)}</p>
                  </div>
                  <button onClick={() => setSelectedNode(null)} className="text-text-tertiary hover:text-text-primary p-1"><svg className="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="stat-card text-center"><div className="stat-value text-accent-gold mono">{selectedNode.betweenness}</div><div className="stat-label">BETWEENNESS</div></div>
                  <div className="stat-card text-center"><div className="stat-value text-accent-blue mono">{selectedNode.degree}</div><div className="stat-label">CONNECTIONS</div></div>
                </div>
                <div className="p-3 rounded bg-bg-base border border-border-subtle">
                  <p className="text-xs text-text-secondary">{selectedNode.flagged ? 'PRIORITY TARGET: Elevated betweenness centrality with minimal direct connections indicates covert coordination role bridging isolated cells.' : 'STANDARD TARGET: Operates within established cell structure. Monitor for pattern deviations.'}</p>
                </div>
                <div className="flex gap-2">
                  <button className="btn btn-primary btn-sm flex-1" onClick={() => setPathSource(selectedNode.id)}>SET AS SOURCE</button>
                  <button className="btn btn-secondary btn-sm flex-1" onClick={() => setPathTarget(selectedNode.id)}>SET AS TARGET</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}