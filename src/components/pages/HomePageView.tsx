import Link from "next/link";
import { AcademicRecordCard } from "@/components/home/AcademicRecordCard";
import { HomeScrollProgress } from "@/components/home/HomeScrollProgress";
import { PointerGlow } from "@/components/home/PointerGlow";
import { HomeNav } from "@/components/navigation/HomeNav";
import { authorConfig } from "@/config/author";
import { getInsightContent } from "@/config/insights";
import { localizedHref } from "@/i18n/links";
import { defaultLocale, type Locale } from "@/i18n/locales";
import { getMessages } from "@/i18n/messages";
import { getPublishedPosts } from "@/lib/content/posts";

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
  authorship: string;
  title: string;
  description: string;
  paperUrl: string;
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
      description: "参与生产级语音算法开发，并针对语音应用优化低时延模型推理能力。",
    },
    {
      time: "2025 年 6 月 - 2025 年 9 月",
      title: "Amphion Technology · 研发实习生",
      meta: "中国深圳",
      description: "为语音克隆应用开发核心算法，并支持视频翻译场景中的后端模型集成。",
    },
  ],
} satisfies Record<Locale, TimelineItem[]>;

const papersData = {
  en: [
    {
      venue: "NeurIPS 2026 · Under Review",
      authorship: "Second author",
      title: "VoxSafeBench: Not Just What Is Said, but Who, How, and Where",
      description:
        "Introduced a benchmark for evaluating social alignment in speech language models across safety, fairness, and privacy dimensions.",
      paperUrl: "https://arxiv.org/abs/2604.14548",
    },
    {
      venue: "ICLR 2026 · Poster",
      authorship: "Second author",
      title: "VoxPrivacy: A Benchmark for Evaluating Interactional Privacy of Speech Language Models",
      description:
        "Introduced a multi-user benchmark for measuring interactional privacy risks in speech-language models.",
      paperUrl: "https://arxiv.org/abs/2601.19956",
    },
    {
      venue: "ECAI 2025 · Oral",
      authorship: "First author",
      title: "DialogGraph-LLM: Graph-Informed LLMs for End-to-End Audio Dialogue Intent Recognition",
      description:
        "Proposed a graph-informed framework for end-to-end intent recognition in spoken dialogue.",
      paperUrl: "https://arxiv.org/abs/2511.11000",
    },
    {
      venue: "ADMA 2025 · Poster",
      authorship: "First author",
      title: "Multi-segment Multitask Fusion Network for Marketing Audio Classification",
      description:
        "Proposed MSMT-FN for marketing-call attitude classification, achieving stronger results than prior baselines.",
      paperUrl: "https://arxiv.org/abs/2511.11006",
    },
  ],
  zh: [
    {
      venue: "NeurIPS 2026 · 审稿中",
      authorship: "第二作者",
      title: "VoxSafeBench：不仅评估说了什么，也评估谁、如何以及在何处表达",
      description: "提出用于评估语音语言模型社会对齐能力的基准，覆盖安全、公平与隐私维度。",
      paperUrl: "https://arxiv.org/abs/2604.14548",
    },
    {
      venue: "ICLR 2026 · 海报",
      authorship: "第二作者",
      title: "VoxPrivacy：评估语音语言模型交互隐私的基准",
      description: "提出面向多用户场景的基准，用于衡量语音语言模型的交互隐私风险。",
      paperUrl: "https://arxiv.org/abs/2601.19956",
    },
    {
      venue: "ECAI 2025 · 口头报告",
      authorship: "第一作者",
      title: "DialogGraph-LLM：面向端到端音频对话意图识别的图增强大语言模型",
      description: "提出图增强框架，用于端到端语音对话意图识别。",
      paperUrl: "https://arxiv.org/abs/2511.11000",
    },
    {
      venue: "ADMA 2025 · 海报",
      authorship: "第一作者",
      title: "面向营销音频分类的多片段多任务融合网络",
      description: "提出 MSMT-FN 用于营销通话态度分类，相比既有基线取得更优结果。",
      paperUrl: "https://arxiv.org/abs/2511.11006",
    },
  ],
} satisfies Record<Locale, PaperItem[]>;

const homeCopy = {
  en: {
    role: "Speech AI Researcher",
    introduction:
      "I study trustworthy speech language models, interactional privacy, and spoken dialogue intelligence, with experience carrying research into production systems.",
    focusLabel: "Research focus",
    focusValue: "Speech Language Models · Trustworthiness · Agentic RL",
    incomingLabel: "Incoming 2026",
    incomingValue: "CUHK-Shenzhen · M.Sc. Data Science",
    educationTitle: "Education",
    educationDescription: "Academic training in software engineering and data science.",
    researchTitle: "Selected Research",
    researchDescription: "Speech-language-model safety, privacy, and spoken dialogue intelligence.",
    experienceTitle: "Experience",
    experienceDescription: "Research translated into production speech systems.",
    insightsTitle: "Insights",
    insightsDescription: "The latest published note from my public research and industry notebook.",
    educationLabel: "Education",
    latestNote: "Latest note",
    openInsights: "View all Insights",
    fallbackInsights: "Long-form notes on technology, companies, and the signals behind major shifts.",
    links: { scholar: "Google Scholar", github: "GitHub", cv: "CV", email: "Email" },
  },
  zh: {
    role: "语音 AI 研究者",
    introduction:
      "我研究可信语音语言模型、交互隐私与语音对话智能，也关注如何将研究成果落地到生产系统。",
    focusLabel: "研究方向",
    focusValue: "语音语言模型 · 可信 AI · 智能体强化学习",
    incomingLabel: "2026 年入学",
    incomingValue: "香港中文大学（深圳）· 数据科学理学硕士",
    educationTitle: "教育背景",
    educationDescription: "软件工程与数据科学方向的学习经历。",
    researchTitle: "主要研究",
    researchDescription: "围绕语音语言模型安全、隐私与语音对话智能的研究。",
    experienceTitle: "实习经历",
    experienceDescription: "将语音研究转化为生产系统与低时延应用。",
    insightsTitle: "随笔洞察",
    insightsDescription: "公开研究与行业笔记中最近发布的一篇。",
    educationLabel: "教育",
    latestNote: "最新文章",
    openInsights: "查看全部随笔洞察",
    fallbackInsights: "记录技术、公司与重要变化背后信号的长篇笔记。",
    links: { scholar: "Google Scholar", github: "GitHub", cv: "简历", email: "邮箱" },
  },
} satisfies Record<Locale, {
  role: string;
  introduction: string;
  focusLabel: string;
  focusValue: string;
  incomingLabel: string;
  incomingValue: string;
  educationTitle: string;
  educationDescription: string;
  researchTitle: string;
  researchDescription: string;
  experienceTitle: string;
  experienceDescription: string;
  insightsTitle: string;
  insightsDescription: string;
  educationLabel: string;
  latestNote: string;
  openInsights: string;
  fallbackInsights: string;
  links: Record<"scholar" | "github" | "cv" | "email", string>;
}>;

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <header className="academic-home-section-heading">
      <h2>{title}</h2>
      <p>{description}</p>
    </header>
  );
}

function splitExperienceTitle(title: string) {
  const [company, ...roleParts] = title.split(" · ");
  return { company, role: roleParts.join(" · ") || title };
}

export function HomePageView({ locale = defaultLocale }: HomePageViewProps) {
  const { common } = getMessages(locale);
  const copy = homeCopy[locale];
  const { featuredInsight } = getInsightContent(locale);
  const latestPost = getPublishedPosts(locale)[0];
  const insightsHref = localizedHref("/insights/", locale);

  return (
    <>
      <HomeNav locale={locale} />
      <HomeScrollProgress />
      <PointerGlow>
        <main className="academic-home home-motion-shell" data-locale={locale}>
          <div className="academic-home-container">
            <section id="profile" className="academic-home-hero home-reveal">
              <div>
                <p className="academic-home-kicker">{copy.role}</p>
                <h1>{authorConfig.name}</h1>
                <p className="academic-home-intro">{copy.introduction}</p>
                <div className="academic-home-links">
                  <a href={authorConfig.googlescholar} target="_blank" rel="noopener noreferrer">
                    {copy.links.scholar}
                  </a>
                  <a href={`https://github.com/${authorConfig.github}`} target="_blank" rel="noopener noreferrer">
                    {copy.links.github}
                  </a>
                  <a href="/files/Resume_en.pdf">{copy.links.cv}</a>
                  <a href={`mailto:${authorConfig.email}`}>{copy.links.email}</a>
                </div>
              </div>
              <aside className="academic-home-facts">
                <div>
                  <span>{copy.focusLabel}</span>
                  <p>{copy.focusValue}</p>
                </div>
                <div>
                  <span>{copy.incomingLabel}</span>
                  <p>{copy.incomingValue}</p>
                </div>
              </aside>
            </section>

            <section id="education" className="academic-home-section">
              <SectionHeading title={copy.educationTitle} description={copy.educationDescription} />
              <div className="academic-card-stack">
                {educationData[locale].map((item) => (
                  <AcademicRecordCard
                    key={item.title}
                    category={copy.educationLabel}
                    meta={item.time}
                    title={item.title}
                    description={item.description}
                    details={[item.meta]}
                  />
                ))}
              </div>
            </section>

            <section id="research" className="academic-home-section">
              <SectionHeading title={copy.researchTitle} description={copy.researchDescription} />
              <div className="academic-card-stack">
                {papersData[locale].map((paper) => (
                  <AcademicRecordCard
                    key={paper.title}
                    category={paper.venue}
                    meta={paper.authorship}
                    title={paper.title}
                    description={paper.description}
                    href={paper.paperUrl}
                    linkLabel={common.paper}
                    external
                    emphasis="research"
                  />
                ))}
              </div>
            </section>

            <section id="experience" className="academic-home-section">
              <SectionHeading title={copy.experienceTitle} description={copy.experienceDescription} />
              <div className="academic-card-stack">
                {internshipData[locale].map((item) => {
                  const { company, role } = splitExperienceTitle(item.title);
                  return (
                    <AcademicRecordCard
                      key={item.title}
                      category={company}
                      meta={item.time}
                      title={role}
                      description={item.description}
                      details={[item.meta]}
                    />
                  );
                })}
              </div>
            </section>

            <section id="insights" className="academic-home-section">
              <SectionHeading title={copy.insightsTitle} description={copy.insightsDescription} />
              {latestPost ? (
                <AcademicRecordCard
                  category={copy.latestNote}
                  meta={latestPost.date ?? copy.insightsTitle}
                  title={latestPost.title}
                  description={latestPost.excerpt}
                  details={latestPost.tags}
                  href={localizedHref(`/insights/${latestPost.slug}/`, locale)}
                  linkLabel={copy.openInsights}
                />
              ) : (
                <div className="academic-home-insights-fallback">
                  <p>{featuredInsight.description || copy.fallbackInsights}</p>
                  <Link href={insightsHref}>{copy.openInsights}</Link>
                </div>
              )}
              {latestPost ? (
                <Link className="academic-home-archive-link" href={insightsHref}>
                  {copy.openInsights}
                </Link>
              ) : null}
            </section>
          </div>
        </main>
      </PointerGlow>
    </>
  );
}
