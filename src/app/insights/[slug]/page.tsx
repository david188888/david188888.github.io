import { notFound } from "next/navigation";
import { InsightArticlePageView } from "@/components/pages/InsightArticlePageView";
import { getLocalizedPost, getPostSlugs } from "@/lib/content/posts";

export const dynamicParams = false;

export function generateStaticParams() {
  const slugs = getPostSlugs();
  if (slugs.length === 0) return [{ slug: "__placeholder__" }];
  return slugs.map((slug) => ({ slug }));
}

export default async function InsightArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  try {
    const post = getLocalizedPost(slug, "en");
    return <InsightArticlePageView locale="en" post={post} />;
  } catch {
    notFound();
  }
}
