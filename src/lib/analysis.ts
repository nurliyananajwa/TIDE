import type { Cohort, FunnelStep, Segment } from "./view";

// Calculations shared by more than one report. Each is done once here so two
// pages can never disagree about, say, which funnel step loses the most people.

export type FunnelRow = FunnelStep & {
  /** People at this step ÷ people at the first step */
  shareOfFirst: number;
  /** People at this step ÷ people at the previous step (null for the first step) */
  continueRate: number | null;
  /** People who left since the previous step (null for the first step) */
  lost: number | null;
  /** Name of the previous step (null for the first step) */
  from: string | null;
  isBiggestLoss: boolean;
  isWeakest: boolean;
};

export function analyseFunnel(steps: FunnelStep[]): FunnelRow[] {
  const rows = steps.map((s, i) => {
    const prev = i > 0 ? steps[i - 1] : null;
    return {
      ...s,
      shareOfFirst: s.people / steps[0].people,
      continueRate: prev ? s.people / prev.people : null,
      lost: prev ? prev.people - s.people : null,
      from: prev ? prev.name : null,
      isBiggestLoss: false,
      isWeakest: false,
    };
  });
  const later = rows.slice(1);
  later.reduce((b, r) => (r.lost! > b.lost! ? r : b)).isBiggestLoss = true;
  later.reduce((b, r) => (r.continueRate! < b.continueRate! ? r : b)).isWeakest = true;
  return rows;
}

/** Segments sorted by conversion rate, with the best and worst picked out. */
export function rankByConversion(segments: Segment[]) {
  const byRate = [...segments].sort((a, b) => b.rate - a.rate);
  const best = byRate[0], worst = byRate[byRate.length - 1];
  return { byRate, best, worst, ratio: best.rate / worst.rate };
}

/** Average retention for each week, weighted by cohort size, using only cohorts that reached that week. */
export function retentionCurve(cohorts: Cohort[]) {
  return Array.from({ length: 7 }, (_, w) => {
    const seen = cohorts.filter((c) => c.weeks[w] !== undefined);
    const people = seen.reduce((n, c) => n + c.size, 0);
    const kept = seen.reduce((n, c) => n + c.size * c.weeks[w] / 100, 0);
    return { week: w, rate: people ? kept / people * 100 : 0 };
  });
}
