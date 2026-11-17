import type { View } from "../demo-data";

export const oceanStages = [
  { id: "discovery", name: "Discovery", x: -24, z: -6, scale: 1.1, lead: "Where the", title: "journey begins.", description: "Explore the people arriving at your shore." },
  { id: "engagement", name: "Engagement", x: -4, z: -27, scale: 0.95, lead: "From interest", title: "to action.", description: "See how visitors explore products and take the next step." },
  { id: "conversion", name: "Conversion", x: 26, z: -5, scale: 0.85, lead: "The path", title: "to purchase.", description: "Follow the purchase funnel and find where people leave." },
  { id: "return", name: "Return", x: 3, z: 22, scale: 1.05, lead: "A reason", title: "to return.", description: "Discover who comes back and how long the connection lasts." },
] as const;

export type OceanStageId = typeof oceanStages[number]["id"];

export function stageMetric(id: OceanStageId, view: View) {
  switch (id) {
    case "discovery": return { value: view.totals.visitors, unit: "visitors" };
    case "engagement": return { value: view.funnel[0].people, unit: "product viewers" };
    case "conversion": return { value: view.totals.purchasers, unit: "purchasers" };
    case "return": return { value: view.totals.returning, unit: "returning visitors" };
  }
}
