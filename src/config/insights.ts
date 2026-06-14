import type { Locale } from "@/i18n/locales";

export interface InsightEntry {
  title: string;
  category: string;
  cadence: string;
  description: string;
  tags: string[];
  href?: string;
}

export interface InsightContent {
  featuredInsight: {
    title: string;
    description: string;
  };
  entries: InsightEntry[];
}

export const localizedInsightContent: Record<Locale, InsightContent> = {
  en: {
    featuredInsight: {
      title: "Notes on companies, industries, and the reports that move them.",
      description:
        "A public notebook for analysis that does not fit inside a CV: industry structure, company strategy, and reactions to important reporting.",
    },
    entries: [
      {
        title: "Industry Notes",
        category: "Industry analysis",
        cadence: "Long-form essays",
        description:
          "Structured notes on technology cycles, market structure, AI infrastructure, consumer platforms, and the incentives behind major shifts.",
        tags: ["AI", "Platforms", "Markets"],
      },
      {
        title: "Company Briefs",
        category: "Company analysis",
        cadence: "Case studies",
        description:
          "Focused memos on individual companies, covering product direction, business model changes, competitive position, and execution risks.",
        tags: ["Strategy", "Products", "Execution"],
      },
      {
        title: "Reported Signals",
        category: "News commentary",
        cadence: "Short responses",
        description:
          "Fast reactions to notable reporting, earnings calls, interviews, and policy moves, with emphasis on what actually changes.",
        tags: ["News", "Earnings", "Policy"],
      },
    ],
  },
  zh: {
    featuredInsight: {
      title: "关于公司、行业和关键报道的观察笔记。",
      description:
        "这里是我公开整理分析的地方，内容包括行业结构、公司战略，以及对重要报道的判断，不局限于简历能承载的信息。",
    },
    entries: [
      {
        title: "行业笔记",
        category: "行业分析",
        cadence: "长文随笔",
        description:
          "系统记录技术周期、市场结构、AI 基础设施、消费平台，以及重大变化背后的激励机制。",
        tags: ["AI", "平台", "市场"],
      },
      {
        title: "公司简报",
        category: "公司分析",
        cadence: "案例研究",
        description:
          "围绕单家公司撰写备忘录，关注产品方向、商业模式变化、竞争位置和执行风险。",
        tags: ["战略", "产品", "执行"],
      },
      {
        title: "报道信号",
        category: "新闻评论",
        cadence: "短评回应",
        description:
          "快速回应重要报道、财报电话会、访谈和政策动向，重点判断真正发生变化的部分。",
        tags: ["新闻", "财报", "政策"],
      },
    ],
  },
};

export function getInsightContent(locale: Locale): InsightContent {
  return localizedInsightContent[locale];
}

export const insightEntries = localizedInsightContent.en.entries;
export const featuredInsight = localizedInsightContent.en.featuredInsight;
