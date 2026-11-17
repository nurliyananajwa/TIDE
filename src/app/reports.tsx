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
  if (before === undefined || label === null || (kind === "count" && before === 0)) return <span className="tc-delta is-flat">No earlier month to compare</span>;
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
      </div>
      <div className="tc-journey-detail" aria-live="polite">
        <div>
          <h3>{s.name}</h3>
          <p>{fmt(s.value)} {s.unit}</p>
        </div>
        <p>{s.copy}</p>
        <button onClick={() => onNavigate(s.report)}>Open {s.report.toLowerCase()} <span aria-hidden="true">↗</span></button>
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
          : <><strong>{best.name}</strong> visitors convert best (<strong>{pct(best.rate)}</strong>), compared with <strong>{worst.name}</strong> ({pct(worst.rate)}).</>}
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
      <p className="tc-definition">Conversion = visitors who made at least one purchase ÷ visitors in that segment. Each visitor is assigned to their first recorded segment in the selected period. These are observed counts in a 0.5% visitor sample; small groups may have very few purchases.</p>
    </div>
  );
}

// ── Funnels ────────────────────────────────────────────────────

export function Funnels({ view }: { view: View }) {
  const f = view.funnel;
  if (!f[0].people) return <div className="tc-report"><Answer note={scope(view)}>No product-view events were recorded in this selection, so an ordered purchase funnel cannot be measured.</Answer></div>;
  const losses = f.slice(1).map((s, i) => ({ from: f[i].name, to: s.name, lost: f[i].people - s.people, rate: s.people / f[i].people }));
  const biggest = losses.reduce((b, l) => (l.lost > b.lost ? l : b));
  const checkout = losses[losses.length - 1];
  return (
    <div className="tc-report">
      <Answer note={`${scope(view)} · ${fmt(f[0].people)} people viewed a product; ${fmt(f[3].people)} purchased (${pct(f[3].people / f[0].people)}).`}>
        <strong>{fmt(biggest.lost)} people</strong> have no recorded next step between &ldquo;{biggest.from.toLowerCase()}&rdquo; and &ldquo;{biggest.to.toLowerCase()}&rdquo;, more than at any other step. Checkout completion is <strong>{pct(checkout.rate, 0)}</strong> of recorded ordered checkouts.
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
      <p className="tc-definition">A person counts at a step only if they completed the previous step at the same time or earlier in the same session. Total purchasers includes purchases with missing earlier steps and may exceed the final bar. Continue = people at this step ÷ people at the previous step.</p>
    </div>
  );
}

// ── Retention ──────────────────────────────────────────────────

export function Retention({ view }: { view: View }) {
  const [cell, setCell] = useState<[number, number]>([0, 1]);
  const curve = retentionCurve(view.cohorts);
  const row = Math.min(cell[0],Math.max(0,view.cohorts.length-1));
  const c = view.cohorts[row];
  const week = c?.weeks[cell[1]] === undefined ? 0 : cell[1];
  const value = c?.weeks[week];
  return <div className="tc-report">
    <Answer note={"Cohorts start with first observations in "+scope(view)+". Follow-up continues to 31 Jan 2021; incomplete weeks are excluded."}>
      {curve[1].cohorts ? <><strong>{curve[1].rate.toFixed(1)}%</strong> of eligible cohort visitors returned the next calendar week.</> : <>There is not enough follow-up to measure next-week return.</>}
      {curve[6].cohorts>0 && <> By week 6, <strong>{curve[6].rate.toFixed(1)}%</strong> returned.</>}
    </Answer>
    <Card title="Return by week since first observation" subtitle="Weighted by cohort size; only fully observed weeks">
      <RetentionCurve curve={curve} />
    </Card>
    <Card title="Cohort table" subtitle="Monday calendar weeks · select a cell to read it">
      <CohortTable cohorts={view.cohorts} selected={[row,week]} onSelect={setCell} />
      <p className="tc-reading" aria-live="polite">{c && value!==undefined ? <>{fmt(c.size)} visitors were first observed in the week of {longDate(c.start)}. <strong>{value.toFixed(1)}%</strong> {week===0?"appear in their first week by definition.":"returned in week "+week+"."}</> : "No cohorts in this selection."}</p>
    </Card>
    <p className="tc-definition">First observed means first seen in this 92-day dataset, not first-ever visit. Device filtering uses the first observed device and matching later activity. Week 0 is 100% by definition. Dashes mark incomplete follow-up.</p>
  </div>;
}

export function Insights({ view, onNavigate }: { view: View; onNavigate: Nav }) {
  const sources=[...view.segments["Traffic source"]].sort((a,b)=>b.rate-a.rate);
  const best=sources[0];
  const f=view.funnel;
  const checkout=f[2].people;
  const curve=retentionCurve(view.cohorts).filter(r=>r.week>0&&r.cohorts>0);
  return <div className="tc-report">
    <Answer note={scope(view)+" · Google’s obfuscated GA4 sample · 0.5% of visitors"}>Explore three observations from the sample. Small counts and missing events limit what we can conclude.</Answer>
    <div className="tc-insights">
      <article className="tc-card tc-insight"><span className="tc-tag">1 · Acquisition</span>
        <h3>{best ? <><strong>{best.name}</strong> has the highest observed purchase rate, <strong>{pct(best.rate)}</strong>.</> : "No recorded traffic sources."}</h3>
        <Evidence items={sources.map(s=>({label:s.name,value:s.rate*100}))} format={v=>v.toFixed(1)+"%"} />
        <p>Compare visitor and purchaser counts before interpreting rate differences. A source with one buyer can rank highly in a small sample.</p>
        <LinkButton to="Breakdowns" onNavigate={onNavigate}>Compare sources</LinkButton>
      </article>
      <article className="tc-card tc-insight"><span className="tc-tag">2 · Checkout</span>
        <h3>{checkout ? <><strong>{pct(f[3].people/checkout,0)}</strong> of ordered checkouts include a later purchase.</> : "No ordered checkouts were recorded in this selection."}</h3>
        <Evidence items={f.map(s=>({label:s.name,value:s.people}))} format={fmt} />
        <p>Only journeys with every earlier step in the same session count. Missing events can explain part of the gap; it does not prove why someone left.</p>
        <LinkButton to="Funnels" onNavigate={onNavigate}>Explore the funnel</LinkButton>
      </article>
      <article className="tc-card tc-insight"><span className="tc-tag">3 · Return</span>
        <h3>{curve.length ? <><strong>{curve[0].rate.toFixed(1)}%</strong> of eligible visitors returned in week {curve[0].week}.</> : "More follow-up is needed to measure return."}</h3>
        <Evidence items={curve.map(r=>({label:"Week "+r.week,value:r.rate}))} format={v=>v.toFixed(1)+"%"} />
        <p>These cohorts begin with the first visit observed in the dataset. Later weeks include fewer eligible cohorts as the observation period ends.</p>
        <LinkButton to="Retention" onNavigate={onNavigate}>Explore retention</LinkButton>
      </article>
    </div>
  </div>;
}
