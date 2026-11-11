/** The five reports, in sidebar order. The single source for names, URLs and banner copy. */
export const reports = [
  { name: "Overview", slug: "overview", icon: "◫", lead: "An ocean of", question: "possibility.", line: "How many people visit, how many buy, and how that is changing." },
  { name: "Breakdowns", slug: "breakdowns", icon: "▥", lead: "Breakdowns.", question: "Who visits, and who buys?", line: "Compare visitors and conversion by device, traffic source and country." },
  { name: "Funnels", slug: "funnels", icon: "▽", lead: "Funnels.", question: "Where do buyers drop off?", line: "Follow visitors from viewing a product to completing a purchase." },
  { name: "Retention", slug: "retention", icon: "▦", lead: "Retention.", question: "Who comes back?", line: "Track how many new visitors return in the weeks after their first visit." },
  { name: "Insights", slug: "insights", icon: "✧", lead: "Insights.", question: "What should we act on?", line: "The three findings worth investigating first, with the evidence for each." },
] as const;

export type Report = typeof reports[number]["name"];
