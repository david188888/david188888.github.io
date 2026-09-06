import Link from "next/link";
import {
  AlignedPageShell,
  type AlignedPageSection,
} from "@/components/layout/AlignedPageShell";
import { localizedHref } from "@/i18n/links";
import { defaultLocale, type Locale } from "@/i18n/locales";
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

  const sections: AlignedPageSection[] = [
    {
      id: "insights",
      label: insights.eyebrow,
      content: (
        <header>
          <p className="home-kicker">{insights.eyebrow}</p>
          <h1 className="home-hero-title">{insights.title}</h1>
          <p className="home-hero-summary">{insights.subtitle}</p>
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
  ];

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
