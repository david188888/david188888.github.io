import type { Metadata } from "next";
import { defaultLocale } from "@/i18n/locales";
import { TalksPageView } from "@/components/pages/SubpageViews";
import { authorConfig } from "@/config/author";
import { getMessages } from "@/i18n/messages";

const { talks } = getMessages(defaultLocale).pages;

export function generateMetadata(): Metadata {
  return {
    title: `${talks.title} | ${authorConfig.nameLocalized.zh}`,
    description: talks.description,
  };
}

export default function TalksPage() {
  return <TalksPageView locale={defaultLocale} />;
}
