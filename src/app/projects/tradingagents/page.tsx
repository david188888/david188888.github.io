import { TradingAgentsPageView } from "@/components/pages/TradingAgentsPageView";
import { defaultLocale } from "@/i18n/locales";
import { authorConfig } from "@/config/author";

export const metadata = {
  title: `TradingAgents | ${authorConfig.nameLocalized.zh}`,
  description: "面向 A 股公司研究的多 Agent 工作台，结合专项分析、独立挑战与程序核查，组织研究判断、依据和待查问题。",
};

export default function TradingAgentsPage() {
  return <TradingAgentsPageView locale={defaultLocale} />;
}
