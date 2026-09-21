import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { authorConfig } from "@/config/author";
import { TalksPageView } from "@/components/pages/SubpageViews";
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

  const { talks } = getMessages(locale).pages;
  return {
    title: `${talks.title} | ${authorConfig.nameLocalized[locale]}`,
    description: talks.description,
  };
}

export default async function LocaleTalksPage({ params }: LocaleSubpageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return <TalksPageView locale={locale} />;
}
