import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InsightsPageView } from "@/components/pages/InsightsPageView";
import { isLocale, locales } from "@/i18n/locales";
import { getMessages } from "@/i18n/messages";

interface LocaleInsightsPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: LocaleInsightsPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const { insights } = getMessages(locale).pages;
  return {
    title: insights.metadataTitle,
    description: insights.metadataDescription,
  };
}

export default async function LocaleInsightsPage({
  params,
}: LocaleInsightsPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return <InsightsPageView locale={locale} />;
}
