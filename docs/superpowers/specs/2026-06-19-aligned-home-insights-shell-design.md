# Aligned Home And Insights Shell Design

## Goal

Restructure the homepage, Insights index, and individual Insights articles around one shared editorial shell: navigation remains in the left column, page content remains in the right column, and every left-side navigation label begins on the same horizontal line as its corresponding right-side section.

The homepage must fully present the profile, research papers, internships, and education. Its Insights section must remain short: show only the latest published note, one-sentence summary, and a link to the full Insights index.

## Confirmed Requirements

- Keep the current restrained dark editorial direction.
- Keep a left-navigation/right-content composition on desktop and tablet.
- Make the left rail and right stream feel connected rather than ending at visibly different heights.
- Keep the complete profile, paper, internship, and education records on the homepage.
- Show only the latest note and an Insights entry link on the homepage.
- Make the homepage, Insights index, and individual article pages use the same shell, spacing system, background, masthead, and section structure.
- Keep English and Chinese routes, static export, keyboard navigation, and reduced-motion support.
- On mobile, prioritize readable content width over preserving a narrow visual sidebar.

## Current Problems

The homepage uses one sticky profile rail containing identity, four tightly grouped section anchors, and social links. The right side contains the hero and every evidence row. The rail therefore feels crowded near the top but visually ends long before the content stream.

The Insights index uses a separate full-width composition with `FluidBackground`, large editorial hero blocks, and its own section grid. Although its palette is related, it does not read as the same site template.

## Approaches Considered

### 1. Viewport-height sticky rail

Keep every navigation item inside one sticky desktop viewport and highlight the active section as the right column scrolls.

This keeps all navigation visible, but it does not solve the user's core concern: the left rail still has one short visual height while the right content continues for the full page.

### 2. Full-width profile with two-column content cards

Move the profile into a full-width hero and arrange papers, internships, and education in a dense two-column grid.

This produces the shortest page, but removes the requested left-navigation/right-content composition and makes long Insights entries less natural to read.

### 3. Aligned chapter grid (selected)

Render every page as a sequence of two-column chapter rows. Each row contains a linked navigation marker on the left and its complete section content on the right. A subtle vertical rail continues through the left cells, while shared horizontal rules connect chapter boundaries across both columns.

This makes both sides exactly the same document height, preserves the navigation/content distinction, and allows the same primitive to serve the homepage, Insights index, and article pages.

## Selected Design

### Shared Page Shell

Create a shared editorial shell used by `HomePageView`, `InsightsPageView`, and `InsightArticlePageView`. It owns:

- `HomeNav` and its locale-aware links;
- the restrained dark background and pointer treatment;
- the centered maximum-width page container;
- the shared left/right column ratio;
- the continuous left rail and cross-column section separators;
- responsive conversion from the chapter grid to a mobile content stream.

The shell must not own page-specific content. Homepage, Insights, and article views provide an ordered list of sections with an ID, navigation label, optional eyebrow, and content node.

### Aligned Sections

Create one reusable aligned-section primitive for each chapter row:

- The left cell is semantic navigation, using a real anchor that points to the right section ID.
- The right cell contains the section heading and content.
- The left label begins on the same horizontal baseline as the right section heading area.
- A continuous one-pixel vertical guide connects the section markers without turning the rail into a decorative timeline.
- One shared horizontal rule spans the section boundary across both columns.
- The label may stick only within the height of its own row. The next row naturally constrains and replaces it.

The active label uses a restrained color and node-state transition. Section changes must not move the grid, resize the rail, or animate the content position.

### Homepage Information Architecture

Use these chapter rows in order:

1. **Profile**: name, role, complete personal introduction, current focus, and GitHub, Scholar, CV, and email links.
2. **Research**: every configured paper with venue/status, title, contribution summary, authorship note, and paper link.
3. **Experience**: every configured internship with company, role, dates, location, and full description.
4. **Education**: every configured degree with institution, degree, dates or matriculation status, and relevant academic detail.
5. **Insights**: the latest published note's title and one-sentence summary plus one link to the full Insights index.

Do not repeat the Insights streams, queue, or archive on the homepage. If no published note exists, show the localized Insights introduction and the same index link instead of an empty card or placeholder list.

### Insights Information Architecture

Use the same shell and aligned-section primitive with Insights-specific navigation labels:

1. **Insights**: compact page introduction.
2. **Published**: complete localized post list in reverse chronological order.
3. **Streams**: the configured writing-stream descriptions.
4. **Notebook**: configured queue items only when they remain useful and are not duplicates of published posts.

The Insights page must reuse the homepage's masthead, background, typography variables, rail, separators, maximum width, and responsive behavior. It must no longer maintain a separate full-width visual template.

### Article Information Architecture

Individual Insights articles use the same shell rather than the current independent full-width template:

1. **Article**: the left cell provides a return link to the localized Insights index; the right cell contains date, title, and excerpt.
2. **Reading**: the right cell contains the article body at a narrower readable measure inside the shared content column. The left cell contains a sticky table of contents when generated heading metadata is available.

The table of contents links only to real `h2` and `h3` IDs in the rendered article. If the content pipeline does not provide reliable heading IDs, omit the table of contents and keep the return link and article label rather than introducing fragile HTML string parsing. On mobile, render an available table of contents as a compact disclosure before the article body.

### Scroll And Navigation Behavior

- Clicking a rail label scrolls to its corresponding section below the fixed masthead.
- Each label can stick beneath the masthead only while its own section row is active.
- A small active-section controller may use `IntersectionObserver` to update emphasis and `aria-current`.
- Active-state transitions change only color, opacity, and the small rail marker.
- If JavaScript or `IntersectionObserver` is unavailable, anchors and layout remain fully functional; only scroll-driven emphasis is absent.
- Respect `prefers-reduced-motion` and avoid animated scrolling when reduced motion is requested.

### Responsive Behavior

- **Desktop, 1024px and above:** use an approximately 28/72 navigation/content split.
- **Tablet, 768px to 1023px:** retain the chapter grid with an approximately 23/77 split and tighter label tracking.
- **Mobile, below 768px:** switch to one readable content column. Render a horizontally scrollable quick-jump list below the masthead and repeat each chapter label above its content.
- Do not keep a narrow mobile sidebar that compresses paper titles or prose.
- Preserve the approved two-row mobile masthead behavior from the homepage regression repair design.

### Content And Data Flow

- Keep profile and external-link data in the existing author configuration.
- Keep localized homepage records in their existing typed data structures unless moving them to a focused content module meaningfully reduces page-component size.
- Build one publication-eligible post result on top of the existing localized post loader. Exclude future-dated posts, then sort the remaining posts in reverse chronological order for the Insights list.
- Define the homepage's latest note as the first item from that same publication-eligible result. Do not maintain a second manually selected latest-note source.
- Reuse heading metadata from the content pipeline for article navigation when it is available; do not add a second source of article headings.
- Keep fallback copy in the existing i18n message structure.

### Accessibility

- Use semantic landmarks and heading order: one page `h1`, then ordered `h2` section headings.
- Keep rail links keyboard focusable with a visible focus indicator.
- Apply `aria-current="location"` only to the active in-page section link.
- Preserve sufficient contrast for inactive navigation labels; they may be quiet but must remain readable.
- Ensure anchor targets use a fixed-header scroll offset.
- Keep the mobile quick-jump list keyboard-scrollable and do not hide it behind touch-only interaction.

## Failure And Empty States

- Missing published posts: render localized Insights introduction plus the index link on the homepage.
- Missing optional metadata: omit that field without leaving an empty visual column.
- Missing article heading metadata: omit the table of contents and retain the article return link and label.
- Invalid or missing external URL: render non-linked evidence text rather than an empty anchor.
- Scroll observer failure: retain normal anchors and static rail styling.
- Long translated labels or titles: allow content wrapping in the right column; keep mobile chapter labels above content rather than shrinking type.

## Testing And Acceptance

### Automated Checks

- Add focused tests for latest-post selection, exclusion of future-dated posts, and the no-post fallback.
- Add render or contract coverage for homepage and Insights section order, IDs, and labels.
- Add article-shell coverage for the return link, readable content measure, and table-of-contents fallback.
- Add CSS contract coverage for the shared grid, sticky containment, fixed-header offsets, mobile single-column fallback, and reduced-motion behavior.
- Run the full Vitest suite, TypeScript check, production build, and `git diff --check`.

### Browser Verification

Verify English and Chinese routes at 1512x900, 1280x720, 1024x720, 768x1024, and 390x844.

- Every desktop and tablet rail label starts on the same horizontal line as its right-side chapter.
- The vertical rail remains continuous across chapter boundaries without gaps, jumps, or overlaps.
- Sticky labels remain inside their own chapter and hand off naturally at the next boundary.
- Homepage profile, papers, internships, and education are complete.
- Homepage Insights contains exactly one latest-note preview and one index entry link, or the documented no-post fallback.
- Insights uses the same shell and visual system as the homepage.
- Individual articles use the same shell; long prose remains readable and an absent table of contents leaves no empty navigation block.
- Mobile has no narrow sidebar, clipped label, or horizontal page overflow.
- Anchor navigation clears the fixed masthead.
- Keyboard focus, reduced motion, and locale switching remain functional.
- Browser console contains no runtime or hydration errors.

## Relationship To Existing Specifications

This design intentionally supersedes the desktop composition and profile-rail layout described in `2026-06-17-minimal-motion-homepage.md` and the preserve-current-composition constraint in `2026-06-19-homepage-regression-repair-design.md`.

It retains the regression design's independent requirements for locale-history behavior, mobile masthead availability, fixed-header anchor offsets, document language, reduced motion, and static-export compatibility.

## Documentation Scope

After implementation, update the minimal-motion implementation plan to record that the earlier sticky profile/evidence layout was replaced by the approved aligned chapter grid. Review `README.md`; update it only if content authoring, routes, or developer commands change.
