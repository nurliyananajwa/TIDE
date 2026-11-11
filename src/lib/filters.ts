import { devices, dimensions, periods, type DeviceId, type DimensionId, type Filters, type PeriodId } from "./view";

// Filters live in the URL (?device=mobile&period=2021-01) so a report can be
// linked, bookmarked and rendered on the server.

export const defaultFilters: Filters = { device: "all", period: "2020-12" };
export const defaultDimension: DimensionId = "source";

type SearchParams = Record<string, string | string[] | undefined>;

/** Returns `value` only if it is one of the allowed ids; anything else (missing, repeated, mistyped) gives the fallback. */
function pick<T extends string>(value: string | string[] | undefined, allowed: readonly { id: T }[], fallback: T): T {
  return allowed.find((o) => o.id === value)?.id ?? fallback;
}

export function parseFilters(params: SearchParams): Filters {
  return {
    device: pick<DeviceId>(params.device, devices, defaultFilters.device),
    period: pick<PeriodId>(params.period, periods, defaultFilters.period),
  };
}

export function parseDimension(params: SearchParams): DimensionId {
  return pick<DimensionId>(params.by, dimensions, defaultDimension);
}

/** Query string for a link that keeps the current filters, e.g. "?device=mobile". Defaults are left out. */
export function filterQuery(filters: Filters, extra: Record<string, string> = {}) {
  const q = new URLSearchParams();
  if (filters.device !== defaultFilters.device) q.set("device", filters.device);
  if (filters.period !== defaultFilters.period) q.set("period", filters.period);
  for (const [k, v] of Object.entries(extra)) q.set(k, v);
  const s = q.toString();
  return s ? `?${s}` : "";
}
