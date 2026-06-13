import { notFound } from "next/navigation";
import { PublicationsPageView } from "@/components/pages/SubpageViews";
import { isLocale, locales } from "@/i18n/locales";

interface LocaleSubpageProps {
  params: Promise<{
    locale: string;
  }>;
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocalePublicationsPage({
  params,
}: LocaleSubpageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return <PublicationsPageView locale={locale} />;
}
