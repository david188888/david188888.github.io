import { notFound } from "next/navigation";
import { SubpageShell } from "@/components/pages/SubpageViews";
import { isLocale } from "@/i18n/locales";

interface LocaleSubpageLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
}

export default async function LocaleSubpageLayout({
  children,
  params,
}: LocaleSubpageLayoutProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return <SubpageShell locale={locale}>{children}</SubpageShell>;
}
