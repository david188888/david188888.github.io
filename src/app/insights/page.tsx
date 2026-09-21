import { defaultLocale } from "@/i18n/locales";
import type { Metadata } from "next";
import { InsightsPageView } from "@/components/pages/InsightsPageView";
import { authorConfig } from "@/config/author";
import { getMessages } from "@/i18n/messages";

const { insights } = getMessages(defaultLocale).pages;

export const metadata: Metadata = {
  title: `${insights.metadataTitle} | ${authorConfig.nameLocalized.zh}`,
  description: insights.metadataDescription,
};

export default function InsightsPage() {
  return <InsightsPageView locale={defaultLocale} />;
}
