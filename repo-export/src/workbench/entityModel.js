// src/workbench/entityModel.js
// Builds the dossier for a selected node: attributes with clearance
// requirements, provenance (Admiralty grading) and linked entities.

import { CELLS, NAMES, redact, displayName } from './graphModel';

export function entityBadges(node) {
  const badges = [];
  if (node.flagged) badges.push({ label: 'Anomaly candidate', className: 'badge badge-red' });
  badges.push({
    label: node.group < 0 ? 'Unresolved identity' : 'Resolved',
    className: 'badge badge-gold',
  });
  badges.push({
    label: `Clearance ${node.group < 0 ? 'L6' : 'L4'}`,
    className: 'badge badge-blue',
  });
  return badges;
}

export function entityStats(node) {
  return [
    { label: 'Degree', value: node.degree },
    { label: 'Betweenness', value: Number(node.betweenness).toFixed(3) },
    { label: 'Sources', value: node.group < 0 ? 3 : 4 },
    { label: 'Open cases', value: node.group < 0 ? 1 : 2 },
  ];
}

/** Core attributes, each with the clearance level it requires. */
export function entityFields(node, clearance) {
  return [
    {
      key: 'Alias',
      value: node.group < 0 ? "'Dastur' (3 variants)" : `${node.name.split(' ')[1]} (2 variants)`,
    },
    {
      key: 'Phone',
      value: redact(node.group < 0 ? '+91 ·· ···· 4471 (burner)' : '+91 98··· ··210', 4, clearance),
    },
    { key: 'Last address', value: redact('12/B Harbour Rd, Ward 7', 6, clearance) },
    { key: 'Bank account', value: redact('HDFC ····8842', 4, clearance) },
    {
      key: 'Community',
      value: node.group < 0 ? 'bridging A ↔ C' : CELLS[node.group].label,
    },
  ];
}

/** Full dossier: core attributes plus the long tail. */
export function entityFullFields(node, clearance) {
  return entityFields(node, clearance).concat([
    { key: 'Age / gender', value: node.group < 0 ? 'unknown' : '34 · M' },
    { key: 'Nationality', value: 'IN' },
    { key: 'Motive tag', value: node.group === 2 ? 'financial' : 'logistics' },
    { key: 'Prior cases', value: node.group < 0 ? '0 (no record match)' : '2 linked' },
    { key: 'Informant handle', value: redact('CI-4 · "HARBOUR"', 6, clearance) },
    {
      key: 'Entity resolution',
      value: node.group < 0 ? '3 candidates, unmerged' : 'merged from 4 records',
    },
  ]);
}

/** Every claim carries a source handle; unsourced claims cannot be exported. */
export function entityProvenance(node) {
  return [
    {
      claim:
        node.group < 0
          ? 'Two independent handsets place the same voice on both Cell A and Cell C calls.'
          : `Named in intercepted call to ${NAMES[(node.group + 1) % 4][0]}, 06 Sep 21:40.`,
      source: 'SIGINT · warrant W-2211',
      grade: 'B2 · usually reliable',
    },
    {
      claim:
        node.group < 0
          ? 'Never appears in any custody, ANPR or bank record — presence inferred from graph topology only.'
          : 'Vehicle registered to this identity seen at dockyard gate 3.',
      source: 'ANPR · station feed',
      grade: 'A1 · confirmed',
    },
    {
      claim: 'Human source describes a "coordinator who never meets the cells".',
      source: 'HUMINT · CI-4',
      grade: 'C3 · uncorroborated',
    },
  ];
}

export function entityLinks(adjacency, node, byId) {
  return (adjacency[node.id] || []).slice(0, 8).map((id) => {
    const linked = byId[id];
    return {
      id,
      node: linked,
      label: `${linked.group < 0 ? "'DASTUR'" : linked.name} · ${
        linked.group < 0 ? 'coord' : `cell ${'ABCD'[linked.group]}`
      }`,
    };
  });
}

export function entityHeader(node) {
  return {
    name: displayName(node),
    idLabel: `ENT-${1400 + node.id}`,
    cell: node.group < 0 ? 'no community' : CELLS[node.group].label,
    role: node.role,
    initials: node.group < 0 ? '??' : node.name.replace('. ', '').slice(0, 2).toUpperCase(),
    sourceCount: node.group < 0 ? 3 : 4,
  };
}
