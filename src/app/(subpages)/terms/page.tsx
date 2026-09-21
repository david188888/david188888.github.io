import type { Metadata } from "next";
import { defaultLocale } from "@/i18n/locales";
import { TermsPageView } from "@/components/pages/SubpageViews";
import { authorConfig } from "@/config/author";
import { getMessages } from "@/i18n/messages";

const { terms } = getMessages(defaultLocale).pages;

export function generateMetadata(): Metadata {
  return {
    title: `${terms.title} | ${authorConfig.nameLocalized.zh}`,
  };
}

export default function TermsPage() {
  return <TermsPageView locale={defaultLocale} />;
}
