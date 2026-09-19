// src/workbench/screens/MapScreen.jsx
import React, { useEffect, useState } from 'react';
import { LIVE_FIXES, MAP_MODES, MAP_PINS, TRACK } from '../caseData';
import { gradeBadgeClass } from '../graphModel';
import { entityHeader } from '../entityModel';

const VB = { w: 1000, h: 660 };
const TRACK_POINTS = MAP_PINS.map((p) => `${p.x},${p.y}`).join(' ');

/** Flip labels near the right edge so they are not clipped by the aspect box. */
function pinLabelStyle(pin) {
  const flip = pin.x > 700;
  return {
    left: `${(((pin.x + (flip ? -13 : 13)) / VB.w) * 100).toFixed(2)}%`,
    top: `${(((pin.y - 8) / VB.h) * 100).toFixed(2)}%`,
    transform: flip ? 'translateX(-100%)' : 'none',
  };
}

export function MapScreen({ selected }) {
  const [mode, setMode] = useState('Live');
  const [tick, setTick] = useState(0);
  const [following, setFollowing] = useState(true);
  const isLive = mode === 'Live';

  useEffect(() => {
    if (!isLive) return undefined;
    // Replace with a websocket / SSE subscription when the live feed exists.
    const timer = setInterval(() => setTick((t) => t + 1), 3000);
    return () => clearInterval(timer);
  }, [isLive]);

  const fix = LIVE_FIXES[tick % LIVE_FIXES.length];
  const header = entityHeader(selected);
  const title = isLive ? 'Live position' : mode === 'Co-location' ? 'Co-location' : 'Movement';

  return (
    <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
      <div className="wb-map-wrap">
        <div className="wb-map-box">
          <svg viewBox={`0 0 ${VB.w} ${VB.h}`} preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            <defs>
              <pattern id="wbMapGrid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M50 0H0v50" fill="none" stroke="#141b28" strokeWidth="1" />
              </pattern>
              <pattern id="wbMapStripe" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="5" height="10" fill="#0e131d" />
              </pattern>
            </defs>
            <rect width={VB.w} height={VB.h} fill="#0c111a" />
            <rect width={VB.w} height={VB.h} fill="url(#wbMapStripe)" />
            <rect width={VB.w} height={VB.h} fill="url(#wbMapGrid)" />
            <text x={VB.w / 2} y="42" textAnchor="middle" fill="#4a5568" style={{ font: '500 11px var(--font-mono)' }}>
              basemap placeholder — drop MapLibre / survey-of-india tiles here
            </text>
            <polyline points={TRACK_POINTS} fill="none" stroke="#c9a227" strokeWidth="2" strokeDasharray="7 5" />
            {MAP_PINS.map((p) => (
              <g key={p.label}>
                {p.unconfirmed && <circle cx={p.x} cy={p.y} r="15" fill="rgba(201,162,39,.18)" />}
                <circle cx={p.x} cy={p.y} r="7" fill={p.unconfirmed ? '#c9a227' : '#3b82f6'} stroke="#0a0e16" strokeWidth="2" />
              </g>
            ))}
          </svg>

          <div className="wb-label-layer">
            {MAP_PINS.map((p) => (
              <div key={p.label} className="wb-pin-label" style={pinLabelStyle(p)}>{p.label}</div>
            ))}
          </div>

          {isLive && (
            <div
              className="wb-beacon"
              style={{ left: `${((fix.x / VB.w) * 100).toFixed(2)}%`, top: `${((fix.y / VB.h) * 100).toFixed(2)}%` }}
            >
              <div className="wb-beacon-accuracy" />
              <div className="wb-beacon-ring" />
              <div className="wb-beacon-dot" />
              <div className="wb-beacon-tag">
                <span className="wb-live-dot" />
                LIVE · {3 + (tick % 4) * 3}s ago
              </div>
            </div>
          )}
        </div>

        <div className="wb-map-modes">
          {MAP_MODES.map((m) => (
            <button key={m} type="button" className={`wb-pill${mode === m ? ' active' : ''}`} onClick={() => setMode(m)}>
              {m}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: '0 1 310px', minWidth: 0, background: 'var(--bg-surface)', borderLeft: '1px solid var(--border-subtle)', overflow: 'auto', padding: 14 }}>
        {isLive && (
          <div className="panel" style={{ borderColor: 'rgba(34,197,94,.3)', padding: '12px 13px', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 9 }}>
              <span className="wb-live-dot" />
              <span style={{ font: '600 10px/1 var(--font-mono)', letterSpacing: '.07em', color: '#86efac' }}>LIVE TRACKING ACTIVE</span>
              <span style={{ flex: 1 }} />
              <span style={{ font: '500 10px/1 var(--font-mono)', color: 'var(--text-tertiary)' }}>{3 + (tick % 4) * 3}s ago</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'Accuracy', value: '±38 m' },
                { label: 'Speed', value: `${fix.speed} km/h` },
                { label: 'Heading', value: 'NNE' },
                { label: 'Source', value: 'Telco 2' },
              ].map((s) => (
                <div key={s.label}>
                  <div style={{ font: '700 13.5px/1.15 var(--font-mono)' }}>{s.value}</div>
                  <div className="stat-label" style={{ fontSize: 8.5 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 11, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="wb-pill"
                style={following ? { borderColor: 'rgba(34,197,94,.4)', background: 'rgba(34,197,94,.12)', color: '#86efac' } : undefined}
                onClick={() => setFollowing((f) => !f)}
              >
                {following ? 'Following ✓' : 'Follow device'}
              </button>
              <button type="button" className="wb-pill">Alert on geofence</button>
            </div>
            <div style={{ marginTop: 10, font: '400 10px/1.5 var(--font-mono)', color: 'var(--text-muted)' }}>
              Warrant W-2211 · live feed expires in 4 h 12 m. Every position read is logged to audit.
            </div>
          </div>
        )}

        <div style={{ font: '600 13px/1.2 var(--font-ui)', marginBottom: 3 }}>{title} · {header.name}</div>
        <div style={{ font: '400 11px/1.45 var(--font-ui)', color: 'var(--text-tertiary)', marginBottom: 14 }}>
          Tower pings and ANPR hits, 04–11 Sep. Dwell &gt; 40 min shown as a stop.
        </div>

        {TRACK.map((t) => (
          <div key={t.time + t.place} style={{ display: 'flex', gap: 11, padding: '11px 0', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ width: 52, flexShrink: 0, font: '500 10.5px/1.35 var(--font-mono)', color: 'var(--accent-gold-light)' }}>{t.time}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ font: '500 12px/1.35 var(--font-ui)', color: 'var(--text-primary)' }}>{t.place}</div>
              <div style={{ font: '400 10.5px/1.4 var(--font-mono)', color: 'var(--text-tertiary)', marginTop: 2 }}>{t.src}</div>
              <div style={{ marginTop: 5 }}><span className={gradeBadgeClass(t.grade)}>{t.grade}</span></div>
            </div>
          </div>
        ))}

        <div className="alert-banner warning" style={{ marginTop: 14, marginBottom: 0 }}>
          <div className="alert-text">
            Co-location: this track overlaps <strong>Cell C · Finance</strong> twice within 90 m at
            21:40 on 07 Sep. Corroborated by two independent sources.
          </div>
        </div>
      </div>
    </div>
  );
}
