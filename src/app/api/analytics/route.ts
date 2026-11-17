import { devices, getView, periods, type Device, type Period, type View } from "../../demo-data";
import { query } from "@/lib/db";

const dates: Record<Period, [string, string]> = {
  "Nov 2020": ["2020-11-01", "2020-11-30"],
  "Dec 2020": ["2020-12-01", "2020-12-31"],
  "Jan 2021": ["2021-01-01", "2021-01-31"],
  "Nov 2020 – Jan 2021": ["2020-11-01", "2021-01-31"],
};

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const device = params.get("device") ?? "All devices";
  const period = params.get("period") ?? "Dec 2020";
  if (!devices.includes(device as Device) || !periods.includes(period as Period)) {
    return Response.json({ error: "Choose a listed device and period." }, { status: 400 });
  }
  const saved = getView(device as Device, period as Period);
  try {
    const range = dates[period as Period];
    const previousRange = saved.previousLabel ? dates[saved.previousLabel] : null;
    const result = await query<{ report: View; previous: View | null }>(
      "select tide_analytics.period_report($1,$2::date,$3::date) report, case when $4::date is null then null else tide_analytics.period_report($1,$4::date,$5::date) end previous",
      [device, ...range, ...(previousRange ?? [null, null])],
    );
    const row = result.rows[0];
    if (!row?.report?.dataset) throw new Error("Dataset not ready");
    return Response.json({ ...row.report, device, period, previousLabel: saved.previousLabel, previous: row.previous?.totals ?? null,
      dataset: { ...row.report.dataset, delivery: "database" } }, { headers: { "Cache-Control": "private, max-age=60" } });
  } catch {
    // A historical, verified SQL export keeps the prototype usable without network access.
    return Response.json(saved, { headers: { "Cache-Control": "private, max-age=60", "X-Tide-Report": "saved-supabase-report" } });
  }
}
