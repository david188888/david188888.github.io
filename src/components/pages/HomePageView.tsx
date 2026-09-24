import Link from "next/link";
import "@/components/home/editorial.css";
import { EditorialMasthead } from "@/components/home/EditorialMasthead";
import { LatestInsightCarousel } from "@/components/home/LatestInsightCarousel";
import { editorialThemeScript } from "@/components/home/editorialTheme";
import { authorConfig } from "@/config/author";
import { getInsightContent } from "@/config/insights";
import {
  getCompetitionRecords,
  getOpenSourceProjects,
  tradingAgentsProject,
} from "@/config/projects";
import {
  getHomeEducation,
  getHomeInternships,
  getHomePublications,
} from "@/config/profile";
import { localizedHref } from "@/i18n/links";
import { defaultLocale, type Locale } from "@/i18n/locales";
import { getPublishedPosts } from "@/lib/content/posts";

interface HomePageViewProps {
  locale?: Locale;
}

interface HomeLinkCopy {
  cv: string;
  github: string;
  googleScholar: string;
  email: string;
}

interface LensStepCopy {
  no: string;
  name: string;
  desc: string;
}

interface HomeCopy {
  profileLabel: string;
  profileSummary: string;
  links: HomeLinkCopy;
  profileFoot: string;
  featureLabel: string;
  fallbackCta: string;
  lensSteps: readonly LensStepCopy[];
  educationTitle: string;
  educationDescription: string;
  coursesLabel: string;
  experienceTitle: string;
  experienceDescription: string;
  researchTitle: string;
  researchDescription: string;
  paperLabel: string;
  projectsTitle: string;
  projectsDescription: string;
  projectKicker: string;
  projectCaption: string;
  projectDetail: string;
  upstreamLabel: string;
  openSourceKicker: string;
  competitionsKicker: string;
  competitionsTitle: string;
  repositoryLabel: string;
  footerNote: string;
}

const homeCopy: Record<Locale, HomeCopy> = {
  en: {
    profileLabel: "Profile",
    profileSummary:
      "Background in software engineering and data science. I focus on how technology moves toward products and commercialization, and how those shifts redistribute value across the industry chain.",
    links: { cv: "View CV", github: "GitHub", googleScholar: "Google Scholar", email: "Contact me" },
    profileFoot: "Open to strategy research / investment analysis roles",
    featureLabel: "Industry Memos · Latest memo",
    fallbackCta: "Browse all Industry Memos",
    lensSteps: [
      {
        no: "01",
        name: "Technology Shift",
        desc: "What capability, cost structure, or interaction model has changed structurally?",
      },
      {
        no: "02",
        name: "Product & Commercialization",
        desc: "How does it enter real use cases and form a sustainable revenue and cost structure?",
      },
      {
        no: "03",
        name: "Value Redistribution",
        desc: "Where do bargaining power, profit pools, and investment opportunities move across the value chain?",
      },
    ],
    educationTitle: "Education",
    educationDescription: "Academic training in software engineering and data science.",
    coursesLabel: "Coursework",
    experienceTitle: "Experience",
    experienceDescription: "Research translated into production speech systems.",
    researchTitle: "Selected Research",
    researchDescription: "Speech-language-model safety, privacy, and spoken dialogue intelligence.",
    paperLabel: "Read the paper ↗",
    projectsTitle: "Projects and Open Source",
    projectsDescription: "Research tooling, open-source contributions, and mathematical modeling.",
    projectKicker: "Research tool · Built on an open-source framework",
    projectCaption:
      "Actual workspace screenshot · valuation basis and supporting evidence. Click to open the project overview.",
    projectDetail: "Project details →",
    upstreamLabel: "Upstream project ↗",
    openSourceKicker: "Open-source contribution",
    competitionsKicker: "Competitions & Modeling",
    competitionsTitle: "Mathematical modeling",
    repositoryLabel: "View repository ↗",
    footerNote: "Research and personal notes · © 2026",
  },
  zh: {
    profileLabel: "Profile",
    profileSummary:
      "软件工程与数据科学教育背景。关注技术如何走向产品与商业化，以及变化如何沿产业链重新分配价值。",
    links: { cv: "查看简历", github: "GitHub", googleScholar: "Google Scholar", email: "联系我" },
    profileFoot: "开放战略研究 / 投资分析类机会",
    featureLabel: "行业思考 · 最新文章",
    fallbackCta: "查看全部行业思考",
    lensSteps: [
      { no: "01", name: "技术变化", desc: "什么能力、成本或交互方式出现结构性变化。" },
      { no: "02", name: "产品与商业化", desc: "它如何进入真实场景，并形成可持续收入与成本结构。" },
      { no: "03", name: "价值重新分配", desc: "产业链上的议价权、利润池与投资机会因此流向哪里。" },
    ],
    educationTitle: "教育背景",
    educationDescription: "软件工程与数据科学方向的学习经历。",
    coursesLabel: "主修课程",
    experienceTitle: "实习经历",
    experienceDescription: "将语音研究转化为生产系统与低时延应用。",
    researchTitle: "论文研究",
    researchDescription: "围绕语音语言模型安全、隐私与语音对话智能的研究。",
    paperLabel: "阅读论文 ↗",
    projectsTitle: "项目与开源",
    projectsDescription: "研究工具、开源贡献与数学建模实践。",
    projectKicker: "研究工具 · 基于开源框架扩展",
    projectCaption: "实际工作台截图 · 估值依据与事实证据。点击查看项目介绍。",
    projectDetail: "项目详情 →",
    upstreamLabel: "上游项目 ↗",
    openSourceKicker: "开源贡献",
    competitionsKicker: "竞赛与建模",
    competitionsTitle: "数学建模实践",
    repositoryLabel: "查看参赛仓库 ↗",
    footerNote: "研究与个人笔记 · © 2026",
  },
};

const sharedCopy = {
  en: {
    projects: {
      summary:
        "Built on TauricResearch/TradingAgents and extended for A-share research with additional data sources, evidence-quality checks, and a local web workspace. Multi-agent analysis is organised into a traceable company-research process that keeps uncertainty visible when evidence is thin, instead of issuing buy or sell instructions.",
    },
  },
  zh: {
    projects: {
      summary:
        "基于 TauricResearch/TradingAgents，面向 A 股研究扩展数据接入、证据质量检查与本地 Web 工作台。将多智能体分析组织为可追溯的公司研究流程，保留证据不足时的不确定性，而非直接输出买卖指令。",
    },
  },
} as const;

const MAX_PULL_QUOTE_LENGTH = 160;

/**
 * Uses the longest author-authored highlight in the article as the pull quote, so
 * the block stays in step with the post instead of being maintained by hand.
 * Highlights longer than a pull quote are cut at the last sentence break that
 * still fits, and only truncated mid-sentence when no break is available.
 */
function extractPullQuote(body: string): string | null {
  const highlights = Array.from(body.matchAll(/==[\w-]+\|([\s\S]*?)==/g))
    .map((match) => match[1].replaceAll("**", "").replaceAll(/\s+/g, " ").trim())
    .filter((text) => text.length >= 20);
  if (highlights.length === 0) return null;

  const longest = highlights.reduce((current, text) => (text.length > current.length ? text : current));
  if (longest.length <= MAX_PULL_QUOTE_LENGTH) return longest;

  const head = longest.slice(0, MAX_PULL_QUOTE_LENGTH);
  const lastBreak = Math.max(
    head.lastIndexOf("。"),
    head.lastIndexOf("！"),
    head.lastIndexOf("？"),
    head.lastIndexOf(". "),
    head.lastIndexOf("! "),
    head.lastIndexOf("? ")
  );
  if (lastBreak >= 40) return head.slice(0, lastBreak + 1);
  return `${head.trimEnd()}…`;
}

export function HomePageView({ locale = defaultLocale }: HomePageViewProps) {
  const copy = homeCopy[locale];
  const summary = sharedCopy[locale].projects.summary;
  const links = copy.links;
  const education = getHomeEducation(locale);
  const internships = getHomeInternships(locale);
  const papers = getHomePublications(locale);
  const openSource = getOpenSourceProjects(locale);
  const competitions = getCompetitionRecords(locale);
  const { featuredInsight } = getInsightContent(locale);
  const latestPosts = getPublishedPosts(locale).slice(0, 5);
  const latestCards = latestPosts.map((post) => ({
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    date: post.date,
    tags: post.tags,
    href: localizedHref(`/insights/${post.slug}/`, locale),
    pullQuote: extractPullQuote(post.body),
  }));
  const insightsHref = localizedHref("/insights/", locale);

  return (
    <div className="ed-root">
      <script dangerouslySetInnerHTML={{ __html: editorialThemeScript }} />
      <div className="ed-site">
        <EditorialMasthead locale={locale} />
        <main>
          <div className="home-hero">
            <section
              className="home-hero-frame"
              aria-label={locale === "zh" ? "个人简介与最新文章" : "Profile and latest writing"}
            >
              <aside className="profile" aria-labelledby="profile-name">
                <p className="section-label">{copy.profileLabel}</p>
                <h1 className="name" id="profile-name">
                  {authorConfig.nameLocalized[locale]}
                </h1>
                <p className="profile-copy">{copy.profileSummary}</p>
                <div className="profile-footer">
                  <nav className="contact" aria-label={locale === "zh" ? "个人链接" : "Profile links"}>
                    <a href="/files/Resume_en.pdf" target="_blank" rel="noopener">
                      {links.cv} <span aria-hidden="true">↗</span>
                    </a>
                    <a href={`https://github.com/${authorConfig.github}`} target="_blank" rel="noopener">
                      {links.github} <span aria-hidden="true">↗</span>
                    </a>
                    {authorConfig.googlescholar && (
                      <a href={authorConfig.googlescholar} target="_blank" rel="noopener">
                        {links.googleScholar} <span aria-hidden="true">↗</span>
                      </a>
                    )}
                    <a href={`mailto:${authorConfig.email}`}>
                      {links.email} <span aria-hidden="true">↗</span>
                    </a>
                  </nav>
                  <p className="profile-foot">
                    <span className="dot" aria-hidden="true" />
                    <span>{copy.profileFoot}</span>
                  </p>
                </div>
              </aside>

              <div className="insight-wrap" id="insights">
                {latestCards.length > 0 ? (
                  <LatestInsightCarousel
                    locale={locale}
                    cards={latestCards}
                    featureLabel={copy.featureLabel}
                    pullQuoteLabel={locale === "zh" ? "摘自本文" : "From this article"}
                  />
                ) : (
                  <article className="feature" aria-labelledby="feature-title">
                    <div className="feature-meta">
                      <strong>{copy.featureLabel}</strong>
                    </div>
                    <h2 id="feature-title">
                      <span>{featuredInsight.title}</span>
                    </h2>
                    <p className="excerpt">{featuredInsight.description}</p>
                    <Link className="read" href={insightsHref}>
                      <span>{copy.fallbackCta}</span>
                      <span aria-hidden="true">→</span>
                    </Link>
                  </article>
                )}
              </div>
            </section>

            <section className="lens-bridge" aria-label={locale === "zh" ? "投资视角" : "Investment lens"}>
              <div className="lens-heading">
                <p className="lens-kicker">Investment Lens</p>
              </div>
              <ol className="lens-flow">
                {copy.lensSteps.map((step) => (
                  <li className="lens-step" key={step.no}>
                    <p className="lens-no" aria-hidden="true">
                      {step.no}
                    </p>
                    <p className="lens-name">{step.name}</p>
                    <p className="lens-desc">{step.desc}</p>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <section id="education" className="chapter" aria-labelledby="education-title">
            <header className="chapter-head">
              <span className="chapter-label">EDUCATION</span>
              <h2 id="education-title">{copy.educationTitle}</h2>
              <p>{copy.educationDescription}</p>
            </header>
            <div className="education-grid">
              {education.map((item) => (
                <article className="education-entry" key={item.id}>
                  <span className="degree-label">{item.time}</span>
                  <h3 className="school">{item.title}</h3>
                  <p className="degree">{item.meta}</p>
                  {item.description ? <p className="education-detail">{item.description}</p> : null}
                  <p className="courses-label">{copy.coursesLabel}</p>
                  <ul className="education-courses">
                    {item.courses.map((course) => (
                      <li key={course.name}>
                        <span>{course.name}</span>
                        {course.score !== undefined ? (
                          <span className="course-score" aria-label={`${course.score} points`}>
                            {course.score}
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>

          <section id="experience" className="chapter" aria-labelledby="experience-title">
            <header className="chapter-head">
              <span className="chapter-label">EXPERIENCE</span>
              <h2 id="experience-title">{copy.experienceTitle}</h2>
              <p>{copy.experienceDescription}</p>
            </header>
            <div className="record-list">
              {internships.map((item) => {
                const [company, ...roleParts] = item.title.split(" · ");
                const role = roleParts.join(" · ") || item.title;
                return (
                  <article className="experience-row" key={item.id}>
                    <div>
                      <h3 className="record-org">{company}</h3>
                      <p className="record-period">{item.time}</p>
                    </div>
                    <div>
                      <p className="record-role">{role}</p>
                      <p className="record-description">{item.description}</p>
                      <p className="record-location">{item.meta}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section id="research" className="chapter" aria-labelledby="research-title">
            <header className="chapter-head">
              <span className="chapter-label">SELECTED RESEARCH</span>
              <h2 id="research-title">{copy.researchTitle}</h2>
              <p>{copy.researchDescription}</p>
            </header>
            <div className="record-list">
              {papers.map((paper) => (
                <article className="research-row" key={paper.id}>
                  <div className="paper-meta">
                    <span>{paper.venue}</span>
                    <span className="authorship">{paper.authorship}</span>
                  </div>
                  <h3 className="paper-title">
                    <a href={paper.paperUrl} target="_blank" rel="noopener noreferrer">
                      {paper.title}
                    </a>
                  </h3>
                  <p className="record-description">{paper.description}</p>
                  <a
                    className="paper-link"
                    href={paper.paperUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {copy.paperLabel}
                  </a>
                </article>
              ))}
            </div>
          </section>

          <section id="projects" className="chapter" aria-labelledby="projects-title">
            <header className="chapter-head">
              <span className="chapter-label">PROJECTS &amp; OPEN SOURCE</span>
              <h2 id="projects-title">{copy.projectsTitle}</h2>
              <p>{copy.projectsDescription}</p>
            </header>
            <div>
              <article className="project-feature">
                <p className="project-kicker">{copy.projectKicker}</p>
                <h3 className="project-name">{tradingAgentsProject.name}</h3>
                <p className="project-summary">{summary}</p>
                <figure className="project-image">
                  <Link
                    href={localizedHref(tradingAgentsProject.detailHref, locale)}
                    aria-label={`${tradingAgentsProject.name} ${copy.projectDetail}`}
                  >
                    <img
                      src={tradingAgentsProject.screenshot}
                      width={tradingAgentsProject.screenshotWidth}
                      height={tradingAgentsProject.screenshotHeight}
                      loading="lazy"
                      alt={
                        locale === "zh"
                          ? "TradingAgents 本地研究工作台：左侧为分析设置与运行记录，右侧展示估值依据不足的说明和带证据引用的事实条目"
                          : "TradingAgents local research workspace: analysis settings and run history on the left, an explanation of missing valuation anchors and evidence-cited facts on the right"
                      }
                    />
                  </Link>
                  <figcaption>{copy.projectCaption}</figcaption>
                </figure>
                <div className="project-actions">
                  <Link href={localizedHref(tradingAgentsProject.detailHref, locale)}>
                    {copy.projectDetail}
                  </Link>
                  <a href={tradingAgentsProject.repositoryUrl} target="_blank" rel="noopener noreferrer">
                    GitHub ↗
                  </a>
                  <a href={tradingAgentsProject.upstreamUrl} target="_blank" rel="noopener noreferrer">
                    {copy.upstreamLabel}
                  </a>
                </div>
              </article>

              {openSource.map((project) => (
                <article className="project-group" key={project.id}>
                  <p className="project-kicker">{copy.openSourceKicker}</p>
                  <h3>{project.name}</h3>
                  <p className="project-group-lead">{project.lead}</p>
                  <ul className="contribution-list">
                    {project.contributions.map((contribution) => (
                      <li key={contribution.id}>
                        <a href={contribution.pullRequestUrl} target="_blank" rel="noopener noreferrer">
                          #{contribution.id.split("-").at(-1)} ↗
                        </a>
                        <span>{contribution.summary}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}

              <div className="project-group">
                <p className="project-kicker">{copy.competitionsKicker}</p>
                <h3>{copy.competitionsTitle}</h3>
                {competitions.map((competition) => (
                  <article className="contest" key={competition.id}>
                    <h4>{competition.name}</h4>
                    <p className="contest-award">{competition.award}</p>
                    {competition.topic ? (
                      <p className="contest-description">{competition.topic}</p>
                    ) : null}
                    {competition.repositoryUrl ? (
                      <a href={competition.repositoryUrl} target="_blank" rel="noopener noreferrer">
                        {copy.repositoryLabel}
                      </a>
                    ) : null}
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section id="contact" className="closing" aria-labelledby="contact-title">
            <div>
              <h2 id="contact-title" className="slogan">
                <span>Be hungry,</span>
                <span className="slogan-em">bet on yourself</span>
              </h2>
            </div>
            <div className="closing-links">
              <a href={`mailto:${authorConfig.email}`}>{authorConfig.email} ↗</a>
              <a href="/files/Resume_en.pdf" target="_blank" rel="noopener">
                {links.cv} ↗
              </a>
              <a href={`https://github.com/${authorConfig.github}`} target="_blank" rel="noopener">
                GitHub ↗
              </a>
            </div>
          </section>
        </main>
        <footer className="foot">
          <p className="foot-note">{copy.footerNote}</p>
        </footer>
      </div>
    </div>
  );
}
