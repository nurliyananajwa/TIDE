import type { Metadata } from "next";
import Link from "next/link";
import { BarList } from "@/components/charts";
import { ReportBanner } from "@/components/report-banner";
import { Answer, Card } from "@/components/ui";
import { rankByConversion } from "@/lib/analysis";
import { filterQuery, parseDimension, parseFilters } from "@/lib/filters";
import { fmt, pct } from "@/lib/format";
import { dimensions, getView, scopeLabel } from "@/lib/view";

export const metadata: Metadata = { title: "Breakdowns" };

export default async function BreakdownsPage({ searchParams }: PageProps<"/breakdowns">) {
  const params = await searchParams;
  const filters = parseFilters(params);
  const by = parseDimension(params);
  const view = await getView(filters);

  const dimension = dimensions.find((d) => d.id === by)!.label;
  const rows = view.segments[by];
  const avg = view.totals.rate;
  const { best, worst, ratio } = rankByConversion(rows);
  const single = rows.length === 1;

  return (
    <>
      <ReportBanner report="Breakdowns" filters={filters} />
      <div className="tc-report">
        <nav className="tc-tabs" aria-label="Break down by">
          {dimensions.map((d) => <Link key={d.id} href={`/breakdowns${filterQuery(filters, { by: d.id })}`} aria-current={d.id === by ? "true" : undefined} scroll={false}>{d.label}</Link>)}
        </nav>
        <Answer note={single ? "Choose All devices in the filter above to compare devices." : `Average conversion for ${scopeLabel(view)}: ${pct(avg)}.`}>
          {single
            ? <>Showing <strong>{best.name}</strong> only: {fmt(best.visitors)} visitors, <strong>{pct(best.rate)}</strong> bought something.</>
            : <><strong>{best.name}</strong> visitors convert best (<strong>{pct(best.rate)}</strong>), <strong>{ratio.toFixed(1)}×</strong> the rate of <strong>{worst.name}</strong> ({pct(worst.rate)}).</>}
        </Answer>
        <div className="tc-grid tc-grid-split">
          <Card title={`Visitors by ${dimension.toLowerCase()}`} subtitle={`Share of ${fmt(view.totals.visitors)} visitors · ${scopeLabel(view)}`}>
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
        <p className="tc-definition">Conversion = visitors who made at least one purchase ÷ visitors in that segment.</p>
      </div>
    </>
  );
}
