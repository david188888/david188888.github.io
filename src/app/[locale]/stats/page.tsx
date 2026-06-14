import { notFound } from "next/navigation";
import { StatsPageView } from "@/components/pages/StatsPageView";
import { isLocale, locales } from "@/i18n/locales";

interface LocaleStatsPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleStatsPage({ params }: LocaleStatsPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return <StatsPageView locale={locale} />;
}
