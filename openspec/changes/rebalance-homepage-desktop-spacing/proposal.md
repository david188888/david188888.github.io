## Why

On wide desktop viewports, the homepage section rail feels compressed against the main content while the page leaves disproportionate unused space on the right. The layout should redistribute that space so navigation, content, and page boundaries feel balanced without weakening readability or changing the established visual identity.

## What Changes

- Lengthen the desktop section rail so its five section stops are easier to scan.
- Increase the rail-to-content separation to remove the crowded left edge.
- Expand the homepage content surface primarily toward the right instead of symmetrically recentering it.
- Reduce the maximum hero column gap so the research facts remain perceptually grouped with the introduction.
- Preserve the existing centered layout below the desktop rail breakpoint, including current mobile and tablet behavior.
- Add focused regression coverage and verify both locales across representative desktop viewport widths.

## Capabilities

### New Capabilities

- `homepage-desktop-spacing`: Defines the responsive spacing and visual-balance requirements for the homepage section rail, main content surface, hero columns, and fallback layout.

### Modified Capabilities

None.

## Impact

- Affected styles: `src/app/globals.css`
- Affected regression coverage: `src/app/__tests__/homepageStyles.test.ts`
- Runtime structure and algorithms remain unchanged: `HomePageView` and `HomeSectionRail` require no component changes.
- No new dependencies, APIs, routes, content fields, visible copy, or deployment behavior.
