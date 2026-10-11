import type { Locale } from "@/i18n/locales";

type LocalizedText = Record<Locale, string>;

export interface OpenSourceContribution {
  id: string;
  pullRequestUrl: string;
  summary: LocalizedText;
  merged: boolean;
}

export interface OpenSourceProject {
  id: string;
  name: string;
  projectUrl: string;
  lead: LocalizedText;
  stars?: { count: number; asOf: string };
  contributions: readonly OpenSourceContribution[];
}

export interface CompetitionRecord {
  id: string;
  name: LocalizedText;
  award: LocalizedText;
  awardTopPercent: LocalizedText;
  topic?: LocalizedText;
  reportUrl: string;
  repositoryUrl?: string;
}

/**
 * Fork of TauricResearch/TradingAgents, extended for A-share research.
 * Only the extension is described on the site; upstream architecture is credited
 * as upstream.
 */
export const tradingAgentsProject = {
  name: "TradingAgents",
  repositoryUrl: "https://github.com/david188888/TradingAgents",
  upstreamUrl: "https://github.com/TauricResearch/TradingAgents",
  detailHref: "/projects/tradingagents/",
  screenshot: "/images/tradingagents-demo-poster-20261008.jpg",
  screenshotWidth: 1920,
  screenshotHeight: 1080,
  demoVideo: "/videos/tradingagents-demo-20261008.mp4",
} as const;

export const openSourceProjects: readonly OpenSourceProject[] = [
  {
    id: "proma",
    name: "Proma",
    projectUrl: "https://github.com/proma-ai/Proma",
    lead: {
      en: "An open-source desktop AI Agent workspace for research, coding, and knowledge management, with an integrated browser, terminal, and support for Skills and MCP tools.",
      zh: "开源桌面 AI Agent 工作台，集成浏览器、终端与 Skills / MCP 工具，支持研究、编程和知识管理。",
    },
    stars: { count: 2220, asOf: "2026-10-11" },
    contributions: [
      {
        id: "proma-1147",
        pullRequestUrl: "https://github.com/proma-ai/Proma/pull/1147",
        summary: {
          en: "Fixed broken symlinks aborting the whole Skill scan.",
          zh: "修复失效符号链接导致 Skill 扫描中断的问题。",
        },
        merged: true,
      },
      {
        id: "proma-1148",
        pullRequestUrl: "https://github.com/proma-ai/Proma/pull/1148",
        summary: {
          en: "Fixed Markdown file names being parsed as URLs; added regression tests.",
          zh: "修复 Markdown 文件名被误识别为网址的问题，并补充回归测试。",
        },
        merged: true,
      },
    ],
  },
];

export const competitionRecords: readonly CompetitionRecord[] = [
  {
    id: "mcm-2025",
    name: {
      en: "2025 Mathematical Contest in Modeling (MCM)",
      zh: "2025 Mathematical Contest in Modeling（MCM，美国大学生数学建模竞赛）",
    },
    award: { en: "Honorable Mention", zh: "Honorable Mention（H 奖）" },
    awardTopPercent: { en: "Top 32%", zh: "获奖比例前约 32%" },
    topic: {
      en: "Olympic medal table model: statistical modeling, machine learning, and uncertainty analysis of medal prediction and its drivers.",
      zh: "奥运奖牌表模型：结合统计建模、机器学习与不确定性分析，研究奖牌预测及其影响因素。",
    },
    repositoryUrl: "https://github.com/david188888/2025-MCM-ICM",
    reportUrl: "/files/reports/2025-mcm-c-report.pdf",
  },
  {
    id: "mathorcup-2023",
    name: {
      en: "13th MathorCup University Mathematical Modeling Challenge 2023",
      zh: "2023 年第十三届 MathorCup 高校数学建模挑战赛",
    },
    award: { en: "Second Prize (Undergraduate Group)", zh: "本科生组二等奖" },
    awardTopPercent: { en: "Top 20–21%", zh: "获奖比例前约 20–21%" },
    topic: {
      en: "Logistics network scheduling, transport, and structural optimization with the NSGA-II genetic algorithm.",
      zh: "基于 NSGA-II 遗传算法的物流网络调度运输和结构优化问题。",
    },
    repositoryUrl: "https://github.com/david188888/2023-mathorcup-C",
    reportUrl: "/files/reports/2023-mathorcup-c-report.pdf",
  },
  {
    id: "gd-cumcm-2023",
    name: {
      en: "2023 Guangdong Provincial Mathematical Modeling Contest, Guangdong Division of the National Contest (CUMCM)",
      zh: "2023 年广东省大学生数学建模竞赛暨全国大学生数学建模竞赛广东省分赛",
    },
    award: { en: "Second Prize (Undergraduate Group)", zh: "二等奖（本科组）" },
    awardTopPercent: { en: "Top 25%", zh: "获奖比例前约 25%" },
    topic: {
      en: "Vegetable pricing and replenishment: used three years of sales and wholesale-price data with kernel density estimation, XGBoost forecasting, nonparametric regression, and an improved genetic algorithm to jointly optimize pricing and stock quantities under operating constraints.",
      zh: "蔬菜类商品的自动定价与补货决策：基于三年的销售与批发价格数据，结合核密度估计、XGBoost 预测、非参数回归与改进遗传算法，在经营约束下联合优化定价与补货量。",
    },
    reportUrl: "/files/reports/2023-cumcm-c-report.pdf",
  },
];

export function getOpenSourceProjects(locale: Locale) {
  return openSourceProjects.map((project) => ({
    id: project.id,
    name: project.name,
    projectUrl: project.projectUrl,
    lead: project.lead[locale],
    stars: project.stars,
    contributions: project.contributions.map((contribution) => ({
      id: contribution.id,
      pullRequestUrl: contribution.pullRequestUrl,
      summary: contribution.summary[locale],
      merged: contribution.merged,
    })),
  }));
}

export function getCompetitionRecords(locale: Locale) {
  return competitionRecords.map((record) => ({
    id: record.id,
    name: record.name[locale],
    award: record.award[locale],
    awardTopPercent: record.awardTopPercent[locale],
    topic: record.topic ? record.topic[locale] : null,
    repositoryUrl: record.repositoryUrl,
    reportUrl: record.reportUrl,
  }));
}
