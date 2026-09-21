import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { authorConfig } from "@/config/author";
import { PublicationsPageView } from "@/components/pages/SubpageViews";
import { isLocale, locales } from "@/i18n/locales";
import { getMessages } from "@/i18n/messages";

interface LocaleSubpageProps {
  params: Promise<{
    locale: string;
  }>;
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: LocaleSubpageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const { publications } = getMessages(locale).pages;
  return {
    title: `${publications.title} | ${authorConfig.nameLocalized[locale]}`,
  };
}

export default async function LocalePublicationsPage({
  params,
}: LocaleSubpageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return <PublicationsPageView locale={locale} />;
}
