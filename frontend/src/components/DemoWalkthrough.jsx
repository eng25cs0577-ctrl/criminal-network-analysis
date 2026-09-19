import React, { useState, useEffect } from 'react';

const steps = [
  {
    title: 'Welcome to Criminal Network Analysis',
    text: "This AI-powered platform helps you map, analyze, and investigate criminal networks. Let's take a quick tour.",
    target: null,
  },
  {
    title: 'Overview',
    text: 'See high-level stats here: total nodes, links, identified cells, flagged targets, and network density metrics.',
    target: 'nav-tab-overview',
    activateTab: 'overview',
  },
  {
    title: 'Network',
    text: 'Explore the interactive graph of operatives and their connections. Click any node to see details and relationships.',
    target: 'nav-tab-network',
    activateTab: 'network',
  },
  {
    title: 'Intelligence',
    text: 'Extract entities from raw text (reports, intercepts) — the AI automatically identifies names, roles, and links.',
    target: 'nav-tab-intel',
    activateTab: 'intel',
  },
  {
    title: 'Advisor',
    text: 'Ask the AI assistant questions about the network — e.g. "Who connects Alpha Cell and Charlie Cell?"',
    target: 'nav-tab-advisor',
    activateTab: 'advisor',
  },
];

export function DemoWalkthrough({ onComplete, setActiveTab }) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState(null);
  const isLast = step === steps.length - 1;
  const current = steps[step];

  useEffect(() => {
    if (current.activateTab && setActiveTab) {
      setActiveTab(current.activateTab);
    }
    if (current.target) {
      const el = document.getElementById(current.target);
      if (el) setRect(el.getBoundingClientRect());
      else setRect(null);
    } else {
      setRect(null);
    }
  }, [step]);

  const next = () => (isLast ? onComplete() : setStep((s) => s + 1));
  const skip = () => onComplete();

  return (
    <div className="fixed inset-0 z-[999]">
      <div className="absolute inset-0 bg-black/70" />

      {rect && (
        <div
          className="absolute rounded-lg border-2 border-accent-gold pointer-events-none animate-pulse"
          style={{
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
            boxShadow: '0 0 0 4000px rgba(0,0,0,0.7)',
          }}
        />
      )}

      <div
        className="absolute bg-gray-900 border border-accent-gold rounded-lg max-w-sm w-[90%] p-6 shadow-xl"
        style={
          rect
            ? { top: rect.bottom + 16, left: Math.max(16, rect.left) }
            : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
        }
      >
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-bold text-accent-gold">{current.title}</h3>
          <span className="text-xs text-text-tertiary">{step + 1} / {steps.length}</span>
        </div>
        <p className="text-sm text-text-secondary mb-6">{current.text}</p>
        <div className="flex justify-between items-center">
          <button onClick={skip} className="text-xs text-text-tertiary hover:text-text-secondary">
            Skip tour
          </button>
          <button onClick={next} className="btn btn-primary btn-sm">
            {isLast ? 'Get started' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
