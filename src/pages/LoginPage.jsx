import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiSignup, apiLogin } from '../api';
import { useAuth } from '../AuthContext';

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

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-bg-base relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(201,162,39,0.03),transparent)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,var(--bg-base))]" />
      </div>

      <div className="relative z-10 w-full max-w-md animate-fade-in">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-accent-gold to-accent-gold-light mb-6 shadow-glow">
            <svg className="w-7 h-7 text-bg-base" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary mb-1">CRIMINAL NETWORK ANALYSIS</h1>
          <p className="text-sm text-text-tertiary uppercase tracking-wider">{isSignup ? 'OPERATOR REGISTRATION' : 'SECURE ACCESS TERMINAL'}</p>
          <div className="mt-5 flex items-center justify-center gap-4 text-xs text-text-tertiary font-mono">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-accent-green animate-pulse" /><span>SYSTEM ONLINE</span></span>
            <span className="px-2 border-x border-border-subtle" />
            <span>CLASSIFICATION: RESTRICTED</span>
            <span className="px-2 border-x border-border-subtle" />
            <span>AES-256 ENCRYPTED</span>
          </div>
        </div>

        <div className="card border-border-default relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-gold to-transparent" />
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">OPERATOR IDENTIFIER</label>
              <div className="relative">
                <input
                  type="email"
                  className="input w-full pl-10 pr-4 py-3 bg-bg-base border-border-default focus:border-accent-gold focus:ring-2 focus:ring-accent-gold/15"
                  placeholder="agent@cbi.gov.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  disabled={loading}
                  aria-label="Email address"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 icon-sm text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9v1.5a2.5 2.5 0 005 0V12z" />
                </svg>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">ACCESS CODE</label>
              <div className="relative">
                <input
                  type="password"
                  className="input w-full pl-10 pr-4 py-3 bg-bg-base border-border-default focus:border-accent-gold focus:ring-2 focus:ring-accent-gold/15"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  disabled={loading}
                  aria-label="Password"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 icon-sm text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
            </div>

            {isSignup && (
              <div>
                <label className="block text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">CONFIRM ACCESS CODE</label>
                <div className="relative">
                  <input
                    type="password"
                    className={`input w-full pl-10 pr-4 py-3 bg-bg-base ${error && isSignup && password !== confirmPassword ? 'input-error' : ''} focus:border-accent-gold focus:ring-2 focus:ring-accent-gold/15`}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    disabled={loading}
                    aria-label="Confirm password"
                  />
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 icon-sm text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                {error && isSignup && password !== confirmPassword && (
                  <p className="mt-1.5 text-xs text-accent-red flex items-center gap-1.5">
                    <svg className="icon-xs flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    Passwords do not match
                  </p>
                )}
              </div>
            )}

            {error && !((isSignup && password !== confirmPassword)) && (
              <div className="p-3 rounded-lg bg-red-alert/10 border border-accent-red/20 flex items-center gap-2 animate-fade-in">
                <svg className="icon-sm text-accent-red flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                <span className="text-sm text-accent-red">{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary w-full py-3 mt-1 text-sm font-semibold uppercase tracking-wider"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <svg className="animate-spin icon-sm" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  <span>{isSignup ? 'REGISTERING OPERATOR...' : 'AUTHENTICATING...'}</span>
                </span>
              ) : (
                isSignup ? 'REGISTER OPERATOR' : 'INITIATE SESSION'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border-subtle">
            <p className="text-center text-xs text-text-tertiary mb-4">
              {isSignup ? 'Already have clearance?' : 'Require new credentials?'}
            </p>
            <button
              type="button"
              onClick={() => { setIsSignup(!isSignup); setError(''); }}
              className="btn btn-ghost w-full py-2.5 text-sm font-medium uppercase tracking-wider"
            >
              {isSignup ? 'ACCESS TERMINAL' : 'REQUEST CLEARANCE'}
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-text-muted font-mono tracking-wider">DEMO MODE • ANY CREDENTIALS ACCEPTED • AUDIT LOG DISABLED</p>
        </div>

        <div className="mt-7 p-4 rounded-lg bg-bg-elevated/50 border border-border-subtle text-xs text-text-tertiary">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-accent-gold">SYSTEM STATUS</span>
            <span className="flex items-center gap-1.5 text-accent-green">
              <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
              OPERATIONAL
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="font-mono text-accent-gold-light text-lg">v1.0.0</div>
              <div className="text-[9px] uppercase tracking-wider">BUILD</div>
            </div>
            <div>
              <div className="font-mono text-accent-gold-light text-lg">AES-256</div>
              <div className="text-[9px] uppercase tracking-wider">ENCRYPTION</div>
            </div>
            <div>
              <div className="font-mono text-accent-gold-light text-lg">JWT-RS256</div>
              <div className="text-[9px] uppercase tracking-wider">AUTH</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}