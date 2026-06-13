import Link from "next/link";
import { ArchiveItem } from "@/components/cards/ArchiveItem";
import { Footer } from "@/components/layout/Footer";
import { Sidebar } from "@/components/layout/Sidebar";
import { Masthead } from "@/components/navigation/Masthead";
import { authorConfig } from "@/config/author";
import { defaultLocale, type Locale } from "@/i18n/locales";
import { localizedHref } from "@/i18n/links";
import { getMessages } from "@/i18n/messages";

interface LocaleViewProps {
  locale?: Locale;
}

interface SubpageShellProps extends LocaleViewProps {
  children: React.ReactNode;
}

const cvPublications = [
  {
    title: "VoxSafeBench: Not Just What Is Said, but Who, How, and Where",
    permalink: "https://arxiv.org/abs/2604.14548",
    venue: "NeurIPS 2026 · Under Review",
    date: "2026-04-01",
    excerpt: "Second author.",
    paperUrl: "https://arxiv.org/abs/2604.14548",
  },
  {
    title: "VoxPrivacy: A Benchmark for Evaluating Interactional Privacy of Speech Language Models",
    permalink: "https://arxiv.org/abs/2601.19956",
    venue: "ICLR 2026 · Poster",
    date: "2026-01-01",
    excerpt: "Second author.",
    paperUrl: "https://arxiv.org/abs/2601.19956",
  },
  {
    title: "DialogGraph-LLM: Graph-Informed LLMs for End-to-End Audio Dialogue Intent Recognition",
    permalink: "https://arxiv.org/abs/2511.11000",
    venue: "ECAI 2025 · Oral",
    date: "2025-06-01",
    excerpt: "First author.",
    paperUrl: "https://arxiv.org/abs/2511.11000",
  },
  {
    title: "Multi-segment Multitask Fusion Network for Marketing Audio Classification",
    permalink: "https://arxiv.org/abs/2511.11006",
    venue: "ADMA 2025 · Poster",
    date: "2025-01-01",
    excerpt: "First author.",
    paperUrl: "https://arxiv.org/abs/2511.11006",
  },
];

const publications = [
  {
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
    title: "Multi-segment Multitask Fusion Network for Marketing Audio Classification",
    permalink: "https://arxiv.org/abs/2511.11006",
    venue: "ADMA 2025 · Poster",
    date: "2025-01-01",
    excerpt:
      "Proposed MSMT-FN for marketing-call attitude classification, achieving stronger results than prior baselines; first author.",
    paperUrl: "https://arxiv.org/abs/2511.11006",
    category: "conferences",
  },
];

const sitemapPages = [
  { key: "home", url: "/" },
  { key: "publications", url: "/publications/" },
  { key: "insights", url: "/insights/" },
  { key: "cv", url: "/cv/" },
  { key: "teaching", url: "/teaching/" },
  { key: "talks", url: "/talks/" },
  { key: "posts", url: "/posts/" },
  { key: "stats", url: "/stats/", hasLocaleRoute: false },
  { key: "sitemap", url: "/sitemap/" },
  { key: "terms", url: "/terms/" },
] as const;

export function SubpageShell({ children, locale = defaultLocale }: SubpageShellProps) {
  return (
    <>
      <Masthead locale={locale} />
      <div className="page-container max-w-[1280px] mx-auto px-4 pt-[70px]">
        <Sidebar locale={locale} />
        <div className="lg:ml-[calc(100%/12*2)] lg:w-[calc(100%/12*10)] lg:pl-4 pb-36">
          {children}
          <Footer locale={locale} />
        </div>
      </div>
    </>
  );
}

export function CVPageView({ locale = defaultLocale }: LocaleViewProps) {
  const { cv } = getMessages(locale).pages;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 text-[var(--global-text-color)]">
        {cv.title}
      </h1>

      <p className="mb-4 text-[var(--global-text-color-light)]">
        <Link
          href="/files/Resume_en.pdf"
          target="_blank"
          className="text-[var(--global-link-color)] underline font-medium"
        >
          {cv.downloadPdf}
        </Link>
      </p>

      <section className="mb-8">
        <h2 className="text-lg font-bold border-b border-[var(--global-border-color)] pb-2 mb-4 text-[var(--global-text-color)]">
          {cv.educationTitle}
        </h2>
        <div className="mb-4">
          <h3 className="font-bold text-[var(--global-text-color)]">
            South China Normal University
          </h3>
          <p className="text-sm text-[var(--global-text-color-light)]">
            B.Eng. in Software Engineering · GPA: 4.06
          </p>
        </div>
        <div className="mb-4">
          <h3 className="font-bold text-[var(--global-text-color)]">
            The Chinese University of Hong Kong, Shenzhen
          </h3>
          <p className="text-sm text-[var(--global-text-color-light)]">
            M.Sc. in Data Science · Matriculation: Sep 2026
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-bold border-b border-[var(--global-border-color)] pb-2 mb-4 text-[var(--global-text-color)]">
          {cv.publicationsTitle}
        </h2>
        {cvPublications.map((pub) => (
          <ArchiveItem key={pub.title} {...pub} />
        ))}
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-bold border-b border-[var(--global-border-color)] pb-2 mb-4 text-[var(--global-text-color)]">
          {cv.internshipTitle}
        </h2>
        <div className="mb-4">
          <h3 className="font-bold text-[var(--global-text-color)]">
            Insta360 · Speech Algorithm Intern
          </h3>
          <p className="text-sm text-[var(--global-text-color-light)]">
            Shenzhen, China · Feb 2026 - Jun 2026
          </p>
        </div>
        <div className="mb-4">
          <h3 className="font-bold text-[var(--global-text-color)]">
            Amphion Technology · R&D Intern
          </h3>
          <p className="text-sm text-[var(--global-text-color-light)]">
            Shenzhen, China · Jun 2025 - Sep 2025
          </p>
        </div>
      </section>
    </div>
  );
}

export function PublicationsPageView({ locale = defaultLocale }: LocaleViewProps) {
  const { publications: publicationsMessages } = getMessages(locale).pages;
  const grouped = publications.reduce(
    (acc, pub) => {
      const cat = pub.category || "conferences";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(pub);
      return acc;
    },
    {} as Record<string, typeof publications>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2 text-[var(--global-text-color)]">
        {publicationsMessages.title}
      </h1>
      {authorConfig.googlescholar && (
        <p className="text-sm text-[var(--global-text-color-light)] mb-4">
          {publicationsMessages.alsoOn}{" "}
          <a
            href={authorConfig.googlescholar}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--global-link-color)]"
          >
            Google Scholar
          </a>
          .
        </p>
      )}
      {Object.entries(grouped).map(([category, items]) => (
        <section key={category} className="mb-8">
          <h2 className="text-lg font-bold border-b border-[var(--global-border-color)] pb-2 mb-4 text-[var(--global-text-color)]">
            {publicationsMessages.categoryTitles[category] || category}
          </h2>
          {items.map((pub) => (
            <ArchiveItem key={pub.title} {...pub} />
          ))}
        </section>
      ))}
    </div>
  );
}

export function PostsPageView({ locale = defaultLocale }: LocaleViewProps) {
  const { posts } = getMessages(locale).pages;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 text-[var(--global-text-color)]">
        {posts.title}
      </h1>
      <p className="max-w-2xl text-[var(--global-text-color-light)]">
        {posts.description}
      </p>
      <p className="mt-5">
        <Link
          href={localizedHref("/insights/", locale)}
          className="text-[var(--global-link-color)] underline underline-offset-4"
        >
          {posts.insightsLink}
        </Link>
      </p>
    </div>
  );
}

export function SitemapPageView({ locale = defaultLocale }: LocaleViewProps) {
  const { sitemap } = getMessages(locale).pages;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 text-[var(--global-text-color)]">
        {sitemap.title}
      </h1>
      <ul className="list-none p-0">
        {sitemapPages.map((page) => (
          <li key={page.url} className="mb-3">
            <Link
              href={
                "hasLocaleRoute" in page && page.hasLocaleRoute === false
                  ? page.url
                  : localizedHref(page.url, locale)
              }
              className="text-[var(--global-link-color)] no-underline hover:underline"
            >
              {sitemap.pages[page.key]}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TalksPageView({ locale = defaultLocale }: LocaleViewProps) {
  const { talks } = getMessages(locale).pages;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 text-[var(--global-text-color)]">
        {talks.title}
      </h1>
      <p className="text-[var(--global-text-color-light)]">
        {talks.description}
      </p>
    </div>
  );
}

export function TeachingPageView({ locale = defaultLocale }: LocaleViewProps) {
  const { teaching } = getMessages(locale).pages;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 text-[var(--global-text-color)]">
        {teaching.title}
      </h1>
      <p className="text-[var(--global-text-color-light)]">
        {teaching.description}
      </p>
    </div>
  );
}

export function TermsPageView({ locale = defaultLocale }: LocaleViewProps) {
  const { terms } = getMessages(locale).pages;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 text-[var(--global-text-color)]">
        {terms.title}
      </h1>
      <div className="prose dark:prose-invert max-w-none text-[var(--global-text-color)]">
        <p>{terms.intro}</p>
        <h2>{terms.analyticsTitle}</h2>
        <p>{terms.analytics}</p>
        <h2>{terms.externalLinksTitle}</h2>
        <p>{terms.externalLinks}</p>
      </div>
    </div>
  );
}
