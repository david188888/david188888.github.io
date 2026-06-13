import { notFound } from "next/navigation";
import { HomePageView } from "@/components/pages/HomePageView";
import { isLocale, locales } from "@/i18n/locales";

interface LocalePageProps {
  params: Promise<{
    locale: string;
  }>;
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleHomePage({ params }: LocalePageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return <HomePageView locale={locale} />;
}
