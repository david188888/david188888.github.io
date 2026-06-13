import { describe, expect, it } from "vitest";
import { createSourceHash, isTranslationCacheFresh } from "../cache";

describe("translation cache", () => {
  it("creates stable source hashes", () => {
    expect(createSourceHash("hello")).toBe(createSourceHash("hello"));
    expect(createSourceHash("hello")).not.toBe(createSourceHash("hello!"));
  });

  it("treats matching source hash and target as fresh", () => {
    expect(
      isTranslationCacheFresh(
        { sourceHash: "abc", targetLanguage: "zh", body: "你好" },
        { sourceHash: "abc", targetLanguage: "zh" }
      )
    ).toBe(true);
  });

  it("treats changed source hash as stale", () => {
    expect(
      isTranslationCacheFresh(
        { sourceHash: "abc", targetLanguage: "zh", body: "你好" },
        { sourceHash: "def", targetLanguage: "zh" }
      )
    ).toBe(false);
  });
});
