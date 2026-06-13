import { notFound } from "next/navigation";
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
