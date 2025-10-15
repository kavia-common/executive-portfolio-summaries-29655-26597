import React, { useEffect, useMemo, useRef } from 'react';
import '../App.css';

/**
 * PUBLIC_INTERFACE
 * DrilldownPanel
 * Accessible slide-over panel that displays details for a selected account.
 *
 * Props:
 * - isOpen: boolean - controls visibility (slide-in/out)
 * - account: object | null - selected account with fields:
 *      { id, name, successRate, risk, businessUnit, region, ... }
 * - onClose: () => void - invoked when user closes the panel
 *
 * Behavior:
 * - Uses aria-modal semantics via role="dialog" and aria-labelledby/aria-describedby
 * - Closes on ESC, overlay click, and Close button
 * - Focus management: trap focus while open and restore on close
 * - Renders a small inline SVG sparkline based on mock performance derived
 *   from holding.returnPct and riskScore for visual context
 */
function DrilldownPanel({ isOpen = false, account = null, onClose = () => {} }) {
  const panelRef = useRef(null);
  const lastActiveRef = useRef(null);

  // Restore focus to last active element when closing
  useEffect(() => {
    if (isOpen) {
      lastActiveRef.current = document.activeElement;
      // Delay focusing the close button for better UX
      const t = setTimeout(() => {
        const btn = panelRef.current?.querySelector('button.close-btn');
        btn?.focus();
      }, 30);
      return () => clearTimeout(t);
    } else if (lastActiveRef.current) {
      // restore focus when panel transitions to closed
      const t = setTimeout(() => {
        try { lastActiveRef.current.focus(); } catch {}
      }, 30);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [isOpen]);

  // ESC & focus trap
  useEffect(() => {
    const onKey = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
      if (e.key === 'Tab' && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll(
          'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Generate a tiny sparkline based on holding characteristics
  const sparkData = useMemo(() => {
    if (!account) return [];
    // Create 24 points with gentle trend influenced by successRate and risk
    const n = 24;
    const target = typeof account.successRate === 'number' ? account.successRate / 10 - 3 : 0;
    const riskScore = account.risk === 'Low' ? 2 : account.risk === 'Medium' ? 5 : 8;
    const vol = Math.max(0.6, Math.min(3, riskScore / 2));
    const arr = [];
    let v = Math.max(-5, Math.min(5, target / 2)); // start near half target proxy
    for (let i = 0; i < n; i++) {
      const drift = (target - v) * 0.05;
      const noise = (Math.random() - 0.5) * vol;
      v = v + drift + noise;
      arr.push({ x: i, y: v });
    }
    return arr;
  }, [account]);

  const sparkPath = useMemo(() => {
    if (!sparkData.length) return '';
    const width = 200;
    const height = 56;
    const xs = sparkData.map(p => p.x);
    const ys = sparkData.map(p => p.y);
    const xMin = Math.min(...xs);
    const xMax = Math.max(...xs);
    const yMin = Math.min(...ys);
    const yMax = Math.max(...ys);
    const xScale = (x) => (xMax === xMin ? 0 : ((x - xMin) / (xMax - xMin)) * (width - 12)) + 6;
    const yScale = (y) => {
      if (yMax === yMin) return height / 2;
      return height - (((y - yMin) / (yMax - yMin)) * (height - 10) + 5);
    };
    return sparkData
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.x).toFixed(1)} ${yScale(p.y).toFixed(1)}`)
      .join(' ');
  }, [sparkData]);

  const titleId = 'account-drilldown-title';
  const descId = 'account-drilldown-desc';

  return (
    <>
      {/* Overlay */}
      <div
        className={`ddp-overlay ${isOpen ? 'show' : ''}`}
        onClick={onClose}
        aria-hidden={!isOpen}
      />

      {/* Panel */}
      <aside
        className={`ddp-panel ${isOpen ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        ref={panelRef}
      >
        <header className="ddp-header">
          <div className="ddp-title-wrap">
            <span className="brand-accent" aria-hidden="true" />
            <div>
              <h3 id={titleId} className="ddp-title">
                {account?.name || 'Account'}
              </h3>
              <p id={descId} className="u-text-muted ddp-subtitle">
                Quick details and actions for this account
              </p>
            </div>
          </div>
          <button
            type="button"
            className="icon-btn close-btn"
            aria-label="Close details panel"
            onClick={onClose}
            title="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </header>

        {/* Sparkline */}
        <section className="ddp-spark card" aria-label="Recent performance sparkline">
          <svg
            viewBox="0 0 200 56"
            className="ddp-spark-svg"
            preserveAspectRatio="none"
            role="img"
            aria-label="Mini performance sparkline"
          >
            <defs>
              <linearGradient id="ddpArea" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.25" />
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            <path d={sparkPath} className="ddp-spark-line" fill="none" />
          </svg>
          {account && (
            <div className="ddp-spark-meta">
              <span className="badge">
                Success Rate {account.successRate != null ? `${account.successRate.toFixed(0)}%` : '—'}
              </span>
              <span className="u-text-muted">Recent activity</span>
            </div>
          )}
        </section>

        {/* Key Metrics */}
        <section className="ddp-metrics card" aria-label="Key metrics">
          <div className="ddp-metrics-grid">
            <div className="ddp-metric">
              <div className="ddp-metric-label">Success Rate</div>
              <div className="ddp-metric-value">{account?.successRate != null ? `${account.successRate.toFixed(0)}%` : '—'}</div>
            </div>
            <div className="ddp-metric">
              <div className="ddp-metric-label">Risk</div>
              <div className="ddp-metric-value">{account?.risk || '—'}</div>
            </div>
            <div className="ddp-metric">
              <div className="ddp-metric-label">Business Unit</div>
              <div className="ddp-metric-value">{account?.businessUnit || '—'}</div>
            </div>
            <div className="ddp-metric">
              <div className="ddp-metric-label">Region</div>
              <div className="ddp-metric-value">{account?.region || '—'}</div>
            </div>
          </div>
        </section>

        {/* Actions */}
        <section className="ddp-actions" aria-label="Account actions">
          <button type="button" className="button button-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Add to Watchlist
          </button>
          <button type="button" className="button">
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            View Full Analytics
          </button>
          <button type="button" className="button" onClick={onClose}>
            Close
          </button>
        </section>
      </aside>
    </>
  );
}

export default DrilldownPanel;
