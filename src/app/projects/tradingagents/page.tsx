import { TradingAgentsPageView } from "@/components/pages/TradingAgentsPageView";
import { defaultLocale } from "@/i18n/locales";

export const metadata = {
  title: "TradingAgents",
  description: "面向 A 股研究的多智能体工作台，基于 TauricResearch/TradingAgents 扩展。",
};

export default function TradingAgentsPage() {
  return <TradingAgentsPageView locale={defaultLocale} />;
}
