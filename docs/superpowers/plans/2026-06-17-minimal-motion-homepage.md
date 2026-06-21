# Minimal Motion Homepage Implementation Plan

> **Superseded layout note (2026-06-20):** The sticky profile rail and right-side evidence stream were replaced by the approved aligned chapter grid shared by the homepage, Insights index, and Insights articles. The dark palette, restrained pointer treatment, evidence rows, focus states, and reduced-motion requirements remain active.

**Goal:** Refine the homepage into a dark, restrained personal site that keeps the visitor focused on HongYu Liu, then quickly exposes research work, public notes, and background evidence.

**Accepted direction:** Use the Brittany Chiang-style two-column structure as the main layout, preserve the existing dark palette, remove decorative blobs/circles/waves, and add subtle pointer-reactive motion only around the visitor's active hover area.

**Tech stack:** Next.js 15, React 19, Tailwind CSS, CSS animations, existing static export build.

## Implementation Scope

- [x] Replace the earlier hero/card composition with a profile-and-evidence stream in `src/components/pages/HomePageView.tsx`.
- [x] Keep the left side focused on identity: name, role, short profile, section anchors, and external links.
- [x] Organize the right side into `Work`, `Notes`, and `Background` sections.
- [x] Show research papers and internships as dense rows instead of decorative cards.
- [x] Show public notes as an insight path without duplicating the research section.
- [x] Use a shorter Chinese hero line so the first viewport avoids orphaned title characters.
- [x] Move the core hero/profile typography into semantic CSS classes for easier refinement.
- [x] Add a dedicated Chinese display font stack and tune Chinese hero line-height/size.

## Motion Scope

- [x] Keep a subtle dark grid and neutral pointer glow in `src/app/globals.css`.
- [x] Remove the earlier teal/blue glow language and ornamental circular or waveform motifs.
- [x] Add local hover-reactive highlights for section nav, evidence rows, and CTA buttons.
- [x] Preserve keyboard focus states and `prefers-reduced-motion` behavior.
- [x] Harden `src/hooks/usePointerGlow.ts` for zero-size targets and non-Element event targets.

## Verification

- [x] Type check with `tsc --noEmit`.
- [x] Check whitespace with `git diff --check`.
- [x] Build the production static export with `next build`.
- [x] Inspect the production page at `http://127.0.0.1:4173/zh/`.
- [x] Inspect the `#work` evidence stream in Chrome.
- [x] Review `README.md`; no update required because setup, routing, and content authoring commands did not change.
