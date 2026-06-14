import Link from "next/link";
import type { Locale } from "@/i18n/locales";

interface ArchiveItemProps {
  title: string;
  permalink: string;
  venue?: string;
  date?: string;
  excerpt?: string;
  type?: string;
  location?: string;
  paperUrl?: string;
  citation?: string;
  locale?: Locale;
  paperLabel?: string;
}

export function ArchiveItem({
  title,
  permalink,
  venue,
  date,
  excerpt,
  type,
  location,
  paperUrl,
  locale = "en",
  paperLabel = "Paper",
}: ArchiveItemProps) {
  const formattedDate = date
    ? new Date(date).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <article className="list__item mb-4 pb-4 border-b border-[var(--global-border-color)]">
      <h2 className="text-[1em] font-bold m-0 mb-1">
        <Link
          href={permalink}
          className="text-[var(--global-link-color)] no-underline hover:underline"
        >
          {title}
        </Link>
      </h2>
      {(venue || type) && (
        <p className="text-[0.75em] text-[var(--global-text-color-light)] uppercase tracking-wider m-0 mb-1">
          {[type, venue, location].filter(Boolean).join(" · ")}
        </p>
      )}
      {formattedDate && (
        <p className="text-[0.75em] text-[var(--global-text-color-light)] m-0 mb-1">
          {formattedDate}
        </p>
      )}
      {excerpt && (
        <p className="text-[0.875em] text-[var(--global-text-color-light)] m-0 mt-1">
          {excerpt}
        </p>
      )}
      {paperUrl && (
        <p className="mt-1 text-sm">
          <a
            href={paperUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--global-link-color)] underline"
          >
            {paperLabel}
          </a>
        </p>
      )}
    </article>
  );
}
