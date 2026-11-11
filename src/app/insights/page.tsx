import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Evidence } from "@/components/charts";
import { ReportBanner } from "@/components/report-banner";
import { Answer, ArrowLink } from "@/components/ui";
import { analyseFunnel, rankByConversion, retentionCurve } from "@/lib/analysis";
import { filterQuery, parseFilters } from "@/lib/filters";
import { pct } from "@/lib/format";
import { getView, scopeLabel } from "@/lib/view";

export const metadata: Metadata = { title: "Insights" };

const percent = (digits: number) => (v: number) => `${v.toFixed(digits)}%`;

export default async function InsightsPage({ searchParams }: PageProps<"/insights">) {
  const filters = parseFilters(await searchParams);
  const view = await getView(filters);
  const q = filterQuery(filters);

  const { byRate: sources, best, worst, ratio } = rankByConversion(view.segments.source);
  const short = ["View", "Cart", "Checkout", "Purchase"];
  const stepRates = analyseFunnel(view.funnel).slice(1).map((r, i) => ({ label: `${short[i]} → ${short[i + 1].toLowerCase()}`, value: r.continueRate! * 100 }));
  const checkoutDone = stepRates[stepRates.length - 1].value;
  const curve = retentionCurve(view.cohorts).filter((r) => r.week > 0);

  const findings: { tag: string; title: ReactNode; evidence: ReactNode; why: string; next: string; href: string; linkLabel: string }[] = [
    {
      tag: "Acquisition",
      title: <><strong>{best.name}</strong> visitors buy <strong>{ratio.toFixed(1)}×</strong> as often as <strong>{worst.name}</strong> visitors.</>,
      evidence: <Evidence items={sources.map((s) => ({ label: s.name, value: s.rate * 100 }))} format={percent(1)} />,
      why: `${worst.name} brings ${pct(worst.share, 0)} of visitors but converts at ${pct(worst.rate)}.`,
      next: `Which referring sites send ${worst.name.toLowerCase()} traffic, and do those visitors view products at all?`,
      href: `/breakdowns${q}`, linkLabel: "Open breakdowns",
    },
    {
      tag: "Checkout",
      title: <>Only <strong>{checkoutDone.toFixed(0)}%</strong> of people who begin checkout complete a purchase.</>,
      evidence: <Evidence items={stepRates} format={percent(0)} />,
      why: "These people already chose to buy, so each lost checkout is a missed sale, not lost interest.",
      next: "Split checkout completion by device: is the drop worse on mobile?",
      href: `/funnels${q}`, linkLabel: "Open funnels",
    },
    {
      tag: "Loyalty",
      title: <>About <strong>{curve[0].rate.toFixed(0)}%</strong> of new visitors return the next week; by week 6 it&apos;s <strong>{curve[5].rate.toFixed(0)}%</strong>.</>,
      evidence: <Evidence items={curve.map((r) => ({ label: `Week ${r.week}`, value: r.rate }))} format={percent(0)} />,
      why: "Most of the drop happens in the first week, so that is where a reminder or follow-up has the most effect.",
      next: "Which traffic sources bring the visitors who are still returning in week 6?",
      href: `/retention${q}`, linkLabel: "Open retention",
    },
  ];

  return (
    <>
      <ReportBanner report="Insights" filters={filters} />
      <div className="tc-report">
        <Answer note={`Based on ${scopeLabel(view)}.`}>
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
              <ArrowLink href={x.href}>{x.linkLabel}</ArrowLink>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
