export interface InsightEntry {
  title: string;
  category: string;
  cadence: string;
  description: string;
  tags: string[];
  href?: string;
}

export const insightEntries: InsightEntry[] = [
  {
    title: "Industry Notes",
    category: "Industry analysis",
    cadence: "Long-form essays",
    description:
      "Structured notes on technology cycles, market structure, AI infrastructure, consumer platforms, and the incentives behind major shifts.",
    tags: ["AI", "Platforms", "Markets"],
  },
  {
    title: "Company Briefs",
    category: "Company analysis",
    cadence: "Case studies",
    description:
      "Focused memos on individual companies, covering product direction, business model changes, competitive position, and execution risks.",
    tags: ["Strategy", "Products", "Execution"],
  },
  {
    title: "Reported Signals",
    category: "News commentary",
    cadence: "Short responses",
    description:
      "Fast reactions to notable reporting, earnings calls, interviews, and policy moves, with emphasis on what actually changes.",
    tags: ["News", "Earnings", "Policy"],
  },
];

export const featuredInsight = {
  title: "Notes on companies, industries, and the reports that move them.",
  description:
    "A public notebook for analysis that does not fit inside a CV: industry structure, company strategy, and reactions to important reporting.",
} as const;
