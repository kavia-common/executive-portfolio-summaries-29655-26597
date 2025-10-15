import React, { useMemo, useRef, useState } from 'react';
import '../App.css';

/**
 * PUBLIC_INTERFACE
 * PerformanceChart
 * Responsive SVG line chart for portfolio performance over time.
 *
 * Features:
 * - Renders axes and gridlines
 * - Responsive: resizes with container using viewBox and preserveAspectRatio
 * - Supports ranges: 1M, 3M, YTD, 1Y via props.data points
 * - Hover tooltip with date and value
 * - Trend indicator chip (up/down/flat) calculated from last two points (or via prop override)
 * - Ocean Professional theme tokens integration via CSS variables
 *
 * Props:
 * - title?: string - title label shown above chart
 * - data: Array<{ date: string, value: number }> - time series points sorted by date ascending
 * - height?: number - intrinsic height for viewBox (width is 100%)
 * - yLabel?: string - optional y-axis label suffix (default "%")
 * - showTrend?: boolean - whether to show trend chip (default true)
 * - trendOverride?: 'up' | 'down' | 'flat' - optional override for trend direction
 */
function PerformanceChart({
  title = 'Performance',
  data = [],
  height = 280,
  yLabel = '%',
  showTrend = true,
  trendOverride,
}) {
  const margin = { top: 28, right: 20, bottom: 28, left: 44 };
  const width = 720; // intrinsic width for viewBox
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  // Normalize data
  const series = Array.isArray(data) ? data.filter(d => typeof d.value === 'number') : [];

  // Compute domains
  const { xMin, xMax, yMin, yMax, points } = useMemo(() => {
    if (!series.length) {
      return {
        xMin: 0,
        xMax: 1,
        yMin: 0,
        yMax: 1,
        points: [],
      };
    }
    const parse = (d) => new Date(d.date).getTime();
    const xs = series.map(p => parse(p));
    const ys = series.map(p => p.value);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    // Add small padding to Y domain
    const pad = Math.max(0.5, (maxY - minY) * 0.08);
    return {
      xMin: minX,
      xMax: maxX,
      yMin: minY - pad,
      yMax: maxY + pad,
      points: series.map(p => ({ x: parse(p), y: p.value, raw: p })),
    };
  }, [series]);

  const xScale = (x) => {
    if (xMax === xMin) return 0;
    return ((x - xMin) / (xMax - xMin)) * innerW;
  };
  const yScale = (y) => {
    if (yMax === yMin) return innerH;
    return innerH - ((y - yMin) / (yMax - yMin)) * innerH;
  };

  // Build path
  const linePath = useMemo(() => {
    if (!points.length) return '';
    return points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.x).toFixed(2)} ${yScale(p.y).toFixed(2)}`)
      .join(' ');
  }, [points]);

  // Axes ticks
  const xTicks = useMemo(() => {
    const count = 5;
    const out = [];
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const ts = xMin + t * (xMax - xMin);
      out.push(ts);
    }
    return out;
  }, [xMin, xMax]);

  const yTicks = useMemo(() => {
    const count = 5;
    const out = [];
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      out.push(yMin + t * (yMax - yMin));
    }
    return out;
  }, [yMin, yMax]);

  // Tooltip interactivity
  const [hover, setHover] = useState(null);
  const svgRef = useRef(null);

  const onMouseMove = (e) => {
    if (!svgRef.current || !points.length) return;
    const rect = svgRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left - margin.left;
    const clamped = Math.max(0, Math.min(innerW, px));
    // invert x
    const ratio = clamped / innerW;
    const ts = xMin + ratio * (xMax - xMin);
    // find nearest point by x
    let nearest = points[0];
    let best = Math.abs(points[0].x - ts);
    for (let i = 1; i < points.length; i++) {
      const d = Math.abs(points[i].x - ts);
      if (d < best) {
        best = d;
        nearest = points[i];
      }
    }
    setHover({
      x: xScale(nearest.x),
      y: yScale(nearest.y),
      raw: nearest.raw,
      value: nearest.y,
    });
  };

  const onLeave = () => setHover(null);

  // Trend indicator
  const trendDir = useMemo(() => {
    if (trendOverride) return trendOverride;
    if (points.length < 2) return 'flat';
    const a = points[points.length - 2].y;
    const b = points[points.length - 1].y;
    if (b > a) return 'up';
    if (b < a) return 'down';
    return 'flat';
  }, [points, trendOverride]);

  const latestVal = points.length ? points[points.length - 1].y : 0;
  const penultVal = points.length > 1 ? points[points.length - 2].y : latestVal;
  const delta = latestVal - penultVal;
  const deltaStr = `${delta >= 0 ? '+' : ''}${delta.toFixed(2)}${yLabel}`;

  // Formatters
  const fmtDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' });
  };
  const fmtTick = (v) => `${v.toFixed(0)}${yLabel}`;

  return (
    <section className="card performance-card" role="region" aria-label={`${title} chart`}>
      <header className="chart-header">
        <div className="chart-title">
          <span className="brand-accent" aria-hidden="true" />
          <h3>{title}</h3>
        </div>
        {showTrend && (
          <div
            className={`kpi-trend ${trendDir === 'up' ? 'trend-up' : ''} ${trendDir === 'down' ? 'trend-down' : ''} ${trendDir === 'flat' ? 'trend-flat' : ''}`}
            aria-label={`Trend ${trendDir} ${deltaStr}`}
          >
            <span className="kpi-trend-icon" aria-hidden="true">
              {trendDir === 'up' && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M4 14l6-6 4 4 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M14 6h6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {trendDir === 'down' && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M4 10l6 6 4-4 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M14 18h6v-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {trendDir === 'flat' && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M4 12h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
            </span>
            <span className="kpi-trend-value">{deltaStr}</span>
          </div>
        )}
      </header>

      <div className="chart-root">
        <svg
          className="chart-svg"
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={`${title} over time`}
          onMouseMove={onMouseMove}
          onMouseLeave={onLeave}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="areaFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Plot area */}
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {/* Gridlines */}
            {yTicks.map((yt, i) => (
              <line
                key={`y-${i}`}
                x1={0}
                x2={innerW}
                y1={yScale(yt)}
                y2={yScale(yt)}
                className="chart-grid"
              />
            ))}
            {xTicks.map((xt, i) => (
              <line
                key={`x-${i}`}
                x1={xScale(xt)}
                x2={xScale(xt)}
                y1={0}
                y2={innerH}
                className="chart-grid chart-grid-vert"
              />
            ))}

            {/* Axes */}
            <line x1={0} x2={innerW} y1={innerH} y2={innerH} className="chart-axis" />
            <line x1={0} x2={0} y1={0} y2={innerH} className="chart-axis" />

            {/* Y ticks labels */}
            {yTicks.map((yt, i) => (
              <text
                key={`yt-${i}`}
                x={-10}
                y={yScale(yt)}
                className="chart-tick"
                textAnchor="end"
                dominantBaseline="middle"
              >
                {fmtTick(yt)}
              </text>
            ))}

            {/* X ticks labels */}
            {xTicks.map((xt, i) => (
              <text
                key={`xt-${i}`}
                x={xScale(xt)}
                y={innerH + 18}
                className="chart-tick"
                textAnchor={i === 0 ? 'start' : i === xTicks.length - 1 ? 'end' : 'middle'}
              >
                {new Date(xt).toLocaleDateString(undefined, { month: 'short', day: '2-digit' })}
              </text>
            ))}

            {/* Area under line */}
            {points.length > 0 && (
              <path
                d={`${linePath} L ${xScale(points[points.length - 1].x)} ${innerH} L ${xScale(points[0].x)} ${innerH} Z`}
                fill="url(#areaFill)"
                stroke="none"
              />
            )}

            {/* Line path */}
            <path d={linePath} className="chart-line" fill="none" />

            {/* Hover elements */}
            {hover && (
              <g className="chart-hover">
                <line
                  x1={hover.x}
                  x2={hover.x}
                  y1={0}
                  y2={innerH}
                  className="chart-hover-line"
                />
                <circle cx={hover.x} cy={hover.y} r="4" className="chart-hover-dot" />
              </g>
            )}
          </g>
        </svg>

        {/* Tooltip */}
        {hover && (
          <div className="chart-tooltip" role="status" aria-live="polite" style={{ left: `calc(${((hover.x + margin.left) / width) * 100}% + 8px)` }}>
            <div className="tooltip-date">{fmtDate(hover.raw?.date)}</div>
            <div className="tooltip-value">
              <strong>{hover.value.toFixed(2)}{yLabel}</strong>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!points.length && (
          <div className="chart-empty u-text-muted">
            No data available for the selected range.
          </div>
        )}
      </div>
    </section>
  );
}

export default PerformanceChart;
