import type { Locale } from "@/i18n/locales";
import { describe, expect, it } from "vitest";
import type { EducationRecord } from "../profile";
import {
  educationRecords,
  getCvEducation,
  getCvInternships,
  getCvPublications,
  getHomeEducation,
  getHomeInternships,
  getHomePublications,
  getIncomingEducation,
  getPublicationArchive,
  internshipRecords,
  publicationCategoryOrder,
  publicationRecords,
} from "../profile";

const locales = ["en", "zh"] as const satisfies readonly Locale[];

const selectorFixtures = {
  en: {
    getHomeEducation: [
      {
        id: "scnu-beng",
        time: "Bachelor's Degree",
        title: "South China Normal University",
        meta: "B.Eng. in Software Engineering",
        description: "Overall GPA: 4.06.",
      },
      {
        id: "cuhksz-msc-data-science",
        time: "Matriculation: Sep 2026",
        title: "The Chinese University of Hong Kong, Shenzhen",
        meta: "Master of Science in Data Science",
        description: "Enrollment scheduled for September 2026.",
      },
    ],
    getCvEducation: [
      {
        id: "scnu-beng",
        school: "South China Normal University",
        detail: "B.Eng. in Software Engineering · GPA: 4.06",
      },
      {
        id: "cuhksz-msc-data-science",
        school: "The Chinese University of Hong Kong, Shenzhen",
        detail: "M.Sc. in Data Science · Matriculation: Sep 2026",
      },
    ],
    getIncomingEducation: {
      label: "Incoming 2026",
      value: "CUHK-Shenzhen · M.Sc. Data Science",
    },
    getHomeInternships: [
      {
        id: "insta360-speech-algorithm",
        time: "Feb 2026 - Jun 2026",
        title: "Insta360 · Speech Algorithm Intern",
        meta: "Shenzhen, China",
        description:
          "Developing production-grade speech algorithms and optimizing low-latency model inference for voice applications.",
      },
      {
        id: "amphion-r-and-d",
        time: "Jun 2025 - Sep 2025",
        title: "Amphion Technology · R&D Intern",
        meta: "Shenzhen, China",
        description:
          "Developed core algorithms for a voice-cloning application and supported backend model integration for video translation.",
      },
    ],
    getCvInternships: [
      {
        id: "insta360-speech-algorithm",
        role: "Insta360 · Speech Algorithm Intern",
        detail: "Shenzhen, China · Feb 2026 - Jun 2026",
      },
      {
        id: "amphion-r-and-d",
        role: "Amphion Technology · R&D Intern",
        detail: "Shenzhen, China · Jun 2025 - Sep 2025",
      },
    ],
    getHomePublications: [
      {
        id: "voxsafebench",
        venue: "NeurIPS 2026 · Under Review",
        authorship: "Second author",
        title: "VoxSafeBench: Not Just What Is Said, but Who, How, and Where",
        description:
          "Introduced a benchmark for evaluating social alignment in speech language models across safety, fairness, and privacy dimensions.",
        paperUrl: "https://arxiv.org/abs/2604.14548",
      },
      {
        id: "voxprivacy",
        venue: "ICLR 2026 · Poster",
        authorship: "Second author",
        title: "VoxPrivacy: A Benchmark for Evaluating Interactional Privacy of Speech Language Models",
        description:
          "Introduced a multi-user benchmark for measuring interactional privacy risks in speech-language models.",
        paperUrl: "https://arxiv.org/abs/2601.19956",
      },
      {
        id: "dialoggraph-llm",
        venue: "ECAI 2025 · Oral",
        authorship: "First author",
        title: "DialogGraph-LLM: Graph-Informed LLMs for End-to-End Audio Dialogue Intent Recognition",
        description:
          "Proposed a graph-informed framework for end-to-end intent recognition in spoken dialogue.",
        paperUrl: "https://arxiv.org/abs/2511.11000",
      },
      {
        id: "msmt-fn",
        venue: "ADMA 2025 · Poster",
        authorship: "First author",
        title: "Multi-segment Multitask Fusion Network for Marketing Audio Classification",
        description:
          "Proposed MSMT-FN for marketing-call attitude classification, achieving stronger results than prior baselines.",
        paperUrl: "https://arxiv.org/abs/2511.11006",
      },
    ],
    getCvPublications: [
      {
        id: "voxsafebench",
        title: "VoxSafeBench: Not Just What Is Said, but Who, How, and Where",
        permalink: "https://arxiv.org/abs/2604.14548",
        venue: "NeurIPS 2026 · Under Review",
        date: "2026-04-01",
        excerpt: "Second author.",
        paperUrl: "https://arxiv.org/abs/2604.14548",
      },
      {
        id: "voxprivacy",
        title: "VoxPrivacy: A Benchmark for Evaluating Interactional Privacy of Speech Language Models",
        permalink: "https://arxiv.org/abs/2601.19956",
        venue: "ICLR 2026 · Poster",
        date: "2026-01-01",
        excerpt: "Second author.",
        paperUrl: "https://arxiv.org/abs/2601.19956",
      },
      {
        id: "dialoggraph-llm",
        title: "DialogGraph-LLM: Graph-Informed LLMs for End-to-End Audio Dialogue Intent Recognition",
        permalink: "https://arxiv.org/abs/2511.11000",
        venue: "ECAI 2025 · Oral",
        date: "2025-06-01",
        excerpt: "First author.",
        paperUrl: "https://arxiv.org/abs/2511.11000",
      },
      {
        id: "msmt-fn",
        title: "Multi-segment Multitask Fusion Network for Marketing Audio Classification",
        permalink: "https://arxiv.org/abs/2511.11006",
        venue: "ADMA 2025 · Poster",
        date: "2025-01-01",
        excerpt: "First author.",
        paperUrl: "https://arxiv.org/abs/2511.11006",
      },
    ],
    getPublicationArchive: [
      {
        id: "voxsafebench",
        title: "VoxSafeBench: Not Just What Is Said, but Who, How, and Where",
        permalink: "https://arxiv.org/abs/2604.14548",
        venue: "NeurIPS 2026 · Under Review",
        date: "2026-04-01",
        excerpt:
          "Introduced a benchmark for evaluating social alignment in speech language models across safety, fairness, and privacy dimensions; second author.",
        paperUrl: "https://arxiv.org/abs/2604.14548",
        category: "conferences",
      },
      {
        id: "voxprivacy",
        title: "VoxPrivacy: A Benchmark for Evaluating Interactional Privacy of Speech Language Models",
        permalink: "https://arxiv.org/abs/2601.19956",
        venue: "ICLR 2026 · Poster",
        date: "2026-01-01",
        excerpt:
          "Introduced a multi-user benchmark for measuring interactional privacy risks in speech-language models; second author.",
        paperUrl: "https://arxiv.org/abs/2601.19956",
        category: "conferences",
      },
      {
        id: "dialoggraph-llm",
        title: "DialogGraph-LLM: Graph-Informed LLMs for End-to-End Audio Dialogue Intent Recognition",
        permalink: "https://arxiv.org/abs/2511.11000",
        venue: "ECAI 2025 · Oral",
        date: "2025-06-01",
        excerpt:
          "Proposed a graph-informed framework for end-to-end intent recognition in spoken dialogue; first author.",
        paperUrl: "https://arxiv.org/abs/2511.11000",
        category: "conferences",
      },
      {
        id: "msmt-fn",
        title: "Multi-segment Multitask Fusion Network for Marketing Audio Classification",
        permalink: "https://arxiv.org/abs/2511.11006",
        venue: "ADMA 2025 · Poster",
        date: "2025-01-01",
        excerpt:
          "Proposed MSMT-FN for marketing-call attitude classification, achieving stronger results than prior baselines; first author.",
        paperUrl: "https://arxiv.org/abs/2511.11006",
        category: "conferences",
      },
    ],
  },
  zh: {
    getHomeEducation: [
      {
        id: "scnu-beng",
        time: "本科",
        title: "华南师范大学",
        meta: "软件工程工学学士",
        description: "综合 GPA：4.06。",
      },
      {
        id: "cuhksz-msc-data-science",
        time: "预计 2026 年 9 月入学",
        title: "香港中文大学（深圳）",
        meta: "数据科学理学硕士",
        description: "预计于 2026 年 9 月开始硕士阶段学习。",
      },
    ],
    getCvEducation: [
      {
        id: "scnu-beng",
        school: "华南师范大学",
        detail: "软件工程工学学士 · GPA：4.06",
      },
      {
        id: "cuhksz-msc-data-science",
        school: "香港中文大学（深圳）",
        detail: "数据科学理学硕士 · 预计 2026 年 9 月入学",
      },
    ],
    getIncomingEducation: {
      label: "2026 年入学",
      value: "香港中文大学（深圳）· 数据科学理学硕士",
    },
    getHomeInternships: [
      {
        id: "insta360-speech-algorithm",
        time: "2026 年 2 月 - 2026 年 6 月",
        title: "Insta360 · 语音算法实习生",
        meta: "中国深圳",
        description: "参与生产级语音算法开发，并针对语音应用优化低时延模型推理能力。",
      },
      {
        id: "amphion-r-and-d",
        time: "2025 年 6 月 - 2025 年 9 月",
        title: "Amphion Technology · 研发实习生",
        meta: "中国深圳",
        description: "为语音克隆应用开发核心算法，并支持视频翻译场景中的后端模型集成。",
      },
    ],
    getCvInternships: [
      {
        id: "insta360-speech-algorithm",
        role: "Insta360 · 语音算法实习生",
        detail: "中国深圳 · 2026 年 2 月 - 2026 年 6 月",
      },
      {
        id: "amphion-r-and-d",
        role: "Amphion Technology · 研发实习生",
        detail: "中国深圳 · 2025 年 6 月 - 2025 年 9 月",
      },
    ],
    getHomePublications: [
      {
        id: "voxsafebench",
        venue: "NeurIPS 2026 · 审稿中",
        authorship: "第二作者",
        title: "VoxSafeBench：不仅评估说了什么，也评估谁、如何以及在何处表达",
        description: "提出用于评估语音语言模型社会对齐能力的基准，覆盖安全、公平与隐私维度。",
        paperUrl: "https://arxiv.org/abs/2604.14548",
      },
      {
        id: "voxprivacy",
        venue: "ICLR 2026 · 海报",
        authorship: "第二作者",
        title: "VoxPrivacy：评估语音语言模型交互隐私的基准",
        description: "提出面向多用户场景的基准，用于衡量语音语言模型的交互隐私风险。",
        paperUrl: "https://arxiv.org/abs/2601.19956",
      },
      {
        id: "dialoggraph-llm",
        venue: "ECAI 2025 · 口头报告",
        authorship: "第一作者",
        title: "DialogGraph-LLM：面向端到端音频对话意图识别的图增强大语言模型",
        description: "提出图增强框架，用于端到端语音对话意图识别。",
        paperUrl: "https://arxiv.org/abs/2511.11000",
      },
      {
        id: "msmt-fn",
        venue: "ADMA 2025 · 海报",
        authorship: "第一作者",
        title: "面向营销音频分类的多片段多任务融合网络",
        description: "提出 MSMT-FN 用于营销通话态度分类，相比既有基线取得更优结果。",
        paperUrl: "https://arxiv.org/abs/2511.11006",
      },
    ],
    getCvPublications: [
      {
        id: "voxsafebench",
        title: "VoxSafeBench：不仅评估说了什么，也评估谁、如何以及在何处表达",
        permalink: "https://arxiv.org/abs/2604.14548",
        venue: "NeurIPS 2026 · 审稿中",
        date: "2026-04-01",
        excerpt: "第二作者。",
        paperUrl: "https://arxiv.org/abs/2604.14548",
      },
      {
        id: "voxprivacy",
        title: "VoxPrivacy：评估语音语言模型交互隐私的基准",
        permalink: "https://arxiv.org/abs/2601.19956",
        venue: "ICLR 2026 · 海报",
        date: "2026-01-01",
        excerpt: "第二作者。",
        paperUrl: "https://arxiv.org/abs/2601.19956",
      },
      {
        id: "dialoggraph-llm",
        title: "DialogGraph-LLM：面向端到端音频对话意图识别的图增强大语言模型",
        permalink: "https://arxiv.org/abs/2511.11000",
        venue: "ECAI 2025 · 口头报告",
        date: "2025-06-01",
        excerpt: "第一作者。",
        paperUrl: "https://arxiv.org/abs/2511.11000",
      },
      {
        id: "msmt-fn",
        title: "面向营销音频分类的多片段多任务融合网络",
        permalink: "https://arxiv.org/abs/2511.11006",
        venue: "ADMA 2025 · 海报",
        date: "2025-01-01",
        excerpt: "第一作者。",
        paperUrl: "https://arxiv.org/abs/2511.11006",
      },
    ],
    getPublicationArchive: [
      {
        id: "voxsafebench",
        title: "VoxSafeBench：不仅评估说了什么，也评估谁、如何以及在何处表达",
        permalink: "https://arxiv.org/abs/2604.14548",
        venue: "NeurIPS 2026 · 审稿中",
        date: "2026-04-01",
        excerpt: "提出用于评估语音语言模型社会对齐能力的基准，覆盖安全、公平与隐私维度；第二作者。",
        paperUrl: "https://arxiv.org/abs/2604.14548",
        category: "conferences",
      },
      {
        id: "voxprivacy",
        title: "VoxPrivacy：评估语音语言模型交互隐私的基准",
        permalink: "https://arxiv.org/abs/2601.19956",
        venue: "ICLR 2026 · 海报",
        date: "2026-01-01",
        excerpt: "提出面向多用户场景的基准，用于衡量语音语言模型的交互隐私风险；第二作者。",
        paperUrl: "https://arxiv.org/abs/2601.19956",
        category: "conferences",
      },
      {
        id: "dialoggraph-llm",
        title: "DialogGraph-LLM：面向端到端音频对话意图识别的图增强大语言模型",
        permalink: "https://arxiv.org/abs/2511.11000",
        venue: "ECAI 2025 · 口头报告",
        date: "2025-06-01",
        excerpt: "提出图增强框架，用于端到端语音对话意图识别；第一作者。",
        paperUrl: "https://arxiv.org/abs/2511.11000",
        category: "conferences",
      },
      {
        id: "msmt-fn",
        title: "面向营销音频分类的多片段多任务融合网络",
        permalink: "https://arxiv.org/abs/2511.11006",
        venue: "ADMA 2025 · 海报",
        date: "2025-01-01",
        excerpt: "提出 MSMT-FN 用于营销通话态度分类，相比既有基线取得更优结果；第一作者。",
        paperUrl: "https://arxiv.org/abs/2511.11006",
        category: "conferences",
      },
    ],
  },
} as const;

const selectorCases = [
  { name: "getHomeEducation", run: getHomeEducation },
  { name: "getCvEducation", run: getCvEducation },
  { name: "getIncomingEducation", run: getIncomingEducation },
  { name: "getHomeInternships", run: getHomeInternships },
  { name: "getCvInternships", run: getCvInternships },
  { name: "getHomePublications", run: getHomePublications },
  { name: "getCvPublications", run: getCvPublications },
  { name: "getPublicationArchive", run: getPublicationArchive },
] as const;

function withoutIncomingSummary(record: EducationRecord): EducationRecord {
  const { incomingSummary: _incomingSummary, ...recordWithoutSummary } = record;
  return recordWithoutSummary;
}

function withTemporaryEducationRecords(records: readonly EducationRecord[], assertion: () => void) {
  const mutableEducationRecords = educationRecords as EducationRecord[];
  const originalRecords = mutableEducationRecords.slice();
  mutableEducationRecords.splice(0, mutableEducationRecords.length, ...records);
  try {
    assertion();
  } finally {
    mutableEducationRecords.splice(0, mutableEducationRecords.length, ...originalRecords);
  }
}

describe("profile content", () => {
  it("keeps stable unique record ids and supported publication categories", () => {
    const records = [...educationRecords, ...internshipRecords, ...publicationRecords];
    expect(new Set(records.map(({ id }) => id)).size).toBe(records.length);
    expect(publicationCategoryOrder).toEqual(["conferences", "manuscripts", "books"]);
    publicationRecords.forEach(({ category, paperUrl }) => {
      expect(publicationCategoryOrder).toContain(category);
      expect(paperUrl).toMatch(/^https:\/\//);
    });
  });

  it.each(locales)("provides every localized field for %s", (locale) => {
    for (const record of educationRecords) {
      expect(record.period[locale]).toBeTruthy();
      expect(record.institution[locale]).toBeTruthy();
      expect(record.degree[locale]).toBeTruthy();
      expect(record.description[locale]).toBeTruthy();
    }
    for (const record of internshipRecords) {
      expect(record.period[locale]).toBeTruthy();
      expect(record.company[locale]).toBeTruthy();
      expect(record.role[locale]).toBeTruthy();
      expect(record.location[locale]).toBeTruthy();
      expect(record.description[locale]).toBeTruthy();
    }
    for (const record of publicationRecords) {
      expect(record.venue[locale]).toBeTruthy();
      expect(record.authorship[locale]).toBeTruthy();
      expect(record.title[locale]).toBeTruthy();
      expect(record.description[locale]).toBeTruthy();
    }
  });

  it.each(locales)("returns exact selector fixtures for %s", (locale) => {
    for (const { name, run } of selectorCases) {
      expect(run(locale)).toEqual(selectorFixtures[locale][name]);
    }
  });

  it("keeps the homepage master's degree expanded while the English CV stays compact", () => {
    expect(getHomeEducation("en")[1].meta).toBe("Master of Science in Data Science");
    expect(getCvEducation("en")[1].detail).toBe("M.Sc. in Data Science · Matriculation: Sep 2026");
  });

  it("throws when no incoming summary is configured", () => {
    withTemporaryEducationRecords(
      educationRecords.map((record) => withoutIncomingSummary(record)),
      () => {
        expect(() => getIncomingEducation("en")).toThrowError("Missing incoming education summary.");
      }
    );
  });

  it("throws when multiple incoming summaries are configured", () => {
    withTemporaryEducationRecords(
      [
        {
          ...educationRecords[0],
          incomingSummary: {
            label: { en: "Incoming 2025", zh: "2025 年入学" },
            value: {
              en: "South China Normal University · B.Eng. in Software Engineering",
              zh: "华南师范大学 · 软件工程工学学士",
            },
          },
        },
        educationRecords[1],
      ],
      () => {
        expect(() => getIncomingEducation("en")).toThrowError(
          "Expected exactly one incoming education summary."
        );
      }
    );
  });
});
