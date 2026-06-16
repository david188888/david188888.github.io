# Minimal Motion Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance the existing homepage with restrained, high-quality motion while preserving the current minimal structure and making Insights feel like the primary content path.

**Architecture:** Keep the current Next.js/Tailwind component structure. Add reusable CSS utility classes in `src/app/globals.css`, then attach them to existing homepage components without changing data flow or routing.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS, CSS animations, existing Vitest test suite.

---

### Task 1: Baseline Verification

**Files:**
- Read: `package.json`
- Run existing tests and build before edits.

- [ ] **Step 1: Run existing tests**

Run: `npm run test:run`

Expected: existing Vitest suite passes before UI edits.

- [ ] **Step 2: Run production build**

Run: `npm run build`

Expected: Next.js build completes before UI edits.

### Task 2: Add Minimal Motion CSS

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add homepage motion classes**

Add CSS classes for:
- `.home-motion-shell`: slow ambient background and subtle grid texture.
- `.home-hero-panel`: minimal glass panel matching current hero.
- `.home-avatar-motion`: restrained avatar halo.
- `.home-highlight-line`: breathing top rule.
- `.home-insight-list` and `.home-insight-row`: row-level hover highlight.
- `.home-support-grid`: understated support rows for Education, Internship, Research sections.

- [ ] **Step 2: Preserve accessibility**

Ensure new animations are covered by the existing `prefers-reduced-motion: reduce` rule in `src/app/globals.css`.

### Task 3: Wire Motion Into Existing Components

**Files:**
- Modify: `src/components/pages/HomePageView.tsx`
- Modify: `src/components/home/HeroSection.tsx`
- Modify: `src/components/home/TimelineCard.tsx`
- Modify: `src/components/home/PaperCard.tsx`
- Modify: `src/components/navigation/HomeNav.tsx`

- [ ] **Step 1: Update the homepage shell**

Attach `.home-motion-shell` to the existing `<main>` element, keep `FluidBackground`, `PointerGlow`, and the existing section order.

- [ ] **Step 2: Refine hero markup**

Attach `.home-hero-panel`, `.home-highlight-line`, and `.home-avatar-motion` without changing copy, links, or image behavior.

- [ ] **Step 3: Refine Insights rows**

Replace the heavy rounded list container with `.home-insight-list` and `.home-insight-row`, preserving the existing localized Insight data and links.

- [ ] **Step 4: Refine lower homepage cards**

Attach lighter row/card motion classes to timeline and paper components while keeping their content and URLs intact.

- [ ] **Step 5: Refine navigation underline**

Add a minimal animated underline to `HomeNav` links without changing navigation targets.

### Task 4: Verification and Closeout

**Files:**
- Check: `README.md`
- Check: `docs/superpowers/plans/2026-06-17-minimal-motion-homepage.md`

- [ ] **Step 1: Run tests**

Run: `npm run test:run`

Expected: all existing tests pass.

- [ ] **Step 2: Run build**

Run: `npm run build`

Expected: production build succeeds.

- [ ] **Step 3: Inspect diff**

Run: `git diff -- src/app/globals.css src/components/pages/HomePageView.tsx src/components/home/HeroSection.tsx src/components/home/TimelineCard.tsx src/components/home/PaperCard.tsx src/components/navigation/HomeNav.tsx docs/superpowers/plans/2026-06-17-minimal-motion-homepage.md`

Expected: diff is limited to planned homepage motion work and the plan file.

- [ ] **Step 4: Documentation check**

Review `README.md`. Update it only if the implementation changes documented setup, commands, routing, or content authoring.
