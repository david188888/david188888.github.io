# Balanced Card Homepage Design

## Goal

Redesign the homepage as a credible personal academic profile rather than a campaign-style landing page. The first screen must identify HongYu Liu and his research focus directly, while the remainder of the page presents education, selected research, internships, and the latest Insight as a balanced vertical stack of academic record cards.

## Confirmed Direction

- Use a classic academic homepage structure with a thin reading-progress line at the top.
- Remove the desktop left rail and its wide progress/navigation column.
- Remove the `Current Direction` eyebrow and the slogan-led hero.
- Do not use a portrait until a real personal headshot is available.
- Present the homepage in this order: Profile, Education, Selected Research, Experience, Insights.
- Use balanced cards: approximately two to three visible cards in a common desktop viewport.
- Retain necessary low-contrast card boundaries, but remove page-wide grid lines and redundant dividers.
- Remove decorative top-right arrows and short left-edge accent lines from cards.
- Keep the existing restrained dark visual direction and bilingual routes.

## Scope

This iteration changes the homepage only. It does not redesign the Insights index, Insights article template, CV page, or other subpages. Existing navigation destinations, localized routes, static export, and content sources remain intact.

The earlier aligned-chapter homepage proposal is superseded for the homepage by this design. Its proposed wide left navigation rail must not be implemented here.

## Information Architecture

### Masthead And Reading Progress

Keep the existing masthead destinations and language switcher. Add or retain one two-pixel reading-progress indicator immediately below the masthead. It is the only persistent progress decoration on desktop.

The progress indicator reflects document scroll position without moving content or changing masthead height. It must be hidden from assistive technology and disabled as an animated transition under reduced motion.

### Profile

The profile is an open, unboxed introduction rather than a card. It contains:

- `HongYu Liu` as the dominant heading;
- `Speech AI Researcher` as the concise role label;
- a factual one-sentence introduction covering trustworthy speech language models, interactional privacy, and spoken dialogue intelligence;
- Google Scholar, GitHub, CV, and email links;
- compact factual context for current research focus and incoming CUHK-Shenzhen study.

The profile must not contain a manifesto, marketing promise, portrait placeholder, or generic abstract illustration.

### Education

Education appears immediately after the profile so visitors can understand academic background without scrolling past research marketing copy. Render one card per institution:

- South China Normal University, B.Eng. in Software Engineering, GPA 4.06;
- The Chinese University of Hong Kong, Shenzhen, incoming M.Sc. in Data Science, September 2026.

### Selected Research

Render every configured paper as a card. Each card presents venue and status, authorship, paper title, contribution summary, and paper link. The title is the strongest element; metadata remains compact.

### Experience

Render each internship as a card with company, role, dates, location, and contribution summary. Avoid status pills unless a status communicates information not already present in the dates or title.

### Insights

Render one latest published Insight card and one archive link. Continue excluding future-dated posts. Do not reproduce the full Insights stream or queue on the homepage.

## Card System

### Geometry

- Desktop content width: approximately 960 to 1040 pixels inside the existing page maximum width.
- Card stack gap: approximately 16 to 18 pixels.
- Standard card minimum height: approximately 150 to 160 pixels.
- Research card minimum height: approximately 165 to 175 pixels when the title needs more room.
- Desktop card padding: approximately 28 to 32 pixels.
- Desktop card columns: approximately 175 to 180 pixels for metadata, with the remaining width for primary content.
- Corner radius: approximately 12 pixels.
- Cards may grow naturally for long English or Chinese content; text must not be clipped to force equal heights.

At common desktop heights, the viewport should show roughly two to three cards once the visitor reaches a record section. This is a target reading density, not a fixed-height constraint.

### Surface And Borders

Use one low-contrast border around each card and a subtly lighter surface than the page background. A restrained radial highlight may add depth, but must remain nearly invisible at rest.

Do not use:

- background grid lines;
- nested card borders;
- dividers inside every card;
- left-edge accent bars;
- decorative arrows in the card corner;
- glass blur, bright gradients, or multiple status pills.

The visible hierarchy should come primarily from spacing, type scale, weight, and muted color.

### Typography

Use the existing serif display direction for the name, section headings, and research titles. Use the existing body family for descriptions and institution or role titles. Use a restrained monospaced or utility style only for venue, date, authorship, and category metadata.

No more than two primary type families should be visible in the homepage system. Chinese text must use the existing CJK serif and body fallbacks rather than inheriting Latin display metrics blindly.

## Motion And Interaction

Use three coordinated motions:

1. Profile content enters once with a short stagger.
2. Cards reveal with a subtle vertical offset and approximately 90-millisecond staggering as their section enters the viewport.
3. Hovered or keyboard-focused cards rise by approximately four pixels while their surface, border contrast, and shadow strengthen slightly.

Use a natural deceleration curve such as `cubic-bezier(.22, 1, .36, 1)`. Do not animate card scale, insert decorative arrows, or move text independently from its card.

For `prefers-reduced-motion: reduce`, remove reveal transforms, stagger delays, animated scrolling, and card movement. Static focus styling must remain visible.

## Responsive Behavior

- At desktop widths, cards use the metadata/content two-column layout.
- On tablet, reduce padding and metadata width while preserving the two-column hierarchy where titles remain readable.
- Below 768 pixels, use one content column. Metadata appears above the primary card content.
- Mobile cards use natural height and approximately 22 to 24 pixels of padding.
- The mobile masthead and language switcher remain available.
- No horizontal scrolling, clipped titles, or fixed card heights are allowed.

## Accessibility

- Keep one page `h1`, followed by ordered section `h2` headings and card `h3` headings.
- Cards are semantic `article` elements. A card is linked as a whole only when the entire card has one unambiguous destination; otherwise, only the explicit paper or article link is interactive.
- Provide visible keyboard focus without relying on the removed corner arrow or left accent line.
- Maintain sufficient contrast for muted metadata and descriptions.
- The reading progress indicator is decorative and uses `aria-hidden="true"`.
- All transitions respect reduced motion.

## Content And Data Flow

Keep localized education, paper, internship, and homepage copy in typed data structures. Reuse the existing author configuration and localized route helpers. Derive the latest homepage Insight from the same published-post selection used by the Insights index rather than maintaining a separate manually selected record.

If publication filtering has not yet been implemented, add a small shared selector that excludes valid future dates and returns newest-first results without mutating the source array.

## Empty And Edge States

- Missing latest Insight: show the localized Insights introduction and archive link without an empty card.
- Missing optional metadata: omit the field without leaving an empty column label.
- Invalid external URL: render the record content without an interactive whole-card wrapper.
- Long translated content: allow the card to grow and wrap naturally.
- JavaScript unavailable: cards, links, content order, and masthead remain usable; only scroll progress and reveal timing are absent.

## Verification

### Automated

- Add focused coverage for homepage section order and labels.
- Cover future-post exclusion and latest-post selection if the shared selector is introduced.
- Add a style contract for card geometry, mobile single-column behavior, and reduced motion.
- Run the full Vitest suite, TypeScript checking, production build, and `git diff --check`.

### Browser

Verify English and Chinese homepages at 1512x900, 1280x720, 1024x720, 768x1024, and 390x844.

- The first screen identifies the person, role, and research area without campaign copy.
- Education precedes research and experience.
- Cards show balanced density and grow naturally for long content.
- No top-right decorative arrow or left-edge accent line appears.
- Hover and keyboard focus use only card surface, border, shadow, and restrained movement.
- The top reading-progress line works without layout shift.
- Mobile has no horizontal overflow or clipped metadata.
- Reduced motion removes reveal and movement effects.
- Browser console contains no hydration or runtime errors.

## Documentation

After implementation, update the earlier aligned-homepage design and plan with a short supersession note. Review `README.md`; edit it only if routes, authoring, or developer commands change.
