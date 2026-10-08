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
        ? "A multi-agent workbench for China A-share company research, combining specialist analysis, independent challenges and programmatic checks into linked judgements, evidence and open questions."
        : "面向 A 股公司研究的多 Agent 工作台，结合专项分析、独立挑战与程序核查，组织研究判断、依据和待查问题。",
  };
}

export default async function LocaleTradingAgentsPage({ params }: LocaleTradingAgentsPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return <TradingAgentsPageView locale={locale} />;
}
