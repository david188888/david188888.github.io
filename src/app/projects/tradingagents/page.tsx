import { TradingAgentsPageView } from "@/components/pages/TradingAgentsPageView";
import { defaultLocale } from "@/i18n/locales";
import { authorConfig } from "@/config/author";

export const metadata = {
  title: `TradingAgents | ${authorConfig.nameLocalized.zh}`,
  description: "面向 A 股研究的多智能体工作台，基于 TauricResearch/TradingAgents 扩展。",
};

export default function TradingAgentsPage() {
  return <TradingAgentsPageView locale={defaultLocale} />;
}
