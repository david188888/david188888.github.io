/**
 * Canonical inline mark syntax, shared by the post renderer
 * (`src/lib/content/posts.ts`) and the Notion -> MDX converter
 * (`scripts/notion-to-mdx.mjs`).
 *
 * Exactly two inline forms exist:
 *
 *   ==text==          colored underline, default color
 *   ==color|text==    colored underline, explicit color
 *
 * Block-level margin notes use `^[...]` and are assembled by the block
 * renderer, not by this module.
 *
 * Design rules:
 *   - One canonical form. Notion colors are normalized *before* they reach
 *     this syntax, so the renderer never has to understand Notion.
 *   - Code spans win. `==` inside backticks is literal text and is never
 *     treated as a mark.
 *   - Fail loudly. An unbalanced `==`, an empty mark, or an unknown color
 *     throws instead of silently degrading into visible punctuation.
 */

/**
 * Colors allowed in the `==color|text==` prefix. Names match Notion's own
 * palette so the converter can map them one to one.
 */
export const MARK_COLORS = Object.freeze([
  "gray",
  "brown",
  "orange",
  "yellow",
  "green",
  "blue",
  "purple",
  "pink",
  "red",
]);

/** Color used when the author writes the bare `==text==` form. */
export const DEFAULT_MARK_COLOR = "blue";

/** Private-use sentinels: never appear in real prose, untouched by parsers. */
const SENTINEL_OPEN = "\uE000";
const SENTINEL_CLOSE = "\uE001";
const SENTINEL_PATTERN = new RegExp(`${SENTINEL_OPEN}(\\d+)${SENTINEL_CLOSE}`, "g");
const COLOR_PREFIX_PATTERN = /^([a-z_]+)\|/;

export class InlineMarkError extends Error {
  /** @param {string} message */
  constructor(message) {
    super(message);
    this.name = "InlineMarkError";
  }
}

/**
 * @typedef {{ color: string, content: string }} InlineMark
 * @typedef {{ text: string, marks: InlineMark[] }} ExtractedInlineMarks
 */

/**
 * Locates backtick code spans so marks inside them stay literal.
 * Mirrors CommonMark enough for validation: a closing run must match the
 * opening run's length exactly.
 *
 * @param {string} text
 * @returns {Array<[number, number]>} half-open [start, end) ranges
 */
function findCodeSpans(text) {
  const spans = [];
  let index = 0;

  while (index < text.length) {
    if (text[index] !== "`") {
      index += 1;
      continue;
    }

    let runLength = 0;
    while (text[index + runLength] === "`") {
      runLength += 1;
    }

    const closeIndex = findBacktickRun(text, index + runLength, runLength);
    if (closeIndex === -1) {
      // Unmatched backtick run: CommonMark renders it literally, so treat it
      // as ordinary text and keep scanning after it.
      index += runLength;
      continue;
    }

    spans.push([index, closeIndex + runLength]);
    index = closeIndex + runLength;
  }

  return spans;
}

/**
 * @param {string} text
 * @param {number} from
 * @param {number} length
 * @returns {number} index of a backtick run of exactly `length`, or -1
 */
function findBacktickRun(text, from, length) {
  let index = from;

  while (index < text.length) {
    if (text[index] !== "`") {
      index += 1;
      continue;
    }

    let end = index;
    while (text[end] === "`") {
      end += 1;
    }

    if (end - index === length) {
      return index;
    }

    index = end;
  }

  return -1;
}

/**
 * @param {Array<[number, number]>} spans
 * @param {number} index
 * @returns {[number, number] | null}
 */
function spanContaining(spans, index) {
  for (const span of spans) {
    if (index >= span[0] && index < span[1]) {
      return span;
    }
  }
  return null;
}

/**
 * @param {string} text
 * @param {number} from
 * @param {Array<[number, number]>} codeSpans
 * @returns {number}
 */
function findClosingMark(text, from, codeSpans) {
  let index = from;

  while (index < text.length) {
    const codeSpan = spanContaining(codeSpans, index);
    if (codeSpan) {
      index = codeSpan[1];
      continue;
    }

    if (text.startsWith("==", index)) {
      return index;
    }

    index += 1;
  }

  return -1;
}

/**
 * Splits the text between two `==` delimiters into an optional color name and
 * the marked content.
 *
 * A leading `word|` that is not a known color is treated as a typo, not as
 * prose, because silently rendering `==rede|x==` as literal text hides the
 * mistake. Use a code span if `|` really is part of the text.
 *
 * @param {string} raw
 * @param {number} position
 * @returns {InlineMark}
 */
function parseMarkBody(raw, position) {
  const match = raw.match(COLOR_PREFIX_PATTERN);

  if (!match) {
    if (raw.length === 0) {
      throw new InlineMarkError(`位置 ${position} 的 == 标记内容为空。`);
    }
    return { color: DEFAULT_MARK_COLOR, content: raw };
  }

  const name = match[1];
  if (!MARK_COLORS.includes(name)) {
    throw new InlineMarkError(
      `位置 ${position} 的 == 标记颜色名 "${name}" 不在允许列表内：${MARK_COLORS.join(", ")}。` +
        ` 如果 "|" 本来就是正文的一部分，请把该片段放进代码段（\`...\`）或改写。`
    );
  }

  const content = raw.slice(match[0].length);
  if (content.length === 0) {
    throw new InlineMarkError(`位置 ${position} 的 == 标记内容为空。`);
  }

  return { color: name, content };
}

/**
 * Replaces every `==...==` mark with an opaque sentinel so a Markdown parser
 * can process the surrounding text without touching the mark, then hands back
 * the extracted marks for later restoration.
 *
 * Marks do not nest: the content between two delimiters can never itself
 * contain `==`.
 *
 * @param {string} text
 * @returns {ExtractedInlineMarks}
 */
export function extractInlineMarks(text) {
  if (typeof text !== "string") {
    throw new TypeError("extractInlineMarks expects a markdown string.");
  }

  const codeSpans = findCodeSpans(text);
  /** @type {InlineMark[]} */
  const marks = [];
  let result = "";
  let index = 0;

  while (index < text.length) {
    const codeSpan = spanContaining(codeSpans, index);
    if (codeSpan) {
      result += text.slice(index, codeSpan[1]);
      index = codeSpan[1];
      continue;
    }

    if (!text.startsWith("==", index)) {
      result += text[index];
      index += 1;
      continue;
    }

    const closeIndex = findClosingMark(text, index + 2, codeSpans);
    if (closeIndex === -1) {
      throw new InlineMarkError(
        `位置 ${index} 处的 == 没有闭合。== 必须成对出现；` +
          `如果只是想显示 == 本身，请写成代码段 \`==\`。`
      );
    }

    const mark = parseMarkBody(text.slice(index + 2, closeIndex), index);
    marks.push(mark);
    result += `${SENTINEL_OPEN}${marks.length - 1}${SENTINEL_CLOSE}`;
    index = closeIndex + 2;
  }

  return { text: result, marks };
}

/**
 * Validates mark syntax without rendering. Used by the converter and by
 * callers that want an early, clear failure.
 *
 * @param {string} text
 */
export function validateInlineMarks(text) {
  extractInlineMarks(text);
}

/**
 * Replaces sentinels in already-rendered HTML with the real mark markup.
 *
 * `idFor` optionally supplies a stable id per mark so the reading side can
 * hide and restore individual marks. Omit it and no id attribute is emitted.
 *
 * @param {string} html rendered HTML containing sentinels
 * @param {InlineMark[]} marks
 * @param {(content: string) => string} renderContent renders mark content inline
 * @param {(mark: InlineMark, index: number) => string | undefined} [idFor]
 * @returns {string}
 */
export function restoreInlineMarks(html, marks, renderContent, idFor) {
  if (typeof html !== "string") {
    throw new TypeError("restoreInlineMarks expects an HTML string.");
  }

  return html.replace(SENTINEL_PATTERN, (_full, rawIndex) => {
    const index = Number(rawIndex);
    const mark = marks[index];
    if (!mark) {
      throw new InlineMarkError(`内部错误：找不到序号 ${rawIndex} 对应的标记。`);
    }

    const id = idFor?.(mark, index);
    const idAttribute = id ? ` data-mark="${escapeAttribute(id)}"` : "";
    return `<span class="mk mk-${mark.color}"${idAttribute}>${renderContent(mark.content)}</span>`;
  });
}

/** @param {string} value */
function escapeAttribute(value) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

/**
 * Serializes a mark back into canonical source syntax. Used by the
 * Notion -> MDX converter so its output is byte-stable across runs.
 *
 * @param {string} text
 * @param {string} [color]
 * @returns {string}
 */
export function formatInlineMark(text, color = DEFAULT_MARK_COLOR) {
  if (!MARK_COLORS.includes(color)) {
    throw new InlineMarkError(`颜色名 "${color}" 不在允许列表内：${MARK_COLORS.join(", ")}。`);
  }
  return `==${color}|${text}==`;
}
