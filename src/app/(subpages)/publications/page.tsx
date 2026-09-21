import type { Metadata } from "next";
import { defaultLocale } from "@/i18n/locales";
import { PublicationsPageView } from "@/components/pages/SubpageViews";
import { authorConfig } from "@/config/author";
import { getMessages } from "@/i18n/messages";

const { publications } = getMessages(defaultLocale).pages;

export function generateMetadata(): Metadata {
  return {
    title: `${publications.title} | ${authorConfig.nameLocalized.zh}`,
  };
}

export default function PublicationsPage() {
  return <PublicationsPageView locale={defaultLocale} />;
}
