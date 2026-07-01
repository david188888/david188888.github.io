# Homepage Desktop Spacing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebalance the desktop homepage by lengthening the fixed section rail and reallocating excess right-side whitespace to the main content without crowding the left side.

**Architecture:** Keep the existing React structure and rail measurement algorithm unchanged. Add desktop-only CSS overrides inside the existing `min-width: 1320px` media query so the base `64rem` centered layout remains the fallback for narrower viewports. Lock the intended relationships with a focused style-contract test, then verify geometry and rendering in both locales at representative desktop widths.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS 3, authored CSS, Vitest

## Global Constraints

- Derive spacing from hierarchy, grouping, readable line length, and responsive safety; do not treat any pixel value as universally optimal.
- Preserve all visible copy, navigation labels, card content, typography, colors, motion timing, and subpage layouts.
- Preserve the rail's measured section stops, active-pill behavior, and reduced-motion behavior.
- Keep card internal columns and padding unchanged; this change addresses page-level whitespace only.
- Apply the asymmetric layout only at `min-width: 1320px`; preserve the current centered layout and hidden rail below that breakpoint.
- Do not add dependencies or modify React components.

---

## File map

- Modify `src/app/globals.css`: define the desktop-only rail, container, and hero geometry.
- Modify `src/app/__tests__/homepageStyles.test.ts`: lock the approved desktop relationships and preserve the centered fallback.
- Reference `docs/superpowers/specs/2026-07-01-homepage-desktop-spacing-design.md`: source of approved intent and verification requirements; no further edit expected.

### Task 1: Lock and implement the desktop spacing relationships

**Files:**
- Modify: `src/app/__tests__/homepageStyles.test.ts:6-51`
- Modify: `src/app/globals.css:783-915`

**Interfaces:**
- Consumes: existing `.home-section-rail`, `.academic-home-container`, `.academic-home-hero`, and the existing `@media (min-width: 1320px)` breakpoint.
- Produces: a desktop-only CSS contract with a `clamp(18rem, 48vh, 24rem)` rail, a `70rem` rightward-expanding content surface, and a `4rem` hero-gap ceiling.

- [ ] **Step 1: Add a failing desktop spacing contract test**

Add this test inside `describe("balanced academic homepage styles", ...)` in `src/app/__tests__/homepageStyles.test.ts`:

```ts
  it("redistributes desktop whitespace without changing the centered fallback", () => {
    const desktopHomepageStyles =
      css.match(/@media \(min-width: 1320px\) \{([\s\S]*?)\n  \}/)?.[1] ?? "";

    expect(css).toMatch(
      /\.academic-home-container\s*\{[\s\S]*?width:\s*min\(64rem,\s*calc\(100vw - 2rem\)\)[\s\S]*?margin:\s*0 auto/
    );
    expect(desktopHomepageStyles).toContain(
      "--home-rail-height: clamp(18rem, 48vh, 24rem)"
    );
    expect(desktopHomepageStyles).toContain(
      "left: max(1.15rem, calc((100vw - 64rem) / 2 - 10rem))"
    );
    expect(desktopHomepageStyles).toContain(
      "width: min(70rem, calc(100vw - 12.5rem))"
    );
    expect(desktopHomepageStyles).toContain(
      "margin-left: max(11rem, calc((100vw - 64rem) / 2))"
    );
    expect(desktopHomepageStyles).toContain("gap: clamp(3rem, 5vw, 4rem)");
  });
```

- [ ] **Step 2: Run the focused test and verify the new contract fails**

Run:

```bash
rtk pnpm test:run -- src/app/__tests__/homepageStyles.test.ts
```

Expected: FAIL in `redistributes desktop whitespace without changing the centered fallback` because the desktop media query still contains the old rail geometry and does not contain the new container or hero overrides.

- [ ] **Step 3: Implement the minimal desktop-only CSS overrides**

Replace the existing `@media (min-width: 1320px)` block in `src/app/globals.css` with:

```css
  @media (min-width: 1320px) {
    .home-section-rail {
      --home-rail-height: clamp(18rem, 48vh, 24rem);
      left: max(1.15rem, calc((100vw - 64rem) / 2 - 10rem));
      display: block;
    }

    .academic-home-container {
      width: min(70rem, calc(100vw - 12.5rem));
      margin-left: max(11rem, calc((100vw - 64rem) / 2));
      margin-right: auto;
    }

    .academic-home-hero {
      gap: clamp(3rem, 5vw, 4rem);
    }
  }
```

Do not change the base `.home-section-rail`, `.academic-home-container`, or `.academic-home-hero` declarations. They remain the responsive fallback below `1320px`.

At the breakpoint, the formulas produce these intended boundaries:

```text
viewport:           1320px
content left:        176px
content width:      1120px
right safety edge:    24px
rail track left:    18.4px
track/content gap: 157.6px
```

At widths above approximately `1376px`, the content returns to the original `64rem`-centered left edge and gains its additional `6rem` only on the right.

- [ ] **Step 4: Run the focused style-contract test**

Run:

```bash
rtk pnpm test:run -- src/app/__tests__/homepageStyles.test.ts
```

Expected: PASS for all tests in `homepageStyles.test.ts`.

- [ ] **Step 5: Run the rail behavior tests**

Run:

```bash
rtk pnpm test:run -- src/components/home/__tests__/HomeSectionRail.test.ts src/app/__tests__/homepageStyles.test.ts
```

Expected: PASS. The section-stop and active-pill calculations remain unchanged because only the measured track height changes.

- [ ] **Step 6: Review the source diff for scope containment**

Run:

```bash
rtk git diff -- src/app/globals.css src/app/__tests__/homepageStyles.test.ts
rtk git diff --check
```

Expected: only the desktop media query and the focused style-contract test changed; `git diff --check` produces no output.

- [ ] **Step 7: Commit the tested implementation**

```bash
rtk git add src/app/globals.css src/app/__tests__/homepageStyles.test.ts
rtk git commit -m "style: rebalance homepage desktop spacing"
```

Expected: one commit containing only the CSS and its regression test.

### Task 2: Verify responsive geometry, both locales, and production build

**Files:**
- Verify: `src/app/globals.css`
- Verify: `src/components/pages/HomePageView.tsx`
- Verify: `src/components/home/HomeSectionRail.tsx`
- Verify: `docs/superpowers/specs/2026-07-01-homepage-desktop-spacing-design.md`

**Interfaces:**
- Consumes: the desktop CSS contract produced by Task 1.
- Produces: evidence that the approved layout works across target widths and locales without overflow, overlap, copy changes, or motion regressions.

- [ ] **Step 1: Run the complete automated test suite**

Run:

```bash
rtk pnpm test:run
```

Expected: all Vitest test files and tests pass with zero failures.

- [ ] **Step 2: Build the static production site**

Run:

```bash
rtk pnpm build
```

Expected: Next.js static generation and `next-sitemap` complete successfully with no type, rendering, or route errors.

- [ ] **Step 3: Start the local site for visual verification**

Run:

```bash
rtk pnpm dev
```

Expected: the Next.js development server reports a local URL and remains running for browser checks.

- [ ] **Step 4: Verify English and Chinese desktop layouts in the browser**

Use the in-app browser and its viewport control to inspect `/` and `/zh/` at `1320x900`, `1440x900`, `1536x960`, and `1920x1080`.

At each width, verify all of the following:

```text
- No horizontal scrollbar or clipped content.
- The rail labels do not overlap the main content.
- The rail remains vertically centered and all five labels are readable.
- The active pill travels along the full longer track while scrolling.
- The main content left edge is stable above the safety-boundary range.
- Cards and section headings extend farther right than before.
- The hero facts remain grouped with the introduction and do not collide with it.
- English and Chinese visible copy is unchanged.
- Paragraph line lengths remain readable rather than stretching across the full card width.
```

Expected: all checks pass at all four viewport widths in both locales.

- [ ] **Step 5: Verify the pre-desktop fallback**

Inspect `/` at `1319x900`.

Expected:

```text
- The rail is hidden.
- The container remains centered at a maximum width of 64rem.
- The hero uses the existing fallback gap.
- No horizontal overflow is present.
```

- [ ] **Step 6: Verify reduced-motion behavior**

Enable `prefers-reduced-motion: reduce` in the browser at one desktop width and reload `/`.

Expected: the rail pill remains hidden as before, reveal/tilt animations remain disabled, and the new geometry remains intact.

- [ ] **Step 7: Perform the final repository checks**

Run:

```bash
rtk git diff --check
rtk git status --short
```

Expected: `git diff --check` produces no output. The implementation files are clean after the Task 1 commit; only pre-existing unrelated untracked paths may remain.

- [ ] **Step 8: Confirm durable documentation remains aligned**

Compare the final implementation against `docs/superpowers/specs/2026-07-01-homepage-desktop-spacing-design.md`.

Expected: no README or CONTRIBUTING update is required because this change does not alter setup, content maintenance, routes, or contributor workflow. If implementation values differ from the approved spec after browser tuning, update the design document with the final values and commit that correction separately before completion.
