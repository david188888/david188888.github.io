# Content Maintenance Refactor Design

## Goal

Make routine site maintenance predictable: education and internship changes, new publications, and new bilingual Blog posts should each have one documented source of truth and a verifiable publication workflow.

## Context

The site is a statically exported Next.js application with English and Chinese routes. Profile records are currently duplicated between `HomePageView.tsx` and `SubpageViews.tsx`, so one factual update can require several coordinated edits. The Blog translation command and runtime post loader also calculate translation-cache hashes from different inputs, which can make a newly generated cache appear stale immediately.

Repository guidance is partially current. `README.md` describes the Next.js stack and translation command, but it does not explain common profile maintenance or the full Blog frontmatter and verification workflow. `CLAUDE.md`, `CONTRIBUTING.md`, and the talk-scraping workflow still describe parts of the retired Jekyll project.

## Confirmed Scope

- Move education, internship, and publication records into one typed profile-content module.
- Keep localized English and Chinese text adjacent within each logical record.
- Make the homepage, CV page, and publications page derive their display data from that module.
- Fix the Blog translation-cache hash contract and add a regression test spanning the script and runtime implementations.
- Fix the broken internship navigation anchor.
- Add a concise common-maintenance section to `README.md`.
- Rewrite stale contributor and agent guidance for the current Next.js project.
- Remove the obsolete talk-scraping workflow, which references paths and a notebook that no longer exist.

## Non-Goals

- Do not migrate profile data to MDX, a CMS, database, or external service.
- Do not replace the current Blog Markdown renderer in this phase.
- Do not redesign pages or change visible styling.
- Do not split `globals.css`, remove legacy components, or consolidate locale route wrappers.
- Do not change the statistics-page authentication model.
- Do not introduce a changelog solely for this maintenance refactor.

## Selected Approach

Use a small typed TypeScript module under `src/config/` as the single source of truth. This matches the existing `author.ts`, `insights.ts`, and `navigation.ts` configuration pattern and avoids adding a content framework for a small, structured data set.

Two alternatives were rejected:

1. Document all existing duplicate edit locations. This is the smallest immediate change but preserves the primary maintenance risk.
2. Move all profile and publication data into Velite/MDX. This could support a larger content platform later, but it adds schema, generation, and migration work that is unnecessary for the current site.

## Profile Content Module

Create `src/config/profile.ts` with exported interfaces and three ordered arrays:

- `educationRecords`
- `internshipRecords`
- `publicationRecords`

Each record has a stable `id`. Facts shared across locales, such as publication dates and URLs, are stored once. Visible text that differs by locale is stored as `Record<Locale, string>` fields on the same record. The record shapes cover the existing views without preserving view-specific duplicated strings:

- Education: localized period, institution, degree, and description.
- Internship: localized period, company, role, location, and description.
- Publication: publication date, paper URL, category, and localized venue, authorship, title, and description.

Export focused locale selectors that return view-neutral localized records. Components remain responsible only for presentation-specific composition, such as combining company and role for a card or combining location and period for the compact CV list.

This boundary means a new publication is inserted once with both language variants, then appears on the homepage, CV, and publications page in the same configured order.

## Component Migration

`HomePageView.tsx` will remove its local education, internship, and paper arrays and consume the localized selectors from `src/config/profile.ts`.

`SubpageViews.tsx` will remove `cvEducationData`, `cvInternshipData`, `cvPublications`, and `publications`. Its CV and publications views will derive their existing display props from the same localized records. No component markup, CSS class, section order, or visible copy outside those records should change.

Existing component tests should continue to verify representative content. Add a focused profile-config test that checks stable ordering, unique IDs, required URLs, and availability of both locales. This test protects the authoring contract without snapshotting the full data set.

## Blog Cache Contract

Define the cache hash contract as SHA-256 of the complete raw UTF-8 MDX source. Exact source changes, including frontmatter changes, must invalidate the cache.

The runtime loader already hashes the raw source. Change the translation workflow to call its existing hash function with the raw source rather than a reconstructed `{ frontmatter, body }` object. Add a regression test that imports both implementations and proves that the same representative MDX source produces the same hash.

Do not change routing, draft handling, or the current rule that only posts with a fresh bilingual cache are listed. Those behaviors require a separate publication-policy decision. The README will state that the source MDX and generated cache must be committed together.

## Navigation Fix

Change the main navigation internship link from `/#internships` to `/#experience`, matching the existing homepage section ID. Add or update navigation coverage so this mismatch cannot recur silently.

## Documentation Changes

### README

Add a `Common Content Updates` section with short instructions for:

1. Updating education or internship facts in `src/config/profile.ts`, including both locale values.
2. Adding one publication record in `src/config/profile.ts`, including its stable ID, date, URL, category, and both locale variants.
3. Adding a Blog post under `content/posts/<YYYY-MM-DD>-<slug>.mdx` with a minimal frontmatter example containing `title`, `date`, `permalink`, `language`, `excerpt`, and `tags`.
4. Running `npm run translate:content`, reviewing the generated JSON, and committing both files.
5. Running `npm run test:run` and `npm run build` before publishing.

Also correct the structure description so Insights routes point to their real `src/app/insights` and locale locations rather than the route group.

### Other Durable Guidance

- Rewrite `CLAUDE.md` as concise current-project guidance: stack, commands, structure, bilingual content rules, static-export constraints, and validation expectations.
- Rewrite `CONTRIBUTING.md` so it no longer links contributors to the Academic Pages upstream repository and instead describes this repository's local workflow.
- Delete `.github/workflows/scrape_talks.yml`; its watched paths and `talkmap.ipynb` target do not exist in the current project.
- Preserve dated files under `docs/superpowers/` as historical design and implementation records.

## Error Handling And Compatibility

- TypeScript should reject missing localized profile fields.
- Profile selectors should not silently substitute one locale for another.
- Existing record order remains authoritative; no new implicit sorting is introduced for education or internships.
- Publications retain their current order and metadata during migration.
- Translation still fails when an API key is required for missing or stale cache, and no credential is written to source or generated output.
- Static export and existing English and Chinese URLs remain unchanged.

## Testing And Acceptance

Run these checks after implementation:

1. Focused profile-config, navigation, and Blog hash-contract tests pass.
2. The full Vitest suite passes.
3. The production static build succeeds.
4. `git diff --check` reports no whitespace errors.
5. Homepage, CV, and publications views still contain all existing records in both locales.
6. The internship navigation link targets `/#experience`.
7. A representative Blog MDX source receives the same hash from the translation script and runtime cache utility.
8. README instructions name only paths and commands that exist after the refactor.

## Follow-Up Candidates

After this phase is stable, separately evaluate replacing the minimal Markdown renderer, splitting the large global stylesheet, removing confirmed unused homepage components, consolidating locale route wrappers, and replacing the client-visible statistics-page credential check. None of these are prerequisites for routine content maintenance.
