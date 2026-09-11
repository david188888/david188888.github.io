import { describe, expect, it } from "vitest";
import { buildAnchor, resolveQuoteOffsets } from "../anchoring.mjs";
import {
  addLocalAnnotation,
  createEmptyState,
  createLocalId,
  hideIds,
  normaliseState,
  removeLocalAnnotation,
  resolveToolsEnabled,
  restoreIds,
  storageKey,
  toggleHidden,
} from "../state.mjs";

describe("resolveQuoteOffsets", () => {
  const text = "第一段提到台积电。第二段也提到台积电，这次说的是先进封装。";

  it("finds a unique quote", () => {
    expect(resolveQuoteOffsets(text, { quote: "先进封装" })).toEqual({
      start: text.indexOf("先进封装"),
      end: text.indexOf("先进封装") + 4,
    });
  });

  it("disambiguates a repeated quote using surrounding context", () => {
    const offsets = resolveQuoteOffsets(text, {
      quote: "台积电",
      prefix: "第二段也提到",
      suffix: "，这次说的",
    });

    expect(offsets?.start).toBe(text.lastIndexOf("台积电"));
  });

  it("falls back to the first match when no context is stored", () => {
    expect(resolveQuoteOffsets(text, { quote: "台积电" })?.start).toBe(text.indexOf("台积电"));
  });

  it("returns null when the quote is gone from the article", () => {
    expect(resolveQuoteOffsets(text, { quote: "这段话被删掉了" })).toBeNull();
  });

  it("returns null for an empty or malformed anchor", () => {
    expect(resolveQuoteOffsets(text, { quote: "" })).toBeNull();
    expect(resolveQuoteOffsets(text, {})).toBeNull();
    expect(resolveQuoteOffsets(null as unknown as string, { quote: "台积电" })).toBeNull();
  });
});

describe("buildAnchor", () => {
  const text = "0123456789abcdefghij";

  it("captures the quote plus bounded context", () => {
    const anchor = buildAnchor(text, 5, 8, 3);

    expect(anchor).toEqual({ quote: "567", prefix: "234", suffix: "89a" });
  });

  it("clamps context at the document edges", () => {
    expect(buildAnchor(text, 0, 2, 5)).toMatchObject({ quote: "01", prefix: "" });
  });

  it("rejects an inverted or empty range", () => {
    expect(() => buildAnchor(text, 8, 5)).toThrow(RangeError);
    expect(() => buildAnchor(text, 3, 3)).toThrow(RangeError);
  });

  it("round-trips through resolveQuoteOffsets", () => {
    const anchor = buildAnchor(text, 5, 8, 3);

    expect(resolveQuoteOffsets(text, anchor)).toEqual({ start: 5, end: 8 });
  });
});

describe("resolveToolsEnabled", () => {
  it("is off for a visitor who has not signed in", () => {
    expect(resolveToolsEnabled({ search: "" })).toEqual({ enabled: false, fromUrl: false });
  });

  it("is on once the author is signed in, with no parameter needed", () => {
    expect(resolveToolsEnabled({ search: "", authorized: true })).toEqual({
      enabled: true,
      fromUrl: false,
    });
  });

  it("turns on for the URL override on a device without a sign-in", () => {
    expect(resolveToolsEnabled({ search: "?annotate=1" })).toEqual({ enabled: true, fromUrl: true });
    expect(resolveToolsEnabled({ search: "?annotate=on" }).enabled).toBe(true);
  });

  it("turns off when the parameter says so, overriding a signed-in author", () => {
    expect(resolveToolsEnabled({ search: "?annotate=0", authorized: true })).toEqual({
      enabled: false,
      fromUrl: true,
    });
  });

  it("survives unrelated query parameters and a fragment", () => {
    expect(resolveToolsEnabled({ search: "?utm_source=x&annotate=1#section" }).enabled).toBe(true);
  });

  it("ignores an unrecognised value instead of guessing", () => {
    expect(resolveToolsEnabled({ search: "?annotate=maybe", authorized: true })).toEqual({
      enabled: true,
      fromUrl: false,
    });
    expect(resolveToolsEnabled({ search: "?annotate=maybe" }).enabled).toBe(false);
  });

  it("treats a bare annotate parameter as not specified", () => {
    expect(resolveToolsEnabled({ search: "?annotate=", authorized: true }).fromUrl).toBe(false);
  });
});

describe("storage key", () => {
  it("separates posts and locales", () => {
    expect(storageKey("post-a", "zh")).not.toBe(storageKey("post-a", "en"));
    expect(storageKey("post-a", "zh")).not.toBe(storageKey("post-b", "zh"));
  });

  it("is versioned so a shape change cannot be misread", () => {
    expect(storageKey("post-a", "zh")).toContain(":v1:");
  });
});

describe("normaliseState", () => {
  it("returns an empty state for junk input", () => {
    expect(normaliseState(null)).toEqual(createEmptyState());
    expect(normaliseState("nonsense")).toEqual(createEmptyState());
    expect(normaliseState({ hidden: "no", local: 5 })).toEqual(createEmptyState());
  });

  it("deduplicates hidden ids and drops empty ones", () => {
    expect(normaliseState({ hidden: ["mk-a", "mk-a", "", 7] }).hidden).toEqual(["mk-a"]);
  });

  it("drops local entries without an id or a quote", () => {
    const state = normaliseState({
      local: [
        { id: "local-1", quote: "有效" },
        { id: "", quote: "缺少 id" },
        { id: "local-2", quote: "" },
      ],
    });

    expect(state.local).toHaveLength(1);
    expect(state.local[0]).toMatchObject({ id: "local-1", quote: "有效", note: "", prefix: "" });
  });

  it("fills in missing optional fields", () => {
    const [entry] = normaliseState({ local: [{ id: "a", quote: "b" }] }).local;

    expect(entry).toEqual({ id: "a", quote: "b", prefix: "", suffix: "", note: "", createdAt: 0 });
  });
});

describe("hidden mark state", () => {
  const base = { hidden: ["mk-a"], local: [] };

  it("toggles an id on and off", () => {
    const on = toggleHidden(base, "note-b");
    expect(on.hidden).toEqual(["mk-a", "note-b"]);
    expect(toggleHidden(on, "mk-a").hidden).toEqual(["note-b"]);
  });

  it("does not mutate the input state", () => {
    toggleHidden(base, "note-b");
    expect(base.hidden).toEqual(["mk-a"]);
  });

  it("adds and removes batches", () => {
    const hidden = hideIds(base, ["note-b", "note-b", "mk-a"]);
    expect(hidden.hidden).toEqual(["mk-a", "note-b"]);
    expect(restoreIds(hidden, ["mk-a"]).hidden).toEqual(["note-b"]);
  });
});

describe("local annotations", () => {
  const annotation = { id: "local-1", quote: "一段话", prefix: "", suffix: "", note: "", createdAt: 1 };

  it("prepends a new annotation", () => {
    const state = addLocalAnnotation(createEmptyState(), annotation);
    expect(state.local.map((entry) => entry.id)).toEqual(["local-1"]);
  });

  it("removes by id", () => {
    const state = addLocalAnnotation(createEmptyState(), annotation);
    expect(removeLocalAnnotation(state, "local-1").local).toEqual([]);
    expect(removeLocalAnnotation(state, "missing").local).toHaveLength(1);
  });

  it("builds ids that cannot collide with published model ids", () => {
    const id = createLocalId(() => 1_700_000_000_000, () => 0.5);
    expect(id).toMatch(/^local-/);
    expect(id).not.toMatch(/^mk-|^note-/);
  });
});
