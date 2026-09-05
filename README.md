# HongYu Liu Homepage

Personal academic homepage for HongYu Liu, built with Next.js, React,
TypeScript, and Tailwind CSS.

## Website

- Live site: [https://david188888.github.io](https://david188888.github.io)
- GitHub profile: [https://github.com/david188888](https://github.com/david188888)

## Tech Stack

- Next.js App Router with static export
- React and TypeScript
- Tailwind CSS for layout, typography, and responsive styling
- MDX content directories prepared through Velite configuration
- GitHub Pages compatible static output

## Current Structure

- `src/app/page.tsx` - main homepage
- `src/app/(subpages)/` - secondary pages such as CV and publications
- `src/app/insights/` - default-locale Insights index and article routes
- `src/app/[locale]/` - static English and Chinese route variants
- `src/components/` - shared React components
- `src/i18n/` - locale routing helpers and bilingual UI messages
- `src/config/` - author, site, navigation, and content configuration
- `content/` - MDX content source folders, including Blog posts in `content/posts/`
- `content/generated/translations/` - reviewable generated translation cache
- `public/` - static files, images, PDFs, and favicons

## Local Development

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Build the static site:

```bash
npm run build
```

## Common Content Updates

Profile content is centralized in `src/config/profile.ts`. Keep the English and
Chinese values in the same record so the homepage, CV, and publications pages
stay synchronized.

### Update Education Or Internship Dates

Dates are stored in each record's `period` field. Find the entry in
`educationRecords` or `internshipRecords` and update both `period.en` and
`period.zh`; every page reads the same record.

### Add A Publication

Add one entry to `publicationRecords` with a unique `id`, publication `date`,
`paperUrl`, `category`, and English and Chinese values for `venue`,
`authorship`, `title`, and `description`. The entry will appear on the
homepage, CV, and publications page.

After changing profile content, run:

```bash
npm run test:run
npm run build
```

## Bilingual Site

The site supports static English and Chinese routes for pages, navigation, and
blog content:

- `/` and `/en/` for English
- `/zh/` for Chinese
- `/stats/` and `/zh/stats/` for the private statistics page

Short UI copy lives in `src/i18n/messages.ts`. Locale-specific page data lives
alongside the components or in `src/config/`.

### Writing A New Blog Post

Create `content/posts/<YYYY-MM-DD>-<slug>.mdx`. The filename without `.mdx`
becomes the article URL under `/insights/`; the current loader does not use a
`permalink` field.

```mdx
---
title: "Post title"
date: "2026-06-27"
language: en
excerpt: "One-sentence summary."
tags:
  - AI
  - Research
---

Post body in Markdown.
```

### Embedding HTML Visualizations (Diagrams, Flowcharts)

The body renderer supports author-authored block-level HTML inside the
markdown, so you can embed an SVG diagram, a flowchart, or any other
visualization directly in a post:

- A block-level HTML element starts on its own line with a tag (for example
  `<figure …>`, `<div …>`) and extends to its matching closing tag. Blank
  lines inside the element are allowed.
- Embedded blocks are rendered verbatim and can use the site stylesheet
  classes (for example the `.supply-chain-*` diagram styles in
  `src/app/globals.css`).
- For safety the renderer strips `<script>` blocks, `on*` event-handler
  attributes, and `javascript:` URLs from embedded blocks before rendering.
- Inline HTML typed inside a normal paragraph is still escaped as plain text,
  and HTML-looking lines inside code fences are never promoted to live HTML.

Example:

```mdx
Some paragraph text.

<figure class="supply-chain-diagram">
  <div class="supply-chain-diagram-scroll">
    <svg viewBox="0 0 1120 760">…</svg>
  </div>
  <figcaption>Caption text.</figcaption>
</figure>
```

During translation the script replaces each embedded block with a
`[[html-block-N]]` placeholder, translates the block's visible text nodes
(`element > text <` content) separately, and stitches the translated text back
into the original markup, so diagrams never get mangled by the model.

Write the source in either English or Chinese, then run:

```bash
npm run translate:content
```

Review `content/generated/translations/posts/<YYYY-MM-DD>-<slug>.json`. Commit
the source MDX and generated JSON together, then run `npm run test:run` and
`npm run build`. A post without a fresh translation cache is not listed.

Translation uses OpenRouter through environment variables:

```env
OPENROUTER_API_KEY=
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=z-ai/glm-5.2:free
```

The free `z-ai/glm-5.2:free` variant is rate limited (roughly 50 requests per
day on accounts with less than $10 of credit, 1000 otherwise), which is fine
for the handful of posts this site publishes. Put the real key in a local
`.env` file; `.env` is gitignored and never committed.

Generated translations are cached under
`content/generated/translations/posts/` and should be reviewed and committed
with the source MDX. The production build reads only local source/cache files;
it does not call the translation API or expose API keys in the browser.

## Notes

This site was previously documented as a Jekyll / Academic Pages project. The
current codebase uses the Next.js stack above, so Ruby, Bundler, and Jekyll
commands are no longer part of the development workflow.
