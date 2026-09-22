"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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

const AUTO_ADVANCE_MS = 2000;

/**
 * Auto-advances so the latest writing stays in view, pauses while the reader
 * points at or focuses the carousel, and never rotates under
 * prefers-reduced-motion. The slide title is the link to the article — there
 * is no separate read-more row.
 */
export function LatestInsightCarousel({
  locale,
  cards,
  featureLabel,
  pullQuoteLabel,
}: LatestInsightCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [pointerPaused, setPointerPaused] = useState(false);
  const [focusPaused, setFocusPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const copy = carouselCopy[locale];
  const count = cards.length;
  const hasMultiple = count > 1;
  const paused = pointerPaused || focusPaused;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(media.matches);
    updatePreference();
    media.addEventListener("change", updatePreference);
    return () => media.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    if (!hasMultiple || paused || reducedMotion) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % count);
    }, AUTO_ADVANCE_MS);
    return () => window.clearInterval(timer);
  }, [count, hasMultiple, paused, reducedMotion]);

  if (count === 0) return null;

  const move = (offset: number) => {
    setActiveIndex((current) => (current + offset + count) % count);
  };

  return (
    <section
      className="latest-insight-carousel"
      aria-label={copy.label}
      aria-roledescription="carousel"
      onPointerEnter={() => setPointerPaused(true)}
      onPointerLeave={() => setPointerPaused(false)}
      onFocusCapture={() => setFocusPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocusPaused(false);
      }}
    >
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
                  <Link className="slide-link" href={card.href} tabIndex={isActive ? 0 : -1}>
                    <span>{titleHead}</span>
                    {titleSubject ? <span className="subject">{titleSubject}</span> : null}
                  </Link>
                </h2>
                <p className="excerpt">{card.excerpt}</p>
                {card.pullQuote ? (
                  <blockquote className="quotation">
                    <p>{card.pullQuote}</p>
                    <cite>{pullQuoteLabel}</cite>
                  </blockquote>
                ) : null}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
