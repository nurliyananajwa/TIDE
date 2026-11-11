import type { Metadata } from "next";
import { BarList, Funnel, LineChart } from "@/components/charts";
import { JourneyMap, type JourneyStop } from "@/components/journey-map";
import { ReportBanner } from "@/components/report-banner";
import { Answer, ArrowLink, Card, Delta } from "@/components/ui";
import { analyseFunnel } from "@/lib/analysis";
import { filterQuery, parseFilters } from "@/lib/filters";
import { fmt, pct } from "@/lib/format";
import { getView, scopeLabel } from "@/lib/view";

export const metadata: Metadata = { title: "Overview" };

export default async function OverviewPage({ searchParams }: PageProps<"/overview">) {
  const filters = parseFilters(await searchParams);
  const view = await getView(filters);
  const q = filterQuery(filters);
  const t = view.totals, p = view.previous;
  const funnel = analyseFunnel(view.funnel);

  const kpis: { label: string; value: string; now: number; before?: number; kind: "count" | "rate"; help: string }[] = [
    { label: "Visitors", value: fmt(t.visitors), now: t.visitors, before: p?.visitors, kind: "count", help: "Unique people" },
    { label: "Sessions", value: fmt(t.sessions), now: t.sessions, before: p?.sessions, kind: "count", help: "Visits, including repeat visits" },
    { label: "Conversion rate", value: pct(t.rate), now: t.rate, before: p?.rate, kind: "rate", help: `${fmt(t.purchasers)} visitors bought something` },
    { label: "Returning visitors", value: pct(t.returningShare, 0), now: t.returningShare, before: p?.returningShare, kind: "rate", help: `${fmt(t.returning)} came back on another day` },
  ];

  const stops: JourneyStop[] = [
    { name: "Discovery", value: t.visitors, unit: "visitors", x: 27, y: 31, copy: "Where do visitors come from, and which groups buy?", href: `/breakdowns${q}`, linkLabel: "Open breakdowns" },
    { name: "Engagement", value: view.funnel[0].people, unit: "viewed a product", x: 49, y: 48, copy: "How far do product viewers get towards a purchase?", href: `/funnels${q}`, linkLabel: "Open funnels" },
    { name: "Conversion", value: t.purchasers, unit: "purchasers", x: 74, y: 37, copy: "Which step of the purchase journey loses the most people?", href: `/funnels${q}`, linkLabel: "Open funnels" },
    { name: "Return", value: t.returning, unit: "returning visitors", x: 60, y: 77, copy: "How many new visitors come back in later weeks?", href: `/retention${q}`, linkLabel: "Open retention" },
  ];

  return (
    <>
      <ReportBanner report="Overview" filters={filters} />
      <div className="tc-report">
        <Answer note={p ? null : "November 2020 is the first month in the dataset, so there is no earlier month to compare with."}>
          In {view.periodLabel}, <strong>{fmt(t.visitors)} people</strong> visited{filters.device === "all" ? "" : ` on ${view.deviceLabel.toLowerCase()}`} and <strong>{pct(t.rate)}</strong> bought something
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
          <Card title="Daily visitors" subtitle={`${scopeLabel(view)} · hover a day for its value`}>
            <LineChart points={view.daily} label={`Daily visitors, ${scopeLabel(view)}`} />
            <p className="tc-note">Daily visitors don&apos;t add up to the monthly total, because many people visit on more than one day.</p>
          </Card>
          <div className="tc-stack">
            <Card title="Where visitors come from" subtitle="Share of visitors by traffic source" action={<ArrowLink href={`/breakdowns${q}`}>Compare</ArrowLink>}>
              <BarList rows={view.segments.source} />
            </Card>
            <Card title="Purchase funnel" subtitle="People reaching each step" action={<ArrowLink href={`/funnels${q}`}>Details</ArrowLink>}>
              <Funnel rows={funnel} compact />
            </Card>
          </div>
        </div>

        <JourneyMap stops={stops} />
      </div>
    </>
  );
}
