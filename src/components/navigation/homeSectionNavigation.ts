import { type Locale } from "@/i18n/locales";

export const homeSectionNavigation = [
  { id: "profile", labels: { en: "Profile", zh: "主页" } },
  { id: "education", labels: { en: "Education", zh: "教育" } },
  { id: "research", labels: { en: "Research", zh: "研究" } },
  { id: "experience", labels: { en: "Experience", zh: "经历" } },
  { id: "insights", labels: { en: "Insights", zh: "随笔" } },
] as const satisfies readonly {
  id: string;
  labels: Record<Locale, string>;
}[];

export type HomeSectionId = (typeof homeSectionNavigation)[number]["id"];
