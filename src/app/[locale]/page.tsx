import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HomePageView } from "@/components/pages/HomePageView";
import { isLocale, locales } from "@/i18n/locales";
import { getMessages } from "@/i18n/messages";

interface LocalePageProps {
  params: Promise<{
    locale: string;
  }>;
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const { home } = getMessages(locale).pages;
  return {
    title: home.metadataTitle,
    description: home.metadataDescription,
  };
}

export default async function LocaleHomePage({ params }: LocalePageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return <HomePageView locale={locale} />;
}
