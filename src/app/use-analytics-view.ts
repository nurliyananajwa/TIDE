"use client";

import { useEffect, useState } from "react";
import { getView, type Device, type Period, type View } from "./demo-data";

/** Start immediately with verified SQL aggregates, then refresh from the server. */
export function useAnalyticsView(device: Device, period: Period): View {
  const [result, setResult] = useState<View | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/analytics?${new URLSearchParams({ device, period })}`, { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error("Report unavailable"); return response.json(); })
      .then((view: View) => { if (!controller.signal.aborted) setResult(view); })
      .catch(() => { /* The verified historical snapshot remains available offline. */ });
    return () => controller.abort();
  }, [device, period]);
  return result?.device === device && result.period === period ? result : getView(device, period);
}
