/**
 * The translation-cache contract, shared by the build-time translator
 * (`scripts/translate-content.mjs`) and the site loader
 * (`src/lib/content/posts.ts`).
 *
 * The two used to re-implement the same hash and freshness rules separately,
 * which meant a change to one could silently disagree with the other. They now
 * import this module so the cache the script writes is exactly the cache the
 * site accepts.
 *
 * Two levels of cache identity exist:
 *
 *   - `createSourceHash` — SHA-256 of one whole MDX file. It answers "does this
 *     cache describe the current source document?". A miss means the post must
 *     be re-run through the script, but it does NOT mean every paragraph has to
 *     be retranslated: the per-unit cache below decides that.
 *
 *   - `createUnitKey` — a content address for one translation unit (a title, a
 *     paragraph, a diagram label, ...). Because the key is derived from the
 *     unit's own text, editing one paragraph reuses every other unit even when
 *     units shift position in the document.
 */

import { createHash } from "node:crypto";
import { TRANSLATION_GLOSSARY_VERSION } from "./translation-glossary.mjs";

/**
 * Cache format version. Bumped when the shape of the cache JSON changes.
 * Written to every cache file so a future format change can migrate instead of
 * guessing.
 */
export const TRANSLATION_CACHE_VERSION = 2;

/**
 * Pipeline version. Bump it whenever the prompts, the unit segmentation, or the
 * validators change in a way that makes previously written translations stale.
 *
 * It participates in the whole-post freshness check AND in every unit key, so a
 * bump forces a clean retranslation instead of silently reusing output produced
 * by an older pipeline. Glossary edits do not need a manual bump: the glossary
 * has its own version, derived from its contents.
 */
export const TRANSLATION_PIPELINE_VERSION = "hy-mt2-v3";

/**
 * SHA-256 of a raw source document.
 *
 * @param {string} source
 * @returns {string}
 */
export function createSourceHash(source) {
  if (typeof source !== "string") {
    throw new TypeError("createSourceHash expects a raw source string.");
  }

  return createHash("sha256").update(source).digest("hex");
}

/**
 * Content address for one translation unit.
 *
 * Every input that can change the produced text is folded into the key: the
 * pipeline version, the model, the unit kind, the section context, the source
 * text, and the hash of the glossary terms injected into that unit's prompt.
 * Two units with the same key are interchangeable, so the cached translation
 * can be reused wherever the key reappears.
 *
 * `termsHash` has no default on purpose: a caller that forgets it would key its
 * units differently from one that passes it, and the mismatch would be silent.
 *
 * @param {{ kind: string, source: string, context?: string, model?: string, termsHash: string, pipelineVersion?: string }} unit
 * @returns {string}
 */
export function createUnitKey({
  kind,
  source,
  context = "",
  model,
  termsHash,
  pipelineVersion = TRANSLATION_PIPELINE_VERSION,
}) {
  if (typeof termsHash !== "string") {
    throw new TypeError(
      "createUnitKey requires termsHash (the hash of the glossary terms for this unit; pass an empty string when none matched)."
    );
  }

  const hash = createHash("sha256");

  for (const part of [pipelineVersion, model ?? "", kind, context, source, termsHash]) {
    hash.update(String(part));
    hash.update("\n");
  }

  return hash.digest("hex");
}

/**
 * Whether a cache document can be used verbatim for the given source.
 *
 * `model` is optional: the site loader does not know (or care) which local model
 * produced a cache, while the translation script passes it so switching models
 * re-runs the post.
 *
 * `glossaryVersion` defaults to the current glossary, so the site rejects a
 * cache written before a glossary edit without having to be told — that is what
 * keeps an edited glossary from silently republishing translations produced
 * under the old one.
 *
 * @param {unknown} cache
 * @param {{ sourceHash: string, targetLanguage: string, model?: string, pipelineVersion?: string, glossaryVersion?: string }} expected
 * @returns {boolean}
 */
export function isTranslationCacheFresh(
  cache,
  {
    sourceHash,
    targetLanguage,
    model,
    pipelineVersion = TRANSLATION_PIPELINE_VERSION,
    glossaryVersion = TRANSLATION_GLOSSARY_VERSION,
  }
) {
  if (!cache || typeof cache !== "object") {
    return false;
  }

  const document = /** @type {Record<string, unknown>} */ (cache);

  if (document.sourceHash !== sourceHash) return false;
  if (document.targetLanguage !== targetLanguage) return false;
  if (typeof document.body !== "string" || document.body.length === 0) return false;
  if (document.pipeline !== pipelineVersion) return false;
  if (document.glossary !== glossaryVersion) return false;
  if (model !== undefined && document.model !== model) return false;

  return true;
}
