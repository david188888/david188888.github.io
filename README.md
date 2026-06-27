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

Find the record in `educationRecords` or `internshipRecords` and update its
localized fields. For an internship date change, update both `period.en` and
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

Write the source in either English or Chinese, then run:

```bash
npm run translate:content
```

Review `content/generated/translations/posts/<YYYY-MM-DD>-<slug>.json`. Commit
the source MDX and generated JSON together, then run `npm run test:run` and
`npm run build`. A post without a fresh translation cache is not listed.

Translation uses MiMo through environment variables:

```env
MIMO_API_KEY=
MIMO_BASE_URL=https://token-plan-sgp.xiaomimimo.com/v1
MIMO_MODEL=mimo-v2.5-pro
```

Generated translations are cached under
`content/generated/translations/posts/` and should be reviewed and committed
with the source MDX. The production build reads only local source/cache files;
it does not call the translation API or expose API keys in the browser.

## Notes

This site was previously documented as a Jekyll / Academic Pages project. The
current codebase uses the Next.js stack above, so Ruby, Bundler, and Jekyll
commands are no longer part of the development workflow.
