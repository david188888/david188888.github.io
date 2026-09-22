"use client";

import Link from "next/link";
import { useState } from "react";
import type { Locale } from "@/i18n/locales";

export interface LatestInsightCard {
  slug: string;
  title: string;
  excerpt: string;
  date?: string;
  tags: string[];
  href: string;
  pullQuote?: string | null;
}

interface LatestInsightCarouselProps {
  locale: Locale;
  cards: readonly LatestInsightCard[];
  featureLabel: string;
  readArticleLabel: string;
  pullQuoteLabel: string;
}

function splitTitle(title: string): [string, string | null] {
  const match = title.match(/^([^：:]{1,40}[：:])([\s\S]+)$/);
  if (!match) return [title, null];
  return [match[1], match[2].trim()];
}

const carouselCopy = {
  en: {
    label: "Latest memos",
    previous: "Previous article",
    next: "Next article",
  },
  zh: {
    label: "最新思考",
    previous: "上一篇文章",
    next: "下一篇文章",
  },
} as const;

/**
 * Manual, reader-paced carousel: long-form titles, excerpts and quotes are meant
 * to be read, not rotated away on a timer, so there is no autoplay — only
 * Prev/Next and a counter, with the controls placed in the header row.
 */
export function LatestInsightCarousel({
  locale,
  cards,
  featureLabel,
  readArticleLabel,
  pullQuoteLabel,
}: LatestInsightCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const copy = carouselCopy[locale];
  const count = cards.length;
  const hasMultiple = count > 1;

  if (count === 0) return null;

  const move = (offset: number) => {
    setActiveIndex((current) => (current + offset + count) % count);
  };

  return (
    <section className="latest-insight-carousel" aria-label={copy.label} aria-roledescription="carousel">
      <div className="carousel-head">
        <p className="section-label">{featureLabel}</p>
        {hasMultiple ? (
          <div className="carousel-controls" aria-label={copy.label}>
            <p className="carousel-counter" aria-live="off">
              {activeIndex + 1} / {count}
            </p>
            <button type="button" onClick={() => move(-1)} aria-label={copy.previous}>
              <span aria-hidden="true">←</span>
            </button>
            <button type="button" onClick={() => move(1)} aria-label={copy.next}>
              <span aria-hidden="true">→</span>
            </button>
          </div>
        ) : null}
      </div>

      <div className="latest-insight-viewport">
        <div
          className="latest-insight-track"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {cards.map((card, index) => {
            const [titleHead, titleSubject] = splitTitle(card.title);
            const isActive = index === activeIndex;
            return (
              <article
                className="latest-insight-slide"
                key={card.slug}
                aria-hidden={!isActive}
                aria-label={`${index + 1} / ${count}`}
              >
                <div className="feature-meta">
                  <span>{card.tags.join(" · ")}</span>
                  {card.date ? <time dateTime={card.date}>{card.date.replaceAll("-", ".")}</time> : null}
                </div>
                <h2 id={index === 0 ? "feature-title" : undefined}>
                  <span>{titleHead}</span>
                  {titleSubject ? <span className="subject">{titleSubject}</span> : null}
                </h2>
                <p className="excerpt">{card.excerpt}</p>
                {card.pullQuote ? (
                  <blockquote className="quotation">
                    <p>{card.pullQuote}</p>
                    <cite>{pullQuoteLabel}</cite>
                  </blockquote>
                ) : null}
                <Link className="read" href={card.href} tabIndex={isActive ? 0 : -1}>
                  <span>{readArticleLabel}</span>
                  <span aria-hidden="true">→</span>
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
