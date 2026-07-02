## ADDED Requirements

### Requirement: Desktop rail provides readable spatial separation
At viewport widths of `1320px` and above, the homepage SHALL display the section rail with a height of `clamp(20rem, 56vh, 28rem)`, SHALL keep the rail at least `2rem` from the viewport edge when the computed content-relative position would be smaller, and SHALL position it so its labels do not overlap the main content.

#### Scenario: Rail at the desktop activation boundary
- **WHEN** the English or Chinese homepage is rendered at `1320px` viewport width
- **THEN** all five rail labels are readable, the rail is vertically centered, the track has at least a `2rem` left inset, and no label overlaps the main content

#### Scenario: Rail represents document progress
- **WHEN** the user scrolls through homepage sections on a desktop viewport
- **THEN** rail stops remain proportional to reachable section positions and the active pill travels along the longer rendered track

#### Scenario: Final section is reachable at document bottom
- **WHEN** the user reaches the maximum scroll position and the final section's theoretical trigger point is below that position
- **THEN** the final section becomes active and the pill reaches the end of the track

### Requirement: Desktop content consumes recovered right-side whitespace
At viewport widths of `1320px` and above, the homepage SHALL allow the main content surface to grow to `70rem`, SHALL preserve the existing `64rem`-centered left reference when viewport space permits, and SHALL allocate the added width primarily toward the right.

#### Scenario: Wide desktop preserves the established left edge
- **WHEN** the homepage is rendered at `1440px`, `1536px`, or `1920px` viewport width
- **THEN** the main content begins at the left edge defined by the centered `64rem` reference and extends farther toward the right than the current layout

#### Scenario: Lower desktop boundary preserves safety edges
- **WHEN** the homepage is rendered at `1320px` viewport width
- **THEN** the main content keeps at least an `11rem` left inset, at least a `1.5rem` right safety edge, and introduces no horizontal overflow

### Requirement: Hero columns remain perceptually grouped
At viewport widths of `1320px` and above, the homepage hero SHALL use `clamp(3rem, 5vw, 4rem)` spacing between the introduction and research-facts columns.

#### Scenario: Hero at representative desktop widths
- **WHEN** the homepage is rendered at any target desktop verification width
- **THEN** the facts column remains visually associated with the introduction without colliding with the name, introduction, or links

### Requirement: Narrower viewport behavior remains unchanged
Below `1320px`, the homepage SHALL retain the existing centered container, hidden section rail, and existing responsive card and hero behavior.

#### Scenario: Viewport immediately below the desktop breakpoint
- **WHEN** the homepage is rendered at `1319px` viewport width
- **THEN** the rail is hidden, the container remains centered with a maximum width of `64rem`, and no desktop-only spacing override is applied

#### Scenario: Mobile layout remains intact
- **WHEN** the homepage is rendered at the existing mobile breakpoint
- **THEN** cards and the hero retain their current single-column layouts and the masthead retains its current mobile behavior

### Requirement: Content and accessibility invariants are preserved
The spacing change SHALL preserve visible copy, card-internal spacing, readable prose line lengths, English and Chinese layouts, and reduced-motion behavior.

#### Scenario: Locale comparison
- **WHEN** `/` and `/zh/` are rendered at the same desktop viewport width
- **THEN** each locale preserves its established copy and neither layout clips or overlaps content

#### Scenario: Reduced motion
- **WHEN** the homepage is rendered with `prefers-reduced-motion: reduce`
- **THEN** the existing animation suppression remains effective and the desktop geometry remains unchanged
