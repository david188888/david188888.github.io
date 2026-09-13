import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  canonicalGeneration,
  createSourceHash,
  findCacheInconsistencies,
  generationRequiresRetranslation,
  hasGeneration,
  isTranslationCacheFresh,
  TRANSLATION_CACHE_VERSION,
  TRANSLATION_GLOSSARY_VERSION,
  TRANSLATION_PIPELINE_VERSION,
} from "../cache";

/** A cache document as the current translation script writes it. */
const freshCache = {
  version: TRANSLATION_CACHE_VERSION,
  sourceHash: "abc",
  targetLanguage: "zh",
  pipeline: TRANSLATION_PIPELINE_VERSION,
  glossary: TRANSLATION_GLOSSARY_VERSION,
  body: "你好",
};

describe("translation cache", () => {
  it("creates stable source hashes", () => {
    expect(createSourceHash("hello")).toBe(createSourceHash("hello"));
    expect(createSourceHash("hello")).not.toBe(createSourceHash("hello!"));
  });

  it("treats matching source hash and target as fresh", () => {
    expect(isTranslationCacheFresh(freshCache, { sourceHash: "abc", targetLanguage: "zh" })).toBe(true);
  });

  it("treats changed source hash as stale", () => {
    expect(isTranslationCacheFresh(freshCache, { sourceHash: "def", targetLanguage: "zh" })).toBe(false);
  });

  it("treats a cache written by an older pipeline as stale", () => {
    expect(
      isTranslationCacheFresh({ ...freshCache, pipeline: undefined }, { sourceHash: "abc", targetLanguage: "zh" })
    ).toBe(false);
    expect(
      isTranslationCacheFresh({ ...freshCache, pipeline: "hy-mt2-v1" }, { sourceHash: "abc", targetLanguage: "zh" })
    ).toBe(false);
  });

  it("ignores a cache with no body", () => {
    expect(
      isTranslationCacheFresh({ ...freshCache, body: "" }, { sourceHash: "abc", targetLanguage: "zh" })
    ).toBe(false);
  });

  it("treats a cache written under a different glossary as stale", () => {
    // Editing the glossary has to invalidate caches produced under the old one,
    // otherwise the site keeps publishing the previous wording.
    expect(
      isTranslationCacheFresh(
        { ...freshCache, glossary: "00000000" },
        { sourceHash: "abc", targetLanguage: "zh" }
      )
    ).toBe(false);
    expect(
      isTranslationCacheFresh(
        { ...freshCache, glossary: undefined },
        { sourceHash: "abc", targetLanguage: "zh" }
      )
    ).toBe(false);
  });

  it("treats a cache written in a format this loader cannot read as stale", () => {
    expect(
      isTranslationCacheFresh(
        { ...freshCache, version: TRANSLATION_CACHE_VERSION + 1 },
        { sourceHash: "abc", targetLanguage: "zh" }
      )
    ).toBe(false);

    const { version: _dropped, ...unversioned } = freshCache;
    expect(isTranslationCacheFresh(unversioned, { sourceHash: "abc", targetLanguage: "zh" })).toBe(false);
  });
});

describe("generation identity", () => {
  const generation = { parameters: { temperature: 0.7, top_k: 20 }, modelDigest: "aa" };

  it("ignores the field order, and admits no identity when none was recorded", () => {
    expect(canonicalGeneration({ parameters: { top_k: 20, temperature: 0.7 }, modelDigest: "aa" })).toBe(
      canonicalGeneration(generation)
    );
    expect(canonicalGeneration(null)).toBeNull();
    expect(canonicalGeneration({ modelDigest: "aa" })).toBeNull();
    expect(hasGeneration({ generation })).toBe(true);
    expect(hasGeneration({})).toBe(false);
  });

  it("does not retranslate while the generation is unchanged", () => {
    expect(generationRequiresRetranslation(generation, generation)).toBe(false);
    expect(generationRequiresRetranslation({ ...generation }, { ...generation })).toBe(false);
  });

  it("retranslates when the sampling parameters moved", () => {
    expect(
      generationRequiresRetranslation({ ...generation, parameters: { temperature: 0.7, top_k: 40 } }, generation)
    ).toBe(true);
    expect(
      generationRequiresRetranslation({ ...generation, parameters: { temperature: 1, top_k: 20 } }, generation)
    ).toBe(true);
  });

  it("retranslates when the model digest moved", () => {
    expect(generationRequiresRetranslation({ ...generation, modelDigest: "bb" }, generation)).toBe(true);
  });

  it("adopts today's values for a cache that recorded nothing", () => {
    // A cache written before the field existed cannot claim a mismatch, and
    // retranslating everything because a field was absent would be a surprise.
    expect(generationRequiresRetranslation(undefined, generation)).toBe(false);
    expect(generationRequiresRetranslation({ modelDigest: "aa" }, generation)).toBe(false);
  });

  it("treats an unreadable digest as unknown rather than changed", () => {
    // An endpoint that stops reporting digests must not throw the cache away.
    expect(generationRequiresRetranslation(generation, { ...generation, modelDigest: null })).toBe(false);
  });
});

describe("cache self-consistency", () => {
  const cache = () => ({
    version: TRANSLATION_CACHE_VERSION,
    body: "<p>一段译文</p>\n## 小节标题",
    title: "标题",
    excerpt: "摘要",
    tags: ["AI", "Chips"],
    units: {
      a: { kind: "prose", translation: "一段译文" },
      b: { kind: "fenced", translation: "## 小节标题" },
      c: { kind: "htmltext", translation: "一段译文" },
      d: { kind: "title", translation: "标题" },
      e: { kind: "excerpt", translation: "摘要" },
      f: { kind: "tags", translation: "AI @@ Chips" },
    },
  });

  it("accepts a cache whose units back every published field", () => {
    expect(findCacheInconsistencies(cache())).toEqual([]);
  });

  it("catches a unit that never reached the body", () => {
    const broken = cache();
    broken.units.g = { kind: "prose", translation: "这句没进正文" };

    expect(findCacheInconsistencies(broken)).toEqual([
      expect.stringContaining("没有出现在缓存的 body 字段里"),
    ]);
  });

  it("catches a body edited away from its units", () => {
    const broken = cache();
    broken.body = "<p>手改过的正文</p>";

    expect(findCacheInconsistencies(broken).length).toBeGreaterThan(0);
  });

  it("catches a tag the tags field does not carry", () => {
    const broken = cache();
    broken.units.f = { kind: "tags", translation: "AI @@ 端侧" };

    expect(findCacheInconsistencies(broken)).toEqual([expect.stringContaining("端侧")]);
  });

  it("catches a cache with no units at all, or a unit with no translation", () => {
    expect(findCacheInconsistencies({ body: "x" })).toEqual([expect.stringContaining("缺少 units")]);
    expect(findCacheInconsistencies({ body: "x", units: { a: { kind: "prose", translation: "  " } } })).toEqual([
      expect.stringContaining("没有译文"),
    ]);
  });

  it("sees through an entity escape difference between units and body", () => {
    const escaped = cache();
    escaped.body = `${escaped.body}\n<p>R&amp;D 预算</p>`;
    escaped.units.g = { kind: "fenced", translation: "R&D 预算" };

    expect(findCacheInconsistencies(escaped)).toEqual([]);
  });

  it("keeps every committed cache consistent with its own units", () => {
    const names = readdirSync("content/generated/translations/posts").filter((name) => name.endsWith(".json"));

    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      const committed = JSON.parse(readFileSync(`content/generated/translations/posts/${name}`, "utf8"));

      expect(findCacheInconsistencies(committed), name).toEqual([]);
    }
  });
});
