import React, { useEffect, useMemo, useRef, useState } from 'react';
import '../App.css';

/**
 * PUBLIC_INTERFACE
 * FilterBar provides a responsive horizontal control bar with:
 * - Time range segmented control: 1M, 3M, YTD, 1Y
 * - Portfolio dropdown select
 * - Placeholder Date Range inputs (From / To)
 * - Reset Filters button
 *
 * Accessibility:
 * - Segmented control is tabbable and supports keyboard activation via Enter/Space
 * - ARIA labels on interactive elements
 * - Proper focus outlines via theme ring token
 *
 * Props:
 * - timeRange: '1M' | '3M' | 'YTD' | '1Y'
 * - onTimeRangeChange: (value) => void
 * - portfolio: string
 * - onPortfolioChange: (value) => void
 * - dateFrom: string (YYYY-MM-DD)
 * - dateTo: string (YYYY-MM-DD)
 * - onDateChange: ({ from, to }) => void
 * - onReset: () => void
 * - portfolios: string[] list of portfolio names
 */
function FilterBar({
  timeRange = 'YTD',
  onTimeRangeChange = () => {},
  portfolio = '',
  onPortfolioChange = () => {},
  dateFrom = '',
  dateTo = '',
  onDateChange = () => {},
  onReset = () => {},
  portfolios = [],
}) {
  const ranges = useMemo(() => ['1M', '3M', 'YTD', '1Y'], []);
  const groupRef = useRef(null);

  // Handle keyboard activation on segmented buttons
  const onKeyActivate = (e, value) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onTimeRangeChange(value);
    }
  };

  // Ensure portfolio exists in provided options, reset if not
  useEffect(() => {
    if (portfolio && portfolios.length && !portfolios.includes(portfolio)) {
      onPortfolioChange(portfolios[0] || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portfolios]);

  const onChangeFrom = (e) => {
    onDateChange({ from: e.target.value, to: dateTo || '' });
  };
  const onChangeTo = (e) => {
    onDateChange({ from: dateFrom || '', to: e.target.value });
  };

  return (
    <div className="filterbar u-card u-card-hover" role="region" aria-label="Time and portfolio filters">
      <div className="filterbar-left" aria-label="Time range segmented control">
        <div className="segmented" role="tablist" aria-label="Select time range" ref={groupRef}>
          {ranges.map((r) => {
            const active = timeRange === r;
            return (
              <button
                key={r}
                type="button"
                role="tab"
                aria-selected={active}
                className={`segmented-item ${active ? 'active' : ''}`}
                onClick={() => onTimeRangeChange(r)}
                onKeyDown={(e) => onKeyActivate(e, r)}
              >
                {r}
              </button>
            );
          })}
        </div>
      </div>

      <div className="filterbar-center" aria-label="Date range picker">
        <div className="date-range">
          <label className="date-field">
            <span className="date-label">From</span>
            <input
              type="date"
              value={dateFrom}
              onChange={onChangeFrom}
              aria-label="From date"
            />
          </label>
          <span className="date-sep" aria-hidden="true">–</span>
          <label className="date-field">
            <span className="date-label">To</span>
            <input
              type="date"
              value={dateTo}
              onChange={onChangeTo}
              aria-label="To date"
            />
          </label>
        </div>
      </div>

      <div className="filterbar-right">
        <label className="portfolio-select">
          <span className="portfolio-label">Portfolio</span>
          <select
            aria-label="Select portfolio"
            value={portfolio}
            onChange={(e) => onPortfolioChange(e.target.value)}
          >
            {(!portfolios || portfolios.length === 0) && <option value="">All Portfolios</option>}
            {portfolios && portfolios.length > 0 && portfolios.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className="button filterbar-reset"
          aria-label="Reset filters"
          onClick={onReset}
          title="Reset filters to defaults"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 4v6h6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M20 20v-6h-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M20 8a8 8 0 0 0-14-4M4 16a8 8 0 0 0 14 4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
          </svg>
          Reset
        </button>
      </div>
    </div>
  );
}

export default FilterBar;
