import Link from "next/link";
import { AcademicRecordCard } from "@/components/home/AcademicRecordCard";
import { HomeSectionRail } from "@/components/home/HomeSectionRail";
import { HomeScrollProgress } from "@/components/home/HomeScrollProgress";
import { PointerGlow } from "@/components/home/PointerGlow";
import { HomeNav } from "@/components/navigation/HomeNav";
import { authorConfig } from "@/config/author";
import {
  getHomeEducation,
  getHomeInternships,
  getHomePublications,
  getIncomingEducation,
} from "@/config/profile";
import { getInsightContent } from "@/config/insights";
import { localizedHref } from "@/i18n/links";
import { defaultLocale, type Locale } from "@/i18n/locales";
import { getMessages } from "@/i18n/messages";
import { getPublishedPosts } from "@/lib/content/posts";

interface HomePageViewProps {
  locale?: Locale;
}

const homeCopy = {
  en: {
    role: "Speech AI Researcher",
    introduction:
      "I study trustworthy speech language models, interactional privacy, and spoken dialogue intelligence, with experience carrying research into production systems.",
    focusLabel: "Research focus",
    focusValue: "Speech Language Models · Trustworthiness · Agentic RL",
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
  const education = getHomeEducation(locale);
  const internships = getHomeInternships(locale);
  const papers = getHomePublications(locale);
  const incomingEducation = getIncomingEducation(locale);
  const { featuredInsight } = getInsightContent(locale);
  const latestPost = getPublishedPosts(locale)[0];
  const insightsHref = localizedHref("/insights/", locale);

  return (
    <>
      <HomeNav locale={locale} />
      <HomeScrollProgress />
      <HomeSectionRail locale={locale} />
      <PointerGlow>
        <main className="academic-home home-motion-shell" data-locale={locale}>
          <div className="academic-home-container">
            <section id="profile" className="academic-home-hero home-reveal">
              <div className="home-stagger-group is-shown">
                <p className="academic-home-kicker home-stagger-line home-stagger-line--1">{copy.role}</p>
                <h1 className="home-stagger-line home-stagger-line--2">{authorConfig.name}</h1>
                <p className="academic-home-intro home-stagger-line home-stagger-line--3">
                  {copy.introduction}
                </p>
                <div className="academic-home-links home-stagger-line home-stagger-line--4">
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
              <aside className="academic-home-facts home-stagger-group is-shown">
                <div className="home-stagger-line home-stagger-line--3">
                  <span>{copy.focusLabel}</span>
                  <p>{copy.focusValue}</p>
                </div>
                <div className="home-stagger-line home-stagger-line--4">
                  <span>{incomingEducation.label}</span>
                  <p>{incomingEducation.value}</p>
                </div>
              </aside>
            </section>

            <section id="education" className="academic-home-section">
              <SectionHeading title={copy.educationTitle} description={copy.educationDescription} />
              <div className="academic-card-stack">
                {education.map((item) => (
                  <AcademicRecordCard
                    key={item.id}
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
                {papers.map((paper) => (
                  <AcademicRecordCard
                    key={paper.id}
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
                {internships.map((item) => {
                  const { company, role } = splitExperienceTitle(item.title);
                  return (
                    <AcademicRecordCard
                      key={item.id}
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
                <Link
                  className="academic-home-insights-card-link"
                  href={localizedHref(`/insights/${latestPost.slug}/`, locale)}
                  aria-label={latestPost.title}
                >
                  <AcademicRecordCard
                    category={copy.latestNote}
                    meta={latestPost.date ?? copy.insightsTitle}
                    title={latestPost.title}
                    description={latestPost.excerpt}
                    details={latestPost.tags}
                  />
                </Link>
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
