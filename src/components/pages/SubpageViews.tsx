import Link from "next/link";
import { ArchiveItem } from "@/components/cards/ArchiveItem";
import { Footer } from "@/components/layout/Footer";
import { Sidebar } from "@/components/layout/Sidebar";
import { Masthead } from "@/components/navigation/Masthead";
import { authorConfig } from "@/config/author";
import {
  getCvEducation,
  getCvInternships,
  getCvPublications,
  getPublicationArchive,
  publicationCategoryOrder,
} from "@/config/profile";
import { defaultLocale, type Locale } from "@/i18n/locales";
import { localizedHref } from "@/i18n/links";
import { getMessages } from "@/i18n/messages";

interface LocaleViewProps {
  locale?: Locale;
}

interface SubpageShellProps extends LocaleViewProps {
  children: React.ReactNode;
}

const sitemapPages = [
  { key: "home", url: "/" },
  { key: "publications", url: "/publications/" },
  { key: "insights", url: "/insights/" },
  { key: "cv", url: "/cv/" },
  { key: "teaching", url: "/teaching/" },
  { key: "talks", url: "/talks/" },
  { key: "posts", url: "/posts/" },
  { key: "stats", url: "/stats/" },
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
  const { common } = getMessages(locale);
  const education = getCvEducation(locale);
  const publications = getCvPublications(locale);
  const internships = getCvInternships(locale);

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
        {education.map((item) => (
          <div key={item.id} className="mb-4">
            <h3 className="font-bold text-[var(--global-text-color)]">
              {item.school}
            </h3>
            <p className="text-sm text-[var(--global-text-color-light)]">
              {item.detail}
            </p>
          </div>
        ))}
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-bold border-b border-[var(--global-border-color)] pb-2 mb-4 text-[var(--global-text-color)]">
          {cv.publicationsTitle}
        </h2>
        {publications.map((pub) => (
          <ArchiveItem
            key={pub.id}
            {...pub}
            locale={locale}
            paperLabel={common.paper}
          />
        ))}
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-bold border-b border-[var(--global-border-color)] pb-2 mb-4 text-[var(--global-text-color)]">
          {cv.internshipTitle}
        </h2>
        {internships.map((item) => (
          <div key={item.id} className="mb-4">
            <h3 className="font-bold text-[var(--global-text-color)]">
              {item.role}
            </h3>
            <p className="text-sm text-[var(--global-text-color-light)]">
              {item.detail}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}

export function PublicationsPageView({ locale = defaultLocale }: LocaleViewProps) {
  const { publications: publicationsMessages } = getMessages(locale).pages;
  const { common } = getMessages(locale);
  const publications = getPublicationArchive(locale);
  const grouped = publicationCategoryOrder
    .map((category) => ({
      category,
      items: publications.filter((publication) => publication.category === category),
    }))
    .filter(({ items }) => items.length > 0);

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
      {grouped.map(({ category, items }) => (
        <section key={category} className="mb-8">
          <h2 className="text-lg font-bold border-b border-[var(--global-border-color)] pb-2 mb-4 text-[var(--global-text-color)]">
            {publicationsMessages.categoryTitles[category] || category}
          </h2>
          {items.map((pub) => (
            <ArchiveItem
              key={pub.id}
              {...pub}
              locale={locale}
              paperLabel={common.paper}
            />
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
