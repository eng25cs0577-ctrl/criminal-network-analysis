// src/workbench/caseData.js
// Mock case, search and audit records. Replace each export with an API call
// as the corresponding backend endpoint lands.

export const KPIS = [
  { label: 'Open cases', value: '6', detail: '2 above risk threshold' },
  { label: 'Entities resolved', value: '1,284', detail: '17 merge candidates' },
  { label: 'Communities', value: '4', detail: 'louvain, weighted' },
  { label: 'Anomaly flags', value: '1', detail: 'high bet · low degree' },
];

export const CASES = [
  { no: '#20411', title: 'Op. Low Tide — dockyard consignment', type: 'Drug trafficking', risk: 'Critical', entities: 25, officer: 'Insp. L. Gupta', updated: '2 min ago' },
  { no: '#20388', title: 'Shell-company invoice ring', type: 'Fraud', risk: 'High', entities: 41, officer: 'SI N. Shree', updated: '1 h ago' },
  { no: '#20361', title: 'Transport corridor recruiting', type: 'Human trafficking', risk: 'High', entities: 18, officer: 'Insp. M. Aparaj', updated: '4 h ago' },
  { no: '#20344', title: 'Hawala settlement cluster', type: 'Fraud', risk: 'Medium', entities: 33, officer: 'SI J. Parmar', updated: 'Yesterday' },
  { no: '#20309', title: 'Warehouse arson — linked witnesses', type: 'Murder', risk: 'Medium', entities: 12, officer: 'SI S. Pasumarthy', updated: '2 d ago' },
  { no: '#20277', title: 'Courier network, north ward', type: 'Drug trafficking', risk: 'Low', entities: 9, officer: 'Insp. S. Reddy', updated: '5 d ago' },
];

export const CASE_FILTERS = ['All', 'Critical', 'High', 'Medium'];

export const SEARCH_FACETS = [
  { label: 'All records', count: 38 },
  { label: 'People', count: 14 },
  { label: 'Phones', count: 9 },
  { label: 'Cases', count: 6 },
  { label: 'Vehicles', count: 5 },
  { label: 'Locations', count: 4 },
];

export const SEARCH_RESULTS = [
  { kind: 'PERSON', title: "UNRESOLVED · 'DASTUR'", snippet: 'Alias appears in 3 intercepts and one human-source report. No custody, bank or ANPR record. Bridges Cell A and Cell C.', source: 'SIGINT · W-2211', grade: 'B2 · usually reliable' },
  { kind: 'PHONE', title: '+91 ·· ···· 4471', snippet: 'Burner active 04–11 Sep. 12 calls to Cell A lead, 4 to Cell C finance handler. Handset never co-located with a named identity.', source: 'CDR · telco 2', grade: 'A1 · confirmed' },
  { kind: 'CASE', title: '#20411 · Op. Low Tide', snippet: 'Dockyard consignment. 25 entities, 4 communities, 1 anomaly flag raised 2 min ago.', source: 'Case file', grade: 'A1 · confirmed' },
  { kind: 'PERSON', title: 'I. Vora · Cell C', snippet: 'Finance handler. Second-highest betweenness. Merge candidate with record ENT-0921 (same NID, different spelling).', source: 'Records · merged ×4', grade: 'B1 · reliable' },
  { kind: 'LOCATION', title: 'Safehouse, north ward', snippet: 'Inferred from graph proximity only — no source places any identity here. Flagged as inference, not evidence.', source: 'INFERRED', grade: 'E5 · inference only' },
];

export const AUDIT_KPIS = [
  { label: 'Actions logged today', value: '412' },
  { label: 'Redaction blocks served', value: '37' },
  { label: 'Exports pending approval', value: '2' },
];

export const AUDIT_LOG = [
  { ts: '14:52:07', who: 'Insp. L. Gupta', action: 'VIEW', target: "Entity ENT-1424 · 'DASTUR'", clearance: 'L4', reason: 'Op. Low Tide — anomaly triage' },
  { ts: '14:51:44', who: 'Insp. L. Gupta', action: 'PATH', target: 'ENT-1400 → ENT-1424', clearance: 'L4', reason: 'Chain of association' },
  { ts: '14:33:02', who: 'SI N. Shree', action: 'DENIED', target: 'Address field · ENT-1424', clearance: 'L2', reason: 'Clearance below L6' },
  { ts: '13:58:19', who: 'Supt. A. Rao', action: 'MERGE', target: 'ENT-1417 ← ENT-0921', clearance: 'L6', reason: 'Entity resolution, same NID' },
  { ts: '13:20:55', who: 'SI J. Parmar', action: 'EXPORT', target: 'Brief · case #20388', clearance: 'L4', reason: 'Prosecution handover' },
  { ts: '12:04:31', who: 'System', action: 'FLAG', target: 'ENT-1424 · anomaly', clearance: 'L6', reason: 'Betweenness p85 + degree p50' },
  { ts: '11:47:10', who: 'Insp. M. Aparaj', action: 'INGEST', target: 'CDR batch · telco 2 (18k rows)', clearance: 'L4', reason: 'Warrant W-2211' },
  { ts: '09:12:26', who: 'SI S. Pasumarthy', action: 'VIEW', target: 'Case #20309 witnesses', clearance: 'L4', reason: 'Statement follow-up' },
];

export const MAP_MODES = ['Live', 'Movement', 'Co-location', 'Heat'];

// Map coordinates are in a 1000 x 660 viewBox; swap for real lat/lng when the
// basemap (MapLibre / Survey of India tiles) is wired in.
export const MAP_PINS = [
  { x: 210, y: 200, label: 'Gate 3 · dockyard' },
  { x: 430, y: 300, label: 'Ward 7 lockup' },
  { x: 640, y: 250, label: 'Transit depot' },
  { x: 560, y: 470, label: 'Hawala counter' },
  { x: 800, y: 400, label: 'Safehouse (unconfirmed)', unconfirmed: true },
];

export const TRACK = [
  { time: '06:12', place: 'Gate 3 · dockyard', src: 'TOWER PING · MCC-404-11', grade: 'A1 · confirmed' },
  { time: '09:48', place: 'Ward 7 lockup', src: 'ANPR · MH-04-KX-2287', grade: 'A1 · confirmed' },
  { time: '13:05', place: 'Transit depot', src: 'TOWER PING · MCC-404-19', grade: 'B2 · usually reliable' },
  { time: '21:40', place: 'Hawala counter, Ward 3', src: 'HUMINT · CI-4', grade: 'C3 · uncorroborated' },
  { time: '23:02', place: 'Safehouse (unconfirmed)', src: 'INFERRED · graph proximity', grade: 'E5 · inference only' },
  { time: 'now', place: 'North ward, moving NNE', src: 'LIVE · telco 2 handover', grade: 'A1 · confirmed' },
];

// Successive live fixes; a real feed replaces this with a websocket / poll.
export const LIVE_FIXES = [
  { x: 688, y: 548, speed: 12 },
  { x: 704, y: 532, speed: 16 },
  { x: 720, y: 516, speed: 20 },
  { x: 700, y: 502, speed: 24 },
];
