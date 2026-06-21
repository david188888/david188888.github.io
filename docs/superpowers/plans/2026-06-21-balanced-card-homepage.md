# Balanced Card Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the slogan-led, wide-left-rail homepage with an identity-first academic homepage whose education, research, experience, and latest Insight appear as balanced vertical cards.

**Architecture:** Add one shared published-post selector, one client-only scroll-progress component, and one pure academic-card component. Keep localized homepage records in `HomePageView`, render the approved section order there, and replace the obsolete homepage rail/evidence CSS with a focused card system while preserving existing routes and navigation.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript 5.7, Tailwind CSS 3.4, Vitest 4, static export.

## Global Constraints

- Homepage order is Profile, Education, Selected Research, Experience, Insights.
- No portrait, `Current Direction` copy, wide left rail, background grid, card-corner arrow, or card-edge accent line.
- Desktop cards use balanced density, approximately 150–175px minimum height, 28–32px padding, 12px radius, and one low-contrast border.
- Hover and focus feedback use only surface, border, shadow, and up to four pixels of vertical movement.
- Respect `prefers-reduced-motion`, English and Chinese routes, keyboard navigation, and static export.
- Do not modify or stage `.pnpm-store/` or `output/`.

---

## File Structure

### New files

- `src/components/home/AcademicRecordCard.tsx`: semantic, reusable academic record card with optional explicit link.
- `src/components/home/HomeScrollProgress.tsx`: progressive-enhancement reading progress indicator.
- `src/components/pages/__tests__/HomePageView.test.tsx`: homepage structure and content contract.
- `src/components/home/__tests__/AcademicRecordCard.test.tsx`: card semantics and decoration regression contract.
- `src/lib/content/__tests__/posts.test.ts`: future-date exclusion and newest-first selection.
- `src/app/__tests__/homepageStyles.test.ts`: card geometry, responsive, and reduced-motion style contract.

### Modified files

- `vitest.config.ts`: include TSX component tests.
- `src/lib/content/posts.ts`: expose published-post selection.
- `src/components/pages/HomePageView.tsx`: implement approved homepage structure.
- `src/app/globals.css`: implement card surface, layout, progress, responsive, and motion styles.
- `docs/superpowers/specs/2026-06-19-aligned-home-insights-shell-design.md`: record homepage supersession.
- `docs/superpowers/plans/2026-06-19-aligned-home-insights-shell.md`: record homepage supersession.

---

### Task 1: Published Insight Selection

**Files:**
- Create: `src/lib/content/__tests__/posts.test.ts`
- Modify: `src/lib/content/posts.ts`

**Interfaces:**
- Produces: `selectPublishedPosts(posts: readonly LocalizedPost[], today?: Date): LocalizedPost[]`
- Produces: `getPublishedPosts(locale?: Locale, today?: Date): LocalizedPost[]`
- Consumed by: `HomePageView` in Task 3.

- [ ] **Step 1: Write the failing selector tests**

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
  const today = new Date("2026-06-21T12:00:00.000Z");

  it("excludes future dates and sorts published posts newest first", () => {
    const result = selectPublishedPosts(
      [post("older", "2025-01-01"), post("future", "2199-01-01"), post("latest", "2026-06-20")],
      today
    );
    expect(result.map(({ slug }) => slug)).toEqual(["latest", "older"]);
  });

  it("keeps undated and invalid-date records after dated records", () => {
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

- [ ] **Step 2: Run the tests and verify the missing export**

Run:

```bash
rtk npm run test:run -- src/lib/content/__tests__/posts.test.ts
```

Expected: FAIL because `selectPublishedPosts` is not exported.

- [ ] **Step 3: Implement the selector**

Add after `getLocalizedPosts` in `src/lib/content/posts.ts`:

```ts
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

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

- [ ] **Step 5: Commit the selector**

```bash
rtk git add src/lib/content/posts.ts src/lib/content/__tests__/posts.test.ts
rtk git commit -m "feat: select published insight posts"
```

---

### Task 2: Academic Card And Reading Progress Primitives

**Files:**
- Create: `src/components/home/AcademicRecordCard.tsx`
- Create: `src/components/home/HomeScrollProgress.tsx`
- Create: `src/components/home/__tests__/AcademicRecordCard.test.tsx`
- Modify: `vitest.config.ts`

**Interfaces:**
- Produces: `AcademicRecordCard(props: AcademicRecordCardProps)`.
- Produces: `HomeScrollProgress()`.
- Consumed by: `HomePageView` in Task 3.

- [ ] **Step 1: Enable TSX tests**

Change `vitest.config.ts` to:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx", "scripts/**/*.test.mjs"],
  },
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
});
```

- [ ] **Step 2: Write the failing card contract tests**

Create `src/components/home/__tests__/AcademicRecordCard.test.tsx`:

```tsx
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={String(href)} {...props}>{children}</a>
  ),
}));

import { AcademicRecordCard } from "../AcademicRecordCard";

describe("AcademicRecordCard", () => {
  it("renders semantic metadata and an explicit link without decorative arrows", () => {
    const html = renderToStaticMarkup(
      <AcademicRecordCard
        category="Research"
        meta="ICLR 2026 · Poster"
        title="VoxPrivacy"
        description="Interactional privacy benchmark."
        details={["Second author", "Speech LLM"]}
        href="https://example.com/paper"
        linkLabel="Paper"
        external
        emphasis="research"
      />
    );

    expect(html).toContain("<article");
    expect(html).toContain("VoxPrivacy");
    expect(html).toContain('href="https://example.com/paper"');
    expect(html).toContain("Paper");
    expect(html).not.toContain("academic-card-arrow");
    expect(html).not.toContain("→");
    expect(html).not.toContain("↗");
  });

  it("omits empty optional metadata", () => {
    const html = renderToStaticMarkup(
      <AcademicRecordCard category="Education" meta="B.Eng." title="SCNU" description="Software Engineering" />
    );
    expect(html).not.toContain("academic-card-details");
    expect(html).not.toContain("academic-card-link");
  });
});
```

- [ ] **Step 3: Run the card test and verify the missing module**

Run:

```bash
rtk npm run test:run -- src/components/home/__tests__/AcademicRecordCard.test.tsx
```

Expected: FAIL because `AcademicRecordCard` does not exist.

- [ ] **Step 4: Implement the pure card component**

Create `src/components/home/AcademicRecordCard.tsx`:

```tsx
import Link from "next/link";

export interface AcademicRecordCardProps {
  category: string;
  meta: string;
  title: string;
  description: string;
  details?: readonly string[];
  href?: string;
  linkLabel?: string;
  external?: boolean;
  emphasis?: "default" | "research";
}

export function AcademicRecordCard({
  category,
  meta,
  title,
  description,
  details = [],
  href,
  linkLabel,
  external = false,
  emphasis = "default",
}: AcademicRecordCardProps) {
  return (
    <article className={`academic-card academic-card--${emphasis}`}>
      <div className="academic-card-meta">
        <span>{category}</span>
        <time>{meta}</time>
      </div>
      <div className="academic-card-copy">
        <h3>{title}</h3>
        <p>{description}</p>
        {details.length > 0 || (href && linkLabel) ? (
          <div className="academic-card-details">
            {href && linkLabel ? external ? (
              <a className="academic-card-link" href={href} target="_blank" rel="noopener noreferrer">{linkLabel}</a>
            ) : (
              <Link className="academic-card-link" href={href}>{linkLabel}</Link>
            ) : null}
            {details.map((detail) => <span key={detail}>{detail}</span>)}
          </div>
        ) : null}
      </div>
    </article>
  );
}
```

- [ ] **Step 5: Implement reading progress**

Create `src/components/home/HomeScrollProgress.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";

export function HomeScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function updateProgress() {
      const distance = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(distance > 0 ? Math.min(1, Math.max(0, window.scrollY / distance)) : 0);
    }
    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, []);

  return (
    <div className="home-reading-progress" aria-hidden="true">
      <span style={{ transform: `scaleX(${progress})` }} />
    </div>
  );
}
```

- [ ] **Step 6: Run card tests and type checking**

Run:

```bash
rtk npm run test:run -- src/components/home/__tests__/AcademicRecordCard.test.tsx
rtk npx tsc --noEmit
```

Expected: 2 tests PASS and TypeScript exits 0.

- [ ] **Step 7: Commit the primitives**

```bash
rtk git add vitest.config.ts src/components/home/AcademicRecordCard.tsx src/components/home/HomeScrollProgress.tsx src/components/home/__tests__/AcademicRecordCard.test.tsx
rtk git commit -m "feat: add academic homepage card primitives"
```

---

### Task 3: Homepage Structure And Cards

**Files:**
- Create: `src/components/pages/__tests__/HomePageView.test.tsx`
- Modify: `src/components/pages/HomePageView.tsx`

**Interfaces:**
- Consumes: `AcademicRecordCard`, `HomeScrollProgress`, `getPublishedPosts`, `localizedHref`, `authorConfig`.
- Produces: homepage section IDs `profile`, `education`, `research`, `experience`, `insights` in that order.

- [ ] **Step 1: Write the failing homepage contract test**

Create `src/components/pages/__tests__/HomePageView.test.tsx`:

```tsx
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={String(href)} {...props}>{children}</a>
  ),
}));
vi.mock("@/components/navigation/HomeNav", () => ({ HomeNav: () => <nav>Navigation</nav> }));
vi.mock("@/components/home/PointerGlow", () => ({ PointerGlow: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/components/home/HomeScrollProgress", () => ({ HomeScrollProgress: () => <div className="home-reading-progress" /> }));

import { HomePageView } from "../HomePageView";

describe("HomePageView", () => {
  it("renders the approved identity-first section order without obsolete campaign copy", () => {
    const html = renderToStaticMarkup(<HomePageView locale="en" />);
    const ids = ["profile", "education", "research", "experience", "insights"];
    ids.forEach((id) => expect(html).toContain(`id="${id}"`));
    ids.slice(1).forEach((id, index) => expect(html.indexOf(`id="${ids[index]}"`)).toBeLessThan(html.indexOf(`id="${id}"`)));
    expect(html).toContain("HongYu Liu");
    expect(html).toContain("South China Normal University");
    expect(html).toContain("Insta360");
    expect(html).not.toContain("Current Direction");
    expect(html).not.toContain("Trustworthy speech systems, documented in public.");
    expect(html).not.toContain("home-profile");
  });

  it("shows no future sample Insight", () => {
    const html = renderToStaticMarkup(<HomePageView locale="en" />);
    expect(html).not.toContain("future-post");
  });
});
```

- [ ] **Step 2: Run the test and verify obsolete content fails the contract**

Run:

```bash
rtk npm run test:run -- src/components/pages/__tests__/HomePageView.test.tsx
```

Expected: FAIL because the current homepage contains campaign copy, the wide profile rail, and the old section order.

- [ ] **Step 3: Replace the homepage page view**

In `src/components/pages/HomePageView.tsx`:

- keep the existing typed `educationData`, `internshipData`, and `papersData` records;
- replace `EvidenceRow`, `sectionNavItems`, and the old left-rail markup with `AcademicRecordCard` cards;
- replace `homeDesignCopy` fields with localized factual labels for `profile`, `education`, `research`, `experience`, and `insights`;
- call `getPublishedPosts(locale)` and select its first record for the latest Insight;
- render `HomeNav`, `HomeScrollProgress`, `PointerGlow`, and this exact section structure:

```tsx
<main className="academic-home home-motion-shell" data-locale={locale}>
  <div className="academic-home-container">
    <section id="profile" className="academic-home-hero home-reveal">
      <div>
        <p className="academic-home-kicker">{copy.role}</p>
        <h1>{authorConfig.name}</h1>
        <p className="academic-home-intro">{copy.introduction}</p>
        <div className="academic-home-links">{/* Scholar, GitHub, CV, Email */}</div>
      </div>
      <aside className="academic-home-facts">{/* Focus and incoming-study facts */}</aside>
    </section>

    <section id="education" className="academic-home-section">
      <SectionHeading title={copy.educationTitle} description={copy.educationDescription} />
      <div className="academic-card-stack">{/* educationData cards */}</div>
    </section>

    <section id="research" className="academic-home-section">
      <SectionHeading title={copy.researchTitle} description={copy.researchDescription} />
      <div className="academic-card-stack">{/* papersData cards */}</div>
    </section>

    <section id="experience" className="academic-home-section">
      <SectionHeading title={copy.experienceTitle} description={copy.experienceDescription} />
      <div className="academic-card-stack">{/* internshipData cards */}</div>
    </section>

    <section id="insights" className="academic-home-section">
      <SectionHeading title={copy.insightsTitle} description={copy.insightsDescription} />
      {/* one latest published post card, or localized fallback, plus archive link */}
    </section>
  </div>
</main>
```

Use these exact card mappings:

```tsx
<AcademicRecordCard
  category={copy.educationLabel}
  meta={item.time}
  title={item.title}
  description={item.description}
  details={[item.meta]}
/>

<AcademicRecordCard
  category={paper.venue}
  meta={paper.authorship}
  title={paper.title}
  description={paper.description}
  href={paper.paperUrl}
  linkLabel={common.paper}
  external
  emphasis="research"
/>

<AcademicRecordCard
  category={item.title.split(" · ")[0]}
  meta={item.time}
  title={item.title.split(" · ")[1] ?? item.title}
  description={item.description}
  details={[item.meta]}
/>
```

Add an `authorship` field to every localized paper record (`First author` / `Second author`, `第一作者` / `第二作者`) so the mapping is typed and does not parse prose.

- [ ] **Step 4: Run the homepage test and TypeScript**

Run:

```bash
rtk npm run test:run -- src/components/pages/__tests__/HomePageView.test.tsx
rtk npx tsc --noEmit
```

Expected: 2 tests PASS and TypeScript exits 0.

- [ ] **Step 5: Commit the homepage structure**

```bash
rtk git add src/components/pages/HomePageView.tsx src/components/pages/__tests__/HomePageView.test.tsx
rtk git commit -m "feat: restructure academic homepage content"
```

---

### Task 4: Homepage Visual System

**Files:**
- Create: `src/app/__tests__/homepageStyles.test.ts`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: class names emitted by Tasks 2 and 3.
- Produces: approved desktop card geometry, responsive stacking, progress, reveal, hover/focus, and reduced motion.

- [ ] **Step 1: Write the failing CSS contract test**

Create `src/app/__tests__/homepageStyles.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("src/app/globals.css", "utf8");

describe("balanced academic homepage styles", () => {
  it("defines balanced cards without removed decorations", () => {
    expect(css).toMatch(/\.academic-card\s*\{[^}]*min-height:\s*clamp\(9\.5rem,/s);
    expect(css).toMatch(/\.academic-card\s*\{[^}]*border-radius:\s*0\.75rem/s);
    expect(css).toMatch(/\.academic-card\s*\{[^}]*grid-template-columns:\s*minmax\(10rem,\s*11\.25rem\)\s+minmax\(0,\s*1fr\)/s);
    expect(css).not.toMatch(/\.academic-card::before/);
    expect(css).not.toMatch(/\.academic-card-arrow/);
  });

  it("uses surface-only interaction and one-column mobile cards", () => {
    expect(css).toMatch(/\.academic-card:hover[^{]*\{[^}]*translateY\(-0\.25rem\)/s);
    expect(css).toMatch(/@media\s*\(max-width:\s*767px\)[\s\S]*\.academic-card\s*\{[^}]*grid-template-columns:\s*1fr/s);
  });

  it("defines reading progress and reduced motion", () => {
    expect(css).toMatch(/\.home-reading-progress\s*\{/);
    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  });
});
```

- [ ] **Step 2: Run the style test and verify missing classes**

Run:

```bash
rtk npm run test:run -- src/app/__tests__/homepageStyles.test.ts
```

Expected: FAIL because the approved classes do not exist.

- [ ] **Step 3: Replace obsolete homepage CSS**

In `src/app/globals.css`, remove the obsolete `.home-layout`, `.home-profile`, `.home-section-nav`, `.home-evidence-*`, old campaign hero, and background-grid rules. Add the approved system using these exact contracts:

```css
.academic-home { min-height: 100vh; overflow: hidden; background: #080a0e; color: #eef2f7; }
.academic-home-container { width: min(64rem, calc(100vw - 2rem)); margin: 0 auto; padding: clamp(7.5rem, 12vw, 10rem) 0 clamp(5rem, 9vw, 8rem); }
.academic-home-hero { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(13rem, 0.65fr); gap: clamp(3rem, 7vw, 5rem); align-items: end; }
.academic-home-hero h1 { margin: 0.85rem 0 0.9rem; font-family: var(--home-font-display); font-size: clamp(4rem, 8vw, 6.4rem); line-height: 0.94; letter-spacing: -0.045em; }
.academic-home-intro { max-width: 44rem; color: #a8b1bd; font-size: clamp(1rem, 1.8vw, 1.12rem); line-height: 1.75; }
.academic-home-section { margin-top: clamp(4.5rem, 9vw, 6.5rem); scroll-margin-top: 5rem; }
.academic-home-section-heading { display: grid; grid-template-columns: minmax(10rem, 11rem) minmax(0, 1fr); gap: 2rem; align-items: baseline; margin: 0 0 1.35rem; }
.academic-card-stack { display: grid; gap: 1.0625rem; }
.academic-card { display: grid; grid-template-columns: minmax(10rem, 11.25rem) minmax(0, 1fr); gap: clamp(1.5rem, 4vw, 2rem); min-height: clamp(9.5rem, 15vw, 10.75rem); padding: clamp(1.75rem, 4vw, 2rem); background: radial-gradient(85% 120% at 95% 0%, rgba(121,145,174,0.065), transparent 46%), #11141a; border: 1px solid rgba(205,217,232,0.11); border-radius: 0.75rem; box-shadow: 0 10px 35px rgba(0,0,0,0.12); transition: transform 420ms cubic-bezier(.22,1,.36,1), border-color 300ms ease, background-color 300ms ease, box-shadow 420ms cubic-bezier(.22,1,.36,1); }
.academic-card--research { min-height: clamp(10.25rem, 17vw, 11.25rem); }
.academic-card:hover, .academic-card:focus-within { transform: translateY(-0.25rem); border-color: rgba(205,217,232,0.21); background-color: #13171e; box-shadow: 0 22px 48px rgba(0,0,0,0.24); }
.home-reading-progress { position: fixed; inset: 3.2rem 0 auto; z-index: 110; height: 2px; background: rgba(21,25,34,0.9); }
.home-reading-progress span { display: block; width: 100%; height: 100%; transform-origin: left; background: linear-gradient(90deg,#e1e8f2,#8da0b9); transition: transform 100ms linear; }
```

Add typography/detail rules for every Task 2 and 3 class. At `max-width: 767px`, use one-column hero, section heading, and cards; reduce card padding to `1.5rem`. Preserve current CJK font variables and apply them to Chinese `h1`, `h2`, and research-card titles. Keep the existing global reduced-motion block and explicitly set `.academic-card { transform: none !important; }` inside it.

- [ ] **Step 4: Run focused style and page tests**

Run:

```bash
rtk npm run test:run -- src/app/__tests__/homepageStyles.test.ts src/components/pages/__tests__/HomePageView.test.tsx
rtk npx tsc --noEmit
```

Expected: 5 tests PASS and TypeScript exits 0.

- [ ] **Step 5: Commit the visual system**

```bash
rtk git add src/app/globals.css src/app/__tests__/homepageStyles.test.ts
rtk git commit -m "feat: style balanced academic homepage cards"
```

---

### Task 5: Documentation, Verification, And GitHub Integration

**Files:**
- Modify: `docs/superpowers/specs/2026-06-19-aligned-home-insights-shell-design.md`
- Modify: `docs/superpowers/plans/2026-06-19-aligned-home-insights-shell.md`
- Review only: `README.md`

**Interfaces:**
- Consumes: completed homepage implementation.
- Produces: synchronized documentation, verified build, pushed feature branch, and merged `master`.

- [ ] **Step 1: Add supersession notes**

Add near the top of both 2026-06-19 aligned-homepage documents:

```md
> **Homepage supersession (2026-06-21):** The homepage portion of this document was replaced by `2026-06-21-balanced-card-homepage-design.md`. The Insights index and article ideas remain separate future work; do not reintroduce the wide aligned-chapter rail on the homepage.
```

- [ ] **Step 2: Review README scope**

Confirm that routes, install commands, build commands, and content-authoring contracts did not change. Do not edit `README.md` if they remain accurate.

- [ ] **Step 3: Run complete automated verification**

Run:

```bash
rtk npm run test:run
rtk npx tsc --noEmit
rtk git diff --check
rtk npm run build
```

Expected: all tests PASS, TypeScript exits 0, diff check prints no errors, and static export completes.

- [ ] **Step 4: Run browser verification**

Serve `out/` on port 4173 and inspect `/`, `/zh/`, and `/insights/` at 1512x900, 1280x720, 768x1024, and 390x844. Confirm section order, card density, no removed decorations, no overflow, working links, scroll progress, hover/focus, reduced motion, and no console errors.

- [ ] **Step 5: Commit documentation and closeout fixes**

```bash
rtk git add docs/superpowers/specs/2026-06-19-aligned-home-insights-shell-design.md docs/superpowers/plans/2026-06-19-aligned-home-insights-shell.md
rtk git commit -m "docs: supersede aligned homepage rail"
```

- [ ] **Step 6: Synchronize with GitHub and resolve conflicts**

```bash
rtk git fetch origin
rtk git rebase origin/master
```

If rebase conflicts occur, preserve the balanced-card homepage behavior and integrate non-conflicting remote changes. Re-run the complete automated verification after resolving conflicts and continuing the rebase.

- [ ] **Step 7: Push the feature branch**

```bash
rtk git push -u origin codex/balanced-card-homepage
```

- [ ] **Step 8: Merge back and push master**

```bash
rtk git switch master
rtk git merge --no-ff codex/balanced-card-homepage -m "merge: balanced card homepage"
rtk git push origin master
```

Expected: the merge succeeds without discarding remote work, and `origin/master` contains the verified homepage implementation.
