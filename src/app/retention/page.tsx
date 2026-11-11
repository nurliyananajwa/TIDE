import type { Metadata } from "next";
import { RetentionCurve } from "@/components/charts";
import { CohortExplorer } from "@/components/cohort-explorer";
import { ReportBanner } from "@/components/report-banner";
import { Answer, Card } from "@/components/ui";
import { retentionCurve } from "@/lib/analysis";
import { parseFilters } from "@/lib/filters";
import { getView } from "@/lib/view";

export const metadata: Metadata = { title: "Retention" };

export default async function RetentionPage({ searchParams }: PageProps<"/retention">) {
  const filters = parseFilters(await searchParams);
  const view = await getView(filters);
  const curve = retentionCurve(view.cohorts);
  const w1 = curve[1].rate, w6 = curve[6].rate;

  return (
    <>
      <ReportBanner report="Retention" filters={filters} />
      <div className="tc-report">
        <Answer note={`Weighted average across ${view.cohorts.length} weekly cohorts${filters.device === "all" ? "" : ` · ${view.deviceLabel}`}. The month filter doesn't apply here: cohorts use the most recent six weeks of first visits.`}>
          About <strong>{w1.toFixed(0)}%</strong> of new visitors come back in the week after their first visit. By week 6, <strong>{w6.toFixed(0)}%</strong> are still returning, roughly <strong>1 in {Math.round(100 / w6)}</strong>.
        </Answer>
        <Card title="Return rate by week since first visit" subtitle="Share of new visitors with any visit in that week">
          <RetentionCurve curve={curve} />
        </Card>
        <Card title="Cohort table" subtitle="One row per week of first visit. Darker = more visitors returned. Select a cell to read it.">
          <CohortExplorer cohorts={view.cohorts} />
        </Card>
        <p className="tc-definition">Week 0 is the week of a visitor&apos;s first visit. A visitor counts as retained in week N if they have any visit that week. Empty cells (–) are weeks after the data ends on 31 Jan 2021.</p>
      </div>
    </>
  );
}
