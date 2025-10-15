//
//
// Pure JavaScript mock data module for Executive Portfolio Summary
// Provides realistic mock data for portfolios, performance time series,
// allocation breakdowns, and accounts (refactored from holdings) with helper selector functions.
// No external dependencies.
//
// Domain refactor notes:
// - Sector -> Business Unit (businessUnit)
// - Holdings -> Accounts (accounts)
// - Table metrics -> Success Rate (%) and Risk ('Low'|'Medium'|'High')
//

// Seeded pseudo-random for reproducibility
const rand = (seed => () => {
  // Mulberry32 PRNG
  let t = (seed += 0x6D2B79F5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
})(123456);

/**
 * Utilities to generate plausible performance series
 * We simulate cumulative return (%) paths for different horizons.
 */
const today = new Date();
const cloneDate = (d) => new Date(d.getTime());

function addDays(date, n) {
  const d = cloneDate(date);
  d.setDate(d.getDate() + n);
  return d;
}

function addMonths(date, n) {
  const d = cloneDate(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

// Generate a cumulative performance path given steps and daily/monthly volatility
function generatePath({ steps, stepUnit = "day", drift = 0.08, vol = 0.12, startDate = today }) {
  // drift and vol are annualized; convert to step params
  const stepsPerYear = stepUnit === "day" ? 252 : 12;
  const mu = drift / stepsPerYear;
  const sigma = vol / Math.sqrt(stepsPerYear);

  let cumulative = 0; // percent return
  const backPoints = [];
  for (let i = steps - 1; i >= 0; i--) {
    // Geometric-like step approximation for percent
    const shock = (rand() * 2 - 1) * sigma;
    const r = mu + shock;
    cumulative = (1 + cumulative / 100) * (1 + r) - 1;
    const date = stepUnit === "day" ? addDays(startDate, -i) : addMonths(startDate, -i);
    backPoints.push({
      date: date.toISOString().slice(0, 10),
      value: +(cumulative * 100).toFixed(2), // percent
    });
  }
  // ensure last point is current date (best effort)
  if (backPoints.length) {
    const last = backPoints[backPoints.length - 1];
    last.date = new Date().toISOString().slice(0, 10);
  }
  return backPoints;
}

/**
 * Portfolio definitions
 */
export const portfolios = [
  { id: "global-growth", name: "Global Growth", objective: "Long-term capital appreciation through global equities and selective alternatives" },
  { id: "income-balanced", name: "Income Balanced", objective: "Balanced income and moderate growth via diversified fixed income and dividend equities" },
  { id: "conservative-income", name: "Conservative Income", objective: "Capital preservation and income with high-quality fixed income and cash" },
];

/**
 * Performance by time range for each portfolio.
 * Keys: '1M', '3M', 'YTD', '1Y'
 * Each range contains an array of { date: 'YYYY-MM-DD', value: number } where value is cumulative return percent.
 */
export const performanceByRange = {
  // Global Growth: higher drift/vol
  "global-growth": {
    "1M": generatePath({ steps: 22, stepUnit: "day", drift: 0.12, vol: 0.18, startDate: today }),
    "3M": generatePath({ steps: 66, stepUnit: "day", drift: 0.12, vol: 0.18, startDate: today }),
    "YTD": generatePath({ steps: 12, stepUnit: "month", drift: 0.12, vol: 0.18, startDate: today }),
    "1Y": generatePath({ steps: 12, stepUnit: "month", drift: 0.12, vol: 0.18, startDate: today }),
  },
  // Income Balanced: moderate drift/vol
  "income-balanced": {
    "1M": generatePath({ steps: 22, stepUnit: "day", drift: 0.07, vol: 0.10, startDate: today }),
    "3M": generatePath({ steps: 66, stepUnit: "day", drift: 0.07, vol: 0.10, startDate: today }),
    "YTD": generatePath({ steps: 12, stepUnit: "month", drift: 0.07, vol: 0.10, startDate: today }),
    "1Y": generatePath({ steps: 12, stepUnit: "month", drift: 0.07, vol: 0.10, startDate: today }),
  },
  // Conservative Income: lower drift/vol
  "conservative-income": {
    "1M": generatePath({ steps: 22, stepUnit: "day", drift: 0.04, vol: 0.05, startDate: today }),
    "3M": generatePath({ steps: 66, stepUnit: "day", drift: 0.04, vol: 0.05, startDate: today }),
    "YTD": generatePath({ steps: 12, stepUnit: "month", drift: 0.04, vol: 0.05, startDate: today }),
    "1Y": generatePath({ steps: 12, stepUnit: "month", drift: 0.04, vol: 0.05, startDate: today }),
  },
};

/**
 * Asset allocation breakdowns per portfolio.
 * Each is an array with { category, percent } summing to 100.
 */
export const allocationByPortfolio = {
  "global-growth": [
    { category: "Equities", percent: 72 },
    { category: "Fixed Income", percent: 12 },
    { category: "Alternatives", percent: 12 },
    { category: "Cash", percent: 4 },
  ],
  "income-balanced": [
    { category: "Equities", percent: 45 },
    { category: "Fixed Income", percent: 42 },
    { category: "Alternatives", percent: 8 },
    { category: "Cash", percent: 5 },
  ],
  "conservative-income": [
    { category: "Equities", percent: 18 },
    { category: "Fixed Income", percent: 68 },
    { category: "Alternatives", percent: 4 },
    { category: "Cash", percent: 10 },
  ],
};

/**
 * Accounts per portfolio (refactor of holdings).
 * Fields: {id, name, successRate (0-100), risk ('Low'|'Medium'|'High'), businessUnit, region}
 * We keep some legacy fields (returnPct, weight, riskScore) to support charts and shims.
 */
const BUSINESS_UNITS = [
  "Technology",
  "Healthcare",
  "Finance",
  "Industrial",
  "Consumer",
  "Operations",
  "Sales & Marketing",
  "R&D",
  "Support",
  "Corporate",
];

const REGIONS = [
  "North America",
  "Europe",
  "Asia Pacific",
  "Latin America",
  "Middle East & Africa",
];

function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }
function riskFromScore(score) {
  if (score <= 3) return "Low";
  if (score <= 6) return "Medium";
  return "High";
}

// Helper to create an account row; includes legacy compatible fields not used by table
function mkAccount(id, name, businessUnit, region, base = 0) {
  const r = rand();
  const success = clamp(Math.round(60 + (r - 0.5) * 50 + base), 5, 98);
  const riskScore = clamp(Math.round(5 + (r - 0.5) * 6), 1, 10);
  const risk = riskFromScore(riskScore);
  return {
    id,
    name,
    businessUnit,
    region,
    successRate: success,
    risk,
    // legacy extras (not used by table but kept for charts/compat)
    returnPct: +(success / 10 - 3 + (r - 0.5) * 2).toFixed(2),
    weight: +(Math.abs(10 + (r - 0.5) * 8)).toFixed(2),
    riskScore,
  };
}

// Create diversified account lists per portfolio
function makeGlobalGrowthAccounts() {
  return [
    mkAccount("gg-a1", "Enterprise Cloud Migration", "Technology", "North America", 18),
    mkAccount("gg-a2", "APAC Semiconductor Expansion", "Technology", "Asia Pacific", 12),
    mkAccount("gg-a3", "Digital Customer Platform", "Sales & Marketing", "North America", 14),
    mkAccount("gg-a4", "EHR Integration Program", "Healthcare", "Europe", 6),
    mkAccount("gg-a5", "Open Banking Rollout", "Finance", "Europe", 4),
    mkAccount("gg-a6", "Smart Factory Automation", "Industrial", "North America", 8),
    mkAccount("gg-a7", "E-commerce Revamp", "Sales & Marketing", "North America", 10),
    mkAccount("gg-a8", "Sustainable Packaging", "Operations", "Europe", 2),
    mkAccount("gg-a9", "Renewable Transition", "Operations", "Middle East & Africa", 12),
    mkAccount("gg-a10", "Grid Modernization", "Industrial", "Asia Pacific", 1),
    mkAccount("gg-a11", "Advanced Materials R&D", "R&D", "Latin America", 9),
    mkAccount("gg-a12", "Smart Real Estate Ops", "Operations", "North America", 3),
    mkAccount("gg-a13", "Next-Gen Mobility", "R&D", "Europe", 5),
    mkAccount("gg-a14", "Care Delivery Modernization", "Healthcare", "North America", 4),
    mkAccount("gg-a15", "SaaS Platform Growth", "Technology", "Europe", 16),
    mkAccount("gg-a16", "5G Network Expansion", "Technology", "Asia Pacific", 11),
    mkAccount("gg-a17", "Wealth Mgmt Platform", "Finance", "North America", 2),
    mkAccount("gg-a18", "Sourcing Optimization", "Operations", "Latin America", 7),
    mkAccount("gg-a19", "Logistics Orchestration", "Operations", "Europe", 4),
    mkAccount("gg-a20", "Marketplace Launch", "Sales & Marketing", "Asia Pacific", 12),
  ];
}
function makeIncomeBalancedAccounts() {
  return [
    mkAccount("ib-a1", "Customer Data Lake", "Technology", "North America", 6),
    mkAccount("ib-a2", "EU Health Compliance", "Healthcare", "Europe", 3),
    mkAccount("ib-a3", "Payments Platform Upgrade", "Finance", "Europe", 2),
    mkAccount("ib-a4", "Billing Modernization", "Finance", "North America", 1),
    mkAccount("ib-a5", "Risk Analytics Suite", "Finance", "North America", 2),
    mkAccount("ib-a6", "Airport Ops System", "Industrial", "Asia Pacific", 3),
    mkAccount("ib-a7", "Preferred Customer Portal", "Finance", "North America", 2),
    mkAccount("ib-a8", "Supplier Collaboration", "Operations", "Europe", 1),
    mkAccount("ib-a9", "Pipeline Monitoring", "Industrial", "North America", 5),
    mkAccount("ib-a10", "Energy Mgmt Console", "Industrial", "Europe", 1),
    mkAccount("ib-a11", "Facilities Automation", "Operations", "North America", 1),
    mkAccount("ib-a12", "Telecom OSS Migration", "Technology", "Asia Pacific", 3),
    mkAccount("ib-a13", "LATAM Retail Revamp", "Sales & Marketing", "Latin America", 4),
    mkAccount("ib-a14", "Commodity Trading Desk", "Finance", "Middle East & Africa", 5),
    mkAccount("ib-a15", "Cash Management Tools", "Finance", "North America", 1),
  ];
}
function makeConservativeIncomeAccounts() {
  return [
    mkAccount("ci-a1", "Treasury Ops Digitization", "Finance", "North America", 1),
    mkAccount("ci-a2", "Regulatory Reporting", "Finance", "North America", 2),
    mkAccount("ci-a3", "Credit Risk Engine", "Finance", "North America", 3),
    mkAccount("ci-a4", "Sovereign Analytics", "Finance", "Europe", 2),
    mkAccount("ci-a5", "Municipal Workflow", "Finance", "North America", 1),
    mkAccount("ci-a6", "Cash Reserve Management", "Corporate", "North America", 1),
    mkAccount("ci-a7", "EU Utility Compliance", "Industrial", "Europe", 2),
    mkAccount("ci-a8", "Staples Supply Suite", "Operations", "North America", 2),
    mkAccount("ci-a9", "Care Pathways", "Healthcare", "North America", 3),
    mkAccount("ci-a10", "Covered Call Ops", "Technology", "North America", 3),
    mkAccount("ci-a11", "MBS Monitoring", "Finance", "North America", 2),
    mkAccount("ci-a12", "ABS Processing", "Finance", "North America", 2),
    mkAccount("ci-a13", "Corp Finance Hub", "Finance", "Europe", 2),
    mkAccount("ci-a14", "Infrastructure Control", "Industrial", "Asia Pacific", 3),
    mkAccount("ci-a15", "RE Ops Portal", "Operations", "North America", 2),
  ];
}

export const accountsByPortfolio = {
  "global-growth": makeGlobalGrowthAccounts(),
  "income-balanced": makeIncomeBalancedAccounts(),
  "conservative-income": makeConservativeIncomeAccounts(),
};

/**
 * PUBLIC_INTERFACE
 * getPortfolioById
 * Returns the portfolio object by id or undefined if not found.
 */
// PUBLIC_INTERFACE
export function getPortfolioById(id) {
  /** Returns the portfolio object by id. */
  return portfolios.find((p) => p.id === id);
}

/**
 * PUBLIC_INTERFACE
 * getPerformance
 * Returns an array of time series points for a given portfolio and range.
 * - portfolioId: one of the ids from portfolios
 * - range: '1M' | '3M' | 'YTD' | '1Y'
 * Returns [] if not available.
 */
// PUBLIC_INTERFACE
export function getPerformance(portfolioId, range) {
  /** Returns performance series by portfolio and range. */
  const p = performanceByRange[portfolioId];
  if (!p) return [];
  return Array.isArray(p[range]) ? p[range] : [];
}

/**
 * PUBLIC_INTERFACE
 * getAllocation
 * Returns allocation array [{category, percent}] for a portfolio.
 */
// PUBLIC_INTERFACE
export function getAllocation(portfolioId) {
  /** Returns allocation breakdown for portfolio. */
  return allocationByPortfolio[portfolioId] || [];
}

/**
 * PUBLIC_INTERFACE
 * getAccounts
 * Returns accounts array for a portfolio. Sorted by successRate descending by default.
 * Each account has fields: {id, name, successRate, risk, businessUnit, region, ...legacy}
 */
// PUBLIC_INTERFACE
export function getAccounts(portfolioId) {
  /** Returns accounts for a portfolio, sorted by successRate descending. */
  const rows = accountsByPortfolio[portfolioId] || [];
  return [...rows].sort((a, b) => (b.successRate ?? 0) - (a.successRate ?? 0));
}

/**
 * Backward-compat shim exports (temporary): map old "holdings" API to new accounts model
 * These allow existing imports to function during refactor.
 */
// PUBLIC_INTERFACE
export function getHoldings(portfolioId) {
  /** Shim: returns accounts but under legacy 'holdings' accessor. */
  return getAccounts(portfolioId).map(a => ({
    ...a,
    // provide legacy field names with best-effort mapping
    sector: a.businessUnit,
    riskScore: a.risk === 'Low' ? 2 : a.risk === 'Medium' ? 5 : 8,
    returnPct: a.returnPct ?? (a.successRate ? +(a.successRate / 10 - 3).toFixed(2) : 0),
    weight: a.weight ?? undefined,
  }));
}

// New convenience exports for filters
export const allBusinessUnits = Array.from(new Set(Object.values(accountsByPortfolio).flat().map(a => a.businessUnit))).sort();
export const allRegions = Array.from(new Set(Object.values(accountsByPortfolio).flat().map(a => a.region))).sort();

// Legacy convenience exports (shim)
export const allSectors = allBusinessUnits;
