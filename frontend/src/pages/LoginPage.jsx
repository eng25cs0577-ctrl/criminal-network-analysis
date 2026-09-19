// src/pages/LoginPage.jsx
// Split-screen login matching the workbench's navy/gold visual language.
// Uses only styles.css classes/vars — no Tailwind (none is installed).

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiSignup, apiLogin } from '../api';
import { useAuth } from '../AuthContext';

// Small decorative network — same idea as the graph screen, purely ambient.
const NODES = [
  [60, 70], [140, 40], [220, 110], [90, 160], [200, 190],
  [280, 60], [300, 170], [40, 230], [170, 250], [260, 240],
];
const EDGES = [[0,1],[1,2],[0,3],[3,4],[2,4],[1,5],[5,6],[4,6],[3,7],[7,8],[4,8],[8,9],[6,9]];

export function LoginPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignup) {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        const data = await apiSignup(email, password);
        login(data.access_token, { email });
      } else {
        const data = await apiLogin(email, password);
        login(data.access_token, { email });
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const label = { display: 'block', font: '500 10px/1 var(--font-ui)', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-tertiary)', marginBottom: 7 };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-base)' }}>
      {/* Brand panel */}
      <div style={{
        flex: '1 1 46%', minWidth: 0, position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(160deg,#0d121c,#0a0e16)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '48px 44px',
      }}>
        <svg viewBox="0 0 340 300" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.5 }} preserveAspectRatio="xMidYMid slice">
          {EDGES.map(([a, b], i) => (
            <line key={i} x1={NODES[a][0]} y1={NODES[a][1]} x2={NODES[b][0]} y2={NODES[b][1]} stroke="#243044" strokeWidth="1" />
          ))}
          {NODES.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i === 4 ? 7 : 4} fill={i === 4 ? '#c9a227' : '#3b82f6'} opacity={i === 4 ? 1 : 0.7} />
          ))}
        </svg>

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 6, background: 'linear-gradient(135deg,#c9a227,#e8c547)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '700 13px/1 var(--font-mono)', color: 'var(--bg-base)' }}>CN</div>
          <div style={{ font: '600 13px/1.2 var(--font-ui)' }}>Criminal Network Analyser</div>
        </div>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 380 }}>
          <div style={{ font: '600 28px/1.25 var(--font-ui)', color: 'var(--text-primary)', marginBottom: 12 }}>
            Map the network.<br />Find the coordinator.
          </div>
          <div style={{ font: '400 13px/1.6 var(--font-ui)', color: 'var(--text-secondary)' }}>
            Link analysis, entity resolution and movement tracing for
            investigators — every claim carries a source and a confidence grade.
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 16, font: '500 10px/1 var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '.06em' }}>
          <span>RESTRICTED ACCESS</span>
          <span>·</span>
          <span>ALL ACTIONS LOGGED</span>
        </div>
      </div>

      {/* Form panel */}
      <div style={{ flex: '1 1 54%', minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ marginBottom: 28 }}>
            <div style={{ font: '600 19px/1.3 var(--font-ui)', color: 'var(--text-primary)', marginBottom: 4 }}>
              {isSignup ? 'Request access' : 'Sign in'}
            </div>
            <div style={{ font: '400 12.5px/1.4 var(--font-ui)', color: 'var(--text-tertiary)' }}>
              {isSignup ? 'Register as an operator on this case system.' : 'Enter your credentials to continue.'}
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={label}>Email</label>
              <input
                type="email" className="input" style={{ width: '100%' }}
                placeholder="agent@cbi.gov.in" value={email}
                onChange={(e) => setEmail(e.target.value)}
                required autoComplete="email" disabled={loading}
              />
            </div>

            <div>
              <label style={label}>Password</label>
              <input
                type="password" className="input" style={{ width: '100%' }}
                placeholder="••••••••" value={password}
                onChange={(e) => setPassword(e.target.value)}
                required autoComplete={isSignup ? 'new-password' : 'current-password'} disabled={loading}
              />
            </div>

            {isSignup && (
              <div>
                <label style={label}>Confirm password</label>
                <input
                  type="password" className="input" style={{ width: '100%' }}
                  placeholder="••••••••" value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required autoComplete="new-password" disabled={loading}
                />
                {error && password !== confirmPassword && (
                  <div style={{ marginTop: 6, font: '500 11px/1.3 var(--font-ui)', color: 'var(--accent-red)' }}>Passwords do not match</div>
                )}
              </div>
            )}

            {error && !(isSignup && password !== confirmPassword) && (
              <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', font: '500 12px/1.4 var(--font-ui)', color: 'var(--accent-red)' }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '11px 16px', fontSize: 13 }} disabled={loading}>
              {loading ? (isSignup ? 'Creating account…' : 'Signing in…') : isSignup ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border-subtle)', textAlign: 'center' }}>
            <button
              type="button" className="btn btn-ghost"
              onClick={() => { setIsSignup(!isSignup); setError(''); }}
            >
              {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Request access"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
