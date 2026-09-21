import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { authorConfig } from "@/config/author";
import { StatsPageView } from "@/components/pages/StatsPageView";
import { isLocale, locales } from "@/i18n/locales";
import { getMessages } from "@/i18n/messages";

interface LocaleStatsPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: LocaleStatsPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const { stats } = getMessages(locale).pages;
  return {
    title: `${stats.title} | ${authorConfig.nameLocalized[locale]}`,
    robots: { index: false, follow: false },
  };
}

export default async function LocaleStatsPage({ params }: LocaleStatsPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return <StatsPageView locale={locale} />;
}
