import React, { useEffect, useMemo, useState } from 'react';
import '../App.css';

/**
 * PUBLIC_INTERFACE
 * HoldingsTable
 * An accessible, sortable, and paginated table for portfolio holdings.
 *
 * Features:
 * - Columns: Name, Weight %, Return %, Sector, Risk
 * - Sort by clicking headers; keyboard accessible via Enter/Space
 * - Pagination with 10 rows per page (configurable via props)
 * - Row click triggers onSelect(holding) for drilldown
 * - ARIA roles and keyboard support for headers and rows
 *
 * Props:
 * - holdings: Array<{ id, name, ticker, weight, returnPct, sector, region, riskScore }>
 * - onSelect: (holding) => void
 * - rowsPerPage?: number (default 10)
 */
function HoldingsTable({
  holdings = [],
  onSelect = () => {},
  rowsPerPage = 10,
}) {
  const columns = useMemo(
    () => [
      { key: 'name', label: 'Name', sortable: true },
      { key: 'weight', label: 'Weight %', sortable: true, isNumeric: true },
      { key: 'returnPct', label: 'Return %', sortable: true, isNumeric: true },
      { key: 'sector', label: 'Sector', sortable: true },
      { key: 'riskScore', label: 'Risk', sortable: true, isNumeric: true },
    ],
    []
  );

  // Sorting state
  const [sortBy, setSortBy] = useState('weight');
  const [sortDir, setSortDir] = useState('desc'); // 'asc' | 'desc'

  // Pagination state
  const [page, setPage] = useState(1);

  // Reset page when holdings changes
  useEffect(() => {
    setPage(1);
  }, [holdings]);

  // Sort handler
  const onSort = (key) => {
    if (sortBy === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDir('asc');
    }
  };

  const onHeaderKeyDown = (e, key) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSort(key);
    }
  };

  // Sorted rows
  const sorted = useMemo(() => {
    const arr = Array.isArray(holdings) ? [...holdings] : [];
    arr.sort((a, b) => {
      const va = a?.[sortBy];
      const vb = b?.[sortBy];
      if (va == null && vb == null) return 0;
      if (va == null) return sortDir === 'asc' ? -1 : 1;
      if (vb == null) return sortDir === 'asc' ? 1 : -1;

      if (typeof va === 'number' && typeof vb === 'number') {
        return sortDir === 'asc' ? va - vb : vb - va;
      } else {
        const sa = String(va).toLowerCase();
        const sb = String(vb).toLowerCase();
        if (sa < sb) return sortDir === 'asc' ? -1 : 1;
        if (sa > sb) return sortDir === 'asc' ? 1 : -1;
        return 0;
      }
    });
    return arr;
  }, [holdings, sortBy, sortDir]);

  // Pagination derived values
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * rowsPerPage;
  const pageRows = sorted.slice(startIdx, startIdx + rowsPerPage);

  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages, p + 1));

  const onRowKeyDown = (e, row) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(row);
    }
  };

  const sortIndicator = (key) => {
    if (key !== sortBy) return null;
    return (
      <span className="tbl-sort-indicator" aria-hidden="true">
        {sortDir === 'asc' ? (
          <svg width="10" height="10" viewBox="0 0 24 24">
            <path d="M12 7l-6 6h12l-6-6z" fill="currentColor" />
          </svg>
        ) : (
          <svg width="10" height="10" viewBox="0 0 24 24">
            <path d="M12 17l6-6H6l6 6z" fill="currentColor" />
          </svg>
        )}
      </span>
    );
  };

  return (
    <section className="card" role="region" aria-label="Holdings table">
      <header className="chart-header">
        <div className="chart-title">
          <span className="brand-accent" aria-hidden="true" />
          <h3>Holdings</h3>
        </div>
        <span className="badge" aria-label={`Total holdings ${total}`}>
          {total} Holdings
        </span>
      </header>

      <div className="table-responsive">
        <table className="tbl" role="table">
          <thead className="tbl-head">
            <tr role="row">
              {columns.map((col) => {
                const active = sortBy === col.key;
                const ariaSort =
                  active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none';
                return (
                  <th
                    key={col.key}
                    scope="col"
                    role="columnheader"
                    aria-sort={ariaSort}
                  >
                    <button
                      type="button"
                      className={`tbl-sort ${active ? 'active' : ''}`}
                      onClick={() => onSort(col.key)}
                      onKeyDown={(e) => onHeaderKeyDown(e, col.key)}
                      aria-label={`Sort by ${col.label}${
                        active ? `, ${sortDir}` : ''
                      }`}
                    >
                      {col.label}
                      {sortIndicator(col.key)}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="tbl-body">
            {pageRows.map((row) => (
              <tr
                key={row.id || row.name}
                role="row"
                tabIndex={0}
                className="tbl-row"
                onClick={() => onSelect(row)}
                onKeyDown={(e) => onRowKeyDown(e, row)}
                aria-label={`${row.name}, weight ${row.weight} percent, return ${row.returnPct} percent, sector ${row.sector}, risk ${row.riskScore}`}
              >
                <td role="cell">
                  <div className="tbl-name">
                    <strong>{row.name}</strong>
                    {row.ticker && <span className="tbl-ticker u-text-muted">{row.ticker}</span>}
                  </div>
                </td>
                <td role="cell" className="tbl-num">
                  {row.weight != null ? `${row.weight.toFixed(2)}%` : '—'}
                </td>
                <td role="cell" className={`tbl-num ${row.returnPct >= 0 ? 'pos' : 'neg'}`}>
                  {row.returnPct != null ? `${row.returnPct.toFixed(2)}%` : '—'}
                </td>
                <td role="cell">{row.sector || '—'}</td>
                <td role="cell" className="tbl-num">
                  {row.riskScore != null ? row.riskScore : '—'}
                </td>
              </tr>
            ))}
            {!pageRows.length && (
              <tr>
                <td colSpan={columns.length}>
                  <div className="u-text-muted" style={{ padding: '12px 0' }}>
                    No holdings to display.
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="tbl-pagination" role="navigation" aria-label="Table pagination">
        <button
          type="button"
          className="button"
          onClick={goPrev}
          disabled={currentPage <= 1}
          aria-label="Previous page"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Prev
        </button>
        <span className="tbl-page-indicator" aria-live="polite">
          Page {currentPage} of {totalPages}
        </span>
        <button
          type="button"
          className="button"
          onClick={goNext}
          disabled={currentPage >= totalPages}
          aria-label="Next page"
        >
          Next
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </section>
  );
}

export default HoldingsTable;
