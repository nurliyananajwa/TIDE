import type { FunnelRow } from "@/lib/analysis";
import { fmt, pct, shortDate } from "@/lib/format";
import type { DayPoint, Segment } from "@/lib/view";

// All charts draw from the numbers they are given: every length, height and position is to scale.

function niceStep(max: number, ticks = 4) {
  const raw = max / ticks;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw)!;
  return step;
}

/** Daily visitors as a line, with a y-axis, dated x-axis and the peak day labelled. */
export function LineChart({ points, label }: { points: DayPoint[]; label: string }) {
  const W = 720, H = 260, left = 48, right = 16, top = 24, bottom = 34;
  const max = Math.max(...points.map((p) => p.visitors));
  const step = niceStep(max);
  const yMax = Math.ceil(max / step) * step;
  const x = (i: number) => left + (i / Math.max(1, points.length - 1)) * (W - left - right);
  const y = (v: number) => top + (1 - v / yMax) * (H - top - bottom);
  const line = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p.visitors).toFixed(1)}`).join("");
  const area = `${line}L${x(points.length - 1)} ${y(0)}L${x(0)} ${y(0)}Z`;
  const ticks = Array.from({ length: yMax / step + 1 }, (_, i) => i * step);
  const every = points.length > 45 ? 14 : 7;
  const peakIndex = points.reduce((best, p, i) => (p.visitors > points[best].visitors ? i : best), 0);
  const peak = points[peakIndex];
  const peakRight = x(peakIndex) > W - 150;
  return (
    <div className="tc-chart-scroll">
      <svg className="tc-line" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
        <defs>
          <linearGradient id="tc-area" x1="0" y1="0" x2="0" y2="1"><stop stopColor="var(--tc-accent)" stopOpacity=".35" /><stop offset="1" stopColor="var(--tc-accent)" stopOpacity="0" /></linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={left} x2={W - right} y1={y(t)} y2={y(t)} className="tc-gridline" />
            <text x={left - 8} y={y(t) + 4} textAnchor="end" className="tc-axis">{fmt(t)}</text>
          </g>
        ))}
        {points.map((p, i) => i % every === 0 && (
          <text key={p.date} x={x(i)} y={H - 10} textAnchor={i === 0 ? "start" : "middle"} className="tc-axis">{shortDate(p.date)}</text>
        ))}
        <path d={area} fill="url(#tc-area)" />
        <path d={line} fill="none" stroke="var(--tc-accent)" strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx={x(peakIndex)} cy={y(peak.visitors)} r="5" fill="var(--tc-sand)" stroke="var(--tc-card)" strokeWidth="2" />
        <text x={x(peakIndex) + (peakRight ? -10 : 10)} y={y(peak.visitors) - 8} textAnchor={peakRight ? "end" : "start"} className="tc-annotation">
          Peak: {fmt(peak.visitors)} on {shortDate(peak.date)}
        </text>
        {points.map((p, i) => (
          <rect key={p.date} x={x(i) - (W - left - right) / points.length / 2} y={top} width={(W - left - right) / points.length} height={H - top - bottom} fill="transparent">
            <title>{`${shortDate(p.date)}: ${fmt(p.visitors)} visitors`}</title>
          </rect>
        ))}
      </svg>
    </div>
  );
}

/** Horizontal bars: one row per segment, bar length = share of visitors. */
export function BarList({ rows, valueLabel = "visitors" }: { rows: Segment[]; valueLabel?: string }) {
  const max = Math.max(...rows.map((r) => r.share));
  return (
    <ul className="tc-bars">
      {rows.map((r) => (
        <li key={r.name}>
          <span className="tc-bars-name">{r.name}</span>
          <span className="tc-bars-track"><i style={{ width: `${(r.share / max) * 100}%` }} /></span>
          <span className="tc-bars-value">{fmt(r.visitors)} <small>{valueLabel} · {pct(r.share, 0)}</small></span>
        </li>
      ))}
    </ul>
  );
}

/** Funnel: bar width = people at that step (relative to the first step), with the loss between steps. */
export function Funnel({ rows, compact = false }: { rows: FunnelRow[]; compact?: boolean }) {
  return (
    <ol className={`tc-funnel ${compact ? "is-compact" : ""}`}>
      {rows.map((r) => (
        <li key={r.name}>
          {r.continueRate !== null && r.lost !== null && (
            <div className={`tc-funnel-loss ${r.isBiggestLoss ? "is-biggest" : ""} ${r.isWeakest ? "is-weakest" : ""}`}>
              <span>↓ {pct(r.continueRate, 0)} continue · {fmt(r.lost)} people left</span>
              {!compact && r.isBiggestLoss && <b>Most people lost</b>}
              {!compact && r.isWeakest && <b>Lowest step completion</b>}
            </div>
          )}
          <div className="tc-funnel-step">
            <span className="tc-funnel-name">{r.name}</span>
            <span className="tc-funnel-track"><i style={{ width: `${r.shareOfFirst * 100}%` }} /></span>
            <span className="tc-funnel-value">{fmt(r.people)} <small>{pct(r.shareOfFirst, 0)} of step 1</small></span>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Average retention by week since first visit (weeks 1–6), each point labelled. */
export function RetentionCurve({ curve }: { curve: { week: number; rate: number }[] }) {
  const pts = curve.filter((c) => c.week > 0);
  const W = 1080, H = 260, left = 48, right = 40, top = 30, bottom = 38, inset = 40;
  const yMax = 40;
  const x = (i: number) => left + inset + (i / (pts.length - 1)) * (W - left - right - inset);
  const y = (v: number) => top + (1 - v / yMax) * (H - top - bottom);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${x(i)} ${y(p.rate)}`).join("");
  return (
    <div className="tc-chart-scroll">
      <svg className="tc-line" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Average share of new visitors who return, by week since first visit">
        {[0, 10, 20, 30, 40].map((t) => (
          <g key={t}><line x1={left} x2={W - right} y1={y(t)} y2={y(t)} className="tc-gridline" /><text x={left - 8} y={y(t) + 4} textAnchor="end" className="tc-axis">{t}%</text></g>
        ))}
        <path d={`${line}L${x(pts.length - 1)} ${y(0)}L${x(0)} ${y(0)}Z`} fill="var(--tc-accent)" fillOpacity=".12" />
        <path d={line} fill="none" stroke="var(--tc-accent)" strokeWidth="2.5" />
        {pts.map((p, i) => (
          <g key={p.week}>
            <circle cx={x(i)} cy={y(p.rate)} r="4.5" fill="var(--tc-accent)" />
            <text x={x(i)} y={y(p.rate) - 12} textAnchor="middle" className="tc-annotation">{p.rate.toFixed(0)}%</text>
            <text x={x(i)} y={H - 12} textAnchor="middle" className="tc-axis">Week {p.week}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

/** Small paired bars used as evidence on the Insights page. */
export function Evidence({ items, format }: { items: { label: string; value: number }[]; format: (v: number) => string }) {
  const max = Math.max(...items.map((i) => i.value));
  return (
    <ul className="tc-bars tc-evidence">
      {items.map((it) => (
        <li key={it.label}><span className="tc-bars-name">{it.label}</span><span className="tc-bars-track"><i style={{ width: `${(it.value / max) * 100}%` }} /></span><span className="tc-bars-value">{format(it.value)}</span></li>
      ))}
    </ul>
  );
}
