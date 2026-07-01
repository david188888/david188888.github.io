## Context

The homepage currently uses a centered `64rem` content container. At `1320px` and wider, a fixed section rail appears to the left with `clamp(14.5rem, 38vh, 20rem)` height and a track positioned `8.25rem` outside the centered container reference. This produces two related effects: the rail labels approach the main content too closely, while the content stops early enough to leave excessive unused space on the right.

The design starts from four first-principles constraints:

1. Whitespace must communicate hierarchy, grouping, or reading flow rather than exist as an arbitrary margin.
2. The main content must remain dominant; the rail is a locator, not a competing content column.
3. Wider cards must not create excessively long prose lines or change their internal information hierarchy.
4. The layout must remain safe at the existing desktop breakpoint and preserve the established tablet/mobile fallback.

## Goals / Non-Goals

**Goals:**

- Redistribute desktop whitespace from the page's right edge into the main content surface.
- Increase practical separation between rail labels and the main content.
- Improve rail scanability by giving five section stops more vertical travel.
- Keep hero introduction and research facts perceptually grouped.
- Preserve stable behavior in English, Chinese, reduced-motion mode, and viewports below `1320px`.

**Non-Goals:**

- Redesign card internals, typography, colors, motion timing, navigation labels, or visible copy.
- Change React component structure or the rail's measured section-stop algorithm.
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
--home-rail-height: clamp(18rem, 48vh, 24rem);
left: max(1.15rem, calc((100vw - 64rem) / 2 - 10rem));
```

The longer track improves scanning and section differentiation while preserving the existing label typography. The `10rem` reference offset creates practical space after the widest label. The viewport-edge clamp preserves a minimum left safety inset.

Equal visual spacing between labels will not be introduced. Label stops remain proportional to measured section positions because the rail represents document progress rather than a generic menu list.

### Tighten only the hero's page-level grouping gap

The desktop hero gap will become `clamp(3rem, 5vw, 4rem)`. This reduces the current `5rem` ceiling while retaining a generous minimum. Card metadata/body columns and card padding remain unchanged because the confirmed concern is page-level whitespace.

### Verify behavior without mandating test-first sequencing

The implementation will update the existing style-contract coverage after or alongside the CSS change. Tests serve as regression evidence for the approved relationships; OpenSpec does not require a red-green TDD sequence for this change.

Browser verification will cover `/` and `/zh/` at `1320px`, `1440px`, `1536px`, and `1920px`, plus `1319px` for the fallback boundary.

## Risks / Trade-offs

- **Risk: the `1320px` boundary becomes too dense** → Keep a minimum `11rem` left inset and `1.5rem` right safety edge; verify no horizontal overflow at exactly `1320px`.
- **Risk: wider cards create long lines** → Preserve the existing copy `max-width` constraints and inspect both locales.
- **Risk: longer rail changes pill behavior** → Preserve the JavaScript calculations and verify full-track travel while scrolling.
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

None. The user approved the refined asymmetric layout direction and clarified that the target is page-level right-side whitespace rather than card-internal spacing.
