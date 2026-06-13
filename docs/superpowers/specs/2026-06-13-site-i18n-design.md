# Site-Wide Bilingual Support Design

## Goal

Add Chinese and English support across the entire static personal website, with a compact language switcher and a local translation workflow that can generate the missing language for long-form content.

## Context

The site is a Next.js App Router project configured with `output: "export"` for GitHub Pages. That means all public pages must be statically generated and the browser must never call a private translation API directly.

Current content is split between hard-coded page text in React components/config files and future MDX-backed long-form posts under `content/posts`. The existing `Insights` page is currently hand-authored from `src/config/insights.ts`, while the older `content/posts/*.mdx` files are not yet used for rendered article pages.

## Requirements

- Support Chinese and English for all visible site text, not only blog posts.
- Add a small language control in the top or upper-right navigation area.
- Preserve static export compatibility for GitHub Pages.
- Do not expose translation provider API keys in browser code, committed files, or generated pages.
- Use Xiaomi MiMo Token Plan through the OpenAI-compatible endpoint for translation:
  - `MIMO_BASE_URL=https://token-plan-sgp.xiaomimimo.com/v1`
  - `MIMO_MODEL=mimo-v2.5-pro`
  - `MIMO_API_KEY` must come from an environment variable.
- For long-form content, automatically detect whether the source is Chinese or English and generate the missing language.
- Follow the `baoyu-translate` translation principles:
  - Analyze before translation for normal mode.
  - Rewrite naturally rather than translating literally.
  - Preserve facts, logic, Markdown structure, links, images, code blocks, and frontmatter.
  - Preserve specialized terminology consistently and annotate original terms when helpful.
  - Use a business/formal style for this site.
- Keep generated translations cached and reviewable.

## Non-Goals

- No runtime translation in the browser.
- No server-side API route, middleware, cookies, or Next.js built-in i18n routing, because static export does not support the required server routing layer.
- No automatic machine translation for every short UI string on every build. Short UI copy should remain human-reviewable in a bilingual message dictionary.
- No commit of real API keys.

## Architecture

Use a two-layer bilingual architecture:

1. **UI Message Dictionary**
   - Store short site copy in a typed dictionary, for example `src/i18n/messages.ts`.
   - Include both `en` and `zh` entries for navigation, homepage sections, Insights page labels, footer text, metadata strings, and subpage labels.
   - Use a small helper such as `getMessages(locale)` to make page components explicit and type-safe.

2. **Long-Form Content Translation Cache**
   - Store original posts as MDX in `content/posts`.
   - Add a local translation script that reads posts, detects source language, calls MiMo only for missing/stale target-language content, and writes generated output to a committed cache such as `content/generated/translations/posts/<slug>.json`.
   - Generated cache records should include:
     - source file path
     - source hash
     - detected source language
     - generated target language
     - model name
     - translation style metadata: `business`, `formal`, `normal`
     - translated title, description/excerpt, tags where applicable, and body Markdown
   - The site build reads only local content/cache files, never the MiMo API.

3. **Static Locale Routes**
   - Use explicit static locale routes instead of Next.js built-in i18n:
     - `/en/`
     - `/zh/`
     - `/en/insights/`
     - `/zh/insights/`
     - future article routes such as `/en/insights/<slug>/` and `/zh/insights/<slug>/`
   - Keep `/` as the default English entry point for compatibility with existing links.
   - Use `generateStaticParams()` for `[locale]` route segments where dynamic segments are introduced.

4. **Language Switcher**
   - Add a compact `LanguageSwitcher` client component used by `HomeNav` and `Masthead`.
   - The switcher maps the current path to the equivalent locale path and preserves the rest of the route.
   - It stores the selected locale in `localStorage` for later visits, but pages remain directly addressable without JavaScript.
   - It renders as a small two-option control: `中文 / EN`.

## Proposed File Structure

- `src/i18n/locales.ts`
  - Defines `Locale`, `locales`, `defaultLocale`, locale labels, and path helpers.
- `src/i18n/messages.ts`
  - Typed bilingual copy for short UI strings.
- `src/i18n/routing.ts`
  - Helpers for normalizing locale-prefixed paths and switching locales.
- `src/components/navigation/LanguageSwitcher.tsx`
  - Client component for language selection.
- `src/lib/content/language.ts`
  - Source-language detection helpers for Chinese vs English long-form content.
- `src/lib/content/posts.ts`
  - Loads original posts plus generated translations and returns localized article data.
- `scripts/translate-content.mjs`
  - Local MiMo translation workflow.
- `content/generated/translations/posts/`
  - Committed generated translation cache.
- `.env.example`
  - Documents required environment variables without secrets.
- `README.md`
  - Documents how to add a new bilingual post and how to run translation.

## Translation Workflow For New Blog Posts

The intended author workflow is:

1. Write one post in `content/posts/<date>-<slug>.mdx` in either Chinese or English.
2. Run:

   ```bash
   npm run translate:content
   ```

3. The script detects the source language:
   - If the post is mostly Chinese, it generates English.
   - If the post is mostly English, it generates Chinese.
   - If the language is ambiguous, the script fails with a clear message and asks the author to set a `language: zh` or `language: en` frontmatter field.
4. The script checks the source hash against the existing cache:
   - If the translation is current, it skips the API call.
   - If the post is new or changed, it calls MiMo and updates the cached translation.
5. Review the generated cache or rendered page.
6. Commit the original MDX and generated translation cache together.
7. Run `npm run build` before publishing.

This is semi-automatic by default: one command generates the missing language, but the output is cached for review rather than silently generated during every deploy. A future prebuild hook can run the command automatically, but it should not be required for GitHub Pages deploys unless the repository also stores the generated cache.

## MiMo Adapter

The translation script should use `fetch` against:

```text
${MIMO_BASE_URL}/chat/completions
```

Request requirements:

- Header: `api-key: ${MIMO_API_KEY}`
- Header: `Content-Type: application/json`
- Body:
  - `model: process.env.MIMO_MODEL ?? "mimo-v2.5-pro"`
  - `messages` with a translation-system prompt and a structured user payload
  - `temperature` low enough for faithful translation, for example `0.3`
  - `top_p: 0.95`
  - `stream: false`

The adapter must fail fast if required environment variables are missing and must never log the API key.

## Translation Prompt Behavior

The script should build a prompt inspired by `baoyu-translate` normal mode:

1. Identify source language, target language, domain, tone, key terminology, names, URLs, code blocks, and formatting constraints.
2. Translate in business/formal style:
   - professional and structured
   - concise, executive-friendly where appropriate
   - no casual slang
   - natural target-language prose rather than literal sentence mirroring
3. Preserve Markdown and frontmatter semantics.
4. Return strict JSON for machine parsing:

```json
{
  "sourceLanguage": "zh",
  "targetLanguage": "en",
  "title": "Translated title",
  "excerpt": "Translated excerpt",
  "tags": ["translated", "tags"],
  "body": "Translated markdown body"
}
```

If the model returns invalid JSON, the script should retry once with a repair prompt, then fail with the raw response saved to a local ignored diagnostic file.

## Routing And Page Behavior

- Home, Insights, Posts, Publications, CV, Talks, Teaching, Sitemap, Terms, Stats, and 404 pages should accept locale context where visible strings appear.
- The current unprefixed home page may remain as English for compatibility.
- Locale-prefixed pages should set `html lang` or page-level language attributes where practical. If the root layout remains global, each top-level locale layout can set visible text and metadata by locale.
- Metadata should use localized title/description values for locale-prefixed pages.
- Internal links should be generated with the current locale unless linking to files, mailto, or external URLs.

## Error Handling

- Missing locale messages should fail TypeScript or fail build, not silently display the wrong language.
- Unsupported locale route segments should return 404.
- Missing translation cache for a published post should fail build so publishing does not silently degrade. Draft posts can be excluded from strict cache checks.
- Translation script should skip API calls when `sourceHash` matches.
- Translation script should fail if `MIMO_API_KEY` is missing and translation is required.
- Translation script should not overwrite manually edited generated cache unless the source hash changed or `--force` is passed.

## Testing Strategy

- Unit tests for locale path helpers:
  - `/en/insights/` switches to `/zh/insights/`
  - `/zh/insights/post-a/` switches to `/en/insights/post-a/`
  - `/` maps to `/zh/` when switching to Chinese
- Unit tests for language detection:
  - Chinese-majority text detects `zh`
  - English-majority text detects `en`
  - ambiguous text returns an ambiguity result
- Unit tests for translation cache freshness:
  - unchanged source hash skips API
  - changed source hash requires regeneration
- Component or build verification:
  - `npm run build` succeeds with static export
  - no generated bundle contains API key environment variable names beyond safe public documentation
  - language switcher renders in both nav variants

## Documentation Updates

Update `README.md` with:

- language URL structure
- how to set up `.env.local`
- how to add a post in one language
- how to run `npm run translate:content`
- how to review and commit generated translations

## Implementation Decisions

- Default root behavior: keep `/` as English because it is static-export friendly and least surprising for existing links.
- Blog article URL prefix: use `/insights/<slug>/` for future long-form writing. Keep `/posts/` as a legacy landing page unless the user later asks to restore the old post archive.
