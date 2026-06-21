import Link from "next/link";
import {
  AlignedPageShell,
  type AlignedPageSection,
} from "@/components/layout/AlignedPageShell";
import { getInsightContent } from "@/config/insights";
import { defaultLocale, type Locale } from "@/i18n/locales";
import { localizedHref } from "@/i18n/links";
import { getMessages } from "@/i18n/messages";
import { getPublishedPosts, type LocalizedPost } from "@/lib/content/posts";

interface InsightsPageViewProps {
  locale?: Locale;
}

export function buildInsightsSections(
  locale: Locale,
  posts: readonly LocalizedPost[]
): AlignedPageSection[] {
  const { insights } = getMessages(locale).pages;
  const { entries } = getInsightContent(locale);
  const publishedTitles = new Set(
    posts.map(({ title }) => title.trim().toLocaleLowerCase(locale))
  );
  const queuedNotes = insights.noteQueue.filter(
    ({ title }) => !publishedTitles.has(title.trim().toLocaleLowerCase(locale))
  );

  const sections: AlignedPageSection[] = [
    {
      id: "insights",
      label: insights.eyebrow,
      content: (
        <header>
          <p className="home-kicker">{insights.eyebrow}</p>
          <h1 className="home-hero-title">{insights.title}</h1>
          <p className="home-hero-summary">{insights.subtitle}</p>
          <p className="home-profile-summary">{insights.aside}</p>
        </header>
      ),
    },
    {
      id: "published",
      label: insights.publishedEyebrow,
      content: (
        <>
          <h2 className="aligned-content-title">{insights.publishedTitle}</h2>
          <div className="home-evidence-list">
            {posts.length > 0 ? (
              posts.map((post) => (
                <Link
                  key={post.slug}
                  href={localizedHref(`/insights/${post.slug}/`, locale)}
                  className="home-latest-insight"
                >
                  {post.date ? <span>{post.date}</span> : null}
                  <h3>{post.title}</h3>
                  {post.excerpt ? <p>{post.excerpt}</p> : null}
                </Link>
              ))
            ) : (
              <p className="home-profile-summary">{insights.futureNote}</p>
            )}
          </div>
        </>
      ),
    },
    {
      id: "streams",
      label: insights.streamsEyebrow,
      content: (
        <>
          <h2 className="aligned-content-title">{insights.streamsTitle}</h2>
          <div className="home-evidence-list">
            {entries.map((entry) => (
              <article key={entry.title} data-hover-reactive className="home-evidence-row">
                <div className="home-evidence-label">
                  <span>{entry.category}</span>
                  <span>{entry.cadence}</span>
                </div>
                <div>
                  <h3>{entry.title}</h3>
                  <p>{entry.description}</p>
                </div>
              </article>
            ))}
          </div>
        </>
      ),
    },
  ];

  if (queuedNotes.length > 0) {
    sections.push({
      id: "notebook",
      label: insights.queueEyebrow,
      content: (
        <>
          <h2 className="aligned-content-title">{insights.queueTitle}</h2>
          <div className="home-evidence-list">
            {queuedNotes.map((note) => (
              <article key={note.title} data-hover-reactive className="home-evidence-row">
                <div className="home-evidence-label">
                  <span>{note.label}</span>
                </div>
                <div>
                  <h3>{note.title}</h3>
                  <p>{note.description}</p>
                </div>
              </article>
            ))}
          </div>
        </>
      ),
    });
  }

  return sections;
}

export function InsightsPageView({ locale = defaultLocale }: InsightsPageViewProps) {
  return (
    <AlignedPageShell
      locale={locale}
      sections={buildInsightsSections(locale, getPublishedPosts(locale))}
    />
  );
}
