/**
 * The domain glossary: the terms a translation must not get wrong.
 *
 * Hy-MT2 has no offline glossary feature — the hosted glossary API belongs to
 * `hy-mt2-plus`, which is not what runs here — so terms ride inside the prompt
 * through the official terminology template
 * (``参考下面的翻译：`X` 翻译成 `Y` `` / ``Reference the following translations:
 * `X` translates to `Y` ``). Hy-MT2 is instruction-tuned for exactly this, and
 * a prompt-side glossary keeps the build offline and reproducible.
 *
 * Why this lives in `src/lib/content` instead of `scripts/`: the glossary is
 * part of the translation cache's identity. `translation-cache.mjs` folds
 * `TRANSLATION_GLOSSARY_VERSION` into the freshness check, and the site loader
 * imports that module, so both sides must read the same glossary to agree on
 * whether a cache is still valid.
 *
 * Two failures motivated this file, both visible in the published English:
 *
 *   - `长鑫` was translated as `GigaDevice`, which is a different company
 *     (兆易创新). The source means 长鑫存储 / 长鑫科技 (SSE: 688825), whose
 *     English trade name is CXMT.
 *   - `端侧` came out as `edge side`, `Edge-side`, `client side`, `device side`
 *     and `on-device` inside one article, because every unit is translated in
 *     its own call and nothing carried a decision across them.
 *
 * Design rules, each one paid for by an experiment:
 *
 *   - Only the terms a unit's own text contains are injected. Handing the model
 *     the whole table made it invent words: given a paragraph that only says
 *     端侧, the full table produced "On-device chips".
 *   - Entries define one canonical target spelling per side and any number of
 *     source-side aliases. Aliases inside one entry may overlap (长鑫 is part of
 *     长鑫存储) because they resolve to the same target. Aliases in *different*
 *     entries may overlap only when the narrower entry's target builds on the
 *     broader one — `端侧设备` → `on-device hardware` next to `端侧` →
 *     `on-device` — so the two instructions agree instead of contradicting each
 *     other. `translation-glossary.test.ts` enforces both halves of that rule:
 *     two entries matching one passage with unrelated targets is a bug, because
 *     the model then receives two instructions that fight.
 *   - Collocations need their own entry. Told only `端侧` → `on-device`, the
 *     model renders `端侧设备` as "on-device devices"; the phrase entry is what
 *     fixes it, not a longer forbid list.
 *   - `enforce` and `forbid` are opt-in per entry and checked offline. They are
 *     deliberately conservative: a false positive refuses to write the cache
 *     and stops the run, so only unambiguous mistakes earn a rule.
 */

import { createHash } from "node:crypto";

/**
 * The glossary itself.
 *
 * `zh` / `en` list the spellings that may appear on each side; the first target
 * entry is the canonical one. `enforce` names the side whose canonical spelling
 * a translation must contain, and `forbid` lists spellings that must not appear
 * in it.
 */
export const TRANSLATION_GLOSSARY = [
  {
    zh: ["长鑫存储", "长鑫科技", "长鑫"],
    en: ["CXMT"],
    enforce: "en",
    // 兆易创新 is the company GigaDevice, not the DRAM maker the source means.
    forbid: { en: ["GigaDevice", "ChangXin Memory"] },
  },
  {
    zh: ["端侧设备"],
    en: ["on-device hardware"],
  },
  {
    zh: ["端侧"],
    en: ["on-device"],
    enforce: "en",
    // Attaching the term to a device noun twice ("on-device devices") reads as a
    // mistake; the model produced it from the bare term in the SVG description.
    forbid: { en: ["on-device device", "on-device devices"] },
  },
];

/** Escapes a literal for use inside a RegExp. */
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Matches a term at a word boundary, treating an inner hyphen as a separator.
 *
 * The lookarounds are what keep `cutting-edge technologies` from tripping a
 * rule about `edge`, and what stop `on-device` from matching inside a longer
 * identifier.
 */
function wordBounded(value) {
  return new RegExp(`(?<![\\w-])${escapeRegExp(value)}(?![\\w-])`, "i");
}

/**
 * Matches a canonical spelling, tolerating a hyphen or a space between its
 * words (`on-device`, `on device`, `On-Device`).
 */
function canonicalPresent(text, target) {
  const pattern = target.split(/[-\s]+/).map(escapeRegExp).join("[-\\s]");
  return new RegExp(`(?<![\\w-])${pattern}(?![\\w-])`, "i").test(text);
}

/** Whether one source-side spelling occurs in the text. */
function matchesKey(text, key, sourceLanguage) {
  if (sourceLanguage === "zh") return text.includes(key);
  return wordBounded(key).test(text);
}

/**
 * The terms one unit's own text calls for, longest alias first.
 *
 * The result depends only on the text and the table — never on which other
 * units happen to be translated in the same batch — because it feeds the unit's
 * cache key. A selection that varied by batch would change the prompt while
 * leaving the key alone, which is undetectable drift.
 */
export function selectGlossaryTerms(text, sourceLanguage, entries = TRANSLATION_GLOSSARY) {
  const sourceSide = sourceLanguage === "zh" ? "zh" : "en";
  const targetSide = sourceSide === "zh" ? "en" : "zh";
  const matched = [];

  for (const entry of entries) {
    const key = entry[sourceSide]
      .filter((candidate) => matchesKey(text, candidate, sourceLanguage))
      .sort((a, b) => b.length - a.length)[0];

    if (!key) continue;

    matched.push({
      source: key,
      target: entry[targetSide][0],
      enforce: entry.enforce === targetSide,
      forbid: entry.forbid?.[targetSide] ?? [],
    });
  }

  return matched.sort((a, b) => b.source.length - a.source.length || a.source.localeCompare(b.source));
}

/** Sorted, whitespace-free form so cosmetic edits never change a hash. */
function canonicalEntry(entry) {
  return {
    zh: [...entry.zh].sort(),
    en: [...entry.en].sort(),
    enforce: entry.enforce ?? null,
    forbid: entry.forbid
      ? Object.fromEntries(
          Object.entries(entry.forbid)
            .map(([side, values]) => [side, [...values].sort()])
            .sort(([a], [b]) => a.localeCompare(b))
        )
      : null,
  };
}

/** Identity of the whole table, for the document-level freshness check. */
export function createGlossaryHash(entries = TRANSLATION_GLOSSARY) {
  const canonical = entries
    .map(canonicalEntry)
    .sort((a, b) => (a.zh[0] ?? "").localeCompare(b.zh[0] ?? ""));

  return createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
}

/**
 * Identity of the terms selected for one unit, for the content-addressed unit
 * key. Empty when nothing matched, so a unit without terms keys exactly like it
 * did before the glossary existed.
 */
export function createTermsHash(terms) {
  if (!Array.isArray(terms) || terms.length === 0) return "";

  const canonical = [...terms]
    .map((term) => ({
      source: term.source,
      target: term.target,
      enforce: Boolean(term.enforce),
      forbid: [...term.forbid].sort(),
    }))
    .sort((a, b) => a.source.localeCompare(b.source));

  return createHash("sha256").update(JSON.stringify(canonical)).digest("hex").slice(0, 8);
}

/**
 * The prompt-side terminology block, following the official template verbatim.
 *
 * Hy-MT2 echoes loosely worded instruction text into the body, so the block is
 * the published wording and nothing else, and it is placed as its own leading
 * paragraph — never merged into the `，并且…` clause chain, whose contents are
 * asserted to be example-free.
 */
export function buildTerminologyBlock(terms, sourceLanguage) {
  if (!Array.isArray(terms) || terms.length === 0) return "";

  const header = sourceLanguage === "zh" ? "参考下面的翻译：" : "Reference the following translations:";
  const lines = terms.map((term) =>
    sourceLanguage === "zh"
      ? `\`${term.source}\` 翻译成 \`${term.target}\``
      : `\`${term.source}\` translates to \`${term.target}\``
  );

  return [header, ...lines].join("\n");
}

export const TRANSLATION_GLOSSARY_VERSION = createGlossaryHash().slice(0, 8);

/**
 * Rejects a translation that contradicts the glossary.
 *
 * This is the only check that looks at meaning rather than structure, and it
 * runs on reused cache entries too: the cache otherwise freezes a one-off
 * mistake forever, because a unit's key only changes when its source or its
 * terms change.
 */
export function validateGlossaryTerms({ translation, terms, label = "译文" }) {
  if (!Array.isArray(terms) || terms.length === 0) return;

  const problems = [];

  for (const term of terms) {
    for (const forbidden of term.forbid) {
      if (wordBounded(forbidden).test(translation)) {
        problems.push(`「${term.source}」译成了被禁形式「${forbidden}」，应为「${term.target}」`);
      }
    }

    if (term.enforce && !canonicalPresent(translation, term.target)) {
      problems.push(`「${term.source}」未使用规范译法「${term.target}」`);
    }
  }

  if (problems.length > 0) {
    throw new Error(`${label}未通过术语检查：${problems.join("；")}。已拒绝写入缓存。`);
  }
}
