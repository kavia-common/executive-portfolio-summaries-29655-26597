import React, { useMemo } from 'react';
import '../App.css';

/**
 * PUBLIC_INTERFACE
 * BUSummaryCards
 * Renders a responsive grid of KPI cards at the Business Unit level for the currently filtered accounts.
 *
 * Props:
 * - accounts: Array<{ successRate?: number, risk?: 'Low' | 'Medium' | 'High', businessUnit?: string, region?: string }>
 *   These should already reflect filters (businessUnits, regions) at the App level.
 *
 * Behavior:
 * - Computes:
 *    • Avg Success Rate (0-100%)
 *    • Avg Risk (1-10, mapping Low=2, Medium=5, High=8 when numeric not provided)
 *    • Active Accounts (count)
 *    • Programs/Projects (optional): if accounts have `programs` or `projects` numeric fields, sum and show as a card.
 *      If not available, omit gracefully.
 * - Styling mirrors SummaryCards / Ocean Professional tokens (reuses same CSS classes).
 */
function BUSummaryCards({ accounts = [] }) {
  // Compute aggregates with guards
  const {
    avgSuccessRate,
    avgRiskScore,
    activeAccounts,
    programsCount,
    hasPrograms,
  } = useMemo(() => {
    const rows = Array.isArray(accounts) ? accounts : [];
    const n = rows.length;

    // Success Rate average (0..100)
    let successSum = 0;
    let successCount = 0;

    // Risk mapping: try `riskScore` if present; otherwise map textual 'risk' to numeric proxy
    let riskSum = 0;
    let riskCount = 0;

    // Programs/Projects if any account has them
    let progSum = 0;
    let hasProg = false;

    rows.forEach((a) => {
      if (typeof a?.successRate === 'number') {
        successSum += a.successRate;
        successCount += 1;
      }
      const riskScore = typeof a?.riskScore === 'number'
        ? a.riskScore
        : a?.risk === 'Low'
          ? 2
          : a?.risk === 'Medium'
            ? 5
            : a?.risk === 'High'
              ? 8
              : undefined;
      if (typeof riskScore === 'number') {
        riskSum += riskScore;
        riskCount += 1;
      }

      const programs = typeof a?.programs === 'number' ? a.programs : undefined;
      const projects = typeof a?.projects === 'number' ? a.projects : undefined;
      if (typeof programs === 'number') {
        progSum += programs;
        hasProg = true;
      } else if (typeof projects === 'number') {
        progSum += projects;
        hasProg = true;
      }
    });

    const avgSuccess = successCount ? successSum / successCount : 0;
    const avgRisk = riskCount ? riskSum / riskCount : 0;
    const count = n;

    return {
      avgSuccessRate: avgSuccess,
      avgRiskScore: avgRisk,
      activeAccounts: count,
      programsCount: progSum,
      hasPrograms: hasProg,
    };
  }, [accounts]);

  // Build KPI items similar to SummaryCards items API
  const items = useMemo(() => {
    const list = [
      {
        key: 'bu-success',
        label: 'Avg Success Rate',
        value: `${avgSuccessRate.toFixed(0)}%`,
        subLabel: 'Across selected BUs',
        trend: undefined,
        accent: 'primary',
      },
      {
        key: 'bu-risk',
        label: 'Avg Risk',
        value: avgRiskScore ? avgRiskScore.toFixed(1) : '—',
        subLabel: 'Composite risk (1-10)',
        trend: undefined,
        accent: 'secondary',
      },
      {
        key: 'bu-active',
        label: 'Active Accounts',
        value: `${activeAccounts}`,
        subLabel: 'Filtered scope',
        trend: undefined,
        accent: 'primary',
      },
    ];
    if (hasPrograms) {
      list.push({
        key: 'bu-programs',
        label: 'Programs/Projects',
        value: `${programsCount}`,
        subLabel: 'Total initiatives',
        trend: undefined,
        accent: 'secondary',
      });
    }
    return list;
  }, [avgSuccessRate, avgRiskScore, activeAccounts, programsCount, hasPrograms]);

  return (
    <section className="summary-cards" role="region" aria-label="Business Unit KPIs">
      {items.map((kpi) => {
        const { key, label, value, subLabel, accent = 'primary' } = kpi;
        return (
          <article
            key={key}
            className={`kpi-card u-card u-card-hover kpi-accent-${accent}`}
            aria-label={`${label} ${value}`}
          >
            <header className="kpi-header">
              <span className="kpi-accent-bar" aria-hidden="true" />
              <span className="kpi-label">{label}</span>
            </header>

            <div className="kpi-main">
              <span className="kpi-value" aria-live="polite">{value}</span>
              {subLabel && <span className="kpi-sublabel u-text-muted">{subLabel}</span>}
            </div>
          </article>
        );
      })}
    </section>
  );
}

export default BUSummaryCards;
