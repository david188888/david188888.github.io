import { describe, expect, it } from "vitest";
import {
  createSourceHash,
  isTranslationCacheFresh,
  TRANSLATION_PIPELINE_VERSION,
} from "../cache";

/** A cache document as the current translation script writes it. */
const freshCache = {
  sourceHash: "abc",
  targetLanguage: "zh",
  pipeline: TRANSLATION_PIPELINE_VERSION,
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
});
