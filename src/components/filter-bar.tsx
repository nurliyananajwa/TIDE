"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { defaultFilters } from "@/lib/filters";
import { devices, periods, type Filters } from "@/lib/view";

/** Device and month selectors. Changing one updates the URL, and the server re-renders the report. */
export function FilterBar({ filters }: { filters: Filters }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function set(key: keyof Filters, value: string) {
    const next = new URLSearchParams(params);
    if (value === defaultFilters[key]) next.delete(key); else next.set(key, value);
    const q = next.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  }

  return (
    <div className="filters">
      <label><span className="tc-filter-label">Device</span>
        <select value={filters.device} onChange={(e) => set("device", e.target.value)}>{devices.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}</select>
      </label>
      <label><span className="tc-filter-label">Period</span>
        <select value={filters.period} onChange={(e) => set("period", e.target.value)}>{periods.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}</select>
      </label>
    </div>
  );
}
