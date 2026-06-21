# Aligned Home And Insights Shell Implementation Plan

> **Homepage supersession (2026-06-21):** The homepage portion of this document was replaced by `2026-06-21-balanced-card-homepage-design.md`. The Insights index and article ideas remain separate future work; do not reintroduce the wide aligned-chapter rail on the homepage.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one aligned editorial shell for the homepage, Insights index, and Insights articles, with left-side chapter navigation and right-side content that remain visually connected through the full document.

**Architecture:** Add a reusable shell that renders an ordered list of two-column chapter rows, plus a progressive-enhancement observer for active navigation. Move homepage, Insights, and article content into page-specific section builders, and derive the homepage preview from the same future-date-filtered post list used by the Insights index.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript 5.7, Tailwind CSS 3.4, Vitest 4, existing static export.

## Global Constraints

- Keep the restrained dark editorial direction and existing typography variables.
- Keep left navigation and right content at widths of 768px and above.
- Use an approximately 28/72 split at 1024px and above and 23/77 from 768px through 1023px.
- Switch to one readable content column below 768px.
- Fully retain profile, research papers, internships, and education on the homepage.
- Show exactly one latest published Insights preview and one Insights index link on the homepage; exclude future-dated posts.
- Use the same shell for the homepage, Insights index, and individual Insights articles.
- Add no runtime dependency.
- Preserve English and Chinese routes, `output: "export"`, keyboard navigation, locale switching, and `prefers-reduced-motion`.
- Do not stage or modify the unrelated untracked `output/` directory.

---

## File Structure

### New files

- `src/components/layout/AlignedPageShell.tsx`: owns the shared masthead, pointer background, page container, and section renderer.
- `src/components/layout/AlignedSections.tsx`: renders semantic quick navigation and aligned chapter rows from typed section data.
- `src/components/navigation/AlignedSectionObserver.tsx`: progressively applies active-link state with `IntersectionObserver`.
- `src/components/layout/__tests__/AlignedSections.test.tsx`: checks semantic section order, anchors, rail supplements, and mobile quick navigation.
- `src/components/layout/__tests__/alignedStyles.test.ts`: protects grid, sticky containment, mobile fallback, and reduced-motion CSS contracts.
- `src/components/pages/__tests__/HomePageView.test.tsx`: checks homepage section order and one-item Insights preview behavior.
- `src/components/pages/__tests__/InsightsPageViews.test.tsx`: checks Insights/index section order and article-shell fallbacks.
- `src/lib/content/__tests__/posts.test.ts`: checks publication filtering and latest-post ordering.

### Modified files

- `vitest.config.ts`: include `.test.tsx` component tests.
- `src/lib/content/posts.ts`: expose the shared publication-eligible post result.
- `src/components/pages/HomePageView.tsx`: replace the sticky profile/evidence split with aligned sections.
- `src/components/pages/InsightsPageView.tsx`: replace the independent full-width template with aligned sections.
- `src/components/pages/InsightArticlePageView.tsx`: place article metadata and body inside the shared shell.
- `src/components/navigation/HomeNav.tsx`: preserve desktop navigation and implement the approved two-row mobile masthead.
- `src/i18n/messages.ts`: add localized article-shell navigation copy.
- `src/app/globals.css`: add the shared grid, rail, sticky handoff, quick navigation, and responsive rules; remove obsolete homepage-only layout rules.
- `docs/superpowers/plans/2026-06-17-minimal-motion-homepage.md`: record that its desktop composition has been superseded.

---

### Task 1: Publication-Eligible Insights Data

**Files:**
- Create: `src/lib/content/__tests__/posts.test.ts`
- Modify: `src/lib/content/posts.ts`

**Interfaces:**
- Produces: `selectPublishedPosts(posts: readonly LocalizedPost[], today?: Date): LocalizedPost[]`
- Produces: `getPublishedPosts(locale?: Locale, today?: Date): LocalizedPost[]`
- Consumers: `HomePageView` and `InsightsPageView` in Tasks 3 and 4.

- [ ] **Step 1: Write the failing publication-filter tests**

Create `src/lib/content/__tests__/posts.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { LocalizedPost } from "../posts";
import { selectPublishedPosts } from "../posts";

function post(slug: string, date?: string): LocalizedPost {
  return {
    slug,
    title: slug,
    excerpt: `${slug} excerpt`,
    date,
    tags: [],
    body: slug,
    bodyHtml: `<p>${slug}</p>`,
    locale: "en",
  };
}

describe("selectPublishedPosts", () => {
  const today = new Date("2026-06-19T12:00:00.000Z");

  it("excludes future-dated posts and sorts newest first", () => {
    const result = selectPublishedPosts(
      [
        post("older", "2025-01-01"),
        post("future", "2199-01-01"),
        post("latest", "2026-06-19"),
      ],
      today
    );

    expect(result.map(({ slug }) => slug)).toEqual(["latest", "older"]);
  });

  it("keeps undated or non-date metadata after dated posts", () => {
    const result = selectPublishedPosts(
      [post("undated"), post("invalid", "draft"), post("dated", "2024-08-01")],
      today
    );

    expect(result.map(({ slug }) => slug)).toEqual(["dated", "undated", "invalid"]);
  });

  it("does not mutate the source array", () => {
    const source = [post("older", "2024-01-01"), post("newer", "2025-01-01")];
    selectPublishedPosts(source, today);
    expect(source.map(({ slug }) => slug)).toEqual(["older", "newer"]);
  });
});
```

- [ ] **Step 2: Run the test and verify the missing export**

Run:

```bash
rtk npm run test:run -- src/lib/content/__tests__/posts.test.ts
```

Expected: FAIL because `selectPublishedPosts` is not exported.

- [ ] **Step 3: Implement publication filtering once**

In `src/lib/content/posts.ts`, keep the existing `getLocalizedPosts` ordering and add the two exports below it:

```ts
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function getLocalizedPosts(locale: Locale = defaultLocale): LocalizedPost[] {
  return getPostSlugs()
    .map((slug) => getLocalizedPost(slug, locale))
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
}

export function selectPublishedPosts(
  posts: readonly LocalizedPost[],
  today: Date = new Date()
): LocalizedPost[] {
  const cutoff = today.toISOString().slice(0, 10);

  return [...posts]
    .filter((post) => {
      if (!post.date || !DATE_ONLY_PATTERN.test(post.date)) return true;
      return post.date <= cutoff;
    })
    .sort((a, b) => {
      const aDate = DATE_ONLY_PATTERN.test(a.date ?? "") ? a.date ?? "" : "";
      const bDate = DATE_ONLY_PATTERN.test(b.date ?? "") ? b.date ?? "" : "";
      return bDate.localeCompare(aDate);
    });
}

export function getPublishedPosts(
  locale: Locale = defaultLocale,
  today: Date = new Date()
): LocalizedPost[] {
  return selectPublishedPosts(getLocalizedPosts(locale), today);
}
```

- [ ] **Step 4: Run the focused tests**

Run:

```bash
rtk npm run test:run -- src/lib/content/__tests__/posts.test.ts
```

Expected: 3 tests PASS.

- [ ] **Step 5: Commit the data contract**

```bash
rtk git add src/lib/content/posts.ts src/lib/content/__tests__/posts.test.ts
rtk git commit -m "feat: filter published insight posts"
```

---

### Task 2: Shared Aligned Page Shell

**Files:**
- Create: `src/components/layout/AlignedPageShell.tsx`
- Create: `src/components/layout/AlignedSections.tsx`
- Create: `src/components/navigation/AlignedSectionObserver.tsx`
- Create: `src/components/layout/__tests__/AlignedSections.test.tsx`
- Create: `src/components/layout/__tests__/alignedStyles.test.ts`
- Modify: `vitest.config.ts`
- Modify: `src/components/navigation/HomeNav.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Produces: `AlignedPageSection` with `{ id, label, content, railContent?, className? }`.
- Produces: `AlignedPageShell({ locale, sections })` for every page view.
- Consumes: existing `HomeNav`, `PointerGlow`, `Locale`, and homepage typography/evidence classes.

- [ ] **Step 1: Enable TSX tests**

Change the `include` list in `vitest.config.ts` to:

```ts
include: ["src/**/*.test.ts", "src/**/*.test.tsx", "scripts/**/*.test.mjs"],
```

- [ ] **Step 2: Write the failing section-render test**

Create `src/components/layout/__tests__/AlignedSections.test.tsx`:

```tsx
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AlignedSections, type AlignedPageSection } from "../AlignedSections";

describe("AlignedSections", () => {
  it("renders ordered rail links, matching sections, and mobile quick navigation", () => {
    const sections: AlignedPageSection[] = [
      { id: "profile", label: "Profile", content: <h1>Profile content</h1> },
      {
        id: "research",
        label: "Research",
        railContent: <span>Supplement</span>,
        content: <h2>Research content</h2>,
      },
    ];

    const html = renderToStaticMarkup(<AlignedSections sections={sections} />);

    expect(html).toContain('aria-label="Page sections"');
    expect(html).toContain('href="#profile"');
    expect(html).toContain('href="#research"');
    expect(html).toContain('id="profile"');
    expect(html).toContain('id="research"');
    expect(html).toContain("01");
    expect(html).toContain("02");
    expect(html).toContain("Supplement");
    expect(html.indexOf("Profile")).toBeLessThan(html.indexOf("Research"));
  });
});
```

- [ ] **Step 3: Write the failing CSS contract test**

Create `src/components/layout/__tests__/alignedStyles.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("src/app/globals.css", "utf8");

describe("aligned page CSS contracts", () => {
  it("defines the shared grid, sticky rail, and active marker", () => {
    expect(css).toMatch(/\.aligned-section-row\s*\{/);
    expect(css).toMatch(/grid-template-columns:\s*minmax\(0,\s*0\.78fr\)\s+minmax\(0,\s*2fr\)/);
    expect(css).toMatch(/\.aligned-section-marker\s*\{[^}]*position:\s*sticky/s);
    expect(css).toMatch(/\[data-active="true"\]/);
  });

  it("switches to one content column below 768px", () => {
    expect(css).toMatch(/@media\s*\(max-width:\s*767px\)/);
    expect(css).toMatch(/\.aligned-section-row\s*\{[^}]*grid-template-columns:\s*1fr/s);
    expect(css).toMatch(/\.aligned-quick-nav\s*\{[^}]*display:\s*flex/s);
    expect(css).toMatch(/\.home-nav-mobile-language\s*\{[^}]*display:\s*block/s);
  });
});
```

- [ ] **Step 4: Run both tests and verify missing modules/styles**

Run:

```bash
rtk npm run test:run -- src/components/layout/__tests__/AlignedSections.test.tsx src/components/layout/__tests__/alignedStyles.test.ts
```

Expected: FAIL because `AlignedSections` and the CSS contracts do not exist.

- [ ] **Step 5: Implement the pure aligned-section renderer**

Create `src/components/layout/AlignedSections.tsx`:

```tsx
import type { ReactNode } from "react";
import { AlignedSectionObserver } from "@/components/navigation/AlignedSectionObserver";

export interface AlignedPageSection {
  id: string;
  label: string;
  content: ReactNode;
  railContent?: ReactNode;
  className?: string;
}

interface AlignedSectionsProps {
  sections: readonly AlignedPageSection[];
}

export function AlignedSections({ sections }: AlignedSectionsProps) {
  const sectionIds = sections.map(({ id }) => id);

  return (
    <div data-aligned-sections>
      <AlignedSectionObserver sectionIds={sectionIds} />
      <nav className="aligned-quick-nav" aria-label="Page sections">
        {sections.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            data-aligned-section-link={section.id}
          >
            {section.label}
          </a>
        ))}
      </nav>

      <div className="aligned-section-list">
        {sections.map((section, index) => (
          <section
            key={section.id}
            id={section.id}
            data-aligned-section
            className={`aligned-section-row ${section.className ?? ""}`.trim()}
          >
            <aside className="aligned-section-rail">
              <div className="aligned-section-marker">
                <a
                  href={`#${section.id}`}
                  data-aligned-section-link={section.id}
                  className="aligned-section-link"
                >
                  <span aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>{section.label}</span>
                </a>
                {section.railContent ? (
                  <div className="aligned-section-rail-content">{section.railContent}</div>
                ) : null}
              </div>
            </aside>
            <div className="aligned-section-content">{section.content}</div>
          </section>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Implement progressive active-section state**

Create `src/components/navigation/AlignedSectionObserver.tsx`:

```tsx
"use client";

import { useEffect } from "react";

interface AlignedSectionObserverProps {
  sectionIds: readonly string[];
}

export function AlignedSectionObserver({ sectionIds }: AlignedSectionObserverProps) {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-aligned-sections]");
    if (!root || sectionIds.length === 0) return;

    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => Boolean(section));
    const links = Array.from(
      root.querySelectorAll<HTMLElement>("[data-aligned-section-link]")
    );

    function activate(id: string) {
      links.forEach((link) => {
        const active = link.dataset.alignedSectionLink === id;
        link.dataset.active = String(active);
        if (active) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    }

    function updateActiveSection() {
      const mastheadOffset = 72;
      const active = sections.reduce((current, section) => {
        return section.getBoundingClientRect().top <= mastheadOffset ? section : current;
      }, sections[0]);
      activate(active.id);
    }

    activate(sections[0].id);
    if (!("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(updateActiveSection, {
      rootMargin: "-72px 0px -60% 0px",
      threshold: [0, 0.25, 0.5, 1],
    });
    sections.forEach((section) => observer.observe(section));
    window.addEventListener("hashchange", updateActiveSection);

    return () => {
      observer.disconnect();
      window.removeEventListener("hashchange", updateActiveSection);
    };
  }, [sectionIds]);

  return null;
}
```

- [ ] **Step 7: Implement the shared shell**

Create `src/components/layout/AlignedPageShell.tsx`:

```tsx
import { PointerGlow } from "@/components/home/PointerGlow";
import { HomeNav } from "@/components/navigation/HomeNav";
import { defaultLocale, type Locale } from "@/i18n/locales";
import { AlignedSections, type AlignedPageSection } from "./AlignedSections";

interface AlignedPageShellProps {
  locale?: Locale;
  sections: readonly AlignedPageSection[];
}

export function AlignedPageShell({
  locale = defaultLocale,
  sections,
}: AlignedPageShellProps) {
  return (
    <>
      <HomeNav locale={locale} />
      <PointerGlow>
        <main
          className="home-motion-shell aligned-page-shell min-h-screen bg-[#050608] text-[#e8edf7]"
          data-locale={locale}
        >
          <div className="aligned-page-container relative z-10 mx-auto w-[min(1280px,calc(100vw-2rem))]">
            <AlignedSections sections={sections} />
          </div>
        </main>
      </PointerGlow>
    </>
  );
}

export type { AlignedPageSection } from "./AlignedSections";
```

- [ ] **Step 8: Give the masthead an explicit mobile row structure**

In `src/components/navigation/HomeNav.tsx`, change the inner layout so language switching can occupy the first mobile row without duplicating primary links:

```tsx
<div className="home-nav-inner mx-auto flex h-[3.2rem] max-w-[1280px] items-center justify-between">
  <div className="home-nav-brand-row">
    <Link
      href={localizedHref("/", locale)}
      className="font-serif text-lg font-semibold text-[#eef3fc] no-underline hover:text-[#f2f6ff] tracking-wide"
    >
      HongYu Liu
    </Link>
    <div className="home-nav-mobile-language">
      <LanguageSwitcher variant="home" />
    </div>
  </div>
  <ul className="home-nav-links flex items-center gap-5 md:gap-6 m-0 p-0 list-none">
    {homeNavigation.map((link) => {
      const messageKey = homeNavMessageKeys[link.title as keyof typeof homeNavMessageKeys];
      return (
        <li key={link.title}>
          <a
            href={localizedHref(link.url, locale)}
            target={link.url.startsWith("http") || link.url.startsWith("mailto") ? "_blank" : undefined}
            rel={link.url.startsWith("http") ? "noopener noreferrer" : undefined}
            className="home-nav-link font-sans text-[0.82rem] font-medium text-[rgba(202,212,228,0.88)] no-underline tracking-wider transition-colors duration-200 hover:text-[#eef3fc]"
          >
            {messageKey ? nav[messageKey] : link.title}
          </a>
        </li>
      );
    })}
    <li className="home-nav-desktop-language m-0">
      <LanguageSwitcher variant="home" />
    </li>
  </ul>
</div>
```

- [ ] **Step 9: Add the complete aligned-layout CSS contract**

In `src/app/globals.css`, remove the obsolete `.home-layout::before`, `.home-section-nav*`, `.home-section`, and old two-column responsive layout rules. Keep typography, evidence-row, action, pointer, and reveal rules. Add this block inside `@layer components`:

```css
  .aligned-page-shell {
    overflow-x: clip;
    overflow-y: visible;
  }

  .aligned-page-container {
    padding-top: calc(3.2rem + clamp(2rem, 5vw, 4.2rem));
    padding-bottom: clamp(3rem, 7vw, 5rem);
  }

  .aligned-quick-nav {
    display: none;
  }

  .home-nav-brand-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .home-nav-mobile-language {
    display: none;
  }

  .aligned-section-list {
    border-top: 1px solid rgba(220, 225, 235, 0.13);
  }

  .aligned-section-row {
    display: grid;
    grid-template-columns: minmax(0, 0.78fr) minmax(0, 2fr);
    scroll-margin-top: 5.5rem;
    border-bottom: 1px solid rgba(220, 225, 235, 0.13);
  }

  .aligned-section-rail {
    position: relative;
    min-width: 0;
    border-right: 1px solid rgba(220, 225, 235, 0.1);
  }

  .aligned-section-rail::before {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    left: clamp(1.25rem, 3vw, 2.1rem);
    width: 1px;
    background: rgba(220, 225, 235, 0.12);
  }

  .aligned-section-marker {
    position: sticky;
    top: calc(3.2rem + 1.6rem);
    padding: clamp(1.7rem, 4vw, 2.4rem) clamp(1rem, 3vw, 2.2rem)
      clamp(2.2rem, 5vw, 3.2rem) clamp(2.7rem, 6vw, 4.2rem);
  }

  .aligned-section-link {
    position: relative;
    display: inline-flex;
    align-items: baseline;
    gap: 0.8rem;
    color: #687386;
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.18em;
    line-height: 1.4;
    text-decoration: none;
    text-transform: uppercase;
    transition: color 180ms ease;
  }

  .aligned-section-link::before {
    content: "";
    position: absolute;
    left: calc(clamp(1.25rem, 3vw, 2.1rem) - clamp(2.7rem, 6vw, 4.2rem) - 0.22rem);
    top: 0.2rem;
    width: 0.48rem;
    height: 0.48rem;
    border: 1px solid #687386;
    border-radius: 50%;
    background: #050608;
    transition: border-color 180ms ease, background 180ms ease, box-shadow 180ms ease;
  }

  .aligned-section-link span:first-child {
    color: #505a69;
    font-size: 0.64rem;
    letter-spacing: 0.1em;
  }

  .aligned-section-link[data-active="true"],
  .aligned-section-link:hover,
  .aligned-section-link:focus-visible {
    color: #eef3fa;
    text-decoration: none;
  }

  .aligned-section-link[data-active="true"]::before {
    border-color: #dce4ee;
    background: #dce4ee;
    box-shadow: 0 0 0 5px rgba(220, 228, 238, 0.06);
  }

  .aligned-section-link:focus-visible {
    outline: 2px solid rgba(220, 228, 238, 0.45);
    outline-offset: 0.35rem;
  }

  .aligned-section-rail-content {
    margin-top: 1.2rem;
    color: #7d8899;
    font-size: 0.82rem;
    line-height: 1.6;
  }

  .aligned-section-content {
    min-width: 0;
    padding: clamp(1.7rem, 4vw, 2.4rem) clamp(1.2rem, 4vw, 3.4rem)
      clamp(2.7rem, 7vw, 4.8rem);
  }

  .aligned-section-content > :first-child {
    margin-top: 0;
  }

  .aligned-article-prose {
    max-width: 48rem;
  }

  .aligned-content-title {
    margin: 0;
    color: #e8edf7;
    font-family: var(--home-font-display);
    font-size: clamp(1.8rem, 4vw, 3rem);
    font-weight: 600;
    line-height: 1.1;
  }

  @media (min-width: 768px) and (max-width: 1023px) {
    .aligned-section-row {
      grid-template-columns: minmax(0, 0.6fr) minmax(0, 2fr);
    }

    .aligned-section-link {
      gap: 0.5rem;
      letter-spacing: 0.1em;
    }
  }

  @media (max-width: 767px) {
    .home-nav-inner {
      display: grid;
      height: 6.4rem;
      padding: 0.5rem 0;
    }

    .home-nav-mobile-language {
      display: block;
    }

    .home-nav-desktop-language {
      display: none;
    }

    .home-nav-links {
      width: 100%;
      justify-content: space-between;
      gap: 0.75rem;
    }

    .aligned-page-container {
      padding-top: calc(6.4rem + 1.4rem);
    }

    .aligned-quick-nav {
      position: sticky;
      top: 6.4rem;
      z-index: 20;
      display: flex;
      gap: 1.2rem;
      overflow-x: auto;
      padding: 0.8rem 0.2rem;
      border-bottom: 1px solid rgba(220, 225, 235, 0.13);
      background: rgba(5, 6, 8, 0.94);
      scrollbar-width: none;
    }

    .aligned-quick-nav a {
      flex: none;
      color: #8490a1;
      font-size: 0.68rem;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-decoration: none;
      text-transform: uppercase;
    }

    .aligned-quick-nav a[data-active="true"] {
      color: #eef3fa;
    }

    .aligned-section-row {
      grid-template-columns: 1fr;
      scroll-margin-top: 9rem;
    }

    .aligned-section-rail {
      border-right: 0;
    }

    .aligned-section-rail::before {
      display: none;
    }

    .aligned-section-marker {
      position: static;
      padding: 1.45rem 0.2rem 0;
    }

    .aligned-section-link::before {
      display: none;
    }

    .aligned-section-rail-content {
      display: block;
      margin-top: 0.75rem;
      font-size: 0.78rem;
    }

    .aligned-section-content {
      padding: 1rem 0.2rem 2.8rem;
    }
  }
```

- [ ] **Step 10: Run layout tests and type checking**

Run:

```bash
rtk npm run test:run -- src/components/layout/__tests__/AlignedSections.test.tsx src/components/layout/__tests__/alignedStyles.test.ts
rtk npx tsc --noEmit
```

Expected: layout tests PASS and TypeScript exits 0.

- [ ] **Step 11: Commit the shared shell**

```bash
rtk git add vitest.config.ts src/components/layout/AlignedPageShell.tsx src/components/layout/AlignedSections.tsx src/components/navigation/AlignedSectionObserver.tsx src/components/navigation/HomeNav.tsx src/components/layout/__tests__/AlignedSections.test.tsx src/components/layout/__tests__/alignedStyles.test.ts src/app/globals.css
rtk git commit -m "feat: add aligned editorial page shell"
```

---

### Task 3: Homepage Chapter Migration

**Files:**
- Create: `src/components/pages/__tests__/HomePageView.test.tsx`
- Modify: `src/components/pages/HomePageView.tsx`

**Interfaces:**
- Consumes: `AlignedPageShell`, `AlignedPageSection`, and `getPublishedPosts`.
- Produces: `buildHomeSections(locale: Locale, publishedPosts: readonly LocalizedPost[]): AlignedPageSection[]` for focused rendering tests.

- [ ] **Step 1: Write the failing homepage-section test**

Create `src/components/pages/__tests__/HomePageView.test.tsx`:

```tsx
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { LocalizedPost } from "@/lib/content/posts";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={String(href)} {...props}>{children}</a>
  ),
}));

import { buildHomeSections } from "../HomePageView";

const latest: LocalizedPost = {
  slug: "latest-note",
  title: "Latest note",
  excerpt: "One sentence summary.",
  date: "2026-06-18",
  tags: [],
  body: "Body",
  bodyHtml: "<p>Body</p>",
  locale: "en",
};

describe("buildHomeSections", () => {
  it("keeps the approved chapter order", () => {
    expect(buildHomeSections("en", [latest]).map(({ id }) => id)).toEqual([
      "profile",
      "research",
      "experience",
      "education",
      "insights",
    ]);
  });

  it("renders only the latest note preview and the Insights index link", () => {
    const insights = buildHomeSections("en", [latest]).find(({ id }) => id === "insights");
    const html = renderToStaticMarkup(<>{insights?.content}</>);

    expect(html).toContain("Latest note");
    expect(html).toContain("One sentence summary.");
    expect(html).toContain('/insights/latest-note/');
    expect(html).toContain('/insights/');
  });

  it("renders localized fallback copy when there is no published note", () => {
    const insights = buildHomeSections("zh", []).find(({ id }) => id === "insights");
    const html = renderToStaticMarkup(<>{insights?.content}</>);
    expect(html).toContain("这里是我公开整理分析的地方");
    expect(html).toContain('/zh/insights/');
  });
});
```

- [ ] **Step 2: Run the test and verify the missing builder**

Run:

```bash
rtk npm run test:run -- src/components/pages/__tests__/HomePageView.test.tsx
```

Expected: FAIL because `buildHomeSections` is not exported.

- [ ] **Step 3: Split homepage copy into the approved five chapters**

In `src/components/pages/HomePageView.tsx`:

1. Remove `PointerGlow`, `HomeNav`, `sectionNavItems`, and the old sticky `<aside>`/`home-stream` JSX.
2. Import `AlignedPageShell`, `AlignedPageSection`, `LocalizedPost`, and `getPublishedPosts`.
3. Remove `workTitle`, `workDescription`, `notesTitle`, `notesDescription`, `backgroundTitle`, `viewWork`, and `readNotes` from both locale values and from the `satisfies` value type. Replace them with these explicit strings:

```ts
// English additions
researchTitle: "Research",
researchDescription: "Complete research papers in speech language models, privacy, and spoken dialogue intelligence.",
experienceTitle: "Experience",
experienceDescription: "Production work on speech algorithms, model inference, voice cloning, and video translation.",
educationTitle: "Education",
educationDescription: "Academic training in software engineering and data science.",
insightsTitle: "Insights",
insightsDescription: "The latest note from my public notebook.",
openInsights: "Open Insights",

// Chinese additions
researchTitle: "研究成果",
researchDescription: "完整记录我在语音语言模型、隐私评估与语音对话智能方向的研究论文。",
experienceTitle: "实习经历",
experienceDescription: "完整记录语音算法、模型推理、语音克隆与视频翻译相关的生产实践。",
educationTitle: "教育经历",
educationDescription: "软件工程与数据科学方向的学习经历。",
insightsTitle: "随笔洞察",
insightsDescription: "公开笔记中最近发布的一篇。",
openInsights: "打开随笔洞察",
```

Add these exact fields to the `satisfies Record<Locale, ...>` value type:

```ts
researchTitle: string;
researchDescription: string;
experienceTitle: string;
experienceDescription: string;
educationTitle: string;
educationDescription: string;
insightsTitle: string;
insightsDescription: string;
openInsights: string;
```

- [ ] **Step 4: Implement the section builder and thin page component**

Keep the existing typed paper, internship, and education arrays. Add this builder and replace `HomePageView`:

```tsx
export function buildHomeSections(
  locale: Locale,
  publishedPosts: readonly LocalizedPost[]
): AlignedPageSection[] {
  const { common } = getMessages(locale);
  const copy = homeDesignCopy[locale];
  const { featuredInsight } = getInsightContent(locale);
  const insightsHref = localizedHref("/insights/", locale);
  const latestPost = publishedPosts[0];
  const cvHref = "/files/Resume_en.pdf";

  return [
    {
      id: "profile",
      label: copy.nav.profile,
      content: (
        <div className="home-reveal">
          <p className="home-kicker">{copy.eyebrow}</p>
          <p className="home-profile-mark">{authorConfig.name}</p>
          <h1 className="home-hero-title">{copy.headline}</h1>
          <p className="home-profile-role">{copy.role}</p>
          <p className="home-profile-summary">{copy.profileSummary}</p>
          <p className="home-hero-summary">{copy.summary}</p>
          <div className="home-social-links mt-8 flex flex-wrap gap-x-8 gap-y-3 text-[0.86rem] text-[#8993a3]">
            <a href={`https://github.com/${authorConfig.github}`} target="_blank" rel="noopener noreferrer">GitHub</a>
            <a href={authorConfig.googlescholar} target="_blank" rel="noopener noreferrer">Scholar</a>
            <a href={cvHref}>CV</a>
            <a href={`mailto:${authorConfig.email}`}>Email</a>
          </div>
        </div>
      ),
    },
    {
      id: "research",
      label: copy.researchTitle,
      content: (
        <>
          <SectionHeading title={copy.researchTitle} description={copy.researchDescription} />
          <div className="home-evidence-list">
            {papersData[locale].map((paper) => (
              <EvidenceRow
                key={paper.title}
                label={copy.researchLabel}
                meta={paper.venue}
                title={paper.title}
                description={paper.description}
                detail={common.paper}
                href={paper.paperUrl}
                external
              />
            ))}
          </div>
        </>
      ),
    },
    {
      id: "experience",
      label: copy.experienceTitle,
      content: (
        <>
          <SectionHeading title={copy.experienceTitle} description={copy.experienceDescription} />
          <div className="home-evidence-list">
            {internshipData[locale].map((item) => (
              <EvidenceRow
                key={item.title}
                label={copy.experienceLabel}
                meta={item.time}
                title={item.title}
                description={item.description}
                detail={item.meta}
              />
            ))}
          </div>
        </>
      ),
    },
    {
      id: "education",
      label: copy.educationTitle,
      content: (
        <>
          <SectionHeading title={copy.educationTitle} description={copy.educationDescription} />
          <div className="home-evidence-list">
            {educationData[locale].map((item) => (
              <EvidenceRow
                key={item.title}
                label={copy.educationLabel}
                meta={item.time}
                title={item.title}
                description={item.description}
                detail={item.meta}
              />
            ))}
          </div>
        </>
      ),
    },
    {
      id: "insights",
      label: copy.insightsTitle,
      content: (
        <>
          <SectionHeading title={copy.insightsTitle} description={copy.insightsDescription} />
          {latestPost ? (
            <Link
              href={localizedHref(`/insights/${latestPost.slug}/`, locale)}
              className="home-latest-insight"
            >
              {latestPost.date ? <span>{latestPost.date}</span> : null}
              <h3>{latestPost.title}</h3>
              {latestPost.excerpt ? <p>{latestPost.excerpt}</p> : null}
            </Link>
          ) : (
            <p className="home-hero-summary">{featuredInsight.description}</p>
          )}
          <Link href={insightsHref} className="home-action-secondary mt-6">
            <span>{copy.openInsights}</span>
          </Link>
        </>
      ),
    },
  ];
}

export function HomePageView({ locale = defaultLocale }: HomePageViewProps) {
  return (
    <AlignedPageShell
      locale={locale}
      sections={buildHomeSections(locale, getPublishedPosts(locale))}
    />
  );
}
```

Add these `.home-latest-insight` styles beside the existing evidence/action styles:

```css
  .home-latest-insight {
    display: block;
    margin-top: 1.35rem;
    padding: clamp(1.2rem, 3vw, 1.8rem);
    border: 1px solid rgba(220, 225, 235, 0.13);
    color: #aeb8c7;
    text-decoration: none;
    transition: border-color 180ms ease, background 180ms ease, transform 180ms ease;
  }

  .home-latest-insight > span {
    color: #687386;
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .home-latest-insight h3 {
    margin: 0.55rem 0 0;
    color: #e8edf7;
    font-size: clamp(1.1rem, 2vw, 1.35rem);
    line-height: 1.3;
  }

  .home-latest-insight p {
    margin: 0.65rem 0 0;
    color: #aeb8c7;
    font-size: 0.92rem;
    line-height: 1.7;
  }

  .home-latest-insight:hover,
  .home-latest-insight:focus-visible {
    border-color: rgba(235, 239, 247, 0.28);
    background: rgba(235, 239, 247, 0.025);
    color: #d8dee8;
    text-decoration: none;
    transform: translateY(-1px);
  }

  .home-latest-insight:focus-visible {
    outline: 2px solid rgba(220, 228, 238, 0.45);
    outline-offset: 0.2rem;
  }
```

- [ ] **Step 5: Run the homepage and content tests**

Run:

```bash
rtk npm run test:run -- src/components/pages/__tests__/HomePageView.test.tsx src/lib/content/__tests__/posts.test.ts
rtk npx tsc --noEmit
```

Expected: all focused tests PASS and TypeScript exits 0.

- [ ] **Step 6: Commit the homepage migration**

```bash
rtk git add src/components/pages/HomePageView.tsx src/components/pages/__tests__/HomePageView.test.tsx src/app/globals.css
rtk git commit -m "feat: align homepage chapters"
```

---

### Task 4: Insights Index And Article Migration

**Files:**
- Create: `src/components/pages/__tests__/InsightsPageViews.test.tsx`
- Modify: `src/components/pages/InsightsPageView.tsx`
- Modify: `src/components/pages/InsightArticlePageView.tsx`
- Modify: `src/i18n/messages.ts`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: `AlignedPageShell`, `AlignedPageSection`, and `getPublishedPosts`.
- Produces: `buildInsightsSections(locale, posts)` and `buildInsightArticleSections(locale, post)` for focused tests.

- [ ] **Step 1: Write failing Insights and article shell tests**

Create `src/components/pages/__tests__/InsightsPageViews.test.tsx`:

```tsx
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { LocalizedPost } from "@/lib/content/posts";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={String(href)} {...props}>{children}</a>
  ),
}));

import { buildInsightArticleSections } from "../InsightArticlePageView";
import { buildInsightsSections } from "../InsightsPageView";

const post: LocalizedPost = {
  slug: "note",
  title: "A published note",
  excerpt: "Short summary.",
  date: "2026-06-18",
  tags: ["AI"],
  body: "Body",
  bodyHtml: "<h2>Section</h2><p>Body</p>",
  locale: "en",
};

describe("Insights section builders", () => {
  it("uses the approved index chapter order", () => {
    expect(buildInsightsSections("en", [post]).map(({ id }) => id)).toEqual([
      "insights",
      "published",
      "streams",
      "notebook",
    ]);
  });

  it("uses the shared article and reading rows", () => {
    const sections = buildInsightArticleSections("en", post);
    expect(sections.map(({ id }) => id)).toEqual(["article", "reading"]);

    const html = renderToStaticMarkup(<>{sections.map(({ content }) => content)}</>);
    expect(html).toContain("A published note");
    expect(html).toContain("Short summary.");
    expect(html).toContain('class="aligned-article-prose');
    expect(html).toContain("<h2>Section</h2>");
  });

  it("omits notebook items whose title is already published", () => {
    const duplicate = {
      ...post,
      title: "What changes when speech models become social agents?",
    };
    const notebook = buildInsightsSections("en", [duplicate]).find(
      ({ id }) => id === "notebook"
    );
    const html = renderToStaticMarkup(<>{notebook?.content}</>);

    expect(html).not.toContain("What changes when speech models become social agents?");
    expect(html).toContain("How AI product strategy shows up before earnings do");
  });

  it("keeps a localized return link when no article table of contents exists", () => {
    const article = buildInsightArticleSections("zh", { ...post, locale: "zh" });
    const rail = renderToStaticMarkup(<>{article[0].railContent}</>);
    expect(rail).toContain("返回随笔洞察");
    expect(rail).toContain('/zh/insights/');
  });
});
```

- [ ] **Step 2: Run the test and verify missing builders/copy**

Run:

```bash
rtk npm run test:run -- src/components/pages/__tests__/InsightsPageViews.test.tsx
```

Expected: FAIL because both builders and article navigation messages are missing.

- [ ] **Step 3: Add localized article-shell labels**

Extend `Messages["pages"]["insights"]` in `src/i18n/messages.ts` with:

```ts
articleLabel: string;
readingLabel: string;
backToInsights: string;
```

Add these values to English:

```ts
articleLabel: "Article",
readingLabel: "Reading",
backToInsights: "Back to Insights",
```

Add these values to Chinese:

```ts
articleLabel: "文章",
readingLabel: "正文",
backToInsights: "返回随笔洞察",
```

- [ ] **Step 4: Refactor the Insights index into aligned chapters**

In `src/components/pages/InsightsPageView.tsx`, remove `FluidBackground` and direct `HomeNav` usage. Export a builder with this structure, preserving the existing post-card and stream markup inside the indicated content nodes:

```tsx
export function buildInsightsSections(
  locale: Locale,
  posts: readonly LocalizedPost[]
): AlignedPageSection[] {
  const { insights } = getMessages(locale).pages;
  const { entries } = getInsightContent(locale);
  const publishedTitles = new Set(posts.map(({ title }) => title.trim().toLocaleLowerCase(locale)));
  const queuedNotes = insights.noteQueue.filter(
    ({ title }) => !publishedTitles.has(title.trim().toLocaleLowerCase(locale))
  );

  const sections: AlignedPageSection[] = [
    {
      id: "insights",
      label: insights.eyebrow,
      content: (
        <header>
          <p className="home-kicker">{insights.eyebrow}</p>
          <h1 className="home-hero-title">{insights.title}</h1>
          <p className="home-hero-summary">{insights.subtitle}</p>
          <p className="home-profile-summary">{insights.aside}</p>
        </header>
      ),
    },
    {
      id: "published",
      label: insights.publishedEyebrow,
      content: (
        <>
          <h2 className="aligned-content-title">{insights.publishedTitle}</h2>
          <div className="home-evidence-list">
            {posts.length > 0 ? posts.map((post) => (
              <Link
                key={post.slug}
                href={localizedHref(`/insights/${post.slug}/`, locale)}
                className="home-latest-insight"
              >
                {post.date ? <span>{post.date}</span> : null}
                <h3>{post.title}</h3>
                {post.excerpt ? <p>{post.excerpt}</p> : null}
              </Link>
            )) : <p className="home-profile-summary">{insights.futureNote}</p>}
          </div>
        </>
      ),
    },
    {
      id: "streams",
      label: insights.streamsEyebrow,
      content: (
        <>
          <h2 className="aligned-content-title">{insights.streamsTitle}</h2>
          <div className="home-evidence-list">
            {entries.map((entry) => (
              <article key={entry.title} className="home-evidence-row">
                <div className="home-evidence-label">
                  <span>{entry.category}</span><span>{entry.cadence}</span>
                </div>
                <div><h3>{entry.title}</h3><p>{entry.description}</p></div>
              </article>
            ))}
          </div>
        </>
      ),
    },
  ];

  if (queuedNotes.length > 0) {
    sections.push({
      id: "notebook",
      label: insights.queueEyebrow,
      content: (
        <>
          <h2 className="aligned-content-title">{insights.queueTitle}</h2>
          <div className="home-evidence-list">
            {queuedNotes.map((note) => (
              <article key={note.title} className="home-evidence-row">
                <div className="home-evidence-label"><span>{note.label}</span></div>
                <div><h3>{note.title}</h3><p>{note.description}</p></div>
              </article>
            ))}
          </div>
        </>
      ),
    });
  }

  return sections;
}

export function InsightsPageView({ locale = defaultLocale }: InsightsPageViewProps) {
  return (
    <AlignedPageShell
      locale={locale}
      sections={buildInsightsSections(locale, getPublishedPosts(locale))}
    />
  );
}
```

- [ ] **Step 5: Refactor article pages into article and reading rows**

In `src/components/pages/InsightArticlePageView.tsx`, remove `FluidBackground` and direct `HomeNav` usage. Add:

```tsx
export function buildInsightArticleSections(
  locale: Locale,
  post: LocalizedPost
): AlignedPageSection[] {
  const { insights } = getMessages(locale).pages;
  const insightsHref = localizedHref("/insights/", locale);

  return [
    {
      id: "article",
      label: insights.articleLabel,
      railContent: <Link href={insightsHref}>{insights.backToInsights}</Link>,
      content: (
        <header>
          {post.date ? <p className="home-kicker">{post.date}</p> : null}
          <h1 className="home-hero-title">{post.title}</h1>
          {post.excerpt ? <p className="home-hero-summary">{post.excerpt}</p> : null}
        </header>
      ),
    },
    {
      id: "reading",
      label: insights.readingLabel,
      content: (
        <article className="aligned-article-prose prose prose-invert max-w-none prose-headings:font-serif prose-a:text-[#c8d8f2]">
          <h2 className="sr-only">{insights.readingLabel}</h2>
          <div dangerouslySetInnerHTML={{ __html: post.bodyHtml }} />
        </article>
      ),
    },
  ];
}

export function InsightArticlePageView({
  locale = defaultLocale,
  post,
}: InsightArticlePageViewProps) {
  return (
    <AlignedPageShell
      locale={locale}
      sections={buildInsightArticleSections(locale, post)}
    />
  );
}
```

The current content pipeline does not emit reliable `h2`/`h3` IDs, so do not render an empty or non-functional table of contents. The localized return link and Reading row are the documented fallback.

- [ ] **Step 6: Run page tests and type checking**

Run:

```bash
rtk npm run test:run -- src/components/pages/__tests__/InsightsPageViews.test.tsx src/components/pages/__tests__/HomePageView.test.tsx
rtk npx tsc --noEmit
```

Expected: page tests PASS and TypeScript exits 0.

- [ ] **Step 7: Commit the unified Insights templates**

```bash
rtk git add src/components/pages/InsightsPageView.tsx src/components/pages/InsightArticlePageView.tsx src/components/pages/__tests__/InsightsPageViews.test.tsx src/i18n/messages.ts src/app/globals.css
rtk git commit -m "feat: unify insights page templates"
```

---

### Task 5: Documentation And End-To-End Verification

**Files:**
- Modify: `docs/superpowers/plans/2026-06-17-minimal-motion-homepage.md`
- Review only: `README.md`
- Verify: all files changed in Tasks 1 through 4.

**Interfaces:**
- Consumes: the completed aligned shell and all three migrated page views.
- Produces: verified static output and synchronized durable documentation.

- [ ] **Step 1: Record the superseded desktop composition**

Add this note immediately after the header block in `docs/superpowers/plans/2026-06-17-minimal-motion-homepage.md`:

```md
> **Superseded layout note (2026-06-19):** The sticky profile rail and right-side evidence stream were replaced by the approved aligned chapter grid shared by the homepage, Insights index, and Insights articles. The dark palette, restrained pointer treatment, evidence rows, focus states, and reduced-motion requirements remain active.
```

- [ ] **Step 2: Run the complete automated verification set**

Run:

```bash
rtk npm run test:run
rtk npx tsc --noEmit
rtk git diff --check
rtk npm run build
```

Expected:

- all Vitest tests PASS;
- TypeScript exits 0;
- `git diff --check` prints no errors;
- Next.js static export completes and writes `out/`.

- [ ] **Step 3: Serve the static export**

Run in a persistent terminal session:

```bash
rtk python3 -m http.server 4173 --directory out
```

Expected: `Serving HTTP on ... port 4173`.

- [ ] **Step 4: Verify desktop and tablet geometry in the browser**

Open `/`, `/zh/`, `/insights/`, `/zh/insights/`, and one article route at 1512x900, 1280x720, 1024x720, and 768x1024. For every page:

- compare each `[data-aligned-section-link]` marker top with its matching `[data-aligned-section] .aligned-section-content` top;
- require at most a one-pixel difference;
- scroll across every boundary and confirm the sticky marker remains contained in its row;
- confirm the active state transfers without layout movement or overlap;
- confirm no horizontal page overflow and no console or hydration errors.

- [ ] **Step 5: Verify homepage content and Insights truncation**

On `/` and `/zh/`:

- confirm every configured paper appears;
- confirm both current internship records appear with complete descriptions;
- confirm both education records appear;
- confirm the 2199 future sample post is absent;
- confirm exactly one latest-note preview and one Insights index button appear.

- [ ] **Step 6: Verify mobile, keyboard, locale, and reduced motion**

At 390x844:

- confirm the page is one column and the quick-jump list is visible below the two-row masthead;
- confirm every quick-jump link clears the fixed masthead;
- tab through masthead, quick navigation, rail/section links, paper links, latest note, and article return link;
- emulate `prefers-reduced-motion: reduce` and confirm reveal/transition durations collapse;
- switch English to Chinese and back, then use browser history to confirm the existing locale behavior remains correct.

- [ ] **Step 7: Review durable documentation scope**

Read `README.md` and confirm routes, content authoring, installation, and deployment commands are unchanged. Do not edit it when those contracts remain unchanged.

- [ ] **Step 8: Commit documentation and verification closeout**

```bash
rtk git add docs/superpowers/plans/2026-06-17-minimal-motion-homepage.md
rtk git commit -m "docs: record aligned homepage layout"
```

Final repository check:

```bash
rtk git status --short
```

Expected: only the user's unrelated untracked `output/` directory remains.
