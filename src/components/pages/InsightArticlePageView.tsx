import Link from "next/link";
import { FluidBackground } from "@/components/home/FluidBackground";
import { HomeNav } from "@/components/navigation/HomeNav";
import { defaultLocale, type Locale } from "@/i18n/locales";
import { localizedHref } from "@/i18n/links";
import { getMessages } from "@/i18n/messages";
import type { LocalizedPost } from "@/lib/content/posts";

interface InsightArticlePageViewProps {
  locale?: Locale;
  post: LocalizedPost;
}

export function InsightArticlePageView({
  locale = defaultLocale,
  post,
}: InsightArticlePageViewProps) {
  const { insights } = getMessages(locale).pages;

  return (
    <>
      <HomeNav locale={locale} />
      <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#06080d] via-[#0a0f17] to-[#0f1620] pt-14 text-[#e7edf8]">
        <FluidBackground />
        <article className="relative z-10 mx-auto w-[min(840px,calc(100vw-2rem))] pb-20 pt-[clamp(2.5rem,7vw,5.2rem)]">
          <Link
            href={localizedHref("/insights/", locale)}
            className="text-sm text-[rgba(202,212,228,0.72)] underline underline-offset-4 hover:text-[#edf3ff]"
          >
            {insights.backHome}
          </Link>
          {post.date && (
            <p className="mb-3 mt-8 text-[0.78rem] uppercase tracking-[0.16em] text-[rgba(180,193,214,0.68)]">
              {post.date}
            </p>
          )}
          <h1 className="m-0 font-serif text-[clamp(2.4rem,7vw,4.8rem)] font-semibold leading-tight text-[#f2f6ff]">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="mt-6 text-[clamp(1.04rem,2vw,1.35rem)] leading-relaxed text-[rgba(202,212,228,0.82)]">
              {post.excerpt}
            </p>
          )}
          <div
            className="prose prose-invert mt-10 max-w-none prose-headings:font-serif prose-a:text-[#c8d8f2]"
            dangerouslySetInnerHTML={{ __html: post.bodyHtml }}
          />
        </article>
      </main>
    </>
  );
}
