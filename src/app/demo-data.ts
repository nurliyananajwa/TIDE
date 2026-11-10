// ─────────────────────────────────────────────────────────────
// TIDE demo dataset (illustrative, not GA4 findings).
//
// Every number on every report is derived from the small set of base
// values below, so totals, segments, funnel steps and insights always
// agree with each other. When the real SQL arrives, replace getView()
// with server queries that return the same shape.
// ─────────────────────────────────────────────────────────────

export const devices = ["All devices", "Desktop", "Mobile", "Tablet"] as const;
export type Device = typeof devices[number];

// The GA4 sample covers 1 Nov 2020 – 31 Jan 2021, so periods are fixed months, not "last N days".
export const periods = ["Nov 2020", "Dec 2020", "Jan 2021", "Nov 2020 – Jan 2021"] as const;
export type Period = typeof periods[number];

type PeriodInfo = { start: string; days: number; visitors: number; conversion: number; previous: Period | null };
const periodInfo: Record<Period, PeriodInfo> = {
  // visitors: multiplier on November's audience; conversion: multiplier on November's rates
  "Nov 2020": { start: "2020-11-01", days: 30, visitors: 1, conversion: 1, previous: null },
  "Dec 2020": { start: "2020-12-01", days: 31, visitors: 1.15, conversion: 1.095, previous: "Nov 2020" },
  "Jan 2021": { start: "2021-01-01", days: 31, visitors: 0.8, conversion: 0.857, previous: "Dec 2020" },
  // Unique visitors over 3 months is less than the sum of the months: people return.
  "Nov 2020 – Jan 2021": { start: "2020-11-01", days: 92, visitors: 2.6, conversion: 0.988, previous: null },
};

type BaseSegment = { name: string; visitors: number; rate: number; returning?: number };
// November 2020, all devices. Purchasers = round(visitors × rate) and sums to 504 in each dimension.
const base: Record<Dimension, BaseSegment[]> = {
  Device: [
    { name: "Desktop", visitors: 6840, rate: 0.048, returning: 0.29 },
    { name: "Mobile", visitors: 4440, rate: 0.035, returning: 0.25 },
    { name: "Tablet", visitors: 720, rate: 0.029, returning: 0.22 },
  ],
  "Traffic source": [
    { name: "Organic search", visitors: 4920, rate: 0.04 },
    { name: "Direct", visitors: 3480, rate: 0.05 },
    { name: "Referral", visitors: 2160, rate: 0.024 },
    { name: "Paid search", visitors: 1440, rate: 0.05625 },
  ],
  Country: [
    { name: "United States", visitors: 5280, rate: 0.05 },
    { name: "India", visitors: 1560, rate: 0.0212 },
    { name: "Canada", visitors: 960, rate: 0.0438 },
    { name: "United Kingdom", visitors: 840, rate: 0.0381 },
    { name: "Other countries", visitors: 3360, rate: 0.0396 },
  ],
};
export const dimensions = ["Device", "Traffic source", "Country"] as const;
export type Dimension = typeof dimensions[number];

const BASE_VISITORS = 12000;
const BASE_RATE = 504 / BASE_VISITORS; // 4.2%
const SESSIONS_PER_VISITOR = 18640 / 12000;

export type Segment = { name: string; visitors: number; share: number; purchasers: number; rate: number };
export type FunnelStep = { name: string; people: number };
export type DayPoint = { date: string; visitors: number };
export type Totals = { visitors: number; sessions: number; purchasers: number; rate: number; returning: number; returningShare: number };

function deviceScale(device: Device) {
  if (device === "All devices") return { share: 1, rate: 1, returning: 0.271 };
  const d = base.Device.find((s) => s.name === device)!;
  return { share: d.visitors / BASE_VISITORS, rate: d.rate / BASE_RATE, returning: d.returning! };
}

function segmentsFor(dimension: Dimension, device: Device, period: Period): Segment[] {
  const p = periodInfo[period];
  const ds = deviceScale(device);
  const rows = dimension === "Device" && device !== "All devices"
    ? base.Device.filter((s) => s.name === device).map((s) => ({ ...s, visitors: s.visitors, rate: s.rate }))
    : base[dimension].map((s) => ({
        ...s,
        visitors: dimension === "Device" ? s.visitors : s.visitors * ds.share,
        rate: dimension === "Device" ? s.rate : s.rate * ds.rate,
      }));
  const out = rows.map((s) => {
    const visitors = Math.round(s.visitors * p.visitors);
    const rate = s.rate * p.conversion;
    return { name: s.name, visitors, purchasers: Math.round(visitors * rate), share: 0, rate: 0 };
  });
  const total = out.reduce((n, s) => n + s.visitors, 0);
  return out.map((s) => ({ ...s, share: s.visitors / total, rate: s.purchasers / s.visitors }))
    .sort((a, b) => b.visitors - a.visitors);
}

function totalsFor(device: Device, period: Period): Totals {
  const seg = segmentsFor("Device", device, period);
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
function dailyFor(device: Device, period: Period): DayPoint[] {
  const p = periodInfo[period];
  const share = deviceScale(device).share;
  const weekday = [0.84, 1.05, 1.08, 1.06, 1.02, 0.97, 0.86]; // Sun..Sat
  const startMs = Date.parse(p.start + "T00:00:00Z");
  return Array.from({ length: p.days }, (_, i) => {
    const d = new Date(startMs + i * 864e5);
    const iso = d.toISOString().slice(0, 10);
    const month = d.getUTCMonth(), day = d.getUTCDate();
    let level = 540;
    if (month === 10) level = 500 + day * 2.4; // November: steady growth
    if (month === 11) level = day <= 18 ? 580 + day * 9 : day <= 26 ? 740 - (day - 18) * 45 : 420 + (day - 26) * 12;
    if (month === 0) level = 430 + Math.min(day, 15) * 3;
    const wobble = Math.sin(i * 1.7) * 18;
    return { date: iso, visitors: Math.round((level * weekday[d.getUTCDay()] + wobble) * share) };
  });
}

// Weekly cohorts by first visit. Later cohorts have fewer observed weeks because the data ends on 31 Jan 2021.
const cohortStarts = ["2020-12-14", "2020-12-21", "2020-12-28", "2021-01-04", "2021-01-11", "2021-01-18"];
const cohortSizes = [2100, 1980, 1860, 1740, 1620, 1500];
const cohortRates = [[100, 26, 21, 18, 16, 14, 13], [100, 29, 23, 19, 17, 15], [100, 24, 20, 17, 15], [100, 31, 25, 22], [100, 28, 23], [100, 30]];
export type Cohort = { start: string; size: number; weeks: number[] };

function cohortsFor(device: Device): Cohort[] {
  const ds = deviceScale(device);
  const shift = device === "Desktop" ? 2 : device === "Mobile" ? -2 : device === "Tablet" ? -3 : 0;
  return cohortStarts.map((start, i) => ({
    start,
    size: Math.round(cohortSizes[i] * ds.share),
    weeks: cohortRates[i].map((v, w) => (w === 0 ? 100 : Math.max(1, v + shift))),
  }));
}

/** Average retention for each week, weighted by cohort size, using only cohorts that reached that week. */
export function retentionCurve(cohorts: Cohort[]) {
  return Array.from({ length: 7 }, (_, w) => {
    const seen = cohorts.filter((c) => c.weeks[w] !== undefined);
    const people = seen.reduce((n, c) => n + c.size, 0);
    const kept = seen.reduce((n, c) => n + c.size * c.weeks[w] / 100, 0);
    return { week: w, rate: people ? kept / people * 100 : 0, cohorts: seen.length };
  });
}

export type View = {
  device: Device; period: Period; previousLabel: Period | null; days: number;
  totals: Totals; previous: Totals | null;
  daily: DayPoint[]; funnel: FunnelStep[];
  segments: Record<Dimension, Segment[]>;
  cohorts: Cohort[];
};

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

export function getView(device: Device, period: Period): View {
  const p = periodInfo[period];
  const totals = totalsFor(device, period);
  return {
    device, period, previousLabel: p.previous, days: p.days,
    totals,
    previous: p.previous ? totalsFor(device, p.previous) : null,
    daily: dailyFor(device, period),
    funnel: funnelFor(totals),
    segments: {
      Device: segmentsFor("Device", device, period),
      "Traffic source": reconcile(segmentsFor("Traffic source", device, period), totals),
      Country: reconcile(segmentsFor("Country", device, period), totals),
    },
    cohorts: cohortsFor(device),
  };
}

// ── Formatting helpers ──
export const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
export const pct = (r: number, digits = 1) => `${(r * 100).toFixed(digits)}%`;
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const shortDate = (iso: string) => `${Number(iso.slice(8, 10))} ${months[Number(iso.slice(5, 7)) - 1]}`;
export const longDate = (iso: string) => `${shortDate(iso)} ${iso.slice(0, 4)}`;
