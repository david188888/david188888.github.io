import type { Metadata } from "next";
import { defaultLocale } from "@/i18n/locales";
import { notFound } from "next/navigation";
import { authorConfig } from "@/config/author";
import { InsightArticlePageView } from "@/components/pages/InsightArticlePageView";
import { getLocalizedPost, getPostSlugs } from "@/lib/content/posts";

export const dynamicParams = false;

export function generateStaticParams() {
  const slugs = getPostSlugs();
  if (slugs.length === 0) return [{ slug: "__placeholder__" }];
  return slugs.map((slug) => ({ slug }));
}

// The root layout's template appends the English name, so the article title is
// set absolutely to keep the localized one.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const post = getLocalizedPost(slug, defaultLocale);
    return {
      title: `${post.title} | ${authorConfig.nameLocalized.zh}`,
      description: post.excerpt,
    };
  } catch {
    return {};
  }
}

export default async function InsightArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  try {
    const post = getLocalizedPost(slug, defaultLocale);
    return <InsightArticlePageView locale={defaultLocale} post={post} />;
  } catch {
    notFound();
  }
}
