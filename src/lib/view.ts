import { getDemoView } from "./demo-view";

// ─────────────────────────────────────────────────────────────
// The data contract between the reports and whatever supplies the numbers.
//
// Every report page calls getView(filters) and renders the View it gets back.
// Today the numbers come from demo-view.ts. To move to real data, write SQL
// queries that return this same shape and call them from getView(); no report
// or chart needs to change.
// ─────────────────────────────────────────────────────────────

export const devices = [
  { id: "all", label: "All devices" },
  { id: "desktop", label: "Desktop" },
  { id: "mobile", label: "Mobile" },
  { id: "tablet", label: "Tablet" },
] as const;
export type DeviceId = typeof devices[number]["id"];

// The GA4 sample covers 1 Nov 2020 – 31 Jan 2021, so periods are fixed months, not "last N days".
export const periods = [
  { id: "2020-11", label: "Nov 2020" },
  { id: "2020-12", label: "Dec 2020" },
  { id: "2021-01", label: "Jan 2021" },
] as const;
export type PeriodId = typeof periods[number]["id"];

export const dimensions = [
  { id: "device", label: "Device" },
  { id: "source", label: "Traffic source" },
  { id: "country", label: "Country" },
] as const;
export type DimensionId = typeof dimensions[number]["id"];

export type Filters = { device: DeviceId; period: PeriodId };

export type Totals = { visitors: number; sessions: number; purchasers: number; rate: number; returning: number; returningShare: number };
export type Segment = { name: string; visitors: number; share: number; purchasers: number; rate: number };
export type FunnelStep = { name: string; people: number };
export type DayPoint = { date: string; visitors: number };
/** One weekly cohort. weeks[n] = % of the cohort who visited in week n; shorter when later weeks haven't happened yet. */
export type Cohort = { start: string; size: number; weeks: number[] };

export type View = {
  filters: Filters;
  deviceLabel: string;
  periodLabel: string;
  /** Label of the month before, or null when the selected month is the first in the dataset. */
  previousLabel: string | null;
  totals: Totals;
  previous: Totals | null;
  daily: DayPoint[];
  funnel: FunnelStep[];
  segments: Record<DimensionId, Segment[]>;
  cohorts: Cohort[];
};

export async function getView(filters: Filters): Promise<View> {
  return getDemoView(filters);
}

/** "Dec 2020" or "Dec 2020 · Mobile": what the numbers on a page cover. */
export const scopeLabel = (v: View) => `${v.periodLabel}${v.filters.device === "all" ? "" : ` · ${v.deviceLabel}`}`;
