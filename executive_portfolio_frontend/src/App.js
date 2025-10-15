import React, { useEffect, useMemo, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import FilterBar from './components/FilterBar';
import SummaryCards from './components/SummaryCards';
import BUSummaryCards from './components/BUSummaryCards';
import PerformanceChart from './components/PerformanceChart';
import AllocationChart from './components/AllocationChart';
import AccountsTable from './components/AccountsTable';
import DrilldownPanel from './components/DrilldownPanel';
import { portfolios as mockPortfolios, getPerformance, getAccounts, getAllocation } from './data/mockPortfolio';

/**
 * PUBLIC_INTERFACE
 * App
 * Top-level container managing:
 * - global filters (timeRange, selected portfolio, sector/region filters, date range)
 * - sidebar/drawer open state
 * - drilldown selected holding state with slide-over panel
 * - persistence: selected portfolio and theme (theme persisted via Navbar)
 */
function App() {
  // Quick filter state (maintained at App level for future data usage)
  const [selectedBusinessUnits, setSelectedBusinessUnits] = useState([]);
  const [selectedRegions, setSelectedRegions] = useState([]);

  // Sidebar open (mobile drawer)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Drilldown state
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [isDrillOpen, setIsDrillOpen] = useState(false);

  // FilterBar state
  const [timeRange, setTimeRange] = useState('YTD');

  // Persist portfolio selection in localStorage
  const [portfolio, setPortfolio] = useState(() => {
    if (typeof window === 'undefined') return 'All Portfolios';
    return localStorage.getItem('selectedPortfolio') || 'All Portfolios';
  });
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedPortfolio', portfolio || 'All Portfolios');
    }
  }, [portfolio]);

  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  // Portfolios list mapped from mock data; include an "All" option for UX
  const portfolios = ['All Portfolios', ...mockPortfolios.map(p => p.name)];

  // PUBLIC_INTERFACE
  const resetFilters = () => {
    setTimeRange('YTD');
    setPortfolio('All Portfolios');
    setDateRange({ from: '', to: '' });
    setSelectedBusinessUnits([]);
    setSelectedRegions([]);
  };

  // Toggle helpers
  // PUBLIC_INTERFACE
  const onToggleBusinessUnit = (value) => {
    setSelectedBusinessUnits((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  // PUBLIC_INTERFACE
  const onToggleRegion = (value) => {
    setSelectedRegions((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const filtersSummary = useMemo(() => {
    const b = selectedBusinessUnits.length ? `${selectedBusinessUnits.length} business unit(s)` : 'All business units';
    const r = selectedRegions.length ? `${selectedRegions.length} region(s)` : 'All regions';
    return `${b} • ${r}`;
  }, [selectedBusinessUnits, selectedRegions]);

  // Derive selected portfolio object by name, default to first
  const selectedPortfolioName =
    portfolio && portfolio !== 'All Portfolios' ? portfolio : mockPortfolios[0]?.name;
  const selectedPortfolio = mockPortfolios.find(p => p.name === selectedPortfolioName) || mockPortfolios[0];
  const selectedPortfolioId = selectedPortfolio?.id;

  // Derived data for charts and table
  const performance = selectedPortfolioId ? getPerformance(selectedPortfolioId, timeRange) : [];
  const allocation = selectedPortfolioId ? getAllocation(selectedPortfolioId) : [];
  // Accounts with optional business unit / region filtering (if user selected filters)
  const accountsRaw = selectedPortfolioId ? getAccounts(selectedPortfolioId) : [];
  const accounts = useMemo(() => {
    let rows = accountsRaw;
    if (selectedBusinessUnits.length) {
      rows = rows.filter(a => a.businessUnit && selectedBusinessUnits.includes(a.businessUnit));
    }
    if (selectedRegions.length) {
      rows = rows.filter(a => a.region && selectedRegions.includes(a.region));
    }
    return rows;
  }, [accountsRaw, selectedBusinessUnits, selectedRegions]);

  // KPI derivations
  const latestReturn = performance.length ? performance[performance.length - 1].value : 0;
  const prevReturn = performance.length > 1 ? performance[performance.length - 2].value : latestReturn;
  const trendDir = latestReturn > prevReturn ? 'up' : latestReturn < prevReturn ? 'down' : 'flat';
  const trendValue = performance.length > 1 ? `${(latestReturn - prevReturn).toFixed(2)}%` : undefined;

  const weightSum = accountsRaw.reduce((acc, a) => acc + (a.weight || 0), 0);
  const aumBn = (Math.max(1, Math.min(200, 20 + weightSum))) / 10; // 2.0 .. 20.0 range
  const aumDisplay = `$${aumBn.toFixed(1)}B`;

  const avgRisk = accountsRaw.length
    ? accountsRaw.reduce((acc, a) => acc + (a.riskScore || (a.risk === 'Low' ? 2 : a.risk === 'Medium' ? 5 : 8)), 0) / accountsRaw.length
    : 5;
  const riskStr = avgRisk.toFixed(1);

  const drawdown = performance.length
    ? Math.min(0, Math.min(...performance.map(p => p.value)) - Math.max(...performance.map(p => p.value)))
    : -0.0;
  const ddDisplay = `${Math.abs(drawdown).toFixed(1)}%`;

  const sharpeProxy = performance.length ? (latestReturn - 2) / 10 : 0.0;
  const sharpeDisplay = sharpeProxy.toFixed(2);

  const equities = allocation.find(a => a.category === 'Equities')?.percent ?? undefined;
  const equitiesStr = equities != null ? `${equities}% Equity` : undefined;

  const kpis = [
    {
      key: 'aum',
      label: 'Total AUM',
      value: aumDisplay,
      subLabel: equitiesStr,
      trend: { direction: trendDir, value: trendValue },
      accent: 'primary',
    },
    {
      key: 'ytd',
      label: `${timeRange} Return`,
      value: `${latestReturn.toFixed(2)}%`,
      trend: { direction: trendDir, value: trendValue },
      accent: 'secondary',
    },
    {
      key: 'risk',
      label: 'Risk (1-10)',
      value: riskStr,
      subLabel: 'Composite risk score',
      trend: { direction: avgRisk <= 4 ? 'down' : avgRisk >= 7 ? 'up' : 'flat', value: undefined },
      accent: 'primary',
    },
    {
      key: 'sharpe',
      label: 'Sharpe / Drawdown',
      value: `${sharpeDisplay}`,
      subLabel: `DD ${ddDisplay}`,
      trend: { direction: sharpeProxy >= 0 ? 'up' : 'down', value: undefined },
      accent: 'secondary',
    },
  ];

  return (
    <div className="App">
      <Navbar />

      {/* Mobile hamburger for opening drawer (visible on mobile) */}
      <div className="container" style={{ padding: '12px var(--space-4)' }}>
        <button
          type="button"
          className="button"
          aria-label="Open filters sidebar"
          onClick={() => setIsSidebarOpen(true)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 6h18M3 12h12M3 18h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Filters
          <span className="badge" aria-label="Selected filters count">{filtersSummary}</span>
        </button>
      </div>

      <div className="app-layout">
        {/* Desktop sidebar column */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          selectedBusinessUnits={selectedBusinessUnits}
          onToggleBusinessUnit={onToggleBusinessUnit}
          selectedRegions={selectedRegions}
          onToggleRegion={onToggleRegion}
        />

        {/* Main content area */}
        <main>
          <header className="card" style={{ marginBottom: 'var(--space-6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="brand-accent" aria-hidden="true" />
                <div>
                  <h2 style={{ margin: 0 }}>Executive Portfolio Summary</h2>
                  <p className="u-text-muted" style={{ margin: 0, fontSize: 14 }}>
                    Overview of key metrics and performance. {filtersSummary}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="button button-primary"
                onClick={() => setIsSidebarOpen(true)}
                aria-label="Adjust filters"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 6h16M6 12h12M10 18h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Adjust Filters
              </button>
            </div>
          </header>

          {/* FilterBar */}
          <FilterBar
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
            portfolio={portfolio}
            onPortfolioChange={setPortfolio}
            dateFrom={dateRange.from}
            dateTo={dateRange.to}
            onDateChange={(next) => setDateRange({ from: next.from || '', to: next.to || '' })}
            onReset={resetFilters}
            portfolios={portfolios}
          />

          {/* KPI and Charts */}
          <>
            {/* BU-level KPI summary (reflects Business Unit / Region filters) */}
            <BUSummaryCards accounts={accounts} />

            {/* Portfolio-level KPIs */}
            <SummaryCards items={kpis} />
            <PerformanceChart
              title={`${selectedPortfolio?.name || 'Portfolio'} — ${timeRange} Performance`}
              data={performance}
              yLabel="%"
            />
            <div style={{ marginTop: 'var(--space-6)' }}>
              <AllocationChart
                title={`${selectedPortfolio?.name || 'Portfolio'} — Allocation`}
                data={allocation}
              />
            </div>

            {/* Accounts Table */}
            <div style={{ marginTop: 'var(--space-6)' }}>
              <AccountsTable
                accounts={accounts}
                onSelect={(a) => {
                  setSelectedAccount(a);
                  setIsDrillOpen(true);
                }}
                rowsPerPage={10}
              />
            </div>
          </>

          {/* Demo Section */}
          <section className="card">
            <div style={{ display: 'grid', placeItems: 'center', textAlign: 'center', padding: '40px 0' }}>
              <img src={logo} className="App-logo" alt="logo" />
              <p style={{ marginTop: 'var(--space-3)' }}>
                Edit <code>src/App.js</code> and save to reload.
              </p>
              <a
                className="App-link"
                href="https://reactjs.org"
                target="_blank"
                rel="noopener noreferrer"
              >
                Learn React
              </a>
            </div>
          </section>
        </main>
      </div>

      {/* Drilldown slide-over for selected holding */}
      <DrilldownPanel
        isOpen={isDrillOpen}
        account={selectedAccount}
        onClose={() => {
          setIsDrillOpen(false);
          // small delay to clear selection after animation for smoother UX
          setTimeout(() => setSelectedAccount(null), 250);
        }}
      />
    </div>
  );
}

export default App;
