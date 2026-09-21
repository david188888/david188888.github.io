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
    pause: "Pause automatic rotation",
    resume: "Resume automatic rotation",
    slide: "Go to article",
    article: "article",
    articles: "articles",
  },
  zh: {
    label: "最新思考",
    previous: "上一篇文章",
    next: "下一篇文章",
    pause: "暂停自动轮播",
    resume: "恢复自动轮播",
    slide: "查看第",
    article: "篇文章",
    articles: "篇文章",
  },
} as const;

export function LatestInsightCarousel({
  locale,
  cards,
  featureLabel,
  readArticleLabel,
  pullQuoteLabel,
}: LatestInsightCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [pointerPaused, setPointerPaused] = useState(false);
  const [focusPaused, setFocusPaused] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const copy = carouselCopy[locale];
  const count = cards.length;
  const hasMultiple = count > 1;
  const paused = pointerPaused || focusPaused || userPaused;

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
    }, 5000);
    return () => window.clearInterval(timer);
  }, [count, hasMultiple, paused, reducedMotion]);

  if (count === 0) return null;

  const move = (offset: number) => {
    setActiveIndex((current) => (current + offset + count) % count);
  };
  const articleNoun = locale === "zh" ? copy.articles : count === 1 ? copy.article : copy.articles;

  return (
    <section
      className="feature latest-insight-carousel"
      aria-label={copy.label}
      aria-roledescription="carousel"
      onPointerEnter={() => setPointerPaused(true)}
      onPointerLeave={() => setPointerPaused(false)}
      onFocusCapture={() => setFocusPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocusPaused(false);
      }}
    >
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
                  <strong>{featureLabel}</strong>
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
                  <span>
                    {readArticleLabel} &nbsp; / &nbsp; {card.tags.join(" · ")}
                  </span>
                  <span aria-hidden="true">↗</span>
                </Link>
              </article>
            );
          })}
        </div>
      </div>

      <div className="latest-insight-controls">
        <div className="latest-insight-buttons">
          <button type="button" onClick={() => move(-1)} disabled={!hasMultiple} aria-label={copy.previous}>
            <span aria-hidden="true">←</span>
          </button>
          <button type="button" onClick={() => move(1)} disabled={!hasMultiple} aria-label={copy.next}>
            <span aria-hidden="true">→</span>
          </button>
        </div>
        <p className="latest-insight-count" aria-live="off">
          {locale === "zh" ? `${activeIndex + 1} / ${count} ${copy.articles}` : `${activeIndex + 1} / ${count} ${articleNoun}`}
        </p>
        <div className="latest-insight-dots" role="group" aria-label={copy.label}>
          {cards.map((card, index) => (
            <button
              key={card.slug}
              type="button"
              className={index === activeIndex ? "is-active" : undefined}
              aria-label={locale === "zh" ? `${copy.slide}${index + 1}${copy.article}` : `${copy.slide} ${index + 1}`}
              aria-current={index === activeIndex ? "true" : undefined}
              onClick={() => setActiveIndex(index)}
            />
          ))}
        </div>
        <button
          type="button"
          className="latest-insight-toggle"
          onClick={() => setUserPaused((current) => !current)}
          disabled={!hasMultiple || reducedMotion}
          aria-label={userPaused ? copy.resume : copy.pause}
          aria-pressed={userPaused}
        >
          <span aria-hidden="true">{userPaused || reducedMotion ? "▶" : "Ⅱ"}</span>
        </button>
      </div>
    </section>
  );
}
