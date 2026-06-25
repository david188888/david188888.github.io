# Homepage Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the approved A + B + light D homepage motion direction.

**Architecture:** Use CSS transition snippets adapted from `transitions-dev` and small React hooks for scroll/geometry state. The hero reveal and reduced-motion handling are CSS-only; card tilt and nav indicator need compact client-side measurement.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind/global CSS, Vitest.

## Global Constraints

- No new animation dependency.
- Respect `prefers-reduced-motion`.
- Keep the existing dark academic homepage design.
- Do not change homepage copy or data.

---

### Task 1: Motion Tests

**Files:**
- Modify: `src/app/__tests__/homepageStyles.test.ts`

**Interfaces:**
- Consumes: `src/app/globals.css`
- Produces: regression coverage for motion tokens, stagger reveal, tilt hooks, nav indicator, and reduced motion.

- [ ] Add tests that assert the global stylesheet contains the approved motion hooks.
- [ ] Run `pnpm test:run src/app/__tests__/homepageStyles.test.ts` and verify the new tests fail before production changes.

### Task 2: Homepage Motion Implementation

**Files:**
- Modify: `src/components/pages/HomePageView.tsx`
- Modify: `src/components/home/AcademicRecordCard.tsx`
- Modify: `src/components/navigation/HomeNav.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: existing homepage sections and `homeNavigation`.
- Produces: hero stagger reveal, card tilt/glare, active nav indicator.

- [ ] Add hero stagger line classes to the existing role/name/intro/link surfaces.
- [ ] Wrap cards in `.home-card-tilt` and add `.home-card-tilt-glare`.
- [ ] Track pointer position on card wrappers and write `--tilt-rx`, `--tilt-ry`, `--tilt-gx`, `--tilt-gy`.
- [ ] Track active homepage section in `HomeNav` and update a sliding indicator.
- [ ] Add CSS motion tokens, transition selectors, and reduced-motion fallbacks.

### Task 3: Verification

**Files:**
- Verify: `src/app/__tests__/homepageStyles.test.ts`
- Verify: rendered homepage in browser.

**Interfaces:**
- Consumes: implemented homepage motion.
- Produces: test/build/browser confidence.

- [ ] Run focused Vitest coverage.
- [ ] Run the production build.
- [ ] Start the local dev server and inspect the homepage at desktop and mobile widths.
- [ ] Check whether durable docs require sync.
