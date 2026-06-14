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
- `src/app/[locale]/` - static English and Chinese route variants
- `src/app/(subpages)/` - secondary pages such as CV, publications, and insights
- `src/components/` - shared React components
- `src/i18n/` - locale routing helpers and bilingual UI messages
- `src/config/` - author, site, navigation, and content configuration
- `content/` - MDX content source folders for future content-backed pages
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

## Bilingual Site

The site supports static English and Chinese routes for pages, navigation, and
blog content:

- `/` and `/en/` for English
- `/zh/` for Chinese
- `/stats/` and `/zh/stats/` for the private statistics page

Short UI copy lives in `src/i18n/messages.ts`. Locale-specific page data lives
alongside the components or in `src/config/`.

### Writing a New Blog Post

Write one MDX file in `content/posts/` in either English or Chinese. Then run:

```bash
npm run translate:content
```

The script detects the source language. Chinese posts generate English cache
files; English posts generate Chinese cache files. If the text is ambiguous,
add `language: zh` or `language: en` to the post frontmatter.

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
