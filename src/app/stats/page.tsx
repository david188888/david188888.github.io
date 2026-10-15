import type { Metadata } from "next";
import { defaultLocale } from "@/i18n/locales";
import { StatsPageView } from "@/components/pages/StatsPageView";
import { authorConfig } from "@/config/author";
import { getMessages } from "@/i18n/messages";

const { stats } = getMessages(defaultLocale).pages;

// Dashboard entry and optional author tools: keep it out of search results.
export const metadata: Metadata = {
  title: `${stats.title} | ${authorConfig.nameLocalized.zh}`,
  robots: { index: false, follow: false },
};

export default function StatsPage() {
  return <StatsPageView locale={defaultLocale} />;
}
