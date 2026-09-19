# Workbench UI — integration notes

Files here mirror the repo layout. Copy `src/` over `src/` in
`eng25cs0577-ctrl/criminal-network-analysis` (nothing existing is overwritten —
all files are new).

```
src/pages/WorkbenchPage.jsx          shell: top bar, rail, screen switch
src/workbench.css                    layout-only rules (palette stays in styles.css)
src/workbench/graphModel.js          graph build, metrics, BFS path, API mapping
src/workbench/entityModel.js         dossier fields, provenance, clearance redaction
src/workbench/caseData.js            mock cases / search / audit / map records
src/workbench/screens/*.jsx          Cases, Graph, Entity, Map, Search, Audit
```

## 1. Add the route

In `src/App.jsx`:

```jsx
import { WorkbenchPage } from './pages/WorkbenchPage';

<Route
  path="/workbench"
  element={<ProtectedRoute><WorkbenchPage /></ProtectedRoute>}
/>
```

Make it the landing screen by pointing `path="/"` at `WorkbenchPage` instead of
`DashboardPage`.

## 2. No new dependencies

React 18 + react-router only. `workbench.css` is imported by the page and uses
the existing `styles.css` custom properties, so the palette stays in one place.

## 3. Backend wiring

- `apiGetGraph()` is called on mount; on success `fromApiGraph()` positions the
  real nodes, otherwise the deterministic mock from `graphModel.js` renders.
  Backend nodes carry no coordinates, so layout is computed client-side.
- `apiGetPath(source, target)` powers **Trace path**, falling back to a local
  BFS if the request fails.
- Cases, search, audit and map records are still mock — replace the exports in
  `caseData.js` as those endpoints land.

## 4. Live location

`MapScreen` polls `LIVE_FIXES` on a 3 s interval as a stand-in. Swap the
`useEffect` for a websocket/SSE subscription and feed `{x, y, speed}` (or
lat/lng once a real basemap is in) — the beacon, accuracy ring and "Ns ago"
ticker follow automatically.

## 5. Placeholders to replace

- Basemap: the striped SVG in `MapScreen` — drop MapLibre / Survey of India tiles.
- Custody photo: the striped SVG in `EntityScreen`.
- Names in `graphModel.js` are fictional test data.
