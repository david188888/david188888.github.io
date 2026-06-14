import Link from "next/link";
import { FluidBackground } from "@/components/home/FluidBackground";
import { HomeNav } from "@/components/navigation/HomeNav";
import { getInsightContent } from "@/config/insights";
import { defaultLocale, type Locale } from "@/i18n/locales";
import { localizedHref } from "@/i18n/links";
import { getMessages } from "@/i18n/messages";
import { getLocalizedPosts } from "@/lib/content/posts";

interface InsightsPageViewProps {
  locale?: Locale;
}

export function InsightsPageView({ locale = defaultLocale }: InsightsPageViewProps) {
  const { insights } = getMessages(locale).pages;
  const posts = getLocalizedPosts(locale);
  const { entries: insightEntries } = getInsightContent(locale);

  return (
    <>
      <HomeNav locale={locale} />
      <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#06080d] via-[#0a0f17] to-[#0f1620] pt-14 text-[#e7edf8]">
        <FluidBackground />
        <div className="relative z-10 mx-auto w-[min(1180px,calc(100vw-2rem))] pb-16 pt-[clamp(2.5rem,7vw,5.2rem)]">
          <section className="min-h-[calc(100svh-9rem)] border-b border-[rgba(166,182,206,0.12)] pb-[clamp(2.5rem,7vw,5rem)]">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)] lg:items-end">
              <div>
                <p className="mb-4 text-[0.78rem] uppercase tracking-[0.22em] text-[rgba(180,193,214,0.7)]">
                  {insights.eyebrow}
                </p>
                <h1 className="m-0 max-w-[11ch] font-serif text-[clamp(3.1rem,10vw,7.2rem)] font-semibold leading-[0.92] text-[#f2f6ff]">
                  {insights.title}
                </h1>
                <p className="mt-7 max-w-3xl text-[clamp(1.08rem,2.2vw,1.55rem)] leading-relaxed text-[rgba(202,212,228,0.84)]">
                  {insights.subtitle}
                </p>
              </div>

              <aside className="max-w-md border-l border-[rgba(166,182,206,0.18)] pl-5 text-[0.95rem] leading-relaxed text-[rgba(202,212,228,0.72)]">
                {insights.aside}
              </aside>
            </div>
          </section>

          <section className="grid gap-8 border-b border-[rgba(166,182,206,0.12)] py-[clamp(2.5rem,6vw,4rem)] lg:grid-cols-[0.75fr_1.25fr]">
            <div>
              <p className="m-0 text-[0.78rem] uppercase tracking-[0.2em] text-[rgba(180,193,214,0.68)]">
                {insights.streamsEyebrow}
              </p>
              <h2 className="mt-3 max-w-sm font-serif text-[clamp(1.8rem,4vw,3rem)] font-semibold leading-tight text-[#edf3ff]">
                {insights.streamsTitle}
              </h2>
            </div>

            <div className="grid gap-0">
              {insightEntries.map((entry) => (
                <article
                  key={entry.title}
                  className="group grid gap-4 border-t border-[rgba(166,182,206,0.12)] py-6 first:border-t-0 md:grid-cols-[10rem_minmax(0,1fr)]"
                >
                  <div>
                    <p className="m-0 text-[0.72rem] uppercase tracking-[0.14em] text-[rgba(167,180,201,0.78)]">
                      {entry.category}
                    </p>
                    <p className="mt-2 mb-0 text-[0.86rem] text-[rgba(162,173,191,0.72)]">
                      {entry.cadence}
                    </p>
                  </div>

                  <div>
                    <h3 className="m-0 text-[clamp(1.25rem,2.2vw,1.65rem)] font-semibold leading-snug text-[#e8edf5]">
                      {entry.title}
                    </h3>
                    <p className="mt-3 max-w-2xl text-[0.98rem] leading-relaxed text-[rgba(198,208,224,0.78)]">
                      {entry.description}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {entry.tags.map((tag) => (
                        <span
                          key={tag}
                          className="border border-[rgba(166,182,206,0.16)] px-2.5 py-1 text-[0.68rem] uppercase tracking-[0.12em] text-[rgba(202,212,228,0.72)] transition-colors group-hover:border-[rgba(202,212,228,0.32)] group-hover:text-[#edf3ff]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="grid gap-8 py-[clamp(2.5rem,6vw,4rem)] lg:grid-cols-[0.75fr_1.25fr]">
            <div>
              <p className="m-0 text-[0.78rem] uppercase tracking-[0.2em] text-[rgba(180,193,214,0.68)]">
                {posts.length > 0 ? insights.publishedEyebrow : insights.queueEyebrow}
              </p>
              <h2 className="mt-3 max-w-sm font-serif text-[clamp(1.8rem,4vw,3rem)] font-semibold leading-tight text-[#edf3ff]">
                {posts.length > 0 ? insights.publishedTitle : insights.queueTitle}
              </h2>
            </div>

            <div className="grid gap-4">
              {posts.length > 0 ? (
                posts.map((post) => (
                  <Link
                    key={post.slug}
                    href={localizedHref(`/insights/${post.slug}/`, locale)}
                    className="block border border-[rgba(166,182,206,0.1)] bg-[rgba(10,15,24,0.34)] p-5 text-inherit no-underline backdrop-blur-[8px] transition-colors hover:bg-[rgba(220,231,246,0.04)]"
                  >
                    <p className="m-0 text-[0.72rem] uppercase tracking-[0.14em] text-[rgba(167,180,201,0.76)]">
                      {post.date ?? insights.publishedEyebrow}
                    </p>
                    <h3 className="mt-3 mb-0 text-xl font-semibold leading-snug text-[#e8edf5]">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="mt-3 mb-0 max-w-2xl text-[0.96rem] leading-relaxed text-[rgba(198,208,224,0.78)]">
                        {post.excerpt}
                      </p>
                    )}
                  </Link>
                ))
              ) : (
                insights.noteQueue.map((note) => (
                <article
                  key={note.title}
                  className="border border-[rgba(166,182,206,0.1)] bg-[rgba(10,15,24,0.34)] p-5 backdrop-blur-[8px]"
                >
                  <p className="m-0 text-[0.72rem] uppercase tracking-[0.14em] text-[rgba(167,180,201,0.76)]">
                    {note.label}
                  </p>
                  <h3 className="mt-3 mb-0 text-xl font-semibold leading-snug text-[#e8edf5]">
                    {note.title}
                  </h3>
                  <p className="mt-3 mb-0 max-w-2xl text-[0.96rem] leading-relaxed text-[rgba(198,208,224,0.78)]">
                    {note.description}
                  </p>
                </article>
                ))
              )}
              <p className="m-0 text-sm text-[rgba(202,212,228,0.58)]">
                {insights.futureNote}
              </p>
            </div>
          </section>

          <footer className="flex flex-col gap-3 border-t border-[rgba(166,182,206,0.12)] py-6 text-sm text-[rgba(202,212,228,0.62)] md:flex-row md:items-center md:justify-between">
            <Link
              href={localizedHref("/", locale)}
              className="text-inherit underline underline-offset-4 hover:text-[#edf3ff]"
            >
              {insights.backHome}
            </Link>
            <span>HongYu Liu · {insights.footerLabel}</span>
          </footer>
        </div>
      </main>
    </>
  );
}
