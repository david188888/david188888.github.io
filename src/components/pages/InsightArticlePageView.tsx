import Link from "next/link";
import {
  AlignedPageShell,
  type AlignedPageSection,
} from "@/components/layout/AlignedPageShell";
import { defaultLocale, type Locale } from "@/i18n/locales";
import { localizedHref } from "@/i18n/links";
import { getMessages } from "@/i18n/messages";
import type { LocalizedPost } from "@/lib/content/posts";

interface InsightArticlePageViewProps {
  locale?: Locale;
  post: LocalizedPost;
}

export function buildInsightArticleSections(
  locale: Locale,
  post: LocalizedPost
): AlignedPageSection[] {
  const { insights } = getMessages(locale).pages;
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
      content: (
        <article className="aligned-article-prose prose prose-invert max-w-none prose-headings:font-serif prose-a:text-[#c8d8f2]">
          <h2 className="sr-only">{insights.readingLabel}</h2>
          <div dangerouslySetInnerHTML={{ __html: post.bodyHtml }} />
        </article>
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
