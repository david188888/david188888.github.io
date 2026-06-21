# Homepage Regression Repair Design

## Goal

Repair the production homepage regressions found after the latest visual refresh while preserving its current dark editorial design and static GitHub Pages deployment model.

## Confirmed Problems

- Switching languages on the live site can expose a stale previous homepage when the user navigates back in Chrome.
- The desktop profile rail does not remain sticky because `.home-motion-shell` is an overflow ancestor.
- The profile rail content exceeds short desktop viewports, leaving section and social links outside the visible area.
- At 390px widths, the masthead compresses the brand, navigation, and language links until labels wrap onto multiple lines.
- The `#profile` anchor is hidden behind the fixed masthead.
- The Chinese route leaves the browser document language set to `en`.

## Constraints

- Keep `output: "export"` and GitHub Pages compatibility.
- Preserve the existing desktop composition, typography, palette, and motion language.
- Do not add a menu dependency or new runtime package.
- Keep every primary navigation destination available on mobile.
- Respect `prefers-reduced-motion`.
- The user confirmed that language switching may perform a short full-page refresh and replace the current history entry.
- Keep all profile controls visible at 1024x720 and larger desktop viewports. Below 720px viewport height, disable sticky positioning so normal document scrolling remains the fallback.

## Approaches Considered

### 1. Surgical repair with full-document locale replacement (selected)

Use a normal locale URL plus `window.location.replace()` for language changes. Change the homepage overflow rule so it no longer creates a sticky containing block, tighten vertical spacing only on short desktop viewports, and make the mobile masthead a deliberate two-row layout.

This directly addresses the observed failures, avoids stale Next client-router history, and has the smallest blast radius. The tradeoff is a brief full-page refresh during language changes.

### 2. Next router replacement with CSS-only layout fixes

Use `router.replace()` or `<Link replace>` and repair the CSS. This preserves client navigation, but it can continue to reuse App Router route data and does not fully isolate the production symptom from stale client caches.

### 3. Route-layout and mobile-navigation redesign

Reorganize the app into locale-specific root layouts and introduce a hamburger menu. This can produce fully localized static root markup and a compact mobile header, but it would move many routes, add interaction state, and create substantially more regression risk than the current task warrants.

## Selected Design

### Language Switching

- Keep the current locale-path mapping from `switchLocalePathname()`.
- Render language options as ordinary anchors so direct URLs and no-JavaScript navigation remain valid.
- For an unmodified primary-button click on an actual language change, persist `preferredLocale`, prevent client-router navigation, and call `window.location.replace(targetHref)`.
- For an unmodified primary-button click on the already-active locale, call `preventDefault()` so the current page does not reload.
- Preserve ordinary anchor behavior for Cmd, Ctrl, Shift, or Alt clicks so users can open locale URLs in a new tab or window.
- Add unit coverage for storage success, unavailable storage, active-locale clicks, modified clicks, and location replacement.

### Desktop Profile Rail

- Replace the homepage shell's two-axis `overflow: hidden` with `overflow-x: clip` and `overflow-y: visible`; do not use `overflow-x: hidden`, which can still create a scroll container through axis-value computation.
- Preserve the two-column grid at `lg` widths.
- Add a 720px-to-800px short-viewport desktop rule that reduces the profile name, summary, section-navigation, and social-link vertical gaps enough for all controls to remain visible at 1024x720 and 1280x720.
- Below 720px viewport height, disable sticky positioning and let the profile rail move with document scrolling.
- Keep the rail sticky below the fixed masthead and allow the document, not the rail, to own vertical scrolling.

### Mobile Masthead

- At widths up to 640px, use a two-row masthead: brand and language selector on the first row, primary navigation on the second.
- Keep labels on one line, reduce gaps without reducing legibility, and give links larger vertical padding for touch use.
- Increase homepage top spacing at the same breakpoint so content clears the taller masthead.
- Do not hide links or introduce a menu button.

### Anchor And Document Language

- Give `#profile` the same fixed-header scroll offset used by content sections.
- Add a small inline script in the root document head that derives the locale from `window.location.pathname` and sets `document.documentElement.lang` before page content is parsed and before React hydration.
- Retain `lang="en"` in exported markup as the no-JavaScript fallback for unprefixed routes. The Chinese acceptance criterion is the pre-hydration browser DOM, because a single static root layout cannot emit route-specific `<html>` attributes without reorganizing every route into multiple root layouts.

## Testing

- Unit-test the locale replacement helper before implementing it.
- Add contract tests for the homepage CSS and responsive classes that caused the regressions, while treating browser geometry checks as the authoritative layout verification.
- Run the complete Vitest suite and TypeScript check.
- Build a clean production static export.
- Verify the generated English and Chinese pages and run Chrome checks at 1512x900, 1280x720, 1024x720, 768x1024, and 390x844.
- At 1024x720 and 1280x720, assert that the sticky profile top remains within one pixel after scrolling 1200px and that the final social link bottom is inside the viewport.
- At 390x844, assert that brand, primary navigation, and language labels each render on one line without horizontal page overflow.
- For `/#profile`, assert that the target top is at or below the fixed masthead bottom after navigation.
- In the exported HTML, assert that the locale script is inside `<head>` and precedes the first Next client chunk. Extract and execute that script in an isolated document/location test to assert `/zh/` produces `lang="zh"` and `/` produces `lang="en"`; then confirm the same values in the loaded browser DOM.
- Re-run the production sequence: English, Chinese switch, browser back/history behavior, reduced motion, and console errors.

## Documentation

Update the existing minimal-motion implementation plan's verification section to record the regression fixes and responsive checks. No README change is required because installation, authoring, routes, and deployment commands remain unchanged.
