import type { Metadata } from "next";
import { defaultLocale } from "@/i18n/locales";
import { CVPageView } from "@/components/pages/SubpageViews";
import { authorConfig } from "@/config/author";
import { getMessages } from "@/i18n/messages";

const { cv } = getMessages(defaultLocale).pages;

export function generateMetadata(): Metadata {
  return {
    title: `${cv.title} | ${authorConfig.nameLocalized.zh}`,
  };
}

export default function CVPage() {
  return <CVPageView locale={defaultLocale} />;
}
