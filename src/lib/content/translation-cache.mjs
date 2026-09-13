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
 *
 * On top of those, three checks live here so the script and the site cannot
 * disagree about them:
 *
 *   - `TRANSLATION_CACHE_VERSION` — the shape of the document, checked by
 *     `isTranslationCacheFresh`. A bump means the loader cannot read the file.
 *   - `generationRequiresRetranslation` — the model digest and the sampling
 *     parameters. Only the script can observe those (the digest belongs to the
 *     local Ollama), so it is the script that refuses to reuse units when they
 *     move.
 *   - `findCacheInconsistencies` — every unit's translation must actually appear
 *     in the field that publishes it. Both sides run it, because a cache whose
 *     `units` and `body` disagree has no way to say which half is right.
 */

import { createHash } from "node:crypto";
import { TRANSLATION_GLOSSARY_VERSION } from "./translation-glossary.mjs";

/**
 * Cache format version: the shape of the cache document.
 *
 * Bumped only when the loader can no longer read an older file, because the
 * check below rejects a cache whose version differs. It is NOT part of the unit
 * keys, so an additive field never needs a bump and never forces a
 * retranslation.
 *
 * Migration path when it does have to move: bump this constant, then run
 * `npm run translate:content`. The script treats a cache it cannot read as an
 * empty one (it never trusts a foreign shape), retranslates the post and
 * rewrites the file; until then the target-language page fails the build with a
 * message pointing at the script.
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
 * The format version is checked here because both sides must agree that the file
 * shape is one they understand; a mismatch means "re-run the script", never
 * "read it anyway".
 *
 * @param {unknown} cache
 * @param {{ sourceHash: string, targetLanguage: string, model?: string, pipelineVersion?: string, glossaryVersion?: string, cacheVersion?: number }} expected
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
    cacheVersion = TRANSLATION_CACHE_VERSION,
  }
) {
  if (!cache || typeof cache !== "object") {
    return false;
  }

  const document = /** @type {Record<string, unknown>} */ (cache);

  if (document.version !== cacheVersion) return false;
  if (document.sourceHash !== sourceHash) return false;
  if (document.targetLanguage !== targetLanguage) return false;
  if (typeof document.body !== "string" || document.body.length === 0) return false;
  if (document.pipeline !== pipelineVersion) return false;
  if (document.glossary !== glossaryVersion) return false;
  if (model !== undefined && document.model !== model) return false;

  return true;
}

/**
 * The generation identity of a cache: what produced the text besides the source
 * and the prompts.
 *
 * Two inputs change the output without changing any unit's source:
 *
 *   - `parameters` — the sampling parameters (`GENERATION_PARAMETERS`).
 *   - `modelDigest` — the digest Ollama reports for the model. It changes when
 *     the model is re-created from an edited Modelfile or a different GGUF, so
 *     the model *name* alone is not identity. Recorded as `null` when the server
 *     reported none (a non-Ollama endpoint, or an unreachable server) rather
 *     than pretending it matched.
 *
 * The unit keys deliberately do not carry this: every unit is affected the same
 * way, so folding it into 87 keys would gain nothing over refusing to reuse any
 * of them. The script compares it once per post instead, and retranslates the
 * whole post when it moved.
 */
export function canonicalGeneration(generation) {
  if (!generation || typeof generation !== "object") return null;

  const parameters = generation.parameters;
  if (!parameters || typeof parameters !== "object") return null;

  return JSON.stringify({
    modelDigest: generation.modelDigest ?? null,
    parameters: Object.keys(parameters)
      .sort()
      .map((name) => [name, parameters[name]]),
  });
}

/**
 * Whether a recorded generation moved in a way that makes every cached unit
 * stale.
 *
 * Two rules matter as much as the comparison itself:
 *
 *   - Nothing recorded means nothing to compare. A cache written before this
 *     field existed adopts today's values instead of retranslating for a field
 *     that was never there; `hasGeneration` tells the two cases apart.
 *   - An unreadable digest is unknown, not changed. Only two *known* and
 *     different digests force a retranslation, so an endpoint that stops
 *     reporting digests cannot silently throw the whole cache away.
 */
export function generationRequiresRetranslation(recorded, current) {
  if (canonicalGeneration(recorded) === null) return false;
  if (canonicalGeneration(current) === null) return false;
  if (canonicalGeneration(recorded) === canonicalGeneration(current)) return false;

  const parameters = (generation) =>
    canonicalGeneration({ parameters: generation.parameters, modelDigest: null });

  if (parameters(recorded) !== parameters(current)) return true;

  return (
    recorded.modelDigest != null &&
    current.modelDigest != null &&
    recorded.modelDigest !== current.modelDigest
  );
}

/** Whether a cache recorded a generation identity at all. */
export function hasGeneration(cache) {
  return canonicalGeneration(cache?.generation) !== null;
}

/** Unit kinds, and the cache field each one's translation is published in. */
const PUBLISHED_FIELD_BY_KIND = {
  title: "title",
  excerpt: "excerpt",
  prose: "body",
  fenced: "body",
  htmltext: "body",
};

/**
 * Decodes the character references the writer escapes exactly once, so a label
 * stored decoded in the units and escaped in the body still compares equal.
 * Comparison only: nothing decoded here is ever written back.
 */
function decodeForComparison(value) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

/**
 * Lists the places where a cache contradicts itself.
 *
 * The site publishes `body`, `title`, `excerpt` and `tags`; the units hold the
 * translations those fields were assembled from. Nothing used to check that the
 * two agree, so an edited body, an edited unit, or a unit that never reached the
 * body would all pass — and the cache has no way to say which half is right.
 * Returns an empty list when the cache is self-consistent.
 */
export function findCacheInconsistencies(cache) {
  if (!cache || typeof cache !== "object") return ["缓存不是一个对象"];

  const units = cache.units;
  if (!units || typeof units !== "object") {
    return ["缓存缺少 units 映射，无法核对 body 是否与译文一致"];
  }

  const problems = [];
  const body = decodeForComparison(typeof cache.body === "string" ? cache.body : "");
  const fields = {
    body,
    title: decodeForComparison(typeof cache.title === "string" ? cache.title.trim() : ""),
    excerpt: decodeForComparison(typeof cache.excerpt === "string" ? cache.excerpt.trim() : ""),
  };
  const tags = Array.isArray(cache.tags) ? cache.tags.map((tag) => String(tag).trim()) : [];

  if (body === "") problems.push("缓存的 body 为空");

  for (const [key, unit] of Object.entries(units)) {
    const short = key.slice(0, 8);

    if (!unit || typeof unit !== "object") {
      problems.push(`单元 ${short} 不是一个对象`);
      continue;
    }

    const kind = String(unit.kind ?? "");
    const translation = typeof unit.translation === "string" ? unit.translation : "";

    if (translation.trim() === "") {
      problems.push(`单元 ${short}（${kind}）没有译文`);
      continue;
    }

    if (kind === "tags") {
      const parts = translation.split("@@").map((part) => part.trim()).filter(Boolean);

      if (parts.length === 0) {
        problems.push(`单元 ${short}（tags）没有译文`);
        continue;
      }

      for (const part of parts) {
        if (!tags.includes(part)) {
          problems.push(`标签单元里的「${part}」没有出现在缓存的 tags 字段里`);
        }
      }
      continue;
    }

    const field = PUBLISHED_FIELD_BY_KIND[kind];
    if (!field) {
      problems.push(`单元 ${short} 的 kind「${kind}」没有登记发布字段`);
      continue;
    }

    if (!fields[field].includes(decodeForComparison(translation.trim()))) {
      problems.push(`${kind} 单元 ${short} 的译文没有出现在缓存的 ${field} 字段里`);
    }
  }

  return problems;
}
