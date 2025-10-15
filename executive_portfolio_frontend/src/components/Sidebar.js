import React, { useEffect, useRef } from 'react';
import '../App.css';

/**
 * PUBLIC_INTERFACE
 * Sidebar component with navigation and quick filters.
 *
 * Props:
 * - isOpen: boolean to control mobile drawer state
 * - onClose: function called when closing the drawer (overlay click, Esc, close button)
 * - selectedSectors: array of selected sector values
 * - onToggleSector: function(value: string) to toggle sector selection
 * - selectedRegions: array of selected region values
 * - onToggleRegion: function(value: string) to toggle region selection
 *
 * Accessibility:
 * - Uses aria-labels for controls, focus trapping for mobile drawer, and closes on Esc
 * - Overlay has role="presentation"
 */
function Sidebar({
  isOpen = false,
  onClose = () => {},
  selectedSectors = [],
  onToggleSector = () => {},
  selectedRegions = [],
  onToggleRegion = () => {},
}) {
  const drawerRef = useRef(null);

  // Close on Esc when open
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
      // Basic focus trap when open on mobile
      if (isOpen && e.key === 'Tab' && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!first || !last) return;
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
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const sectors = ['Technology', 'Healthcare', 'Finance', 'Industrial', 'Energy'];
  const regions = ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East & Africa'];

  const clearSectors = () => sectors.forEach((s) => selectedSectors.includes(s) && onToggleSector(s));
  const clearRegions = () => regions.forEach((r) => selectedRegions.includes(r) && onToggleRegion(r));

  const NavItem = ({ icon, label, href = '#', ariaLabel }) => (
    <a className="side-nav-item" href={href} aria-label={ariaLabel || label}>
      <span className="side-nav-icon" aria-hidden="true">{icon}</span>
      <span className="side-nav-label">{label}</span>
    </a>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sidebar" aria-label="Sidebar navigation and filters">
        <div className="sidebar-inner">
          <nav className="side-nav" aria-label="Primary">
            <div className="side-section-title">Navigation</div>
            <NavItem
              label="Dashboard"
              ariaLabel="Go to Dashboard"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M3 11h8V3H3v8zM13 21h8v-8h-8v8zM3 21h8v-6H3v6zM13 3v6h8V3h-8z" fill="currentColor"/>
                </svg>
              }
            />
            <NavItem
              label="Portfolios"
              ariaLabel="Go to Portfolios"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M3 7h18M3 12h18M3 17h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              }
            />
          </nav>

          <div className="side-divider" role="separator" aria-hidden="true"></div>

          <section className="filter-section" aria-labelledby="sector-filter-title">
            <div className="filter-header">
              <h3 id="sector-filter-title" className="filter-title">Sector</h3>
              <button
                type="button"
                className="filter-clear"
                onClick={clearSectors}
                aria-label="Clear all sector filters"
              >
                Clear
              </button>
            </div>
            <ul className="filter-list">
              {sectors.map((s) => {
                const id = `sector-${s.replace(/\s+/g, '-').toLowerCase()}`;
                const checked = selectedSectors.includes(s);
                return (
                  <li key={s} className="filter-item">
                    <label htmlFor={id} className="filter-label">
                      <input
                        id={id}
                        type="checkbox"
                        className="filter-checkbox"
                        checked={checked}
                        onChange={() => onToggleSector(s)}
                        aria-checked={checked}
                        aria-label={s}
                      />
                      <span>{s}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="filter-section" aria-labelledby="region-filter-title">
            <div className="filter-header">
              <h3 id="region-filter-title" className="filter-title">Region</h3>
              <button
                type="button"
                className="filter-clear"
                onClick={clearRegions}
                aria-label="Clear all region filters"
              >
                Clear
              </button>
            </div>
            <ul className="filter-list">
              {regions.map((r) => {
                const id = `region-${r.replace(/\s+/g, '-').toLowerCase()}`;
                const checked = selectedRegions.includes(r);
                return (
                  <li key={r} className="filter-item">
                    <label htmlFor={id} className="filter-label">
                      <input
                        id={id}
                        type="checkbox"
                        className="filter-checkbox"
                        checked={checked}
                        onChange={() => onToggleRegion(r)}
                        aria-checked={checked}
                        aria-label={r}
                      />
                      <span>{r}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </aside>

      {/* Mobile drawer + overlay */}
      <div
        className={`sidebar-overlay ${isOpen ? 'show' : ''}`}
        role="presentation"
        aria-hidden={!isOpen}
        onClick={onClose}
      />
      <aside
        className={`sidebar-drawer ${isOpen ? 'open' : ''}`}
        aria-label="Mobile sidebar navigation and filters"
        aria-modal="true"
        ref={drawerRef}
      >
        <div className="drawer-header">
          <div className="brand">
            <span className="brand-accent" aria-hidden="true" />
            <span className="brand-title">Filters</span>
          </div>
          <button
            type="button"
            className="icon-btn"
            aria-label="Close sidebar"
            onClick={onClose}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <div className="sidebar-inner">
          <nav className="side-nav" aria-label="Primary (mobile)">
            <div className="side-section-title">Navigation</div>
            <NavItem
              label="Dashboard"
              ariaLabel="Go to Dashboard"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M3 11h8V3H3v8zM13 21h8v-8h-8v8zM3 21h8v-6H3v6zM13 3v6h8V3h-8z" fill="currentColor"/>
                </svg>
              }
            />
            <NavItem
              label="Portfolios"
              ariaLabel="Go to Portfolios"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M3 7h18M3 12h18M3 17h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              }
            />
          </nav>

          <div className="side-divider" role="separator" aria-hidden="true"></div>

          <section className="filter-section" aria-labelledby="sector-filter-title-mobile">
            <div className="filter-header">
              <h3 id="sector-filter-title-mobile" className="filter-title">Sector</h3>
              <button
                type="button"
                className="filter-clear"
                onClick={clearSectors}
                aria-label="Clear all sector filters"
              >
                Clear
              </button>
            </div>
            <ul className="filter-list">
              {sectors.map((s) => {
                const id = `m-sector-${s.replace(/\s+/g, '-').toLowerCase()}`;
                const checked = selectedSectors.includes(s);
                return (
                  <li key={s} className="filter-item">
                    <label htmlFor={id} className="filter-label">
                      <input
                        id={id}
                        type="checkbox"
                        className="filter-checkbox"
                        checked={checked}
                        onChange={() => onToggleSector(s)}
                        aria-checked={checked}
                        aria-label={s}
                      />
                      <span>{s}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="filter-section" aria-labelledby="region-filter-title-mobile">
            <div className="filter-header">
              <h3 id="region-filter-title-mobile" className="filter-title">Region</h3>
              <button
                type="button"
                className="filter-clear"
                onClick={clearRegions}
                aria-label="Clear all region filters"
              >
                Clear
              </button>
            </div>
            <ul className="filter-list">
              {regions.map((r) => {
                const id = `m-region-${r.replace(/\s+/g, '-').toLowerCase()}`;
                const checked = selectedRegions.includes(r);
                return (
                  <li key={r} className="filter-item">
                    <label htmlFor={id} className="filter-label">
                      <input
                        id={id}
                        type="checkbox"
                        className="filter-checkbox"
                        checked={checked}
                        onChange={() => onToggleRegion(r)}
                        aria-checked={checked}
                        aria-label={r}
                      />
                      <span>{r}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
