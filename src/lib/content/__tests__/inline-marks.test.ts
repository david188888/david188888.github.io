import { describe, expect, it } from "vitest";
import {
  DEFAULT_MARK_COLOR,
  MARK_COLORS,
  extractInlineMarks,
  formatInlineMark,
  restoreInlineMarks,
  validateInlineMarks,
} from "../inline-marks.mjs";

describe("extractInlineMarks", () => {
  it("treats a bare ==text== as the default color", () => {
    const { text, marks } = extractInlineMarks("前面 ==重点== 后面");

    expect(marks).toEqual([{ color: DEFAULT_MARK_COLOR, content: "重点" }]);
    expect(text).not.toContain("==");
    expect(text).toContain("前面 ");
    expect(text).toContain(" 后面");
  });

  it("reads an explicit color prefix", () => {
    const { marks } = extractInlineMarks("==red|风险== 和 ==green|机会==");

    expect(marks).toEqual([
      { color: "red", content: "风险" },
      { color: "green", content: "机会" },
    ]);
  });

  it("accepts every whitelisted color", () => {
    for (const color of MARK_COLORS) {
      const { marks } = extractInlineMarks(`==${color}|文字==`);
      expect(marks).toEqual([{ color, content: "文字" }]);
    }
  });

  it("keeps mark content untouched so inline markdown inside still works", () => {
    const { marks } = extractInlineMarks("==red|**加粗**的==文字");

    expect(marks).toEqual([{ color: "red", content: "**加粗**的" }]);
  });

  it("ignores == inside backtick code spans", () => {
    const { text, marks } = extractInlineMarks("用 `==不是标记==` 表示");

    expect(marks).toEqual([]);
    expect(text).toBe("用 `==不是标记==` 表示");
  });

  it("ignores == inside double-backtick code spans", () => {
    const { text, marks } = extractInlineMarks("``a == b`` 是代码");

    expect(marks).toEqual([]);
    expect(text).toBe("``a == b`` 是代码");
  });

  it("still finds marks that follow a code span", () => {
    const { marks } = extractInlineMarks("`x == y` 然后 ==强调==");

    expect(marks).toEqual([{ color: DEFAULT_MARK_COLOR, content: "强调" }]);
  });

  it("throws on an unclosed mark", () => {
    expect(() => extractInlineMarks("这里 ==没有闭合")).toThrow(/没有闭合/);
  });

  it("throws on an unknown color name instead of rendering it literally", () => {
    expect(() => extractInlineMarks("==rede|拼错的颜色==")).toThrow(/不在允许列表内/);
  });

  it("throws on an empty mark", () => {
    expect(() => extractInlineMarks("空标记 ==== 结束")).toThrow(/内容为空/);
  });

  it("throws on an empty mark with a color prefix", () => {
    expect(() => extractInlineMarks("==red|==")).toThrow(/内容为空/);
  });

  it("treats a leading word that is not letters-only as ordinary content", () => {
    const { marks } = extractInlineMarks("==a-b|c== 是正文不是颜色");

    expect(marks).toEqual([{ color: DEFAULT_MARK_COLOR, content: "a-b|c" }]);
  });
});

describe("validateInlineMarks", () => {
  it("passes valid input", () => {
    expect(() => validateInlineMarks("==red|风险== 与普通文本")).not.toThrow();
  });

  it("rejects invalid input", () => {
    expect(() => validateInlineMarks("==red|风险")).toThrow(/没有闭合/);
  });
});

describe("restoreInlineMarks", () => {
  it("wraps mark content with the color class", () => {
    const { text, marks } = extractInlineMarks("a ==red|b== c");
    const html = restoreInlineMarks(text, marks, (content) => `<em>${content}</em>`);

    expect(html).toBe('a <span class="mk mk-red"><em>b</em></span> c');
  });

  it("throws when a sentinel has no matching mark", () => {
    expect(() => restoreInlineMarks("\uE0009\uE001", [], (content) => content)).toThrow(
      /找不到序号 9/
    );
  });
});

describe("formatInlineMark", () => {
  it("always writes an explicit color so converter output is stable", () => {
    expect(formatInlineMark("风险", "red")).toBe("==red|风险==");
  });

  it("defaults to the default color", () => {
    expect(formatInlineMark("重点")).toBe(`==${DEFAULT_MARK_COLOR}|重点==`);
  });

  it("rejects an unknown color", () => {
    expect(() => formatInlineMark("x", "chartreuse")).toThrow(/不在允许列表内/);
  });

  it("round-trips through the parser", () => {
    const source = formatInlineMark("上下文内存", "red");
    const { marks } = extractInlineMarks(source);

    expect(marks).toEqual([{ color: "red", content: "上下文内存" }]);
  });
});
