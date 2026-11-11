import { devices, periods, type Cohort, type DayPoint, type DeviceId, type DimensionId, type Filters, type FunnelStep, type PeriodId, type Segment, type Totals, type View } from "./view";

// ─────────────────────────────────────────────────────────────
// TEMPORARY: illustrative demo numbers, not GA4 findings.
//
// Everything is derived from the few base values below, so totals, breakdowns,
// funnel steps and insights always agree with each other. This file exists only
// until the real SQL queries are written, then it is deleted. Don't add features here.
// ─────────────────────────────────────────────────────────────

type PeriodInfo = { start: string; days: number; visitors: number; conversion: number; previous: PeriodId | null };
const periodInfo: Record<PeriodId, PeriodInfo> = {
  // visitors: multiplier on November's audience; conversion: multiplier on November's rates
  "2020-11": { start: "2020-11-01", days: 30, visitors: 1, conversion: 1, previous: null },
  "2020-12": { start: "2020-12-01", days: 31, visitors: 1.15, conversion: 1.095, previous: "2020-11" },
  "2021-01": { start: "2021-01-01", days: 31, visitors: 0.8, conversion: 0.857, previous: "2020-12" },
};

type BaseSegment = { name: string; visitors: number; rate: number; returning?: number };
// November 2020, all devices. Purchasers = round(visitors × rate) and sums to 504 in each dimension.
const base: Record<DimensionId, BaseSegment[]> = {
  device: [
    { name: "Desktop", visitors: 6840, rate: 0.048, returning: 0.29 },
    { name: "Mobile", visitors: 4440, rate: 0.035, returning: 0.25 },
    { name: "Tablet", visitors: 720, rate: 0.029, returning: 0.22 },
  ],
  source: [
    { name: "Organic search", visitors: 4920, rate: 0.04 },
    { name: "Direct", visitors: 3480, rate: 0.05 },
    { name: "Referral", visitors: 2160, rate: 0.024 },
    { name: "Paid search", visitors: 1440, rate: 0.05625 },
  ],
  country: [
    { name: "United States", visitors: 5280, rate: 0.05 },
    { name: "India", visitors: 1560, rate: 0.0212 },
    { name: "Canada", visitors: 960, rate: 0.0438 },
    { name: "United Kingdom", visitors: 840, rate: 0.0381 },
    { name: "Other countries", visitors: 3360, rate: 0.0396 },
  ],
};

const BASE_VISITORS = 12000;
const BASE_RATE = 504 / BASE_VISITORS; // 4.2%
const SESSIONS_PER_VISITOR = 18640 / 12000;

const label = (list: readonly { id: string; label: string }[], id: string) => list.find((x) => x.id === id)!.label;

function deviceScale(device: DeviceId) {
  if (device === "all") return { share: 1, rate: 1, returning: 0.271 };
  const d = base.device.find((s) => s.name === label(devices, device))!;
  return { share: d.visitors / BASE_VISITORS, rate: d.rate / BASE_RATE, returning: d.returning! };
}

function segmentsFor(dimension: DimensionId, device: DeviceId, period: PeriodId): Segment[] {
  const p = periodInfo[period];
  const ds = deviceScale(device);
  const rows = dimension === "device"
    ? base.device.filter((s) => device === "all" || s.name === label(devices, device))
    : base[dimension].map((s) => ({ ...s, visitors: s.visitors * ds.share, rate: s.rate * ds.rate }));
  const out = rows.map((s) => {
    const visitors = Math.round(s.visitors * p.visitors);
    return { name: s.name, visitors, purchasers: Math.round(visitors * s.rate * p.conversion), share: 0, rate: 0 };
  });
  const total = out.reduce((n, s) => n + s.visitors, 0);
  return out.map((s) => ({ ...s, share: s.visitors / total, rate: s.purchasers / s.visitors }))
    .sort((a, b) => b.visitors - a.visitors);
}

function totalsFor(device: DeviceId, period: PeriodId): Totals {
  const seg = segmentsFor("device", device, period);
  const visitors = seg.reduce((n, s) => n + s.visitors, 0);
  const purchasers = seg.reduce((n, s) => n + s.purchasers, 0);
  const returningShare = deviceScale(device).returning;
  return {
    visitors,
    sessions: Math.round(visitors * SESSIONS_PER_VISITOR),
    purchasers,
    rate: purchasers / visitors,
    returning: Math.round(visitors * returningShare),
    returningShare,
  };
}

function funnelFor(t: Totals): FunnelStep[] {
  const viewed = Math.round(t.visitors * 0.7);
  const cart = Math.round(viewed * 0.35);
  const checkout = Math.round(cart * 0.5714);
  return [
    { name: "Viewed a product", people: viewed },
    { name: "Added to cart", people: cart },
    { name: "Began checkout", people: checkout },
    { name: "Purchased", people: t.purchasers },
  ];
}

// Daily visitors: weekday rhythm, a December holiday peak and a quiet January.
function dailyFor(device: DeviceId, period: PeriodId): DayPoint[] {
  const p = periodInfo[period];
  const share = deviceScale(device).share;
  const weekday = [0.84, 1.05, 1.08, 1.06, 1.02, 0.97, 0.86]; // Sun..Sat
  const startMs = Date.parse(p.start + "T00:00:00Z");
  return Array.from({ length: p.days }, (_, i) => {
    const d = new Date(startMs + i * 864e5);
    const month = d.getUTCMonth(), day = d.getUTCDate();
    let level = 540;
    if (month === 10) level = 500 + day * 2.4; // November: steady growth
    if (month === 11) level = day <= 18 ? 580 + day * 9 : day <= 26 ? 740 - (day - 18) * 45 : 420 + (day - 26) * 12;
    if (month === 0) level = 430 + Math.min(day, 15) * 3;
    const wobble = Math.sin(i * 1.7) * 18;
    return { date: d.toISOString().slice(0, 10), visitors: Math.round((level * weekday[d.getUTCDay()] + wobble) * share) };
  });
}

// Weekly cohorts by first visit. Later cohorts have fewer observed weeks because the data ends on 31 Jan 2021.
const cohortStarts = ["2020-12-14", "2020-12-21", "2020-12-28", "2021-01-04", "2021-01-11", "2021-01-18"];
const cohortSizes = [2100, 1980, 1860, 1740, 1620, 1500];
const cohortRates = [[100, 26, 21, 18, 16, 14, 13], [100, 29, 23, 19, 17, 15], [100, 24, 20, 17, 15], [100, 31, 25, 22], [100, 28, 23], [100, 30]];

function cohortsFor(device: DeviceId): Cohort[] {
  const share = deviceScale(device).share;
  const shift = { all: 0, desktop: 2, mobile: -2, tablet: -3 }[device];
  return cohortStarts.map((start, i) => ({
    start,
    size: Math.round(cohortSizes[i] * share),
    weeks: cohortRates[i].map((v, w) => (w === 0 ? 100 : Math.max(1, v + shift))),
  }));
}

/** Round a list of weights to whole numbers that add up exactly to `total` (largest remainder). */
function allocate(weights: number[], total: number) {
  const sum = weights.reduce((n, w) => n + w, 0);
  const raw = weights.map((w) => (w / sum) * total);
  const out = raw.map(Math.floor);
  let left = total - out.reduce((n, v) => n + v, 0);
  raw.map((v, i) => [v - Math.floor(v), i] as const).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (left-- > 0) out[i]++; });
  return out;
}

/** Make a breakdown add up exactly to the report totals, so no table disagrees with the headline. */
function reconcile(rows: Segment[], t: Totals): Segment[] {
  const visitors = allocate(rows.map((r) => r.visitors), t.visitors);
  const purchasers = allocate(rows.map((r) => r.purchasers), t.purchasers);
  return rows.map((r, i) => ({ ...r, visitors: visitors[i], share: visitors[i] / t.visitors, purchasers: purchasers[i], rate: purchasers[i] / visitors[i] }));
}

export function getDemoView(filters: Filters): View {
  const { device, period } = filters;
  const previous = periodInfo[period].previous;
  const totals = totalsFor(device, period);
  return {
    filters,
    deviceLabel: label(devices, device),
    periodLabel: label(periods, period),
    previousLabel: previous ? label(periods, previous) : null,
    totals,
    previous: previous ? totalsFor(device, previous) : null,
    daily: dailyFor(device, period),
    funnel: funnelFor(totals),
    segments: {
      device: segmentsFor("device", device, period),
      source: reconcile(segmentsFor("source", device, period), totals),
      country: reconcile(segmentsFor("country", device, period), totals),
    },
    cohorts: cohortsFor(device),
  };
}
