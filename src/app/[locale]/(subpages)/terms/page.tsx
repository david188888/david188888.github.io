import { notFound } from "next/navigation";
import { TermsPageView } from "@/components/pages/SubpageViews";
import { isLocale, locales } from "@/i18n/locales";

interface LocaleSubpageProps {
  params: Promise<{
    locale: string;
  }>;
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleTermsPage({ params }: LocaleSubpageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return <TermsPageView locale={locale} />;
}
