import type { Metadata } from "next";
import { defaultLocale } from "@/i18n/locales";
import { TeachingPageView } from "@/components/pages/SubpageViews";
import { authorConfig } from "@/config/author";
import { getMessages } from "@/i18n/messages";

const { teaching } = getMessages(defaultLocale).pages;

export function generateMetadata(): Metadata {
  return {
    title: `${teaching.title} | ${authorConfig.nameLocalized.zh}`,
    description: teaching.description,
  };
}

export default function TeachingPage() {
  return <TeachingPageView locale={defaultLocale} />;
}
