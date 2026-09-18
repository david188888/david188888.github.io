import { notFound } from "next/navigation";
import { TradingAgentsPageView } from "@/components/pages/TradingAgentsPageView";
import { isLocale, locales } from "@/i18n/locales";

interface LocaleTradingAgentsPageProps {
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LocaleTradingAgentsPageProps) {
  const { locale } = await params;
  return {
    title: "TradingAgents",
    description:
      locale === "en"
        ? "A multi-agent research workspace for the A-share market, built on TauricResearch/TradingAgents."
        : "面向 A 股研究的多智能体工作台，基于 TauricResearch/TradingAgents 扩展。",
  };
}

export default async function LocaleTradingAgentsPage({ params }: LocaleTradingAgentsPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return <TradingAgentsPageView locale={locale} />;
}
