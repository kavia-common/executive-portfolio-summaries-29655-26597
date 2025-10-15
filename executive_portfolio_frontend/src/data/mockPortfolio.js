//
// Pure JavaScript mock data module for Executive Portfolio Summary
// Provides realistic mock data for portfolios, performance time series,
// allocation breakdowns, and holdings with helper selector functions.
// No external dependencies.
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

  const points = [];
  let cumulative = 0; // percent return
  let d = cloneDate(startDate);

  // We generate backwards then reverse so the last point is 'today'
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
 * Holdings per portfolio.
 * Fields: {id, name, ticker, weight, returnPct, sector, region, riskScore}
 * 15-24 rows per portfolio, diversified sectors/regions.
 */
const SECTORS = [
  "Technology",
  "Healthcare",
  "Finance",
  "Industrial",
  "Consumer Discretionary",
  "Consumer Staples",
  "Energy",
  "Utilities",
  "Materials",
  "Real Estate",
  "Communication Services",
];

const REGIONS = [
  "North America",
  "Europe",
  "Asia Pacific",
  "Latin America",
  "Middle East & Africa",
];

function mkHolding(id, name, ticker, weight, sector, region, returnPct, riskScore) {
  return { id, name, ticker, weight: +weight.toFixed(2), returnPct: +returnPct.toFixed(2), sector, region, riskScore: Math.max(1, Math.min(10, Math.round(riskScore))) };
}

// Helpers to create diverse holdings
function makeGlobalGrowthHoldings() {
  const rows = [
    mkHolding("gg-1", "Apex Technologies Inc.", "APXT", 4.8, "Technology", "North America", 12.5, 8),
    mkHolding("gg-2", "BlueWave Semiconductor", "BWSC", 4.2, "Technology", "Asia Pacific", 9.1, 8),
    mkHolding("gg-3", "NovaCloud Services", "NVCS", 3.9, "Communication Services", "North America", 11.4, 7),
    mkHolding("gg-4", "Quantix Pharma", "QPHM", 3.5, "Healthcare", "Europe", 6.2, 6),
    mkHolding("gg-5", "Global Bank Group", "GBG", 3.2, "Finance", "Europe", 4.0, 6),
    mkHolding("gg-6", "Pioneer Industrials", "PIND", 3.0, "Industrial", "North America", 5.5, 5),
    mkHolding("gg-7", "Horizon Retail", "HZRT", 2.9, "Consumer Discretionary", "North America", 7.0, 6),
    mkHolding("gg-8", "GreenLeaf Foods", "GLFD", 2.6, "Consumer Staples", "Europe", 3.2, 4),
    mkHolding("gg-9", "Terra Energy Corp", "TENC", 2.5, "Energy", "Middle East & Africa", 8.7, 7),
    mkHolding("gg-10", "Pacific Utilities", "PCUT", 2.3, "Utilities", "Asia Pacific", 2.1, 3),
    mkHolding("gg-11", "Allied Materials", "ALMT", 2.1, "Materials", "Latin America", 6.8, 6),
    mkHolding("gg-12", "Metro Real Estate REIT", "MRET", 2.0, "Real Estate", "North America", 2.6, 4),
    mkHolding("gg-13", "Vertex Automotive", "VTAU", 1.9, "Consumer Discretionary", "Europe", 5.0, 6),
    mkHolding("gg-14", "Zenith Health Systems", "ZNHS", 1.8, "Healthcare", "North America", 4.4, 5),
    mkHolding("gg-15", "Omega Software Ltd.", "OMSW", 1.7, "Technology", "Europe", 10.2, 8),
    mkHolding("gg-16", "Aurora Networks", "AUNW", 1.6, "Communication Services", "Asia Pacific", 7.9, 7),
    mkHolding("gg-17", "Summit Financial", "SUMF", 1.5, "Finance", "North America", 3.1, 5),
    mkHolding("gg-18", "Atlas Mining", "ATMN", 1.4, "Materials", "Latin America", 6.5, 6),
    mkHolding("gg-19", "Seaboard Logistics", "SBLG", 1.3, "Industrial", "Europe", 4.8, 5),
    mkHolding("gg-20", "Orbital E-Commerce", "ORBC", 1.2, "Consumer Discretionary", "Asia Pacific", 9.3, 7),
  ];
  // Normalize weights to sum to ~72% (aligning with equities weight) but we keep absolute numbers reasonable
  // For simplicity we let sum be around 50-70%; weight field is just per-holding weight of portfolio total
  return rows;
}

function makeIncomeBalancedHoldings() {
  const rows = [
    mkHolding("ib-1", "Dividend Tech Leaders ETF", "DTLF", 4.0, "Technology", "North America", 5.6, 5),
    mkHolding("ib-2", "Global Healthcare Dividend", "GHCD", 3.6, "Healthcare", "Europe", 4.3, 4),
    mkHolding("ib-3", "International Financials", "IFIN", 3.2, "Finance", "Europe", 3.1, 4),
    mkHolding("ib-4", "Core US Aggregate Bond", "USAG", 6.5, "Finance", "North America", 2.2, 3),
    mkHolding("ib-5", "Investment Grade Corp Bond", "IGCB", 5.8, "Finance", "North America", 2.8, 3),
    mkHolding("ib-6", "Global Infrastructure", "GINF", 3.0, "Industrial", "Asia Pacific", 3.4, 4),
    mkHolding("ib-7", "Preferred Securities Fund", "PRSF", 2.8, "Finance", "North America", 2.9, 3),
    mkHolding("ib-8", "Stable Consumer Staples", "STCS", 2.4, "Consumer Staples", "Europe", 2.1, 3),
    mkHolding("ib-9", "Energy Pipeline Partners", "ENPP", 2.0, "Energy", "North America", 4.6, 5),
    mkHolding("ib-10", "Utilities Dividend Growth", "UDVG", 2.2, "Utilities", "Europe", 2.0, 2),
    mkHolding("ib-11", "REIT Income Trust", "RITX", 2.0, "Real Estate", "North America", 1.7, 3),
    mkHolding("ib-12", "Asia Pacific Telecom", "APTC", 1.8, "Communication Services", "Asia Pacific", 3.3, 4),
    mkHolding("ib-13", "Latin Consumer Basket", "LACB", 1.4, "Consumer Discretionary", "Latin America", 3.8, 5),
    mkHolding("ib-14", "Commodities Sleeve", "CMDS", 1.2, "Materials", "Middle East & Africa", 4.2, 5),
    mkHolding("ib-15", "Short-Term Treasury", "STTR", 4.5, "Finance", "North America", 1.2, 1),
  ];
  return rows;
}

function makeConservativeIncomeHoldings() {
  const rows = [
    mkHolding("ci-1", "US Treasury 1-3 Yr", "UST13", 10.0, "Finance", "North America", 1.1, 1),
    mkHolding("ci-2", "US Treasury 3-7 Yr", "UST37", 9.0, "Finance", "North America", 1.4, 1),
    mkHolding("ci-3", "Investment Grade Corp", "IGCR", 8.0, "Finance", "North America", 1.8, 2),
    mkHolding("ci-4", "International Sovereign", "INSG", 7.0, "Finance", "Europe", 1.5, 2),
    mkHolding("ci-5", "Short-Term Municipal", "STMN", 6.0, "Finance", "North America", 1.2, 1),
    mkHolding("ci-6", "Cash Reserve", "CASH", 8.0, "Finance", "North America", 0.5, 1),
    mkHolding("ci-7", "Defensive Utilities", "DFUT", 3.0, "Utilities", "Europe", 1.6, 2),
    mkHolding("ci-8", "Staples Dividend", "STPD", 3.0, "Consumer Staples", "North America", 1.9, 2),
    mkHolding("ci-9", "Healthcare Defensive", "HCDF", 2.5, "Healthcare", "North America", 2.2, 3),
    mkHolding("ci-10", "Covered Call Equity", "CVCE", 2.0, "Technology", "North America", 2.6, 3),
    mkHolding("ci-11", "Mortgage-Backed Sec.", "MBSX", 5.5, "Finance", "North America", 1.4, 2),
    mkHolding("ci-12", "Asset-Backed Sec.", "ABSX", 4.5, "Finance", "North America", 1.3, 2),
    mkHolding("ci-13", "High-Quality Corp", "HQCR", 6.5, "Finance", "Europe", 1.7, 2),
    mkHolding("ci-14", "Global Infrastructure", "GINF", 2.0, "Industrial", "Asia Pacific", 1.8, 3),
    mkHolding("ci-15", "REIT Core", "RETC", 2.0, "Real Estate", "North America", 1.1, 2),
  ];
  return rows;
}

export const holdingsByPortfolio = {
  "global-growth": makeGlobalGrowthHoldings(),
  "income-balanced": makeIncomeBalancedHoldings(),
  "conservative-income": makeConservativeIncomeHoldings(),
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
 * getHoldings
 * Returns holdings array for a portfolio. Sorted by weight descending by default.
 * Each holding has fields: {id, name, ticker, weight, returnPct, sector, region, riskScore}
 */
// PUBLIC_INTERFACE
export function getHoldings(portfolioId) {
  /** Returns holdings for a portfolio, sorted by weight descending. */
  const rows = holdingsByPortfolio[portfolioId] || [];
  return [...rows].sort((a, b) => b.weight - a.weight);
}

// Convenience exports for filters
export const allSectors = Array.from(new Set(Object.values(holdingsByPortfolio).flat().map(h => h.sector))).sort();
export const allRegions = Array.from(new Set(Object.values(holdingsByPortfolio).flat().map(h => h.region))).sort();
