"use client";

import { useState, type ReactNode } from "react";
import { BarList, CohortTable, Evidence, Funnel, LineChart, RetentionCurve } from "./charts";
import { dimensions, fmt, longDate, pct, retentionCurve, type Dimension, type View } from "./demo-data";

export type Report = "Overview" | "Breakdowns" | "Funnels" | "Retention" | "Insights";
type Nav = (report: Report) => void;

// ── Shared pieces ──────────────────────────────────────────────

/** The one-sentence answer that opens every report. */
function Answer({ children, note }: { children: ReactNode; note?: ReactNode }) {
  return <section className="tc-answer" aria-label="Summary"><p>{children}</p>{note && <small>{note}</small>}</section>;
}

function Card({ title, subtitle, action, className = "", children }: { title: string; subtitle?: string; action?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <section className={`tc-card ${className}`}>
      <header className="tc-card-head"><div><h3>{title}</h3>{subtitle && <p>{subtitle}</p>}</div>{action}</header>
      {children}
    </section>
  );
}

function LinkButton({ to, onNavigate, children }: { to: Report; onNavigate: Nav; children: ReactNode }) {
  return <button className="tc-link" onClick={() => onNavigate(to)}>{children} <span aria-hidden="true">→</span></button>;
}

function Delta({ now, before, kind, label }: { now: number; before: number | undefined; kind: "count" | "rate"; label: string | null }) {
  if (before === undefined || label === null) return <span className="tc-delta is-flat">No earlier month to compare</span>;
  const diff = kind === "count" ? (now - before) / before : (now - before) * 100;
  const text = kind === "count" ? `${diff >= 0 ? "+" : ""}${(diff * 100).toFixed(1)}%` : `${diff >= 0 ? "+" : ""}${diff.toFixed(1)} pts`;
  return <span className={`tc-delta ${diff > 0.0005 ? "is-up" : diff < -0.0005 ? "is-down" : "is-flat"}`}>{diff > 0 ? "▲" : diff < 0 ? "▼" : "•"} {text} <small>vs {label}</small></span>;
}

const scope = (v: View) => `${v.period}${v.device === "All devices" ? "" : ` · ${v.device}`}`;

// ── Overview ───────────────────────────────────────────────────

export function Overview({ view, onNavigate }: { view: View; onNavigate: Nav }) {
  const t = view.totals, p = view.previous;
  const kpis: { label: string; value: string; now: number; before?: number; kind: "count" | "rate"; help: string }[] = [
    { label: "Visitors", value: fmt(t.visitors), now: t.visitors, before: p?.visitors, kind: "count", help: "Unique people" },
    { label: "Sessions", value: fmt(t.sessions), now: t.sessions, before: p?.sessions, kind: "count", help: "Visits, including repeat visits" },
    { label: "Conversion rate", value: pct(t.rate), now: t.rate, before: p?.rate, kind: "rate", help: `${fmt(t.purchasers)} visitors bought something` },
    { label: "Returning visitors", value: pct(t.returningShare, 0), now: t.returningShare, before: p?.returningShare, kind: "rate", help: `${fmt(t.returning)} came back on another day` },
  ];
  return (
    <div className="tc-report">
      <Answer note={p ? null : view.period.includes("–") ? "Choose a single month to compare it with the month before." : "November 2020 is the first month in the dataset, so there is no earlier month to compare with."}>
        In {view.period}, <strong>{fmt(t.visitors)} people</strong> visited{view.device === "All devices" ? "" : ` on ${view.device.toLowerCase()}`} and <strong>{pct(t.rate)}</strong> bought something
        {p && <>, {t.visitors >= p.visitors ? "up" : "down"} <strong>{Math.abs((t.visitors - p.visitors) / p.visitors * 100).toFixed(0)}%</strong> in visitors from {view.previousLabel}</>}.
      </Answer>

      <div className="tc-kpis">
        {kpis.map((k) => (
          <section key={k.label} className="tc-kpi">
            <h3>{k.label}</h3>
            <strong>{k.value}</strong>
            <Delta now={k.now} before={k.before} kind={k.kind} label={view.previousLabel} />
            <p>{k.help}</p>
          </section>
        ))}
      </div>

      <div className="tc-grid tc-grid-main">
        <Card title="Daily visitors" subtitle={`${scope(view)} · hover a day for its value`}>
          <LineChart points={view.daily} label={`Daily visitors, ${scope(view)}`} />
          <p className="tc-note">Daily visitors don&apos;t add up to the monthly total, because many people visit on more than one day.</p>
        </Card>
        <div className="tc-stack">
          <Card title="Where visitors come from" subtitle="Share of visitors by traffic source" action={<LinkButton to="Breakdowns" onNavigate={onNavigate}>Compare</LinkButton>}>
            <BarList rows={view.segments["Traffic source"]} />
          </Card>
          <Card title="Purchase funnel" subtitle="People reaching each step" action={<LinkButton to="Funnels" onNavigate={onNavigate}>Details</LinkButton>}>
            <Funnel steps={view.funnel} compact />
          </Card>
        </div>
      </div>

      <JourneyMap view={view} onNavigate={onNavigate} />
    </div>
  );
}

// The journey map is the one decorative ocean moment: navigation, not a chart.
// Island shapes and positions are illustration only; the numbers come from the view.
const islandA = "M-70 72C12 10 98 50 137 118S250 98 277 161S243 251 295 304S338 414 271 470S130 455 94 506S18 577-60 564Z";
const islandB = "M646-80C607-10 708 37 682 96S569 132 611 204S714 202 760 258S865 295 890 215S1000 188 1060 231V-80Z";
const islandC = "M429 398C473 346 518 357 545 402S631 411 652 469S610 556 557 543S521 593 461 559S381 482 429 398Z";

function JourneyMap({ view, onNavigate }: { view: View; onNavigate: Nav }) {
  const [active, setActive] = useState(0);
  const stops = [
    { name: "Discovery", value: view.totals.visitors, unit: "visitors", x: 27, y: 31, copy: "Where do visitors come from, and which groups buy?", report: "Breakdowns" as Report },
    { name: "Engagement", value: view.funnel[0].people, unit: "viewed a product", x: 49, y: 48, copy: "How far do product viewers get towards a purchase?", report: "Funnels" as Report },
    { name: "Conversion", value: view.totals.purchasers, unit: "purchasers", x: 74, y: 37, copy: "Which step of the purchase journey loses the most people?", report: "Funnels" as Report },
    { name: "Return", value: view.totals.returning, unit: "returning visitors", x: 60, y: 77, copy: "How many new visitors come back in later weeks?", report: "Retention" as Report },
  ];
  const s = stops[active];
  return (
    <section className="tc-journey" aria-label="Explore by journey stage">
      <header className="tc-card-head"><div><h3>Explore by journey stage</h3><p>Choose a stop to open the report for that stage. The map is decorative; it doesn&apos;t encode data.</p></div></header>
      <div className="expedition journey-map">
        <div className="map-terrain">
          <svg viewBox="0 0 1000 650" preserveAspectRatio="none" className="terrain-svg" aria-hidden="true"><defs>
            <pattern id="atlas-grid-v2" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M50 0H0V50" fill="none" stroke="#7da99f" strokeOpacity=".12" /></pattern>
            <pattern id="atlas-dots" width="13" height="13" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r=".8" fill="#a5c6ab" fillOpacity=".14" /></pattern>
            <radialGradient id="atlas-water"><stop stopColor="#214c51" /><stop offset="1" stopColor="#102c37" /></radialGradient>
            <linearGradient id="terrain-land" x2="1" y2="1"><stop stopColor="#617568" /><stop offset=".55" stopColor="#364e46" /><stop offset="1" stopColor="#263e39" /></linearGradient>
            <filter id="coast-shadow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="2" dy="9" stdDeviation="12" floodColor="#020e16" floodOpacity=".6" /></filter>
          </defs><rect width="1000" height="650" fill="url(#atlas-water)" /><rect width="1000" height="650" fill="url(#atlas-grid-v2)" />
            {[islandA, islandB, islandC].map((d, i) => <g key={i}>
              {[40, 30, 20, 10].map((w) => <path key={w} d={d} fill="none" stroke="#98cbb4" strokeWidth={w} strokeOpacity=".035" />)}
              <path d={d} fill="url(#terrain-land)" stroke="#98b499" strokeWidth="1.2" filter="url(#coast-shadow)" />
              <path d={d} fill="url(#atlas-dots)" />
            </g>)}
            <path className="journey-route" d="M270 201C340 200 331 312 490 312S600 240 740 240S740 480 600 500" fill="none" stroke="#d5e49a" strokeWidth="2" strokeDasharray="4 7" />
          </svg>
          {stops.map((d, i) => <button key={d.name} className={`expedition-stop ${active === i ? "chosen" : ""}`} style={{ left: d.x + "%", top: d.y + "%" }} onClick={() => setActive(i)} aria-pressed={active === i} aria-label={`${d.name}: ${fmt(d.value)} ${d.unit}`}><span className="expedition-marker"><i />{String(i + 1).padStart(2, "0")}</span><span className="expedition-label"><strong>{d.name}</strong><small>{fmt(d.value)} {d.unit}</small></span></button>)}
        </div>
        <div className="expedition-detail" aria-live="polite"><div className="detail-index">0{active + 1}<span>{s.unit}</span></div><h3>{s.name}</h3><div className="detail-number">{fmt(s.value)}<small>{s.unit}</small></div><p>{s.copy}</p><button onClick={() => onNavigate(s.report)}>Open {s.report.toLowerCase()} <span>↗</span></button></div>
      </div>
    </section>
  );
}

// ── Breakdowns ─────────────────────────────────────────────────

export function Breakdowns({ view }: { view: View }) {
  const [dimension, setDimension] = useState<Dimension>("Traffic source");
  const rows = view.segments[dimension];
  const avg = view.totals.rate;
  const byRate = [...rows].sort((a, b) => b.rate - a.rate);
  const best = byRate[0], worst = byRate[byRate.length - 1];
  const single = rows.length === 1;
  return (
    <div className="tc-report">
      <div className="tc-tabs" role="group" aria-label="Break down by">
        {dimensions.map((d) => <button key={d} aria-pressed={dimension === d} onClick={() => setDimension(d)}>{d}</button>)}
      </div>
      <Answer note={single ? "Choose All devices in the filter above to compare devices." : `Average conversion for ${scope(view)}: ${pct(avg)}.`}>
        {single
          ? <>Showing <strong>{best.name}</strong> only: {fmt(best.visitors)} visitors, <strong>{pct(best.rate)}</strong> bought something.</>
          : <><strong>{best.name}</strong> visitors convert best (<strong>{pct(best.rate)}</strong>), <strong>{(best.rate / worst.rate).toFixed(1)}×</strong> the rate of <strong>{worst.name}</strong> ({pct(worst.rate)}).</>}
      </Answer>
      <div className="tc-grid tc-grid-split">
        <Card title={`Visitors by ${dimension.toLowerCase()}`} subtitle={`Share of ${fmt(view.totals.visitors)} visitors · ${scope(view)}`}>
          <BarList rows={rows} />
        </Card>
        <Card title="Conversion by segment" subtitle="Sorted by visitors. Differences are in percentage points from the average.">
          <div className="tc-table-scroll">
            <table className="tc-table">
              <thead><tr><th scope="col">{dimension}</th><th scope="col" className="num">Visitors</th><th scope="col" className="num">Purchasers</th><th scope="col" className="num">Conversion</th><th scope="col" className="num">vs average</th></tr></thead>
              <tbody>
                {rows.map((r) => {
                  const diff = (r.rate - avg) * 100;
                  return (
                    <tr key={r.name}>
                      <th scope="row">{r.name}</th>
                      <td className="num">{fmt(r.visitors)}</td>
                      <td className="num">{fmt(r.purchasers)}</td>
                      <td className="num">{pct(r.rate)}</td>
                      <td className={`num ${diff > 0.05 ? "is-up" : diff < -0.05 ? "is-down" : ""}`}>{single ? "–" : `${diff >= 0 ? "+" : ""}${diff.toFixed(1)} pts`}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot><tr><th scope="row">All</th><td className="num">{fmt(view.totals.visitors)}</td><td className="num">{fmt(view.totals.purchasers)}</td><td className="num">{pct(avg)}</td><td /></tr></tfoot>
            </table>
          </div>
        </Card>
      </div>
      <p className="tc-definition">Conversion = visitors who made at least one purchase ÷ visitors in that segment. All values are illustrative demo data.</p>
    </div>
  );
}

// ── Funnels ────────────────────────────────────────────────────

export function Funnels({ view }: { view: View }) {
  const f = view.funnel;
  const losses = f.slice(1).map((s, i) => ({ from: f[i].name, to: s.name, lost: f[i].people - s.people, rate: s.people / f[i].people }));
  const biggest = losses.reduce((b, l) => (l.lost > b.lost ? l : b));
  const checkout = losses[losses.length - 1];
  return (
    <div className="tc-report">
      <Answer note={`${scope(view)} · ${fmt(f[0].people)} people viewed a product; ${fmt(f[3].people)} purchased (${pct(f[3].people / f[0].people)}).`}>
        <strong>{fmt(biggest.lost)} people</strong> leave between &ldquo;{biggest.from.toLowerCase()}&rdquo; and &ldquo;{biggest.to.toLowerCase()}&rdquo;, more than at any other step. Checkout is also weak: only <strong>{pct(checkout.rate, 0)}</strong> of people who begin checkout finish.
      </Answer>
      <div className="tc-grid tc-grid-split">
        <Card title="Purchase funnel" subtitle="Bar length = people at each step, relative to step 1">
          <Funnel steps={f} />
        </Card>
        <Card title="Step by step" subtitle="Where to look first: high losses and low completion">
          <div className="tc-table-scroll">
            <table className="tc-table">
              <thead><tr><th scope="col">Step</th><th scope="col" className="num">People</th><th scope="col" className="num">Continue</th><th scope="col" className="num">Left</th></tr></thead>
              <tbody>
                {f.map((s, i) => (
                  <tr key={s.name}>
                    <th scope="row">{i + 1}. {s.name}</th>
                    <td className="num">{fmt(s.people)}</td>
                    <td className={`num ${i > 0 && losses[i - 1] === checkout ? "is-down" : ""}`}>{i === 0 ? "–" : pct(losses[i - 1].rate, 0)}</td>
                    <td className={`num ${i > 0 && losses[i - 1] === biggest ? "is-down" : ""}`}>{i === 0 ? "–" : fmt(losses[i - 1].lost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      <p className="tc-definition">A person counts at a step only if they completed the previous step earlier in the same session. Continue = people at this step ÷ people at the previous step.</p>
    </div>
  );
}

// ── Retention ──────────────────────────────────────────────────

export function Retention({ view }: { view: View }) {
  const [cell, setCell] = useState<[number, number]>([0, 1]);
  const curve = retentionCurve(view.cohorts);
  const w1 = curve[1].rate, w6 = curve[6].rate;
  const c = view.cohorts[cell[0]], v = c.weeks[cell[1]];
  return (
    <div className="tc-report">
      <Answer note={`Weighted average across ${view.cohorts.length} weekly cohorts${view.device === "All devices" ? "" : ` · ${view.device}`}. The month filter doesn't apply here: cohorts use the most recent six weeks of first visits.`}>
        About <strong>{w1.toFixed(0)}%</strong> of new visitors come back in the week after their first visit. By week 6, <strong>{w6.toFixed(0)}%</strong> are still returning, roughly <strong>1 in {Math.round(100 / w6)}</strong>.
      </Answer>
      <Card title="Return rate by week since first visit" subtitle="Share of new visitors with any visit in that week">
        <RetentionCurve curve={curve} />
      </Card>
      <Card title="Cohort table" subtitle="One row per week of first visit. Darker = more visitors returned. Select a cell to read it.">
        <CohortTable cohorts={view.cohorts} selected={cell} onSelect={setCell} />
        <p className="tc-reading" aria-live="polite">
          Of the {fmt(c.size)} people who first visited in the week of {longDate(c.start)}, <strong>{v}%</strong> {cell[1] === 0 ? "visited in their first week (by definition, everyone)" : `visited again in week ${cell[1]}`}.
        </p>
      </Card>
      <p className="tc-definition">Week 0 is the week of a visitor&apos;s first visit. A visitor counts as retained in week N if they have any visit that week. Empty cells (–) are weeks after the data ends on 31 Jan 2021.</p>
    </div>
  );
}

// ── Insights ───────────────────────────────────────────────────

export function Insights({ view, onNavigate }: { view: View; onNavigate: Nav }) {
  const sources = [...view.segments["Traffic source"]].sort((a, b) => b.rate - a.rate);
  const best = sources[0], worst = sources[sources.length - 1];
  const f = view.funnel;
  const short = ["View", "Cart", "Checkout", "Purchase"];
  const stepRates = f.slice(1).map((s, i) => ({ label: `${short[i]} → ${short[i + 1].toLowerCase()}`, value: s.people / f[i].people * 100 }));
  const checkoutDone = stepRates[stepRates.length - 1].value;
  const curve = retentionCurve(view.cohorts).filter((r) => r.week > 0);
  const findings: { tag: string; title: ReactNode; evidence: ReactNode; why: string; next: string; report: Report }[] = [
    {
      tag: "Acquisition",
      title: <><strong>{best.name}</strong> visitors buy <strong>{(best.rate / worst.rate).toFixed(1)}×</strong> as often as <strong>{worst.name}</strong> visitors.</>,
      evidence: <Evidence items={sources.map((s) => ({ label: s.name, value: s.rate * 100 }))} format={(v) => `${v.toFixed(1)}%`} />,
      why: `${worst.name} brings ${pct(worst.share, 0)} of visitors but converts at ${pct(worst.rate)}.`,
      next: `Which referring sites send ${worst.name.toLowerCase()} traffic, and do those visitors view products at all?`,
      report: "Breakdowns",
    },
    {
      tag: "Checkout",
      title: <>Only <strong>{checkoutDone.toFixed(0)}%</strong> of people who begin checkout complete a purchase.</>,
      evidence: <Evidence items={stepRates.map((s) => ({ label: s.label, value: s.value }))} format={(v) => `${v.toFixed(0)}%`} />,
      why: "These people already chose to buy, so each lost checkout is a missed sale, not lost interest.",
      next: "Split checkout completion by device: is the drop worse on mobile?",
      report: "Funnels",
    },
    {
      tag: "Loyalty",
      title: <>About <strong>{curve[0].rate.toFixed(0)}%</strong> of new visitors return the next week; by week 6 it&apos;s <strong>{curve[5].rate.toFixed(0)}%</strong>.</>,
      evidence: <Evidence items={curve.map((r) => ({ label: `Week ${r.week}`, value: r.rate }))} format={(v) => `${v.toFixed(0)}%`} />,
      why: "Most of the drop happens in the first week, so that is where a reminder or follow-up has the most effect.",
      next: "Which traffic sources bring the visitors who are still returning in week 6?",
      report: "Retention",
    },
  ];
  return (
    <div className="tc-report">
      <Answer note={`Based on ${scope(view)}. These are sample stories from illustrative values, not GA4 findings.`}>
        Three things stand out: one traffic source converts far worse than the rest, most checkouts are abandoned, and most new visitors don&apos;t come back after week one.
      </Answer>
      <div className="tc-insights">
        {findings.map((x, i) => (
          <article key={x.tag} className="tc-card tc-insight">
            <span className="tc-tag">{i + 1} · {x.tag}</span>
            <h3>{x.title}</h3>
            {x.evidence}
            <dl>
              <div><dt>Why it matters</dt><dd>{x.why}</dd></div>
              <div><dt>Check next</dt><dd>{x.next}</dd></div>
            </dl>
            <LinkButton to={x.report} onNavigate={onNavigate}>Open {x.report.toLowerCase()}</LinkButton>
          </article>
        ))}
      </div>
    </div>
  );
}

