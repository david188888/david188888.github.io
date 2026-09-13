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
- Blog content is plain Markdown plus YAML frontmatter in `content/posts/*.mdx`,
  parsed by `src/lib/content/posts.ts` and rendered with `markdown-it`; no MDX
  compiler runs, so the `.mdx` extension is only a naming convention
- GitHub Pages compatible static output

## Current Structure

- `src/app/page.tsx` - main homepage
- `src/app/(subpages)/` - secondary pages such as CV and publications
- `src/app/insights/` - default-locale Insights index and article routes
- `src/app/[locale]/` - static English and Chinese route variants
- `src/components/` - shared React components
- `src/i18n/` - locale routing helpers and bilingual UI messages
- `src/config/` - author, site, navigation, and content configuration
- `content/posts/` - published blog posts; the only content directory the site
  reads. `content/drafts/` holds unpublished drafts (see its own README)
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

### Syncing An Existing Post From Notion

The essays are drafted and revised in Notion, then synced into `content/posts/`.
The converter is deterministic and does not touch the network:

```bash
# 1. Save the notion_fetch output (must use include_discussions: true) to
#    local/notion-fetch/<date>-<slug>.txt — local/ is gitignored.
# 2. Convert it back into the published MDX, preserving the frontmatter:
node scripts/notion-to-mdx.mjs \
  --input local/notion-fetch/2026-09-11-agent-ai-infra.txt \
  --source content/posts/2026-09-05-ai-chip-infrastructure-token-economics.mdx \
  --write
# 3. Retranslate only what actually changed:
npm run translate:content -- --check   # preview reuse vs pending, no model calls
npm run translate:content              # translate the units that changed
# 4. Verify, then commit the MDX and its translation cache together:
npm run test:run && npm run build
```

Without `--write` the converter prints the MDX to stdout and its report to
stderr, so it doubles as a dry run. `--comments=all|mark-only|none` controls
margin notes; discussions resolved in Notion are always skipped, which is the
supported way to keep a working comment out of the article. Notion text colours,
background colours and underlines all collapse to `==red|text==`, and comment
threads become `^[text]` margin notes; the full syntax is specified in
`docs/insights-markup.md`, and `content/drafts/README.md` covers drafting and
publishing a brand-new post.

A ```` ```html ```` fence whose body is markup is written back as bare block HTML
and the report lists how many fences were unwrapped. The renderer never promotes
fenced content to live HTML, so a figure left inside a fence publishes as escaped
source text instead of a diagram.

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
into the original markup, so diagrams never get mangled by the model. A
```` ```html ```` fence that wraps such a block gets the same treatment: the
fence markers are re-attached from the source and only the text nodes are
translated. The Notion sync writes such a fence back as the bare block HTML shown
above, because the renderer deliberately never promotes fenced content to live
HTML — a figure left inside a fence publishes as escaped source text. Character references are decoded before the model sees them and
re-escaped exactly once afterwards, so a label written `R&amp;D` stays `R&amp;D`
instead of publishing the visible `R&amp;amp;D`. The content of `<style>` and
`<script>` elements inside a diagram is never treated as prose and never
translated, while `<title>`/`<desc>` accessibility text is.

Write the source in either English or Chinese, then run:

```bash
npm run translate:content
```

Review `content/generated/translations/posts/<YYYY-MM-DD>-<slug>.json`. Commit
the source MDX and generated JSON together, then run `npm run test:run` and
`npm run build`. A post without a fresh translation cache is not listed.

Translation runs fully locally on a Hy-MT2-7B model (Tencent's dedicated
translation model) served by Ollama. One-time setup:

```bash
# 1. Download the weights (Q8_0, ~7.5 GB) from the official Tencent repo
aria2c -x16 -s16 -k1M --file-allocation=none -d ~/models/hy-mt2 \
  "https://hf-mirror.com/tencent/Hy-MT2-7B-GGUF/resolve/main/HY-MT2-7B-Q8_0.gguf"

# 2. Register the model with the official Hy-MT2 sampling parameters
ollama create hy-mt2-7b -f scripts/translation/Modelfile

# 3. Serve the OpenAI-compatible endpoint while translating
ollama serve
```

The script translates each field with Hy-MT2's official instruction templates:
the title uses the style-controlled mode (headline register), the excerpt the
basic mode, tags the delimiter-preserving mode (` @@ `-separated), and embedded
HTML text nodes the structured-data mode (keys pinned). The body is split into
paragraph-level units (`scripts/translate-content.mjs`, `MAX_CHUNK_CHARS` as the
upper bound) that are translated and reassembled byte-for-byte; fence markers
stay out of the prompt and are re-attached from the source, so a block can never
lose a backtick. A fence that contains Chinese is translated as reader-facing
text, a fence that does not is carried over verbatim. Each paragraph is handed
its enclosing section heading as context only, and that heading is folded into
the paragraph's cache key.

The same model is reachable by an agent as a skill. The copy that ships with this
repository is `.agents/skills/hy-mt2-translator`, because DSH discovers skills
only under `.agents/skills`. `.claude/skills/hy-mt2-translator` is a local copy
for Claude Code, and `.claude/` is deliberately untracked. A test keeps the two
byte-identical while both are present.

### Incremental translation

Editing a small part of a post no longer retranslates the whole article. Every
translation unit — a heading, a paragraph, a diagram label, the title, the tags —
is cached under a content address (`sha256(pipeline version + model + kind +
section context + source text + glossary terms)`), so an unchanged unit is reused
even after it moves to a different position in the document. Only the units whose
text actually changed are sent to the model, which turns a one-sentence Notion
edit into a handful of calls instead of a full article pass.

Two deliberate invalidations: bump `TRANSLATION_PIPELINE_VERSION` in
`src/lib/content/translation-cache.mjs` whenever a prompt, the segmentation or a
validator changes, and note that changing `HY_MT2_MODEL` also invalidates. The
site checks the same pipeline version, so a prompt change fails the build until
translation is re-run instead of silently republishing old output.

### Glossary

`src/lib/content/translation-glossary.mjs` is the single source for proper nouns
and for terms that must read the same way everywhere. Hy-MT2 has no offline
glossary feature, so each matching term is injected into the prompt through the
official terminology template — and only the terms that unit's own text contains,
because handing the model the whole table makes it invent words.

The glossary carries its own identity. Its content hash is written to every cache
file as `glossary` and participates in the freshness check, so **editing a term
invalidates the affected caches without a manual version bump**; the affected
units are then the only ones retranslated. `enforce` requires a canonical
spelling to appear, `forbid` records a wrong rendering as a regression (it is how
`长鑫` stops being published as `GigaDevice`). A unit whose translation breaks a
rule is re-sampled a few times before the run gives up, because a local 7B model
drops a term occasionally.

```bash
npm run translate:content -- --check   # shows the affected unit count after a glossary edit
```

```bash
npm run translate:content                    # translate everything that changed
npm run translate:content -- --check         # report reuse vs pending, no model calls; exits 1 if stale
npm run translate:content -- --only <slug>   # restrict to one post
npm run translate:content -- --force         # ignore the cache and retranslate every unit
npm run translate:content -- --concurrency 4 # parallel unit requests (default 4)
```

`--concurrency` only shortens wall-clock time when Ollama is allowed to serve
requests in parallel (`OLLAMA_NUM_PARALLEL`); otherwise the requests queue and the
total is roughly the sum of the calls either way.

A translation that fails validation is never written, so the previous cache
stays in place and the site keeps publishing the last reviewed text. Fence
markers have to come back byte-identical (count, order, backtick or tilde run,
info string), the author's inline markup (`**`, `*`, `~~`, inline code, link
targets, heading levels, list bullets) has to match the source one-to-one, and
the text must be free of mojibake, invented HTML entities, Chinese sentence
punctuation left in an English line, and prompt wording. Title, excerpt and tags
go through the same checks before the body is translated, so a bad title fails in
seconds instead of minutes. What the inline markers mean is defined in
`docs/insights-markup.md`.

Configuration via environment variables (see `.env.example`):

```env
HY_MT2_BASE_URL=http://localhost:11434/v1
HY_MT2_MODEL=hy-mt2-7b
```

Generated translations are cached under
`content/generated/translations/posts/` and should be reviewed and committed
with the source MDX. A cache file holds the assembled `body` the site renders
plus a `units` map of content-addressed source/translation pairs; units the
current source no longer uses are pruned on every run, so the file stays bounded.
The production build reads only local source/cache files; it does not call the
translation API or expose API keys in the browser.

## Notes

This site was previously documented as a Jekyll / Academic Pages project. The
current codebase uses the Next.js stack above, so Ruby, Bundler, and Jekyll
commands are no longer part of the development workflow.
