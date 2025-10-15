import React, { useEffect, useState } from 'react';
import '../App.css';

/**
 * PUBLIC_INTERFACE
 * Navbar component displaying app title, search input, notifications, avatar and a theme toggle.
 * - Title: "Executive Portfolio Summary"
 * - Search input: aria-label="Search"
 * - Notification bell icon button: aria-label="Notifications"
 * - Avatar: placeholder circle
 * - Theme toggle: updates document.documentElement.dataset.theme and persists to localStorage
 * - Responsive: collapses/hides secondary controls on small screens
 */
function Navbar() {
  const [theme, setTheme] = useState(() => {
    // Initialize from localStorage or fallback to light
    const saved = typeof window !== 'undefined' ? localStorage.getItem('theme') : null;
    return saved || 'light';
  });

  const [query, setQuery] = useState('');

  // Apply theme to documentElement and persist
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.theme = theme;
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme);
    }
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    // For now, no-op: placeholder for future search integration
  };

  return (
    <nav className="navbar ocean-navbar">
      <div className="navbar-left">
        <div className="brand">
          <span className="brand-accent" aria-hidden="true" />
          <span className="brand-title">Executive Portfolio Summary</span>
        </div>
      </div>

      <div className="navbar-center">
        <form className="search" onSubmit={onSubmit} role="search">
          <span className="search-icon" aria-hidden="true">
            {/* Minimal inline SVG for search icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="M20 20L17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
          <input
            type="search"
            className="search-input"
            placeholder="Search portfolios, metrics..."
            aria-label="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>
      </div>

      <div className="navbar-right">
        <button
          type="button"
          className="icon-btn"
          aria-label="Notifications"
          title="Notifications"
        >
          {/* Minimal inline bell icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 22a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2Z" fill="currentColor" />
            <path d="M18 16v-5a6 6 0 1 0-12 0v5l-2 2h16l-2-2Z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round" />
          </svg>
          <span className="notif-dot" aria-hidden="true"></span>
        </button>

        <button
          type="button"
          className="icon-btn theme-toggle-btn"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {theme === 'light' ? (
            // Moon for light -> dark
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
            </svg>
          ) : (
            // Sun for dark -> light
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <circle cx="12" cy="12" r="5" />
              <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 1v2" />
                <path d="M12 21v2" />
                <path d="M4.22 4.22l1.42 1.42" />
                <path d="M18.36 18.36l1.42 1.42" />
                <path d="M1 12h2" />
                <path d="M21 12h2" />
                <path d="M4.22 19.78l1.42-1.42" />
                <path d="M18.36 5.64l1.42-1.42" />
              </g>
            </svg>
          )}
        </button>

        <div className="avatar" aria-label="User avatar" title="Profile"></div>
      </div>
    </nav>
  );
}

export default Navbar;
