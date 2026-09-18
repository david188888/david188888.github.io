import Link from "next/link";
import {
  AlignedPageShell,
  type AlignedPageSection,
} from "@/components/layout/AlignedPageShell";
import { defaultLocale, type Locale } from "@/i18n/locales";
import { localizedHref } from "@/i18n/links";
import { getMessages } from "@/i18n/messages";
import { AnnotationControls } from "@/components/insights/AnnotationControls";
import { InsightBody } from "@/components/insights/InsightBody";
import type { LocalizedPost } from "@/lib/content/posts";

interface InsightArticlePageViewProps {
  locale?: Locale;
  post: LocalizedPost;
}

export function buildInsightArticleSections(
  locale: Locale,
  post: LocalizedPost
): AlignedPageSection[] {
  const { insights, stats } = getMessages(locale).pages;
  const insightsHref = localizedHref("/insights/", locale);

  return [
    {
      id: "article",
      label: insights.articleLabel,
      railContent: <Link href={insightsHref}>{insights.backToInsights}</Link>,
      content: (
        <header>
          {post.date ? <p className="home-kicker">{post.date}</p> : null}
          <h1 className="home-hero-title">{post.title}</h1>
          {post.excerpt ? <p className="home-hero-summary">{post.excerpt}</p> : null}
        </header>
      ),
    },
    {
      id: "reading",
      label: insights.readingLabel,
      className: "insight-reading-section",
      content: (
        <>
          <AnnotationControls
            slug={post.slug}
            locale={locale}
            labels={{
              ...insights.annotations,
              // The annotation tools reuse the stats page credentials, so the
              // form labels come from the same place rather than being copied.
              credentials: {
                username: stats.username,
                password: stats.password,
                signIn: stats.signIn,
                invalidCredentials: stats.invalidCredentials,
              },
            }}
          />
          <article className="aligned-article-prose prose max-w-none prose-headings:font-serif">
            <h2 className="sr-only">{insights.readingLabel}</h2>
            <InsightBody body={post.body} />
          </article>
        </>
      ),
    },
  ];
}

export function InsightArticlePageView({
  locale = defaultLocale,
  post,
}: InsightArticlePageViewProps) {
  return (
    <AlignedPageShell
      locale={locale}
      sections={buildInsightArticleSections(locale, post)}
    />
  );
}
