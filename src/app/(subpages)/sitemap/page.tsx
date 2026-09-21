import type { Metadata } from "next";
import { defaultLocale } from "@/i18n/locales";
import { SitemapPageView } from "@/components/pages/SubpageViews";
import { authorConfig } from "@/config/author";
import { getMessages } from "@/i18n/messages";

const { sitemap } = getMessages(defaultLocale).pages;

export function generateMetadata(): Metadata {
  return {
    title: `${sitemap.title} | ${authorConfig.nameLocalized.zh}`,
  };
}

export default function SitemapPage() {
  return <SitemapPageView locale={defaultLocale} />;
}
