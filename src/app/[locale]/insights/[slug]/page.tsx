import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { authorConfig } from "@/config/author";
import { InsightArticlePageView } from "@/components/pages/InsightArticlePageView";
import { isLocale, type Locale } from "@/i18n/locales";
import { getLocalizedPost, getPostSlugs } from "@/lib/content/posts";

export const dynamicParams = false;

export function generateStaticParams() {
  const slugs = getPostSlugs();
  if (slugs.length === 0) {
    return [{ locale: "en", slug: "__placeholder__" }];
  }
  return slugs.flatMap((slug) => [
    { locale: "en", slug },
    { locale: "zh", slug },
  ]);
}

// The root layout's template appends the English name, so the article title is
// set absolutely to keep the localized one.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  try {
    const post = getLocalizedPost(slug, locale as Locale);
    return {
      title: `${post.title} | ${authorConfig.nameLocalized[locale]}`,
      description: post.excerpt,
    };
  } catch {
    return {};
  }
}

export default async function LocalizedInsightArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  try {
    const post = getLocalizedPost(slug, locale as Locale);
    return <InsightArticlePageView locale={locale as Locale} post={post} />;
  } catch {
    notFound();
  }
}
