import Link from "next/link";
import { PointerGlow } from "@/components/home/PointerGlow";
import { HomeNav } from "@/components/navigation/HomeNav";
import { authorConfig } from "@/config/author";
import { getInsightContent } from "@/config/insights";
import { defaultLocale, type Locale } from "@/i18n/locales";
import { localizedHref } from "@/i18n/links";
import { getMessages } from "@/i18n/messages";

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
    workTitle: "Work",
    workDescription:
      "Research papers and production experience around speech language models, privacy, and spoken dialogue intelligence.",
    notesTitle: "Notes",
    notesDescription:
      "A public notebook for industry structure, company strategy, and signals worth tracking.",
    backgroundTitle: "Background",
    viewWork: "View Work",
    readNotes: "Read Notes",
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
    workTitle: "Work",
    workDescription:
      "围绕语音语言模型、隐私评估与语音对话智能的研究论文和生产实践。",
    notesTitle: "Notes",
    notesDescription:
      "公开记录行业结构、公司战略，以及值得持续追踪的关键信号。",
    backgroundTitle: "Background",
    viewWork: "查看 Work",
    readNotes: "阅读 Notes",
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
    workTitle: string;
    workDescription: string;
    notesTitle: string;
    notesDescription: string;
    backgroundTitle: string;
    viewWork: string;
    readNotes: string;
    researchLabel: string;
    experienceLabel: string;
    educationLabel: string;
    links: Record<"github" | "scholar" | "cv" | "email", string>;
  }
>;

const sectionNavItems = [
  ["profile", "profile"],
  ["work", "work"],
  ["notes", "notes"],
  ["background", "background"],
] as const satisfies Array<readonly [keyof typeof homeDesignCopy.en.nav, string]>;

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

export function HomePageView({ locale = defaultLocale }: HomePageViewProps) {
  const { common } = getMessages(locale);
  const copy = homeDesignCopy[locale];
  const { featuredInsight, entries: insightEntries } = getInsightContent(locale);
  const insightsHref = localizedHref("/insights/", locale);
  const cvHref = "/files/Resume_en.pdf";

  return (
    <>
      <HomeNav locale={locale} />
      <PointerGlow>
        <main className="home-motion-shell relative min-h-screen bg-[#050608] text-[#e8edf7]" data-locale={locale}>
          <div className="home-layout relative z-10 mx-auto grid min-h-screen w-[min(1280px,calc(100vw-2rem))] gap-[clamp(2.5rem,7vw,7rem)] px-[clamp(0.25rem,1vw,0.5rem)] pt-[calc(3.2rem+clamp(2rem,5vw,4.2rem))] pb-[clamp(3rem,7vw,5rem)] lg:grid-cols-[minmax(18rem,0.86fr)_minmax(0,1.5fr)]">
            <aside id="profile" className="home-profile lg:sticky lg:top-[calc(3.2rem+clamp(2rem,5vw,4.2rem))] lg:flex lg:max-h-[calc(100svh-7rem)] lg:flex-col">
              <div className="home-reveal" style={{ animationDelay: "80ms" }}>
                <p className="home-profile-mark">
                  {authorConfig.name}
                </p>
                <h1 className="home-profile-name">
                  {authorConfig.name}
                </h1>
                <p className="home-profile-role">
                  {copy.role}
                </p>
                <p className="home-profile-summary">
                  {copy.profileSummary}
                </p>
              </div>

              <nav className="home-section-nav home-reveal mt-[clamp(3.2rem,7vw,5.8rem)] grid gap-7" style={{ animationDelay: "260ms" }} aria-label="Homepage sections">
                {sectionNavItems.map(([key, id]) => (
                  <a key={id} href={`#${id}`} data-hover-reactive className="home-section-nav-item">
                    {copy.nav[key]}
                  </a>
                ))}
              </nav>

              <div className="home-social-links home-reveal mt-12 flex flex-wrap gap-x-8 gap-y-3 text-[0.86rem] text-[#8993a3] lg:mt-auto" style={{ animationDelay: "420ms" }}>
                <a href={`https://github.com/${authorConfig.github}`} target="_blank" rel="noopener noreferrer">
                  {copy.links.github}
                </a>
                <a href={authorConfig.googlescholar} target="_blank" rel="noopener noreferrer">
                  {copy.links.scholar}
                </a>
                <a href={cvHref}>{copy.links.cv}</a>
                <a href={`mailto:${authorConfig.email}`}>{copy.links.email}</a>
              </div>
            </aside>

            <div className="home-stream min-w-0">
              <section className="home-reveal" style={{ animationDelay: "160ms" }}>
                <p className="home-kicker">
                  {copy.eyebrow}
                </p>
                <h2 className="home-hero-title">
                  {copy.headline}
                </h2>
                <p className="home-hero-summary">
                  {copy.summary}
                </p>
                <div className="mt-10 flex flex-wrap gap-4">
                  <a href="#work" data-hover-reactive className="home-action-primary">
                    <span>{copy.viewWork}</span>
                  </a>
                  <Link href={insightsHref} data-hover-reactive className="home-action-secondary">
                    <span>{copy.readNotes}</span>
                  </Link>
                </div>
              </section>

              <section id="work" className="home-section home-reveal" style={{ animationDelay: "300ms" }}>
                <SectionHeading title={copy.workTitle} description={copy.workDescription} />
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
              </section>

              <section id="notes" className="home-section home-reveal" style={{ animationDelay: "380ms" }}>
                <SectionHeading title={copy.notesTitle} description={featuredInsight.description || copy.notesDescription} />
                <div className="home-evidence-list">
                  {insightEntries.map((entry) => (
                    <EvidenceRow
                      key={entry.title}
                      label={entry.category}
                      meta={entry.cadence}
                      title={entry.title}
                      description={entry.description}
                      detail={entry.tags.join(" / ")}
                      href={entry.href ? localizedHref(entry.href, locale) : insightsHref}
                    />
                  ))}
                </div>
              </section>

              <section id="background" className="home-section home-reveal" style={{ animationDelay: "460ms" }}>
                <SectionHeading title={copy.backgroundTitle} />
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
              </section>
            </div>
          </div>
        </main>
      </PointerGlow>
    </>
  );
}
