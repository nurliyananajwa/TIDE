// Shared report types and formatting. The saved reports below are Supabase SQL exports.
import snapshot from "@/lib/analytics-snapshot.json";
export const devices = ["All devices", "Desktop", "Mobile", "Tablet"] as const;
export type Device = typeof devices[number];
export const periods = ["Nov 2020", "Dec 2020", "Jan 2021", "Nov 2020 – Jan 2021"] as const;
export type Period = typeof periods[number];
export const dimensions = ["Device", "Traffic source", "Country"] as const;
export type Dimension = typeof dimensions[number];
export type Segment = { name: string; visitors: number; share: number; purchasers: number; rate: number };
export type FunnelStep = { name: string; people: number };
export type DayPoint = { date: string; visitors: number };
export type Totals = { visitors: number; sessions: number; purchasers: number; rate: number; returning: number; returningShare: number };
export type Cohort = { start: string; size: number; weeks: number[] };
export type Dataset = { runId: string; source: string; sourceUrl: string; sampleRate: number; start: string; end: string; events: number; quality: Record<string, number>; delivery?: "database" | "snapshot" };
export type View = { device: Device; period: Period; previousLabel: Period | null; days: number; totals: Totals; previous: Totals | null; daily: DayPoint[]; funnel: FunnelStep[]; segments: Record<Dimension, Segment[]>; cohorts: Cohort[]; dataset: Dataset };
export function getView(device: Device, period: Period): View {
  const report = snapshot.find(row => row.device === device && row.period === period);
  if (!report) throw new Error("Report selection unavailable");
  return { ...report, dataset: { ...report.dataset, delivery: "snapshot" } } as View;
}
export function retentionCurve(cohorts: Cohort[]) {
  return Array.from({ length: 7 }, (_, week) => {
    const eligible = cohorts.filter(c => c.weeks[week] !== undefined);
    const people = eligible.reduce((n,c) => n+c.size,0);
    return { week, rate: people ? eligible.reduce((n,c) => n+c.size*c.weeks[week],0)/people : 0, cohorts: eligible.length };
  });
}
export const ratio = (part: number, total: number) => total > 0 ? part/total : 0;
export const fmt = (n: number) => Number.isFinite(n) ? Math.round(n).toLocaleString("en-US") : "—";
export const pct = (r: number, digits = 1) => Number.isFinite(r) ? (r*100).toFixed(digits)+"%" : "—";
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const shortDate = (iso: string) => Number(iso.slice(8,10))+" "+months[Number(iso.slice(5,7))-1];
export const longDate = (iso: string) => shortDate(iso)+" "+iso.slice(0,4);
