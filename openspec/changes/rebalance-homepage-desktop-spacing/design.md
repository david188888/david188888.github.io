## Context

The homepage currently uses a centered `64rem` content container. At `1320px` and wider, a fixed section rail appears to the left with `clamp(14.5rem, 38vh, 20rem)` height and a track positioned `8.25rem` outside the centered container reference. This produces two related effects: the rail labels approach the main content too closely, while the content stops early enough to leave excessive unused space on the right.

The design starts from four first-principles constraints:

1. Whitespace must communicate hierarchy, grouping, or reading flow rather than exist as an arbitrary margin.
2. The main content must remain dominant; the rail is a locator, not a competing content column.
3. Wider cards must not create excessively long prose lines or change their internal information hierarchy.
4. The layout must remain safe at the existing desktop breakpoint and preserve the established tablet/mobile fallback.
5. A progress indicator must represent positions the user can actually reach, not theoretical section offsets beyond the document's maximum scroll position.

## Goals / Non-Goals

**Goals:**

- Redistribute desktop whitespace from the page's right edge into the main content surface.
- Increase practical separation between rail labels and the main content.
- Give the rail a deliberate viewport-edge breathing zone instead of pinning it near the screen edge.
- Improve rail scanability by giving five section stops more vertical travel.
- Ensure the final section activates and the pill reaches the track end when the document reaches its maximum scroll position.
- Keep hero introduction and research facts perceptually grouped.
- Preserve stable behavior in English, Chinese, reduced-motion mode, and viewports below `1320px`.

**Non-Goals:**

- Redesign card internals, typography, colors, motion timing, navigation labels, or visible copy.
- Change React component structure, event listeners, navigation markup, or animation timing.
- Change subpage layouts, routes, content models, or deployment behavior.
- Introduce a universal spacing scale beyond the relationships required for this layout correction.

## Decisions

### Use a desktop-only CSS override

The change will extend the existing `@media (min-width: 1320px)` block. Base declarations remain unchanged, so the current centered `64rem` layout remains the fallback below the breakpoint.

This is preferred over changing component structure because the problem is geometric, not semantic or behavioral. It also keeps `HomeSectionRail` measurement logic unchanged: the active pill already derives its travel from the rendered track height.

### Expand asymmetrically toward the right

At the desktop breakpoint, the main container will use:

```css
width: min(70rem, calc(100vw - 12.5rem));
margin-left: max(11rem, calc((100vw - 64rem) / 2));
margin-right: auto;
```

The `64rem` reference preserves the existing content left edge once the viewport has enough room. The `11rem` minimum left inset protects the rail at the lower boundary, while the `12.5rem` subtraction leaves a `1.5rem` right safety edge at `1320px`. The additional `6rem` therefore enters primarily on the right rather than being split symmetrically.

Symmetrically recentering a `70rem` container was rejected because it would move the content left and worsen the original crowding. Shifting the existing `64rem` container right was rejected because it would improve margins without using recovered space to widen cards and section headings.

### Increase rail separation and height without increasing visual weight

At desktop widths, the rail will use:

```css
--home-rail-height: clamp(20rem, 56vh, 28rem);
left: max(2rem, calc((100vw - 64rem) / 2 - 10rem));
```

The longer track increases vertical travel by roughly 17% at common desktop heights, improving scanning and section differentiation while preserving the existing label typography. The `10rem` reference offset creates practical space after the widest label. The `2rem` viewport-edge clamp moves the complete rail group right at constrained desktop widths, creating a deliberate breathing zone instead of leaving the track visually pinned to the screen edge.

Equal visual spacing between labels will not be introduced. Label stops remain proportional to measured section positions because the rail represents document progress rather than a generic menu list.

### Normalize section stops to the reachable scroll domain

The page can only produce scroll positions in `[0, maxScrollY]`, where `maxScrollY = scrollHeight - innerHeight`. A section whose theoretical trigger point exceeds `maxScrollY` can never become active. Before normalizing stops to rail positions, `buildSectionStops` will clamp every measured start to this reachable domain:

```ts
buildSectionStops(measurements, maxScrollY)
```

The runtime will pass the current document maximum; the helper keeps an unbounded default for isolated callers. At the bottom of the page, the final stop therefore has `start === maxScrollY`, becomes active, and maps to rail position `1`. This is preferred over adding a special “if bottom” branch because one consistent coordinate system governs item positions, active state, and pill travel.

### Tighten only the hero's page-level grouping gap

The desktop hero gap will become `clamp(3rem, 5vw, 4rem)`. This reduces the current `5rem` ceiling while retaining a generous minimum. Card metadata/body columns and card padding remain unchanged because the confirmed concern is page-level whitespace.

### Verify behavior without mandating test-first sequencing

The implementation will update the existing style-contract coverage after or alongside the CSS change. Tests serve as regression evidence for the approved relationships; OpenSpec does not require a red-green TDD sequence for this change.

Browser verification will cover `/` and `/zh/` at `1320px`, `1440px`, `1536px`, and `1920px`, plus `1319px` for the fallback boundary.

## Risks / Trade-offs

- **Risk: the `1320px` boundary becomes too dense** → Keep a minimum `2rem` rail inset, `11rem` content inset, and `1.5rem` right safety edge; verify no overlap or horizontal overflow at exactly `1320px`.
- **Risk: wider cards create long lines** → Preserve the existing copy `max-width` constraints and inspect both locales.
- **Risk: clamping creates duplicate late stops on unusually short documents** → Keep stable source ordering and verify the current homepage produces one distinct final stop at `maxScrollY`.
- **Risk: asymmetric alignment feels unintended at intermediate widths** → Check the transition at `1319px`, `1320px`, and `1376px`, where the original left reference becomes naturally available.
- **Trade-off: the desktop breakpoint has a deliberate layout transition** → Accept the transition because the rail itself appears at that breakpoint and requires a different spatial composition.

## Migration Plan

1. Add the desktop-only CSS overrides.
2. Update focused style-contract coverage for the final relationships.
3. Run the automated suite and static production build.
4. Verify target viewports, both locales, scrolling rail behavior, and reduced motion.
5. Push through the existing `master` deployment workflow after approval.

Rollback requires reverting the CSS/test implementation commit; no data, schema, route, or dependency migration is involved.

## Open Questions

None. The user approved the refined asymmetric layout direction, clarified that the target is page-level whitespace rather than card-internal spacing, and selected moving the complete rail group right when the first implementation still felt crowded at the viewport edge.
