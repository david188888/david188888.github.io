import Link from "next/link";
import {
  AlignedPageShell,
  type AlignedPageSection,
} from "@/components/layout/AlignedPageShell";
import { authorConfig } from "@/config/author";
import { getInsightContent } from "@/config/insights";
import { defaultLocale, type Locale } from "@/i18n/locales";
import { localizedHref } from "@/i18n/links";
import { getMessages } from "@/i18n/messages";
import { getPublishedPosts, type LocalizedPost } from "@/lib/content/posts";

interface HomePageViewProps {
  locale?: Locale;
}

interface TimelineItem {
  time: string;
  title: string;
  meta: string;
  description: string;
}

interface PaperItem {
  venue: string;
  title: string;
  description: string;
  paperUrl: string;
}

interface EvidenceRowProps {
  label: string;
  meta: string;
  title: string;
  description: string;
  detail?: string;
  href?: string;
  external?: boolean;
}

const educationData = {
  en: [
    {
      time: "Bachelor's Degree",
      title: "South China Normal University",
      meta: "B.Eng. in Software Engineering",
      description: "Overall GPA: 4.06.",
    },
    {
      time: "Matriculation: Sep 2026",
      title: "The Chinese University of Hong Kong, Shenzhen",
      meta: "Master of Science in Data Science",
      description: "Enrollment scheduled for September 2026.",
    },
  ],
  zh: [
    {
      time: "本科",
      title: "华南师范大学",
      meta: "软件工程工学学士",
      description: "综合 GPA：4.06。",
    },
    {
      time: "预计 2026 年 9 月入学",
      title: "香港中文大学（深圳）",
      meta: "数据科学理学硕士",
      description: "预计于 2026 年 9 月开始硕士阶段学习。",
    },
  ],
} satisfies Record<Locale, TimelineItem[]>;

const internshipData = {
  en: [
    {
      time: "Feb 2026 - Jun 2026",
      title: "Insta360 · Speech Algorithm Intern",
      meta: "Shenzhen, China",
      description:
        "Developing production-grade speech algorithms and optimizing low-latency model inference for voice applications.",
    },
    {
      time: "Jun 2025 - Sep 2025",
      title: "Amphion Technology · R&D Intern",
      meta: "Shenzhen, China",
      description:
        "Developed core algorithms for a voice-cloning application and supported backend model integration for video translation.",
    },
  ],
  zh: [
    {
      time: "2026 年 2 月 - 2026 年 6 月",
      title: "Insta360 · 语音算法实习生",
      meta: "中国深圳",
      description:
        "参与生产级语音算法开发，并针对语音应用优化低时延模型推理能力。",
    },
    {
      time: "2025 年 6 月 - 2025 年 9 月",
      title: "Amphion Technology · 研发实习生",
      meta: "中国深圳",
      description:
        "为语音克隆应用开发核心算法，并支持视频翻译场景中的后端模型集成。",
    },
  ],
} satisfies Record<Locale, TimelineItem[]>;

const papersData = {
  en: [
    {
      venue: "NeurIPS 2026 · Under Review",
      title: "VoxSafeBench: Not Just What Is Said, but Who, How, and Where",
      description:
        "Introduced a benchmark for evaluating social alignment in speech language models across safety, fairness, and privacy dimensions; second author.",
      paperUrl: "https://arxiv.org/abs/2604.14548",
    },
    {
      venue: "ICLR 2026 · Poster",
      title: "VoxPrivacy: A Benchmark for Evaluating Interactional Privacy of Speech Language Models",
      description:
        "Introduced a multi-user benchmark for measuring interactional privacy risks in speech-language models; second author.",
      paperUrl: "https://arxiv.org/abs/2601.19956",
    },
    {
      venue: "ECAI 2025 · Oral",
      title: "DialogGraph-LLM: Graph-Informed LLMs for End-to-End Audio Dialogue Intent Recognition",
      description:
        "Proposed a graph-informed framework for end-to-end intent recognition in spoken dialogue; first author.",
      paperUrl: "https://arxiv.org/abs/2511.11000",
    },
    {
      venue: "ADMA 2025 · Poster",
      title: "Multi-segment Multitask Fusion Network for Marketing Audio Classification",
      description:
        "Proposed MSMT-FN for marketing-call attitude classification, achieving stronger results than prior baselines; first author.",
      paperUrl: "https://arxiv.org/abs/2511.11006",
    },
  ],
  zh: [
    {
      venue: "NeurIPS 2026 · 审稿中",
      title: "VoxSafeBench：不仅评估说了什么，也评估谁、如何以及在何处表达",
      description:
        "提出用于评估语音语言模型社会对齐能力的基准，覆盖安全、公平与隐私维度；第二作者。",
      paperUrl: "https://arxiv.org/abs/2604.14548",
    },
    {
      venue: "ICLR 2026 · 海报",
      title: "VoxPrivacy：评估语音语言模型交互隐私的基准",
      description:
        "提出面向多用户场景的基准，用于衡量语音语言模型的交互隐私风险；第二作者。",
      paperUrl: "https://arxiv.org/abs/2601.19956",
    },
    {
      venue: "ECAI 2025 · 口头报告",
      title: "DialogGraph-LLM：面向端到端音频对话意图识别的图增强大语言模型",
      description:
        "提出图增强框架，用于端到端语音对话意图识别；第一作者。",
      paperUrl: "https://arxiv.org/abs/2511.11000",
    },
    {
      venue: "ADMA 2025 · 海报",
      title: "面向营销音频分类的多片段多任务融合网络",
      description:
        "提出 MSMT-FN 用于营销通话态度分类，相比既有基线取得更优结果；第一作者。",
      paperUrl: "https://arxiv.org/abs/2511.11006",
    },
  ],
} satisfies Record<Locale, PaperItem[]>;

const homeDesignCopy = {
  en: {
    role: "Speech AI Researcher",
    profileSummary:
      "I study trustworthy spoken dialogue systems and keep public notes on what changes.",
    eyebrow: "Current Direction",
    headline: "Trustworthy speech systems, documented in public.",
    summary: "Research is the core; notes are the way people see how I think.",
    nav: {
      profile: "Profile",
      work: "Work",
      notes: "Notes",
      background: "Background",
    },
    researchTitle: "Research",
    researchDescription:
      "Complete research papers in speech language models, privacy, and spoken dialogue intelligence.",
    experienceTitle: "Experience",
    experienceDescription:
      "Production work on speech algorithms, model inference, voice cloning, and video translation.",
    educationTitle: "Education",
    educationDescription: "Academic training in software engineering and data science.",
    insightsTitle: "Insights",
    insightsDescription: "The latest note from my public notebook.",
    openInsights: "Open Insights",
    researchLabel: "Research",
    experienceLabel: "Experience",
    educationLabel: "Education",
    links: {
      github: "GitHub",
      scholar: "Scholar",
      cv: "CV",
      email: "Email",
    },
  },
  zh: {
    role: "语音 AI 研究者",
    profileSummary:
      "我研究可信的语音对话系统，也公开记录我对技术、公司与行业变化的判断。",
    eyebrow: "当前方向",
    headline: "可信语音系统，公开可见的研究记录。",
    summary: "研究是核心，Notes 是别人理解我如何思考的入口。",
    nav: {
      profile: "个人",
      work: "工作",
      notes: "记录",
      background: "背景",
    },
    researchTitle: "研究成果",
    researchDescription:
      "完整记录我在语音语言模型、隐私评估与语音对话智能方向的研究论文。",
    experienceTitle: "实习经历",
    experienceDescription:
      "完整记录语音算法、模型推理、语音克隆与视频翻译相关的生产实践。",
    educationTitle: "教育经历",
    educationDescription: "软件工程与数据科学方向的学习经历。",
    insightsTitle: "随笔洞察",
    insightsDescription: "公开笔记中最近发布的一篇。",
    openInsights: "打开随笔洞察",
    researchLabel: "研究",
    experienceLabel: "经历",
    educationLabel: "教育",
    links: {
      github: "GitHub",
      scholar: "Scholar",
      cv: "CV",
      email: "Email",
    },
  },
} satisfies Record<
  Locale,
  {
    role: string;
    profileSummary: string;
    eyebrow: string;
    headline: string;
    summary: string;
    nav: Record<"profile" | "work" | "notes" | "background", string>;
    researchTitle: string;
    researchDescription: string;
    experienceTitle: string;
    experienceDescription: string;
    educationTitle: string;
    educationDescription: string;
    insightsTitle: string;
    insightsDescription: string;
    openInsights: string;
    researchLabel: string;
    experienceLabel: string;
    educationLabel: string;
    links: Record<"github" | "scholar" | "cv" | "email", string>;
  }
>;

function SectionHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div className="home-section-heading">
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
    </div>
  );
}

function EvidenceRow({
  label,
  meta,
  title,
  description,
  detail,
  href,
  external = false,
}: EvidenceRowProps) {
  const content = (
    <>
      <div className="home-evidence-label">
        <span>{label}</span>
        <span>{meta}</span>
      </div>
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
        {detail ? <span className="home-evidence-link">{detail}</span> : null}
      </div>
    </>
  );

  if (!href) {
    return (
      <article data-hover-reactive className="home-evidence-row">
        {content}
      </article>
    );
  }

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" data-hover-reactive className="home-evidence-row">
        {content}
      </a>
    );
  }

  return (
    <Link href={href} data-hover-reactive className="home-evidence-row">
      {content}
    </Link>
  );
}

export function buildHomeSections(
  locale: Locale,
  publishedPosts: readonly LocalizedPost[]
): AlignedPageSection[] {
  const { common } = getMessages(locale);
  const copy = homeDesignCopy[locale];
  const { featuredInsight } = getInsightContent(locale);
  const insightsHref = localizedHref("/insights/", locale);
  const latestPost = publishedPosts[0];
  const cvHref = "/files/Resume_en.pdf";

  return [
    {
      id: "profile",
      label: copy.nav.profile,
      content: (
        <div className="home-reveal">
          <p className="home-kicker">{copy.eyebrow}</p>
          <p className="home-profile-mark">{authorConfig.name}</p>
          <h1 className="home-hero-title">{copy.headline}</h1>
          <p className="home-profile-role">{copy.role}</p>
          <p className="home-profile-summary">{copy.profileSummary}</p>
          <p className="home-hero-summary">{copy.summary}</p>
          <div className="home-social-links mt-8 flex flex-wrap gap-x-8 gap-y-3 text-[0.86rem] text-[#8993a3]">
            <a
              href={`https://github.com/${authorConfig.github}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {copy.links.github}
            </a>
            <a
              href={authorConfig.googlescholar}
              target="_blank"
              rel="noopener noreferrer"
            >
              {copy.links.scholar}
            </a>
            <a href={cvHref}>{copy.links.cv}</a>
            <a href={`mailto:${authorConfig.email}`}>{copy.links.email}</a>
          </div>
        </div>
      ),
    },
    {
      id: "research",
      label: copy.researchTitle,
      content: (
        <>
          <SectionHeading
            title={copy.researchTitle}
            description={copy.researchDescription}
          />
          <div className="home-evidence-list">
            {papersData[locale].map((paper) => (
              <EvidenceRow
                key={paper.title}
                label={copy.researchLabel}
                meta={paper.venue}
                title={paper.title}
                description={paper.description}
                detail={common.paper}
                href={paper.paperUrl}
                external
              />
            ))}
          </div>
        </>
      ),
    },
    {
      id: "experience",
      label: copy.experienceTitle,
      content: (
        <>
          <SectionHeading
            title={copy.experienceTitle}
            description={copy.experienceDescription}
          />
          <div className="home-evidence-list">
            {internshipData[locale].map((item) => (
              <EvidenceRow
                key={item.title}
                label={copy.experienceLabel}
                meta={item.time}
                title={item.title}
                description={item.description}
                detail={item.meta}
              />
            ))}
          </div>
        </>
      ),
    },
    {
      id: "education",
      label: copy.educationTitle,
      content: (
        <>
          <SectionHeading
            title={copy.educationTitle}
            description={copy.educationDescription}
          />
          <div className="home-evidence-list">
            {educationData[locale].map((item) => (
              <EvidenceRow
                key={item.title}
                label={copy.educationLabel}
                meta={item.time}
                title={item.title}
                description={item.description}
                detail={item.meta}
              />
            ))}
          </div>
        </>
      ),
    },
    {
      id: "insights",
      label: copy.insightsTitle,
      content: (
        <>
          <SectionHeading
            title={copy.insightsTitle}
            description={copy.insightsDescription}
          />
          {latestPost ? (
            <Link
              href={localizedHref(`/insights/${latestPost.slug}/`, locale)}
              className="home-latest-insight"
            >
              {latestPost.date ? <span>{latestPost.date}</span> : null}
              <h3>{latestPost.title}</h3>
              {latestPost.excerpt ? <p>{latestPost.excerpt}</p> : null}
            </Link>
          ) : (
            <p className="home-hero-summary">{featuredInsight.description}</p>
          )}
          <Link href={insightsHref} className="home-action-secondary mt-6">
            <span>{copy.openInsights}</span>
          </Link>
        </>
      ),
    },
  ];
}

export function HomePageView({ locale = defaultLocale }: HomePageViewProps) {
  return (
    <AlignedPageShell
      locale={locale}
      sections={buildHomeSections(locale, getPublishedPosts(locale))}
    />
  );
}
