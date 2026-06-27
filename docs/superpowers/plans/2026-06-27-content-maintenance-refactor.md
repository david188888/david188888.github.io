# Content Maintenance Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give education, internship, publication, and bilingual Blog maintenance one documented source of truth with regression-tested publication behavior.

**Architecture:** Add a typed `src/config/profile.ts` module that owns normalized bilingual records and deterministic view selectors. Existing page components consume those selectors without visual changes. Separately align the translation script's raw-source hash contract with the runtime loader, fix the navigation anchor, and synchronize tracked repository documentation.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript 5.7, Vitest 4, MDX source files, Node.js translation script.

## Global Constraints

- Preserve static export and all existing English and Chinese URLs.
- Do not redesign pages, change CSS, or alter visible copy during the data migration.
- Keep profile data in typed TypeScript; do not add a CMS, database, or dependency.
- Hash the complete raw UTF-8 MDX source with SHA-256 in both translation and runtime code.
- The Blog route slug comes from the MDX filename, not `permalink`.
- Leave ignored, untracked `CLAUDE.md` and its `.gitignore` rule unchanged.
- Use `rtk` before every shell command.

---

### Task 1: Add The Typed Profile Content Source

**Files:**
- Create: `src/config/profile.ts`
- Create: `src/config/__tests__/profile.test.ts`

**Interfaces:**
- Consumes: `Locale` from `src/i18n/locales.ts`.
- Produces: `educationRecords`, `internshipRecords`, `publicationRecords`, `publicationCategoryOrder`, `getHomeEducation`, `getCvEducation`, `getIncomingEducation`, `getHomeInternships`, `getCvInternships`, `getHomePublications`, `getCvPublications`, and `getPublicationArchive`.

- [ ] **Step 1: Write the failing profile contract test**

Create `src/config/__tests__/profile.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  educationRecords,
  getCvEducation,
  getCvInternships,
  getCvPublications,
  getHomeEducation,
  getHomeInternships,
  getHomePublications,
  getIncomingEducation,
  getPublicationArchive,
  internshipRecords,
  publicationCategoryOrder,
  publicationRecords,
} from "../profile";

describe("profile content", () => {
  it("keeps stable unique record ids and supported publication categories", () => {
    const records = [...educationRecords, ...internshipRecords, ...publicationRecords];
    expect(new Set(records.map(({ id }) => id)).size).toBe(records.length);
    expect(publicationCategoryOrder).toEqual(["conferences", "manuscripts", "books"]);
    publicationRecords.forEach(({ category, paperUrl }) => {
      expect(publicationCategoryOrder).toContain(category);
      expect(paperUrl).toMatch(/^https:\/\//);
    });
  });

  it.each(["en", "zh"] as const)("provides every localized field for %s", (locale) => {
    for (const record of educationRecords) {
      expect(record.period[locale]).toBeTruthy();
      expect(record.institution[locale]).toBeTruthy();
      expect(record.degree[locale]).toBeTruthy();
      expect(record.description[locale]).toBeTruthy();
    }
    for (const record of internshipRecords) {
      expect(record.period[locale]).toBeTruthy();
      expect(record.company[locale]).toBeTruthy();
      expect(record.role[locale]).toBeTruthy();
      expect(record.location[locale]).toBeTruthy();
      expect(record.description[locale]).toBeTruthy();
    }
    for (const record of publicationRecords) {
      expect(record.venue[locale]).toBeTruthy();
      expect(record.authorship[locale]).toBeTruthy();
      expect(record.title[locale]).toBeTruthy();
      expect(record.description[locale]).toBeTruthy();
    }
  });

  it("reproduces the current English view compositions", () => {
    expect(getHomeEducation("en")[0]).toEqual({
      id: "scnu-beng",
      time: "Bachelor's Degree",
      title: "South China Normal University",
      meta: "B.Eng. in Software Engineering",
      description: "Overall GPA: 4.06.",
    });
    expect(getCvEducation("en")[0].detail).toBe("B.Eng. in Software Engineering · GPA: 4.06");
    expect(getIncomingEducation("en")).toEqual({
      label: "Incoming 2026",
      value: "CUHK-Shenzhen · M.Sc. Data Science",
    });
    expect(getHomeInternships("en")[0].title).toBe("Insta360 · Speech Algorithm Intern");
    expect(getCvInternships("en")[0].detail).toBe("Shenzhen, China · Feb 2026 - Jun 2026");
    expect(getHomePublications("en")[0].authorship).toBe("Second author");
    expect(getCvPublications("en")[0].excerpt).toBe("Second author.");
    expect(getPublicationArchive("en")[0].excerpt).toBe(
      "Introduced a benchmark for evaluating social alignment in speech language models across safety, fairness, and privacy dimensions; second author."
    );
  });

  it("uses Chinese punctuation in publication selectors", () => {
    expect(getCvPublications("zh")[0].excerpt).toBe("第二作者。");
    expect(getPublicationArchive("zh")[0].excerpt).toBe(
      "提出用于评估语音语言模型社会对齐能力的基准，覆盖安全、公平与隐私维度；第二作者。"
    );
  });
});
```

- [ ] **Step 2: Run the focused test and verify the missing module failure**

Run:

```bash
rtk npm run test:run -- src/config/__tests__/profile.test.ts
```

Expected: FAIL because `src/config/profile.ts` does not exist.

- [ ] **Step 3: Implement the profile types, records, formatters, and selectors**

Create `src/config/profile.ts` with these public types and deterministic helpers:

```ts
import type { Locale } from "@/i18n/locales";

type LocalizedText = Record<Locale, string>;

export type PublicationCategory = "conferences" | "manuscripts" | "books";

export interface EducationRecord {
  id: string;
  period: LocalizedText;
  institution: LocalizedText;
  degree: LocalizedText;
  description: LocalizedText;
  cvSupplement?: LocalizedText;
  incomingSummary?: { label: LocalizedText; value: LocalizedText };
}

export interface InternshipRecord {
  id: string;
  period: LocalizedText;
  company: LocalizedText;
  role: LocalizedText;
  location: LocalizedText;
  description: LocalizedText;
}

export interface PublicationRecord {
  id: string;
  date: string;
  paperUrl: string;
  category: PublicationCategory;
  venue: LocalizedText;
  authorship: LocalizedText;
  title: LocalizedText;
  description: LocalizedText;
}

export const publicationCategoryOrder: readonly PublicationCategory[] = [
  "conferences",
  "manuscripts",
  "books",
];
```

Populate the three arrays with the exact records currently in `HomePageView.tsx` and `SubpageViews.tsx`. Use these stable IDs and preserve this order:

```ts
export const educationRecords: readonly EducationRecord[] = [
  {
    id: "scnu-beng",
    period: { en: "Bachelor's Degree", zh: "本科" },
    institution: { en: "South China Normal University", zh: "华南师范大学" },
    degree: { en: "B.Eng. in Software Engineering", zh: "软件工程工学学士" },
    description: { en: "Overall GPA: 4.06.", zh: "综合 GPA：4.06。" },
    cvSupplement: { en: "GPA: 4.06", zh: "GPA：4.06" },
  },
  {
    id: "cuhksz-msc-data-science",
    period: { en: "Matriculation: Sep 2026", zh: "预计 2026 年 9 月入学" },
    institution: {
      en: "The Chinese University of Hong Kong, Shenzhen",
      zh: "香港中文大学（深圳）",
    },
    degree: { en: "Master of Science in Data Science", zh: "数据科学理学硕士" },
    description: {
      en: "Enrollment scheduled for September 2026.",
      zh: "预计于 2026 年 9 月开始硕士阶段学习。",
    },
    incomingSummary: {
      label: { en: "Incoming 2026", zh: "2026 年入学" },
      value: {
        en: "CUHK-Shenzhen · M.Sc. Data Science",
        zh: "香港中文大学（深圳）· 数据科学理学硕士",
      },
    },
  },
];

export const internshipRecords: readonly InternshipRecord[] = [
  {
    id: "insta360-speech-algorithm",
    period: { en: "Feb 2026 - Jun 2026", zh: "2026 年 2 月 - 2026 年 6 月" },
    company: { en: "Insta360", zh: "Insta360" },
    role: { en: "Speech Algorithm Intern", zh: "语音算法实习生" },
    location: { en: "Shenzhen, China", zh: "中国深圳" },
    description: {
      en: "Developing production-grade speech algorithms and optimizing low-latency model inference for voice applications.",
      zh: "参与生产级语音算法开发，并针对语音应用优化低时延模型推理能力。",
    },
  },
  {
    id: "amphion-r-and-d",
    period: { en: "Jun 2025 - Sep 2025", zh: "2025 年 6 月 - 2025 年 9 月" },
    company: { en: "Amphion Technology", zh: "Amphion Technology" },
    role: { en: "R&D Intern", zh: "研发实习生" },
    location: { en: "Shenzhen, China", zh: "中国深圳" },
    description: {
      en: "Developed core algorithms for a voice-cloning application and supported backend model integration for video translation.",
      zh: "为语音克隆应用开发核心算法，并支持视频翻译场景中的后端模型集成。",
    },
  },
];
```

Add the four existing publication records in their current order:

```ts
export const publicationRecords: readonly PublicationRecord[] = [
  {
    id: "voxsafebench",
    date: "2026-04-01",
    paperUrl: "https://arxiv.org/abs/2604.14548",
    category: "conferences",
    venue: { en: "NeurIPS 2026 · Under Review", zh: "NeurIPS 2026 · 审稿中" },
    authorship: { en: "Second author", zh: "第二作者" },
    title: {
      en: "VoxSafeBench: Not Just What Is Said, but Who, How, and Where",
      zh: "VoxSafeBench：不仅评估说了什么，也评估谁、如何以及在何处表达",
    },
    description: {
      en: "Introduced a benchmark for evaluating social alignment in speech language models across safety, fairness, and privacy dimensions.",
      zh: "提出用于评估语音语言模型社会对齐能力的基准，覆盖安全、公平与隐私维度。",
    },
  },
  {
    id: "voxprivacy",
    date: "2026-01-01",
    paperUrl: "https://arxiv.org/abs/2601.19956",
    category: "conferences",
    venue: { en: "ICLR 2026 · Poster", zh: "ICLR 2026 · 海报" },
    authorship: { en: "Second author", zh: "第二作者" },
    title: {
      en: "VoxPrivacy: A Benchmark for Evaluating Interactional Privacy of Speech Language Models",
      zh: "VoxPrivacy：评估语音语言模型交互隐私的基准",
    },
    description: {
      en: "Introduced a multi-user benchmark for measuring interactional privacy risks in speech-language models.",
      zh: "提出面向多用户场景的基准，用于衡量语音语言模型的交互隐私风险。",
    },
  },
  {
    id: "dialoggraph-llm",
    date: "2025-06-01",
    paperUrl: "https://arxiv.org/abs/2511.11000",
    category: "conferences",
    venue: { en: "ECAI 2025 · Oral", zh: "ECAI 2025 · 口头报告" },
    authorship: { en: "First author", zh: "第一作者" },
    title: {
      en: "DialogGraph-LLM: Graph-Informed LLMs for End-to-End Audio Dialogue Intent Recognition",
      zh: "DialogGraph-LLM：面向端到端音频对话意图识别的图增强大语言模型",
    },
    description: {
      en: "Proposed a graph-informed framework for end-to-end intent recognition in spoken dialogue.",
      zh: "提出图增强框架，用于端到端语音对话意图识别。",
    },
  },
  {
    id: "msmt-fn",
    date: "2025-01-01",
    paperUrl: "https://arxiv.org/abs/2511.11006",
    category: "conferences",
    venue: { en: "ADMA 2025 · Poster", zh: "ADMA 2025 · 海报" },
    authorship: { en: "First author", zh: "第一作者" },
    title: {
      en: "Multi-segment Multitask Fusion Network for Marketing Audio Classification",
      zh: "面向营销音频分类的多片段多任务融合网络",
    },
    description: {
      en: "Proposed MSMT-FN for marketing-call attitude classification, achieving stronger results than prior baselines.",
      zh: "提出 MSMT-FN 用于营销通话态度分类，相比既有基线取得更优结果。",
    },
  },
];
```

Add these helpers and selectors after the arrays:

```ts
function localized(value: LocalizedText, locale: Locale): string {
  return value[locale];
}

function removeTerminalPunctuation(value: string): string {
  return value.trim().replace(/[.!?。！？]$/, "");
}

function lowerCaseFirst(value: string): string {
  return value ? `${value[0].toLocaleLowerCase()}${value.slice(1)}` : value;
}

export function getHomeEducation(locale: Locale) {
  return educationRecords.map((record) => ({
    id: record.id,
    time: localized(record.period, locale),
    title: localized(record.institution, locale),
    meta: localized(record.degree, locale),
    description: localized(record.description, locale),
  }));
}

export function getCvEducation(locale: Locale) {
  return educationRecords.map((record) => ({
    id: record.id,
    school: localized(record.institution, locale),
    detail: `${localized(record.degree, locale)} · ${localized(record.cvSupplement ?? record.period, locale)}`,
  }));
}

export function getIncomingEducation(locale: Locale) {
  const summary = educationRecords.find((record) => record.incomingSummary)?.incomingSummary;
  if (!summary) throw new Error("Missing incoming education summary.");
  return { label: localized(summary.label, locale), value: localized(summary.value, locale) };
}

export function getHomeInternships(locale: Locale) {
  return internshipRecords.map((record) => ({
    id: record.id,
    time: localized(record.period, locale),
    title: `${localized(record.company, locale)} · ${localized(record.role, locale)}`,
    meta: localized(record.location, locale),
    description: localized(record.description, locale),
  }));
}

export function getCvInternships(locale: Locale) {
  return internshipRecords.map((record) => ({
    id: record.id,
    role: `${localized(record.company, locale)} · ${localized(record.role, locale)}`,
    detail: `${localized(record.location, locale)} · ${localized(record.period, locale)}`,
  }));
}

export function getHomePublications(locale: Locale) {
  return publicationRecords.map((record) => ({
    id: record.id,
    venue: localized(record.venue, locale),
    authorship: localized(record.authorship, locale),
    title: localized(record.title, locale),
    description: localized(record.description, locale),
    paperUrl: record.paperUrl,
  }));
}

export function getCvPublications(locale: Locale) {
  return publicationRecords.map((record) => {
    const authorship = localized(record.authorship, locale);
    return {
      id: record.id,
      title: localized(record.title, locale),
      permalink: record.paperUrl,
      venue: localized(record.venue, locale),
      date: record.date,
      excerpt: locale === "zh" ? `${authorship}。` : `${authorship}.`,
      paperUrl: record.paperUrl,
    };
  });
}

export function getPublicationArchive(locale: Locale) {
  return publicationRecords.map((record) => {
    const description = removeTerminalPunctuation(localized(record.description, locale));
    const authorship = localized(record.authorship, locale);
    return {
      id: record.id,
      title: localized(record.title, locale),
      permalink: record.paperUrl,
      venue: localized(record.venue, locale),
      date: record.date,
      excerpt:
        locale === "zh"
          ? `${description}；${authorship}。`
          : `${description}; ${lowerCaseFirst(authorship)}.`,
      paperUrl: record.paperUrl,
      category: record.category,
    };
  });
}
```

- [ ] **Step 4: Run the focused profile test**

Run:

```bash
rtk npm run test:run -- src/config/__tests__/profile.test.ts
```

Expected: PASS, 4 tests.

- [ ] **Step 5: Commit the profile source**

```bash
rtk git add src/config/profile.ts src/config/__tests__/profile.test.ts
rtk git commit -m "refactor: centralize profile content"
```

---

### Task 2: Migrate Homepage, CV, And Publications Views

**Files:**
- Modify: `src/components/pages/HomePageView.tsx`
- Modify: `src/components/pages/SubpageViews.tsx`
- Modify: `src/components/pages/__tests__/HomePageView.test.tsx`
- Create: `src/components/pages/__tests__/SubpageViews.test.tsx`

**Interfaces:**
- Consumes: all selector functions and `publicationCategoryOrder` from Task 1.
- Produces: unchanged rendered homepage, CV, and publications content backed by one config module.

- [ ] **Step 1: Extend homepage coverage to every configured record in both locales**

In `HomePageView.test.tsx`, import `educationRecords`, `internshipRecords`, and `publicationRecords`. Add:

```tsx
it.each(["en", "zh"] as const)("renders every configured profile record for %s", (locale) => {
  const html = renderToStaticMarkup(<HomePageView locale={locale} />);

  educationRecords.forEach((record) => expect(html).toContain(record.institution[locale]));
  internshipRecords.forEach((record) => {
    expect(html).toContain(record.company[locale]);
    expect(html).toContain(record.role[locale]);
  });
  publicationRecords.forEach((record) => expect(html).toContain(record.title[locale]));
});
```

This characterization test should pass before and after the refactor; it protects all visible records while implementation ownership moves to the config module.

- [ ] **Step 2: Add CV and publications full-record rendering tests**

Create `SubpageViews.test.tsx`:

```tsx
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { educationRecords, internshipRecords, publicationRecords } from "@/config/profile";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={String(href)} {...props}>{children}</a>
  ),
}));

import { CVPageView, PublicationsPageView } from "../SubpageViews";

describe("profile subpages", () => {
  it.each(["en", "zh"] as const)("renders every CV record for %s", (locale) => {
    const html = renderToStaticMarkup(<CVPageView locale={locale} />);
    educationRecords.forEach((record) => expect(html).toContain(record.institution[locale]));
    internshipRecords.forEach((record) => expect(html).toContain(record.role[locale]));
    publicationRecords.forEach((record) => expect(html).toContain(record.title[locale]));
  });

  it.each(["en", "zh"] as const)("renders every publication record for %s", (locale) => {
    const html = renderToStaticMarkup(<PublicationsPageView locale={locale} />);
    publicationRecords.forEach((record) => expect(html).toContain(record.title[locale]));
  });
});
```

- [ ] **Step 3: Run the page tests before migration**

Run:

```bash
rtk npm run test:run -- src/components/pages/__tests__/HomePageView.test.tsx src/components/pages/__tests__/SubpageViews.test.tsx
```

Expected: PASS before migration, establishing the no-visible-copy-change baseline.

- [ ] **Step 4: Migrate `HomePageView.tsx`**

Import:

```ts
import {
  getHomeEducation,
  getHomeInternships,
  getHomePublications,
  getIncomingEducation,
} from "@/config/profile";
```

Delete `TimelineItem`, `PaperItem`, `educationData`, `internshipData`, and `papersData`. Remove `incomingLabel` and `incomingValue` from both `homeCopy` entries and its `satisfies` type.

Inside `HomePageView`, add:

```ts
const education = getHomeEducation(locale);
const internships = getHomeInternships(locale);
const papers = getHomePublications(locale);
const incomingEducation = getIncomingEducation(locale);
```

Replace hero references with `incomingEducation.label` and `incomingEducation.value`. Replace the three array lookups with `education`, `papers`, and `internships`, and use `item.id` or `paper.id` as each React key. Preserve all existing card props and markup.

- [ ] **Step 5: Migrate `SubpageViews.tsx`**

Import:

```ts
import {
  getCvEducation,
  getCvInternships,
  getCvPublications,
  getPublicationArchive,
  publicationCategoryOrder,
} from "@/config/profile";
```

Delete `cvEducationData`, `cvInternshipData`, `cvPublications`, and `publications`. In `CVPageView`, initialize the three selector results and map them using `id` as key.

In `PublicationsPageView`, replace the reducer with:

```ts
const publications = getPublicationArchive(locale);
const grouped = publicationCategoryOrder
  .map((category) => ({
    category,
    items: publications.filter((publication) => publication.category === category),
  }))
  .filter(({ items }) => items.length > 0);
```

Render `grouped.map(({ category, items }) => ...)` and use `pub.id` as the `ArchiveItem` key. Keep all existing headings, links, and classes.

- [ ] **Step 6: Run focused and full tests**

Run:

```bash
rtk npm run test:run -- src/config/__tests__/profile.test.ts src/components/pages/__tests__/HomePageView.test.tsx src/components/pages/__tests__/SubpageViews.test.tsx
rtk npm run test:run
```

Expected: focused tests PASS, then all tests PASS.

- [ ] **Step 7: Commit the component migration**

```bash
rtk git add src/components/pages/HomePageView.tsx src/components/pages/SubpageViews.tsx src/components/pages/__tests__/HomePageView.test.tsx src/components/pages/__tests__/SubpageViews.test.tsx
rtk git commit -m "refactor: reuse profile content across pages"
```

---

### Task 3: Align The Blog Translation Hash Contract

**Files:**
- Modify: `scripts/translate-content.mjs`
- Modify: `scripts/__tests__/translate-content.test.mjs`

**Interfaces:**
- Consumes: runtime `createSourceHash(source: string)` from `src/lib/content/cache.ts` as the canonical behavior.
- Produces: script `createSourceHash(source: string)` with identical output for raw MDX source.

- [ ] **Step 1: Write cross-module regression tests**

Update the script test imports:

```js
import {
  buildMiMoRequest,
  createSourceHash as createScriptSourceHash,
  parseFrontmatter,
  toCachePath,
} from "../translate-content.mjs";
import { createSourceHash as createRuntimeSourceHash } from "../../src/lib/content/cache.ts";
```

Add:

```js
it("uses the runtime raw-source hash contract", () => {
  const source = "---\ntitle: Example\nlanguage: en\n---\n\n# Body\n";
  expect(createScriptSourceHash(source)).toBe(createRuntimeSourceHash(source));
});

it("invalidates hashes for frontmatter and whitespace-only changes", () => {
  const source = "---\ntitle: Example\n---\n\nBody\n";
  const frontmatterChange = "---\ntitle: Changed\n---\n\nBody\n";
  const whitespaceChange = "---\ntitle: Example\n---\n\nBody  \n";

  for (const changed of [frontmatterChange, whitespaceChange]) {
    expect(createScriptSourceHash(changed)).not.toBe(createScriptSourceHash(source));
    expect(createRuntimeSourceHash(changed)).not.toBe(createRuntimeSourceHash(source));
    expect(createScriptSourceHash(changed)).toBe(createRuntimeSourceHash(changed));
  }
});

it("rejects structured object input", () => {
  expect(() => createScriptSourceHash({ frontmatter: {}, body: "Body" })).toThrow();
});
```

- [ ] **Step 2: Run the script tests and verify failure**

Run:

```bash
rtk npm run test:run -- scripts/__tests__/translate-content.test.mjs
```

Expected: FAIL because the script still accepts and hashes object input.

- [ ] **Step 3: Make the script hash raw source only**

Replace the helper with:

```js
export function createSourceHash(source) {
  return crypto.createHash("sha256").update(source).digest("hex");
}
```

In `main`, replace:

```js
const sourceHash = createSourceHash({ frontmatter: parsed.frontmatter, body });
```

with:

```js
const sourceHash = createSourceHash(source);
```

- [ ] **Step 4: Run script, content, and full tests**

Run:

```bash
rtk npm run test:run -- scripts/__tests__/translate-content.test.mjs src/lib/content/__tests__/cache.test.ts src/lib/content/__tests__/posts.test.ts
rtk npm run test:run
```

Expected: all selected tests PASS, then the full suite PASS.

- [ ] **Step 5: Commit the hash fix**

```bash
rtk git add scripts/translate-content.mjs scripts/__tests__/translate-content.test.mjs
rtk git commit -m "fix: align blog translation cache hashes"
```

---

### Task 4: Correct The Internship Navigation Anchor

**Files:**
- Modify: `src/config/navigation.ts`
- Create: `src/config/__tests__/navigation.test.ts`

**Interfaces:**
- Consumes: homepage section ID `experience` from `HomePageView.tsx`.
- Produces: `mainNavigation` internship entry targeting `/#experience`.

- [ ] **Step 1: Write the failing navigation test**

Create `src/config/__tests__/navigation.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { mainNavigation } from "../navigation";

describe("main navigation", () => {
  it("links internships to the homepage experience section", () => {
    expect(mainNavigation.find(({ title }) => title === "Internships")?.url).toBe("/#experience");
  });
});
```

- [ ] **Step 2: Run the test and verify the old anchor failure**

Run:

```bash
rtk npm run test:run -- src/config/__tests__/navigation.test.ts
```

Expected: FAIL with received value `/#internships`.

- [ ] **Step 3: Fix the navigation entry**

Change only:

```ts
{ title: "Internships", url: "/#experience" },
```

- [ ] **Step 4: Run the navigation test**

Run:

```bash
rtk npm run test:run -- src/config/__tests__/navigation.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit the anchor fix**

```bash
rtk git add src/config/navigation.ts src/config/__tests__/navigation.test.ts
rtk git commit -m "fix: target the homepage experience section"
```

---

### Task 5: Synchronize Content Maintenance Documentation

**Files:**
- Modify: `README.md`
- Modify: `CONTRIBUTING.md`
- Delete: `.github/workflows/scrape_talks.yml`

**Interfaces:**
- Consumes: final paths, selector-backed profile structure, Blog filename route behavior, and repository commands from Tasks 1-4.
- Produces: accurate tracked maintenance guidance for future changes.

- [ ] **Step 1: Correct the README structure map**

Replace the route-group line with separate current locations:

```md
- `src/app/(subpages)/` - secondary pages such as CV and publications
- `src/app/insights/` - default-locale Insights index and article routes
- `src/app/[locale]/` - static English and Chinese route variants
```

Change the `content/` description from future content to current Blog source content.

- [ ] **Step 2: Add concise common content maintenance instructions**

Insert before `## Bilingual Site`:

````md
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
`authorship`, `title`, and `description`. The entry will appear on the homepage,
CV, and publications page.

After changing profile content, run:

```bash
npm run test:run
npm run build
```
````

- [ ] **Step 3: Replace the Blog authoring section with the exact workflow**

Use this minimal source example:

````md
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
````

Keep the existing MiMo environment-variable explanation immediately after this workflow.

- [ ] **Step 4: Replace stale contribution guidance**

Replace `CONTRIBUTING.md` with:

```md
# Contributing

This repository is HongYu Liu's personal Next.js website. Keep changes focused
and preserve the static GitHub Pages export.

## Development

1. Install dependencies with `npm install`.
2. Run the site with `npm run dev`.
3. Run `npm run test:run` and `npm run build` before opening a pull request.

Profile content belongs in `src/config/profile.ts`. Blog source belongs in
`content/posts/`, with reviewed translation caches committed under
`content/generated/translations/posts/`. See `README.md` for the authoring
workflow.

Do not commit API keys, `.env.local` files, build output, or local diagnostic
files.
```

- [ ] **Step 5: Delete the obsolete talk-scraping workflow**

Delete `.github/workflows/scrape_talks.yml`. Do not modify the active deployment workflow.

- [ ] **Step 6: Validate documentation references**

Run:

```bash
rtk rg -n "academicpages|Jekyll|talkmap|_talks|/#internships" README.md CONTRIBUTING.md .github src/config
rtk git diff --check
```

Expected: no stale tracked references in the searched maintenance surfaces and no whitespace errors. The historical dated design files are intentionally outside this scan.

- [ ] **Step 7: Commit the documentation synchronization**

```bash
rtk git add README.md CONTRIBUTING.md .github/workflows/scrape_talks.yml
rtk git commit -m "docs: document routine content maintenance"
```

---

### Task 6: Run Final Repository Verification

**Files:**
- Verify only; modify a task-owned file only when a failing check exposes an issue caused by this plan.

**Interfaces:**
- Consumes: all deliverables from Tasks 1-5.
- Produces: verified static site and a concise implementation summary.

- [ ] **Step 1: Run the full test suite**

```bash
rtk npm run test:run
```

Expected: every Vitest file and test passes.

- [ ] **Step 2: Run the production static build**

```bash
rtk npm run build
```

Expected: Next.js compilation, type checking, static generation, export, and sitemap postbuild complete successfully.

- [ ] **Step 3: Check diff quality and repository state**

```bash
rtk git diff --check
rtk git status --short
```

Expected: no whitespace errors. Only the user's pre-existing untracked `.claude/`, `.pnpm-store/`, and `output/` paths may remain outside the plan's commits.

- [ ] **Step 4: Review the final commit sequence**

```bash
rtk git log -7 --oneline
```

Expected: the two design commits, one plan commit, and focused implementation commits for profile content, page migration, Blog hash, navigation, and documentation.
