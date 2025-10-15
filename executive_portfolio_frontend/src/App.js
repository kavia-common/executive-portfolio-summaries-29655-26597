import React, { useMemo, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// PUBLIC_INTERFACE
function App() {
  // Quick filter state (maintained at App level for future data usage)
  const [selectedSectors, setSelectedSectors] = useState([]);
  const [selectedRegions, setSelectedRegions] = useState([]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
