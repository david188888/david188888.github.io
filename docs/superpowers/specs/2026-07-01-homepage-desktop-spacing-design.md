# Homepage Desktop Spacing Design

**Date:** 2026-07-01
**Status:** Approved

## Objective

Rebalance the desktop homepage so the fixed section rail does not feel crowded against the main content and the right side does not feel excessively empty. Preserve the site's restrained editorial character, existing content hierarchy, and current tablet/mobile behavior.

## First-principles framing

Whitespace is useful only when it clarifies hierarchy, grouping, or reading flow. The current desktop composition spends too much of the available width on the right margin while the rail and content occupy a comparatively compressed area on the left. The solution is therefore to redistribute space, not remove whitespace indiscriminately.

The design is derived from four constraints:

1. The main content must remain visually dominant; the rail is a locator, not a competing column.
2. Related information should be closer than unrelated information.
3. Body copy must retain a readable line length even when cards become wider.
4. Changes must degrade safely before the rail's existing `1320px` desktop breakpoint.

Spacing should follow an 8px base rhythm where practical. This is a consistency tool rather than a claim that one absolute spacing value is universally optimal.

## Chosen approach: asymmetric rightward expansion

Keep the main content's left edge effectively stable and allocate most of the added width to the right side. This reduces excessive right-side whitespace without moving the content toward the rail.

### Desktop geometry

- Increase the homepage content maximum width from `64rem` to `70rem`.
- Preserve the current `64rem`-based left alignment rather than recentering the wider container.
- Move the rail approximately `1rem` farther from the main content, producing about one additional 8px spacing step between the rail labels and content.
- Keep a practical right-side safety margin at the `1320px` activation boundary.

The implementation should express the shared desktop measurements as CSS custom properties or an equivalently clear relationship. It should not scatter unrelated one-off offsets across selectors.

### Rail

- Increase `--home-rail-height` from `clamp(14.5rem, 38vh, 20rem)` to approximately `clamp(18rem, 48vh, 24rem)`.
- Keep the rail vertically centered.
- Preserve section stops derived from measured document positions; do not replace them with visually equal spacing.
- Preserve the active pill's proportional travel and reduced-motion behavior.

The longer rail improves scanability and gives five section labels enough vertical separation without increasing font size or visual weight.

### Hero and cards

- Reduce the hero column-gap ceiling from `5rem` to approximately `4rem` so the research facts remain perceptually connected to the introduction.
- Allow cards and section headings to consume the wider container.
- Keep card internal columns and internal padding unchanged unless browser verification reveals a concrete regression. The approved concern is page-level whitespace, not card internals.
- Continue constraining prose with existing `max-width` rules so wider cards do not create excessively long lines.

### Responsive boundaries

- Apply the asymmetric layout only where the desktop rail is displayed (`min-width: 1320px`).
- Preserve the current centered container below that breakpoint.
- Preserve current mobile card stacking, masthead behavior, and hidden rail behavior.
- Check at least `1320px`, `1440px`, `1536px`, and `1920px` viewport widths. The layout must not introduce horizontal overflow or squeeze the right-side hero facts.

## Alternatives considered

### Symmetrically widen the centered container

Rejected because half of the added width would extend toward the rail. That would reduce the rail-to-content gap and worsen the original imbalance.

### Shift the existing `64rem` container to the right

Rejected because it improves the margins but leaves cards unnecessarily narrow. It also creates a positional offset without using the recovered space to improve the main content surface.

### Compress internal card spacing

Rejected because it solves a different problem. The user confirmed that the concern is page-level right-side whitespace, not spacing between card metadata and card body content.

## Verification

Implementation is complete only when all of the following pass:

- Existing unit and style-contract tests pass.
- New or updated style-contract tests lock the desktop width, rail-height, and responsive fallback relationships without overspecifying unrelated presentation details.
- `next build` succeeds.
- `git diff --check` succeeds.
- Browser checks at the target desktop widths confirm balanced margins, readable line lengths, no overlap, and no horizontal overflow.
- English and Chinese homepages are checked because longer Chinese or English labels may expose different spacing pressure.
- Reduced-motion behavior remains unchanged.

## Scope limits

This change does not alter visible copy, navigation labels, card content, typography, colors, motion timing, or subpage layouts. Any broader visual redesign requires a separate decision.
