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
  contributions: readonly OpenSourceContribution[];
}

export interface CompetitionRecord {
  id: string;
  name: LocalizedText;
  award: LocalizedText;
  topic?: LocalizedText;
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
  screenshot: "/images/tradingagents-console.png",
  screenshotWidth: 3008,
  screenshotHeight: 1472,
} as const;

export const openSourceProjects: readonly OpenSourceProject[] = [
  {
    id: "proma",
    name: "Proma",
    projectUrl: "https://github.com/proma-ai/Proma",
    lead: {
      en: "Fixes for Skill scanning and Markdown link detection in an open-source desktop agent.",
      zh: "为开源桌面 Agent 软件修复 Skill 扫描与 Markdown 链接识别问题。",
    },
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
    topic: {
      en: "Olympic medal table model: statistical modeling, machine learning, and uncertainty analysis of medal prediction and its drivers.",
      zh: "奥运奖牌表模型：结合统计建模、机器学习与不确定性分析，研究奖牌预测及其影响因素。",
    },
    repositoryUrl: "https://github.com/david188888/2025-MCM-ICM",
  },
  {
    id: "mathorcup-2023",
    name: {
      en: "13th MathorCup University Mathematical Modeling Challenge 2023",
      zh: "2023 年第十三届 MathorCup 高校数学建模挑战赛",
    },
    award: { en: "Second Prize (Undergraduate Group)", zh: "本科生组二等奖" },
    topic: {
      en: "Logistics network scheduling, transport, and structural optimization with the NSGA-II genetic algorithm.",
      zh: "基于 NSGA-II 遗传算法的物流网络调度运输和结构优化问题。",
    },
    repositoryUrl: "https://github.com/david188888/2023-mathorcup-C",
  },
  {
    id: "gd-cumcm-2023",
    name: {
      en: "2023 Guangdong Provincial Mathematical Modeling Contest, Guangdong Division of the National Contest (CUMCM)",
      zh: "2023 年广东省大学生数学建模竞赛暨全国大学生数学建模竞赛广东省分赛",
    },
    award: { en: "Second Prize (Undergraduate Group)", zh: "二等奖（本科组）" },
  },
];

export function getOpenSourceProjects(locale: Locale) {
  return openSourceProjects.map((project) => ({
    id: project.id,
    name: project.name,
    projectUrl: project.projectUrl,
    lead: project.lead[locale],
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
    topic: record.topic ? record.topic[locale] : null,
    repositoryUrl: record.repositoryUrl,
  }));
}
