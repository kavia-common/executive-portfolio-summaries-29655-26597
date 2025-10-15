import React, { useMemo, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import FilterBar from './components/FilterBar';
import SummaryCards from './components/SummaryCards';
import PerformanceChart from './components/PerformanceChart';
import AllocationChart from './components/AllocationChart';
import HoldingsTable from './components/HoldingsTable';
import { portfolios as mockPortfolios, getPerformance, getHoldings, getAllocation } from './data/mockPortfolio';

// PUBLIC_INTERFACE
function App() {
  // Quick filter state (maintained at App level for future data usage)
  const [selectedSectors, setSelectedSectors] = useState([]);
  const [selectedRegions, setSelectedRegions] = useState([]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // FilterBar state
  const [timeRange, setTimeRange] = useState('YTD');
  const [portfolio, setPortfolio] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  // Example portfolios list - in future this can come from API
  // Portfolios list mapped from mock data; include an "All" option for UX
  const portfolios = ['All Portfolios', ...mockPortfolios.map(p => p.name)];

  // PUBLIC_INTERFACE
  const resetFilters = () => {
    setTimeRange('YTD');
    setPortfolio('All Portfolios');
    setDateRange({ from: '', to: '' });
  };

  // Toggle helpers
  // PUBLIC_INTERFACE
  const onToggleSector = (value) => {
    setSelectedSectors((prev) =>
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
    const s = selectedSectors.length ? `${selectedSectors.length} sector(s)` : 'All sectors';
    const r = selectedRegions.length ? `${selectedRegions.length} region(s)` : 'All regions';
    return `${s} • ${r}`;
  }, [selectedSectors, selectedRegions]);

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
          selectedSectors={selectedSectors}
          onToggleSector={onToggleSector}
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

          {/*
            Prepare KPI data from mockPortfolio selectors.
            - Choose the first mock portfolio as default if "All Portfolios" is selected.
          */}
          {(() => {
            const selectedName = portfolio && portfolio !== 'All Portfolios' ? portfolio : mockPortfolios[0]?.name;
            const selected = mockPortfolios.find(p => p.name === selectedName) || mockPortfolios[0];
            const portfolioId = selected?.id;

            // Performance time series for selected range
            const perf = portfolioId ? getPerformance(portfolioId, timeRange) : [];
            const latestReturn = perf.length ? perf[perf.length - 1].value : 0;
            const prevReturn = perf.length > 1 ? perf[perf.length - 2].value : latestReturn;
            const trendDir = latestReturn > prevReturn ? 'up' : latestReturn < prevReturn ? 'down' : 'flat';
            const trendValue = perf.length > 1 ? `${(latestReturn - prevReturn).toFixed(2)}%` : undefined;

            // AUM (mocked using holdings weights as a proxy to construct a number)
            // In real app this would come from API; here we synthesize a stable figure per portfolio
            const holdings = portfolioId ? getHoldings(portfolioId) : [];
            const weightSum = holdings.reduce((acc, h) => acc + (h.weight || 0), 0);
            const aumBn = (Math.max(1, Math.min(200, 20 + weightSum))) / 10; // 2.0 .. 20.0 range
            const aumDisplay = `$${aumBn.toFixed(1)}B`;

            // Risk proxy: simple normalized riskScore average scaled to 1-10
            const avgRisk = holdings.length
              ? holdings.reduce((acc, h) => acc + (h.riskScore || 5), 0) / holdings.length
              : 5;
            const riskStr = avgRisk.toFixed(1);

            // Sharpe/Drawdown proxy: rough heuristic from volatility implied by range variation
            const drawdown = perf.length
              ? Math.min(0, Math.min(...perf.map(p => p.value)) - Math.max(...perf.map(p => p.value))) // negative or zero
              : -0.0;
            const ddDisplay = `${Math.abs(drawdown).toFixed(1)}%`;

            const sharpeProxy = perf.length
              ? (latestReturn - 2) / 10 // arbitrary baseline over "risk"
              : 0.0;
            const sharpeDisplay = sharpeProxy.toFixed(2);

            const allocation = portfolioId ? getAllocation(portfolioId) : [];
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
              <>
                <SummaryCards items={kpis} />
                <PerformanceChart
                  title={`${selected?.name || 'Portfolio'} — ${timeRange} Performance`}
                  data={perf}
                  yLabel="%"
                />
                <div style={{ marginTop: 'var(--space-6)' }}>
                  <AllocationChart
                    title={`${selected?.name || 'Portfolio'} — Allocation`}
                    data={allocation}
                  />
                </div>

                {/* Holdings Table */}
                <div style={{ marginTop: 'var(--space-6)' }}>
                  <HoldingsTable
                    holdings={holdings}
                    onSelect={(h) => {
                      // For now, simply log; could navigate/show drawer with details
                      // eslint-disable-next-line no-console
                      console.log('Selected holding:', h);
                      // Optionally focus UI or open a detail panel in future
                    }}
                    rowsPerPage={10}
                  />
                </div>
              </>
            );
          })()}

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
    </div>
  );
}

export default App;
