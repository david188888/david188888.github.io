import type { Locale } from "@/i18n/locales";

type LocalizedText = Record<Locale, string>;

export type PublicationCategory = "conferences" | "manuscripts" | "books";

export interface EducationRecord {
  id: string;
  period: LocalizedText;
  institution: LocalizedText;
  degree: LocalizedText;
  description: LocalizedText;
  cvSupplement?: LocalizedText;
  cvDegree?: LocalizedText;
  incomingSummary?: { label: LocalizedText; value: LocalizedText };
}

export interface InternshipRecord {
  id: string;
  period: LocalizedText;
  company: LocalizedText;
  role: LocalizedText;
  location: LocalizedText;
  description: LocalizedText;
}

export interface PublicationRecord {
  id: string;
  date: string;
  paperUrl: string;
  category: PublicationCategory;
  venue: LocalizedText;
  authorship: LocalizedText;
  title: LocalizedText;
  description: LocalizedText;
}

export const publicationCategoryOrder: readonly PublicationCategory[] = [
  "conferences",
  "manuscripts",
  "books",
];

export const educationRecords: readonly EducationRecord[] = [
  {
    id: "scnu-beng",
    period: { en: "Bachelor's Degree", zh: "本科" },
    institution: { en: "South China Normal University", zh: "华南师范大学" },
    degree: { en: "B.Eng. in Software Engineering", zh: "软件工程工学学士" },
    description: { en: "Overall GPA: 4.06.", zh: "综合 GPA：4.06。" },
    cvSupplement: { en: "GPA: 4.06", zh: "GPA：4.06" },
  },
  {
    id: "cuhksz-msc-data-science",
    period: { en: "Matriculation: Sep 2026", zh: "预计 2026 年 9 月入学" },
    institution: {
      en: "The Chinese University of Hong Kong, Shenzhen",
      zh: "香港中文大学（深圳）",
    },
    degree: { en: "Master of Science in Data Science", zh: "数据科学理学硕士" },
    cvDegree: { en: "M.Sc. in Data Science", zh: "数据科学理学硕士" },
    description: {
      en: "Enrollment scheduled for September 2026.",
      zh: "预计于 2026 年 9 月开始硕士阶段学习。",
    },
    incomingSummary: {
      label: { en: "Incoming 2026", zh: "2026 年入学" },
      value: {
        en: "CUHK-Shenzhen · M.Sc. Data Science",
        zh: "香港中文大学（深圳）· 数据科学理学硕士",
      },
    },
  },
];

export const internshipRecords: readonly InternshipRecord[] = [
  {
    id: "insta360-speech-algorithm",
    period: { en: "Feb 2026 - Jun 2026", zh: "2026 年 2 月 - 2026 年 6 月" },
    company: { en: "Insta360", zh: "Insta360" },
    role: { en: "Speech Algorithm Intern", zh: "语音算法实习生" },
    location: { en: "Shenzhen, China", zh: "中国深圳" },
    description: {
      en: "Developing production-grade speech algorithms and optimizing low-latency model inference for voice applications.",
      zh: "参与生产级语音算法开发，并针对语音应用优化低时延模型推理能力。",
    },
  },
  {
    id: "amphion-r-and-d",
    period: { en: "Jun 2025 - Sep 2025", zh: "2025 年 6 月 - 2025 年 9 月" },
    company: { en: "Amphion Technology", zh: "Amphion Technology" },
    role: { en: "R&D Intern", zh: "研发实习生" },
    location: { en: "Shenzhen, China", zh: "中国深圳" },
    description: {
      en: "Developed core algorithms for a voice-cloning application and supported backend model integration for video translation.",
      zh: "为语音克隆应用开发核心算法，并支持视频翻译场景中的后端模型集成。",
    },
  },
];

export const publicationRecords: readonly PublicationRecord[] = [
  {
    id: "voxsafebench",
    date: "2026-04-01",
    paperUrl: "https://arxiv.org/abs/2604.14548",
    category: "conferences",
    venue: { en: "NeurIPS 2026 · Under Review", zh: "NeurIPS 2026 · 审稿中" },
    authorship: { en: "Second author", zh: "第二作者" },
    title: {
      en: "VoxSafeBench: Not Just What Is Said, but Who, How, and Where",
      zh: "VoxSafeBench：不仅评估说了什么，也评估谁、如何以及在何处表达",
    },
    description: {
      en: "Introduced a benchmark for evaluating social alignment in speech language models across safety, fairness, and privacy dimensions.",
      zh: "提出用于评估语音语言模型社会对齐能力的基准，覆盖安全、公平与隐私维度。",
    },
  },
  {
    id: "voxprivacy",
    date: "2026-01-01",
    paperUrl: "https://arxiv.org/abs/2601.19956",
    category: "conferences",
    venue: { en: "ICLR 2026 · Poster", zh: "ICLR 2026 · 海报" },
    authorship: { en: "Second author", zh: "第二作者" },
    title: {
      en: "VoxPrivacy: A Benchmark for Evaluating Interactional Privacy of Speech Language Models",
      zh: "VoxPrivacy：评估语音语言模型交互隐私的基准",
    },
    description: {
      en: "Introduced a multi-user benchmark for measuring interactional privacy risks in speech-language models.",
      zh: "提出面向多用户场景的基准，用于衡量语音语言模型的交互隐私风险。",
    },
  },
  {
    id: "dialoggraph-llm",
    date: "2025-06-01",
    paperUrl: "https://arxiv.org/abs/2511.11000",
    category: "conferences",
    venue: { en: "ECAI 2025 · Oral", zh: "ECAI 2025 · 口头报告" },
    authorship: { en: "First author", zh: "第一作者" },
    title: {
      en: "DialogGraph-LLM: Graph-Informed LLMs for End-to-End Audio Dialogue Intent Recognition",
      zh: "DialogGraph-LLM：面向端到端音频对话意图识别的图增强大语言模型",
    },
    description: {
      en: "Proposed a graph-informed framework for end-to-end intent recognition in spoken dialogue.",
      zh: "提出图增强框架，用于端到端语音对话意图识别。",
    },
  },
  {
    id: "msmt-fn",
    date: "2025-01-01",
    paperUrl: "https://arxiv.org/abs/2511.11006",
    category: "conferences",
    venue: { en: "ADMA 2025 · Poster", zh: "ADMA 2025 · 海报" },
    authorship: { en: "First author", zh: "第一作者" },
    title: {
      en: "Multi-segment Multitask Fusion Network for Marketing Audio Classification",
      zh: "面向营销音频分类的多片段多任务融合网络",
    },
    description: {
      en: "Proposed MSMT-FN for marketing-call attitude classification, achieving stronger results than prior baselines.",
      zh: "提出 MSMT-FN 用于营销通话态度分类，相比既有基线取得更优结果。",
    },
  },
];

function localized(value: LocalizedText, locale: Locale): string {
  return value[locale];
}

function removeTerminalPunctuation(value: string): string {
  return value.trim().replace(/[.!?。！？]$/, "");
}

function lowerCaseFirst(value: string): string {
  return value ? `${value[0].toLocaleLowerCase()}${value.slice(1)}` : value;
}

export function getHomeEducation(locale: Locale) {
  return educationRecords.map((record) => ({
    id: record.id,
    time: localized(record.period, locale),
    title: localized(record.institution, locale),
    meta: localized(record.degree, locale),
    description: localized(record.description, locale),
  }));
}

export function getCvEducation(locale: Locale) {
  return educationRecords.map((record) => ({
    id: record.id,
    school: localized(record.institution, locale),
    detail: `${localized(record.cvDegree ?? record.degree, locale)} · ${localized(record.cvSupplement ?? record.period, locale)}`,
  }));
}

export function getIncomingEducation(locale: Locale) {
  const summary = educationRecords.find((record) => record.incomingSummary)?.incomingSummary;
  if (!summary) throw new Error("Missing incoming education summary.");
  return { label: localized(summary.label, locale), value: localized(summary.value, locale) };
}

export function getHomeInternships(locale: Locale) {
  return internshipRecords.map((record) => ({
    id: record.id,
    time: localized(record.period, locale),
    title: `${localized(record.company, locale)} · ${localized(record.role, locale)}`,
    meta: localized(record.location, locale),
    description: localized(record.description, locale),
  }));
}

export function getCvInternships(locale: Locale) {
  return internshipRecords.map((record) => ({
    id: record.id,
    role: `${localized(record.company, locale)} · ${localized(record.role, locale)}`,
    detail: `${localized(record.location, locale)} · ${localized(record.period, locale)}`,
  }));
}

export function getHomePublications(locale: Locale) {
  return publicationRecords.map((record) => ({
    id: record.id,
    venue: localized(record.venue, locale),
    authorship: localized(record.authorship, locale),
    title: localized(record.title, locale),
    description: localized(record.description, locale),
    paperUrl: record.paperUrl,
  }));
}

export function getCvPublications(locale: Locale) {
  return publicationRecords.map((record) => {
    const authorship = localized(record.authorship, locale);
    return {
      id: record.id,
      title: localized(record.title, locale),
      permalink: record.paperUrl,
      venue: localized(record.venue, locale),
      date: record.date,
      excerpt: locale === "zh" ? `${authorship}。` : `${authorship}.`,
      paperUrl: record.paperUrl,
    };
  });
}

export function getPublicationArchive(locale: Locale) {
  return publicationRecords.map((record) => {
    const description = removeTerminalPunctuation(localized(record.description, locale));
    const authorship = localized(record.authorship, locale);
    return {
      id: record.id,
      title: localized(record.title, locale),
      permalink: record.paperUrl,
      venue: localized(record.venue, locale),
      date: record.date,
      excerpt:
        locale === "zh"
          ? `${description}；${authorship}。`
          : `${description}; ${lowerCaseFirst(authorship)}.`,
      paperUrl: record.paperUrl,
      category: record.category,
    };
  });
}
