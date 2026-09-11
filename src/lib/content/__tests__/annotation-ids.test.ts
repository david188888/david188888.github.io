import { describe, expect, it } from "vitest";
import { createAnnotationIdFactory, stableHash } from "../annotation-ids.mjs";

describe("stableHash", () => {
  it("is deterministic for the same input", () => {
    expect(stableHash("上下文内存")).toBe(stableHash("上下文内存"));
  });

  it("differs for different inputs", () => {
    expect(stableHash("风险")).not.toBe(stableHash("机会"));
  });

  it("handles empty and long strings without throwing", () => {
    expect(stableHash("")).toMatch(/^[a-z0-9]{7}$/);
    expect(stableHash("文".repeat(5000))).toMatch(/^[a-z0-9]{7}$/);
  });

  it("rejects non-strings", () => {
    expect(() => stableHash(123)).toThrow(TypeError);
  });
});

describe("createAnnotationIdFactory", () => {
  it("prefixes the kind and the hash", () => {
    expect(createAnnotationIdFactory()("mk", "风险")).toMatch(/^mk-[a-z0-9]{7}-1$/);
  });

  it("numbers duplicate content separately", () => {
    const next = createAnnotationIdFactory();

    expect(next("mk", "风险")).toBe(next("mk", "风险").replace(/-2$/, "-1"));
    expect(next("mk", "风险")).toMatch(/-3$/);
  });

  it("treats the same content in different kinds as separate sequences", () => {
    const next = createAnnotationIdFactory();

    expect(next("mk", "同一段文字")).toMatch(/^mk-.+-1$/);
    expect(next("note", "同一段文字")).toMatch(/^note-.+-1$/);
  });

  it("restarts occurrence numbering for a new factory, which is one page render", () => {
    const first = createAnnotationIdFactory();
    first("mk", "风险");

    expect(createAnnotationIdFactory()("mk", "风险")).toMatch(/-1$/);
  });
});
