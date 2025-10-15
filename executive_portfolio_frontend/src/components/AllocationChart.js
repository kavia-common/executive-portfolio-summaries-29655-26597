import React, { useEffect, useMemo, useRef, useState } from 'react';
import '../App.css';

/**
 * PUBLIC_INTERFACE
 * AllocationChart
 * Donut chart displaying portfolio allocation by category using animated SVG arcs.
 *
 * Features:
 * - Animated arc drawing on mount/update
 * - Responsive using viewBox (width: 100%)
 * - Legend with category color and percentage
 * - Accessible: role="img", aria-label, titles, focusable segments
 * - Ocean Professional theming via CSS variables
 *
 * Props:
 * - title?: string
 * - data: Array<{ category: string, percent: number }>
 * - size?: number (intrinsic SVG size; scales with container)
 * - thickness?: number (donut ring thickness)
 */
function AllocationChart({
  title = 'Allocation',
  data = [],
  size = 240,
  thickness = 26,
}) {
  // Normalize and validate data
  const cleaned = useMemo(() => {
    const arr = Array.isArray(data) ? data.filter(d => d && typeof d.percent === 'number' && d.percent > 0) : [];
    const total = arr.reduce((acc, d) => acc + d.percent, 0) || 1;
    // ensure sum ~= 100, normalize safely
    return arr.map(d => ({ ...d, percent: (d.percent / total) * 100 }));
  }, [data]);

  const radius = (size / 2) - 8; // small padding for stroke round caps
  const innerRadius = radius - thickness;
  const center = { x: size / 2, y: size / 2 };
  const circumference = 2 * Math.PI * ((radius + innerRadius) / 2); // for animation baseline

  // Color palette aligned to Ocean Professional
  const colors = useMemo(() => {
    const palette = [
      'var(--color-primary)',
      'var(--color-secondary)',
      '#10B981', // emerald
      '#6366F1', // indigo
      '#EC4899', // pink
      '#F97316', // orange
      '#14B8A6', // teal
    ];
    return cleaned.map((_, i) => palette[i % palette.length]);
  }, [cleaned]);

  // Generate arc path for donut segment using SVG arc command
  const toArc = (cx, cy, rOuter, rInner, startAngle, endAngle) => {
    const degToRad = (deg) => (deg - 90) * (Math.PI / 180); // start from 12 o'clock
    const sa = degToRad(startAngle);
    const ea = degToRad(endAngle);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    const x0 = cx + rOuter * Math.cos(sa);
    const y0 = cy + rOuter * Math.sin(sa);
    const x1 = cx + rOuter * Math.cos(ea);
    const y1 = cy + rOuter * Math.sin(ea);

    const x2 = cx + rInner * Math.cos(ea);
    const y2 = cy + rInner * Math.sin(ea);
    const x3 = cx + rInner * Math.cos(sa);
    const y3 = cy + rInner * Math.sin(sa);

    return [
      `M ${x0.toFixed(3)} ${y0.toFixed(3)}`,
      `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x1.toFixed(3)} ${y1.toFixed(3)}`,
      `L ${x2.toFixed(3)} ${y2.toFixed(3)}`,
      `A ${rInner} ${rInner} 0 ${largeArc} 0 ${x3.toFixed(3)} ${y3.toFixed(3)}`,
      'Z',
    ].join(' ');
  };

  // Compute segments
  const segments = useMemo(() => {
    let acc = 0;
    return cleaned.map((d, i) => {
      const angle = (d.percent / 100) * 360;
      const start = acc;
      const end = acc + angle;
      acc = end;
      return {
        ...d,
        start,
        end,
        color: colors[i],
        path: toArc(center.x, center.y, radius, innerRadius, start, end),
      };
    });
  }, [cleaned, center.x, center.y, radius, innerRadius, colors]);

  // Animation state: progress 0..1
  const [progress, setProgress] = useState(0);
  const reqRef = useRef(null);
  const startRef = useRef(null);
  const duration = 650; // ms

  useEffect(() => {
    // restart animation on data change
    cancelAnimationFrame(reqRef.current);
    startRef.current = null;
    setProgress(0);

    const step = (ts) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const p = Math.min(1, elapsed / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - p, 3);
      setProgress(eased);
      if (p < 1) {
        reqRef.current = requestAnimationFrame(step);
      }
    };
    reqRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(reqRef.current);
  }, [data]); // restart when incoming data changes

  // Compute a partially drawn path by trimming the end angle based on progress
  const partialPath = (seg) => {
    const end = seg.start + (seg.end - seg.start) * progress;
    return toArc(center.x, center.y, radius, innerRadius, seg.start, end);
    // For accessibility, we keep full hitbox by rendering an invisible full path below
  };

  const totalPct = cleaned.reduce((a, b) => a + b.percent, 0).toFixed(0);

  // Center label values
  const largest = useMemo(() => cleaned.slice().sort((a, b) => b.percent - a.percent)[0], [cleaned]);
  const centerLabel = largest ? largest.category : 'Allocation';
  const centerValue = largest ? `${largest.percent.toFixed(0)}%` : '—';

  return (
    <section className="card allocation-card" role="region" aria-label={`${title} donut chart`}>
      <header className="chart-header">
        <div className="chart-title">
          <span className="brand-accent" aria-hidden="true" />
          <h3>{title}</h3>
        </div>
        <span className="badge" aria-label={`Total categories ${cleaned.length}`}>
          {cleaned.length} Categories
        </span>
      </header>

      <div className="allocation-root">
        <svg
          className="allocation-svg"
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label={`${title} by category, total ${totalPct}%`}
          preserveAspectRatio="xMidYMid meet"
        >
          <title>{`${title} — ${totalPct}%`}</title>

          {/* Background subtle ring */}
          <circle
            cx={center.x}
            cy={center.y}
            r={(radius + innerRadius) / 2}
            fill="none"
            stroke="color-mix(in oklab, var(--color-primary) 8%, var(--border-color))"
            strokeWidth={thickness}
            opacity="0.35"
          />

          {/* Segments */}
          {segments.map((seg, i) => (
            <g key={seg.category}>
              {/* Full path invisible for focus ring/hitbox */}
              <path
                d={seg.path}
                fill="transparent"
                tabIndex={0}
                aria-label={`${seg.category} ${seg.percent.toFixed(0)} percent`}
                className="allocation-seg-hitbox"
              >
                <title>{`${seg.category}: ${seg.percent.toFixed(1)}%`}</title>
              </path>

              {/* Animated visible path */}
              <path
                d={partialPath(seg)}
                fill={seg.color}
                className="allocation-seg"
                style={{ filter: 'drop-shadow(0 1px 0 color-mix(in oklab, var(--color-primary) 20%, transparent))' }}
              />
            </g>
          ))}

          {/* Center label */}
          <g className="allocation-center" aria-hidden="true">
            <circle cx={center.x} cy={center.y} r={innerRadius - 8} fill="var(--card-bg)" />
            <text
              x={center.x}
              y={center.y - 4}
              textAnchor="middle"
              className="allocation-center-value"
            >
              {centerValue}
            </text>
            <text
              x={center.x}
              y={center.y + 16}
              textAnchor="middle"
              className="allocation-center-label"
            >
              {centerLabel}
            </text>
          </g>
        </svg>

        {/* Legend */}
        <div className="allocation-legend" role="list" aria-label="Allocation legend">
          {segments.map((seg, i) => (
            <div role="listitem" className="allocation-legend-item" key={`lg-${seg.category}`}>
              <span className="allocation-legend-swatch" style={{ background: seg.color }} aria-hidden="true" />
              <div className="allocation-legend-text">
                <div className="allocation-legend-name">{seg.category}</div>
                <div className="allocation-legend-pct u-text-muted">{seg.percent.toFixed(0)}%</div>
              </div>
            </div>
          ))}
          {!segments.length && (
            <div className="u-text-muted">No allocation data.</div>
          )}
        </div>
      </div>
    </section>
  );
}

export default AllocationChart;
