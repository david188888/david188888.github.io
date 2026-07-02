## 1. Desktop Layout Implementation

- [x] 1.1 Extend the existing `min-width: 1320px` block in `src/app/globals.css` with the approved rail height and horizontal anchor while preserving the base rail declarations.
- [x] 1.2 Add the approved asymmetric `70rem` container width and left-reference formulas inside the desktop block while preserving the centered `64rem` fallback.
- [x] 1.3 Add the desktop-only `clamp(3rem, 5vw, 4rem)` hero gap without changing card-internal spacing or React components.
- [x] 1.4 Review the implementation diff to confirm no visible copy, typography, colors, motion timing, routes, or subpage styles changed.

## 2. Regression Coverage

- [x] 2.1 Update `src/app/__tests__/homepageStyles.test.ts` to assert the final desktop rail, container, and hero relationships.
- [x] 2.2 Preserve assertions for the centered `64rem` fallback, hidden rail below `1320px`, single-column mobile cards, and reduced-motion hooks.
- [x] 2.3 Run the focused homepage style and rail behavior tests and resolve any contract mismatch against the approved spec.
- [x] 2.4 Clamp measured section starts to the reachable document scroll range before building rail stops.
- [x] 2.5 Add rail behavior coverage proving the final section activates and progress reaches `1` at `maxScrollY`.

## 3. Automated Verification

- [x] 3.1 Run the complete Vitest suite and confirm zero failures.
- [x] 3.2 Run the static production build and confirm all English and Chinese routes generate successfully.
- [x] 3.3 Run `git diff --check` and confirm the final source diff contains only scoped implementation and regression changes.

## 4. Browser Verification

- [x] 4.1 Verify `/` and `/zh/` at `1320px`, `1440px`, `1536px`, and `1920px` widths for rail/content separation, balanced right-side whitespace, readable line lengths, and no overflow.
- [x] 4.2 Verify the `1319px` fallback keeps the rail hidden and the `64rem` container centered.
- [x] 4.3 Scroll through all homepage sections and confirm proportional rail stops and full active-pill travel on the longer track.
- [x] 4.4 Verify `prefers-reduced-motion: reduce` preserves existing animation suppression and the new desktop geometry.

## 5. Delivery

- [x] 5.1 Commit the scoped CSS and regression coverage after verification succeeds.
- [x] 5.2 Push the verified `master` branch and confirm the GitHub Pages workflow succeeds before declaring the live layout updated.
