import React from 'react';
import '../App.css';

/**
 * PUBLIC_INTERFACE
 * SummaryCards
 * Renders a responsive grid of KPI cards for executive portfolio overview.
 *
 * Props:
 * - items: Array of {
 *     key: string (unique),
 *     label: string,
 *     value: string | number,
 *     subLabel?: string,            // optional secondary descriptor
 *     trend?: { direction: 'up' | 'down' | 'flat', value?: string } // optional trend info
 *     accent?: 'primary' | 'secondary' // optional accent color, default 'primary'
 *   }
 *
 * No business logic is embedded; component is purely presentational.
 */
function SummaryCards({ items = [] }) {
  return (
    <section className="summary-cards" role="region" aria-label="Key portfolio indicators">
      {items.map((kpi) => {
        const { key, label, value, subLabel, trend, accent = 'primary' } = kpi;
        const trendDir = trend?.direction || 'flat';
        const isUp = trendDir === 'up';
        const isDown = trendDir === 'down';
        const isFlat = trendDir === 'flat';

        return (
          <article
            key={key}
            className={`kpi-card u-card u-card-hover kpi-accent-${accent}`}
            aria-label={`${label} ${value}${trend?.value ? `, ${trend.value} ${trendDir}` : ''}`}
          >
            <header className="kpi-header">
              <span className="kpi-accent-bar" aria-hidden="true" />
              <span className="kpi-label">{label}</span>
            </header>

            <div className="kpi-main">
              <span className="kpi-value" aria-live="polite">{value}</span>
              {subLabel && <span className="kpi-sublabel u-text-muted">{subLabel}</span>}
            </div>

            {trend && (
              <div
                className={`kpi-trend ${isUp ? 'trend-up' : ''} ${isDown ? 'trend-down' : ''} ${isFlat ? 'trend-flat' : ''}`}
                aria-label={`Trend ${trendDir}${trend.value ? ` ${trend.value}` : ''}`}
              >
                <span className="kpi-trend-icon" aria-hidden="true">
                  {isUp && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M4 14l6-6 4 4 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M14 6h6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {isDown && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M4 10l6 6 4-4 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M14 18h6v-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {isFlat && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M4 12h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  )}
                </span>
                {trend.value && <span className="kpi-trend-value">{trend.value}</span>}
              </div>
            )}
          </article>
        );
      })}
    </section>
  );
}

export default SummaryCards;
