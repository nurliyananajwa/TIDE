import type { Metadata } from "next";
import { Funnel } from "@/components/charts";
import { ReportBanner } from "@/components/report-banner";
import { Answer, Card } from "@/components/ui";
import { analyseFunnel } from "@/lib/analysis";
import { parseFilters } from "@/lib/filters";
import { fmt, pct } from "@/lib/format";
import { getView, scopeLabel } from "@/lib/view";

export const metadata: Metadata = { title: "Funnels" };

export default async function FunnelsPage({ searchParams }: PageProps<"/funnels">) {
  const filters = parseFilters(await searchParams);
  const view = await getView(filters);
  const f = analyseFunnel(view.funnel);
  const first = f[0], last = f[f.length - 1];
  const biggest = f.find((r) => r.isBiggestLoss)!;

  return (
    <>
      <ReportBanner report="Funnels" filters={filters} />
      <div className="tc-report">
        <Answer note={`${scopeLabel(view)} · ${fmt(first.people)} people viewed a product; ${fmt(last.people)} purchased (${pct(last.shareOfFirst)}).`}>
          <strong>{fmt(biggest.lost!)} people</strong> leave between &ldquo;{biggest.from!.toLowerCase()}&rdquo; and &ldquo;{biggest.name.toLowerCase()}&rdquo;, more than at any other step. Checkout is also weak: only <strong>{pct(last.continueRate!, 0)}</strong> of people who begin checkout finish.
        </Answer>
        <div className="tc-grid tc-grid-split">
          <Card title="Purchase funnel" subtitle="Bar length = people at each step, relative to step 1">
            <Funnel rows={f} />
          </Card>
          <Card title="Step by step" subtitle="Where to look first: high losses and low completion">
            <div className="tc-table-scroll">
              <table className="tc-table">
                <thead><tr><th scope="col">Step</th><th scope="col" className="num">People</th><th scope="col" className="num">Continue</th><th scope="col" className="num">Left</th></tr></thead>
                <tbody>
                  {f.map((r, i) => (
                    <tr key={r.name}>
                      <th scope="row">{i + 1}. {r.name}</th>
                      <td className="num">{fmt(r.people)}</td>
                      <td className={`num ${r.isWeakest ? "is-down" : ""}`}>{r.continueRate === null ? "–" : pct(r.continueRate, 0)}</td>
                      <td className={`num ${r.isBiggestLoss ? "is-down" : ""}`}>{r.lost === null ? "–" : fmt(r.lost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
        <p className="tc-definition">A person counts at a step only if they completed the previous step earlier in the same session. Continue = people at this step ÷ people at the previous step.</p>
      </div>
    </>
  );
}
