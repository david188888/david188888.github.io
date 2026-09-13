#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { splitMarkdownSegments } from "../src/lib/content/markdown-segments.mjs";
import {
  buildTerminologyBlock,
  createTermsHash,
  selectGlossaryTerms,
  validateGlossaryTerms,
  TRANSLATION_GLOSSARY_VERSION,
} from "../src/lib/content/translation-glossary.mjs";
import {
  createSourceHash,
  createUnitKey,
  findCacheInconsistencies,
  generationRequiresRetranslation,
  hasGeneration,
  isTranslationCacheFresh,
  TRANSLATION_CACHE_VERSION,
  TRANSLATION_PIPELINE_VERSION,
} from "../src/lib/content/translation-cache.mjs";

// Re-exported so the test suite can assert it matches the runtime hash.
export { createSourceHash };

const DEFAULT_BASE_URL = "http://localhost:11434/v1";
const DEFAULT_MODEL = "hy-mt2-7b";
const POSTS_DIR = "content/posts";
const TRANSLATION_DIR = "content/generated/translations/posts";
const DIAGNOSTICS_PATH = "local/translation-diagnostics/last-invalid-response.txt";

// How many independent unit translations may be in flight at once. Ollama
// serialises them unless OLLAMA_NUM_PARALLEL is raised, but keeping the queue
// full still removes the idle gaps between sequential requests.
const DEFAULT_CONCURRENCY = 4;

// Hy-MT2 max_context is 8192 tokens. A 2400-char Chinese chunk is roughly
// 1.5-2.5k tokens in, leaving room for the English output under num_predict
// 4096. Larger chunks keep cross-paragraph coherence; smaller ones are safer
// against truncation.
const MAX_CHUNK_CHARS = 2400;

// Official Hy-MT2 sampling recommendations for the 1.8B/7B models.
const GENERATION_PARAMETERS = {
  temperature: 0.7,
  top_p: 0.6,
  top_k: 20,
  repetition_penalty: 1.05,
  max_tokens: 4096,
};

const LANGUAGE_NAMES = {
  zh: { zh: "中文", en: "Chinese" },
  en: { zh: "英语", en: "English" },
};

export function parseFrontmatter(source) {
  if (!source.startsWith("---\n")) {
    return { frontmatter: {}, body: source };
  }

  const closingIndex = source.indexOf("\n---", 4);
  if (closingIndex === -1) {
    return { frontmatter: {}, body: source };
  }

  const rawFrontmatter = source.slice(4, closingIndex);
  const bodyStart = source.startsWith("\n", closingIndex + 4) ? closingIndex + 5 : closingIndex + 4;

  return {
    frontmatter: parseSimpleYaml(rawFrontmatter),
    body: source.slice(bodyStart),
  };
}

export function toCachePath(sourcePath) {
  const basename = path.posix.basename(sourcePath, path.posix.extname(sourcePath));
  return path.posix.join(TRANSLATION_DIR, `${basename}.json`);
}

export function detectLanguage(text) {
  const chineseCount = (text.match(/[\u3400-\u9fff]/g) ?? []).length;
  const englishCount = (text.match(/[A-Za-z]/g) ?? []).length;
  const totalSignal = chineseCount + englishCount;

  if (chineseCount >= 8 && chineseCount / Math.max(totalSignal, 1) >= 0.35) {
    return "zh";
  }

  if (englishCount >= 20 && englishCount / Math.max(totalSignal, 1) >= 0.75) {
    return "en";
  }

  return null;
}

export function getTargetLanguage(sourceLanguage) {
  if (sourceLanguage === "en") {
    return "zh";
  }

  if (sourceLanguage === "zh") {
    return "en";
  }

  throw new Error(`Unsupported source language: ${sourceLanguage}`);
}

/**
 * A ```` ```html ```` fence whose body is markup. The site renders fenced
 * blocks as escaped code, but their visible text is still reader-facing prose
 * (the previous single-request pipeline translated it), so these blocks get
 * the same placeholder + text-node treatment as unfenced HTML: the model only
 * ever sees the text nodes, never the tags. Fences in any other language stay
 * verbatim — sample code is not prose.
 */
const FENCE_START_PATTERN = /^[ \t]*(`{3,}|~{3,})/;
const FENCED_HTML_OPEN_PATTERN = /^[ \t]*`{3,}html(?:[ \t]+\S[^\n]*)?[ \t]*$/i;

/**
 * A closing fence repeats the opening character, is at least as long, and
 * carries no info string (CommonMark 4.5).
 */
function fenceCloserPattern(marker) {
  const character = marker[0] === "`" ? "`" : "~";
  return new RegExp(`^[ \\t]*${character}{${marker.length},}[ \\t]*$`);
}

/**
 * Splits a fenced block into its opening marker line, body and closing marker.
 *
 * The markers are sliced out of the source instead of being rebuilt, so an
 * indented fence, a longer run of backticks, or a `~~~` fence keeps its exact
 * shape once the body has been translated. Returns null when the block is not
 * closed on its last line, or when it holds nothing to translate.
 */
export function splitFenceBlock(content) {
  const lines = (typeof content === "string" ? content : "").split("\n");
  const open = lines.length > 1 ? lines[0].match(FENCE_START_PATTERN) : null;
  if (!open) {
    return null;
  }

  const closer = fenceCloserPattern(open[1]);
  let closeIndex = -1;
  for (let index = 1; index < lines.length; index += 1) {
    if (closer.test(lines[index])) {
      closeIndex = index;
      break;
    }
  }

  if (closeIndex === -1 || closeIndex !== lines.length - 1) {
    return null;
  }

  const inner = lines.slice(1, closeIndex).join("\n");
  if (inner.trim() === "") {
    return null;
  }

  return {
    prefix: `${lines[0]}\n`,
    inner,
    // The newline before the closing marker belongs to the wrapper, not to the
    // body: without it the restored fence glues onto the last markup line.
    suffix: `\n${lines[closeIndex]}`,
  };
}

function matchFencedHtmlBlock(content) {
  const block = splitFenceBlock(content);
  if (!block || !FENCED_HTML_OPEN_PATTERN.test(block.prefix.trim())) {
    return null;
  }

  return block;
}

/**
 * Replaces every embedded HTML block in the body with a stable placeholder
 * line so the translation model never has to reproduce raw markup. Returns the
 * placeholder body plus the extracted blocks in document order.
 */
export function extractHtmlBlocks(body) {
  const segments = splitMarkdownSegments(body);
  const blocks = [];
  const lines = [];

  for (const segment of segments) {
    const fenced = segment.type !== "html" ? matchFencedHtmlBlock(segment.content) : null;

    if (segment.type !== "html" && !fenced) {
      lines.push(segment.content);
      continue;
    }

    const token = `html-block-${blocks.length + 1}`;
    blocks.push(
      fenced
        ? { token, html: fenced.inner, prefix: fenced.prefix, suffix: fenced.suffix }
        : { token, html: segment.content }
    );
    lines.push(`[[${token}]]`);
  }

  return { body: lines.join("\n"), blocks };
}

const TEXT_NODE_PATTERN = />([^<]+)</;

/**
 * Elements whose content is machine-readable rather than reader-facing prose.
 *
 * A `<style>` rule or a `<script>` body inside an SVG diagram must never reach
 * the translation model: it is not prose, and the model would happily rewrite
 * CSS selectors or JavaScript identifiers into the target language.
 */
const OPAQUE_ELEMENT_PATTERN = /<(style|script)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;

/**
 * Half-open [start, end) ranges covering every opaque element.
 *
 * Extraction and application both classify a text node by its offset in the
 * *original* markup, so the two walks agree on which nodes are translatable and
 * their indices stay aligned.
 */
function opaqueRanges(html) {
  const ranges = [];
  const pattern = new RegExp(OPAQUE_ELEMENT_PATTERN.source, "gi");
  let match;

  while ((match = pattern.exec(html)) !== null) {
    ranges.push([match.index, match.index + match[0].length]);
  }

  return ranges;
}

function isOpaque(ranges, offset) {
  return ranges.some(([start, end]) => offset >= start && offset < end);
}

const NAMED_ENTITIES = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: "\u00A0",
};

/**
 * Turns character references back into the characters they stand for.
 *
 * The model must see the *logical* text (`R&D`), never the markup that encodes
 * it (`R&amp;D`): otherwise it translates the entity and the writer escapes the
 * result a second time, publishing a literal `&amp;`.
 */
export function decodeHtmlEntities(value) {
  return String(value).replace(
    /&(?:#(\d+)|#[xX]([0-9a-fA-F]+)|([a-zA-Z][a-zA-Z0-9]*));/g,
    (full, decimal, hex, name) => {
      if (decimal !== undefined) {
        const codePoint = Number(decimal);
        return Number.isFinite(codePoint) && codePoint > 0 && codePoint <= 0x10ffff
          ? String.fromCodePoint(codePoint)
          : full;
      }

      if (hex !== undefined) {
        const codePoint = Number.parseInt(hex, 16);
        return Number.isFinite(codePoint) && codePoint > 0 && codePoint <= 0x10ffff
          ? String.fromCodePoint(codePoint)
          : full;
      }

      const key = String(name).toLowerCase();
      return key in NAMED_ENTITIES ? NAMED_ENTITIES[key] : full;
    }
  );
}

/**
 * Visible text between tags inside an embedded HTML block (node labels,
 * legends, figcaption). Attributes are intentionally left untouched, and so is
 * the content of opaque elements.
 *
 * Returned text is decoded, so callers that hand it to the model see prose
 * while `applyTextTranslations` escapes it exactly once on the way back.
 */
export function extractTextNodes(html) {
  const ranges = opaqueRanges(html);
  const nodes = [];
  const pattern = new RegExp(TEXT_NODE_PATTERN.source, "g");
  let match;

  while ((match = pattern.exec(html)) !== null) {
    if (isOpaque(ranges, match.index)) {
      continue;
    }

    const text = decodeHtmlEntities(match[1]).trim();
    if (text) {
      nodes.push(text);
    }
  }

  return nodes;
}

/**
 * Flattens every translatable text node of every embedded HTML block into
 * cacheable units.
 *
 * `slot` is the `block.node` address the model's JSON response is keyed by;
 * `source` is the decoded visible text, which is also what the unit key hashes —
 * so editing one diagram label retranslates only that label.
 */
export function planHtmlTextUnits(blocks) {
  const nodes = [];

  for (const [blockIndex, block] of blocks.entries()) {
    for (const [nodeIndex, text] of extractTextNodes(block.html).entries()) {
      nodes.push({
        slot: `${blockIndex + 1}.${nodeIndex + 1}`,
        source: text,
      });
    }
  }

  return nodes;
}

function escapeXmlText(value) {
  return value
    // Only real layout whitespace is collapsed; a decoded &nbsp; keeps its
    // non-breaking space instead of silently becoming a normal one.
    .replace(/[ \t\r\n]+/g, " ")
    .trim()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Applies per-node translations back into the HTML while preserving the
 * original indentation whitespace around each text node. Nodes without a
 * translation keep their source text.
 *
 * The replacement is decoded first and escaped once, so a model that answers
 * with `R&amp;D` and one that answers with `R&D` both publish `R&amp;D` — never
 * the double-escaped `R&amp;amp;D`.
 */
export function applyTextTranslations(html, translations) {
  const ranges = opaqueRanges(html);
  let nodeIndex = 0;

  return html.replace(new RegExp(TEXT_NODE_PATTERN.source, "g"), (full, text, offset) => {
    if (isOpaque(ranges, offset)) {
      return full;
    }

    const core = decodeHtmlEntities(text).trim();
    if (!core) {
      return full;
    }

    const replacement = translations[nodeIndex];
    nodeIndex += 1;
    if (typeof replacement !== "string" || replacement.trim() === "") {
      return full;
    }

    const leading = text.slice(0, text.length - text.trimStart().length);
    const trailing = text.slice(text.trimEnd().length);
    return `>${leading}${escapeXmlText(decodeHtmlEntities(replacement))}${trailing}<`;
  });
}

/**
 * Puts translated HTML blocks back into the translated body. Fails loudly if
 * the model dropped or mangled a placeholder so the cache is never written
 * with a silently missing diagram.
 */
export function restoreHtmlBlocks(translatedBody, blocks, htmlText) {
  let result = translatedBody;

  for (const [blockIndex, block] of blocks.entries()) {
    let finalHtml = block.html;
    if (htmlText && typeof htmlText === "object") {
      const translations = extractTextNodes(block.html).map((_text, nodeIndex) => {
        const value = htmlText[`${blockIndex + 1}.${nodeIndex + 1}`];
        return typeof value === "string" ? value : null;
      });
      finalHtml = applyTextTranslations(finalHtml, translations);
    }

    const placeholderPattern = new RegExp(`^[ \\t]*\\[\\[${block.token}\\]\\][ \\t]*$`, "m");
    if (!placeholderPattern.test(result)) {
      throw new Error(`Translated body is missing the required placeholder [[${block.token}]].`);
    }

    const restored = block.prefix ? `${block.prefix}${finalHtml}${block.suffix}` : finalHtml;
    result = result.replace(placeholderPattern, () => restored);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Hy-MT2 prompt construction
//
// Hy-MT2 is a dedicated translation model: it has no system prompt and is
// instruction-tuned for a fixed family of translation templates (see the
// Hy-MT2-Translator skill in .claude/skills and its DSH-visible mirror in
// .agents/skills; scripts/__tests__/hy-mt2-skill.test.mjs keeps them identical).
// Prompts use the Chinese instruction wording when the source is Chinese and
// the English wording otherwise, mirroring the official examples.
// ---------------------------------------------------------------------------

const MARKS_CLAUSE_ZH =
  "保持 Markdown 结构（标题、列表、链接、代码块）不变。" +
  "文本中的 ==颜色|文字== 与 ==文字== 是作者的行内标记，^[文字] 是页边批注：" +
  "这些标记必须原样保留，数量相同、成对出现、颜色名不翻译，只翻译标记包裹的文字。" +
  "形如 [[html-block-N]] 的占位符行必须单独成行并原样保留，不得翻译、移动、合并或删除。";

const MARKS_CLAUSE_EN =
  "Keep the Markdown structure (headings, lists, links, code blocks) unchanged. " +
  "The text contains author inline marks ==color|text== and ==text==, and margin notes ^[text]: " +
  "keep every mark exactly as-is — same count, same pairing, colour names untranslated — and only translate the text they wrap. " +
  "Placeholder lines like [[html-block-N]] must stay on their own line, verbatim; never translate, move, merge, or drop them.";

// The inline-formatting clause deliberately names no mark syntax: Hy-MT2 echoes
// literal examples from a preservation clause straight into the body. It also has
// to say that the marked text is translated like any other prose — a model told
// only to "keep the formatting" will happily leave the wrapped words in the
// source language.
const STRUCTURE_CLAUSE_ZH =
  "原文的加粗、斜体、删除线、行内代码、链接、标题层级和列表符号都要保留，" +
  "标记里的文字和普通正文一样正常翻译；不要增加、删除或改写标记符号本身。";

const STRUCTURE_CLAUSE_EN =
  "Keep the source's bold, italics, strikethrough, inline code, links, heading levels and list bullets, " +
  "and translate the text they wrap exactly like ordinary prose; never add, drop or rewrite the marker characters themselves.";

/**
 * Optional section-context clause.
 *
 * A paragraph translated on its own loses the terminology its surrounding
 * section established, so the enclosing heading path is offered as context. The
 * clause must say explicitly that the heading is context only: Hy-MT2 echoes
 * literal instruction text into the body when a clause is worded loosely.
 */
const CONTEXT_CLAUSE_ZH =
  "这段话属于小节「{context}」。该小节标题仅供理解语境，不要翻译、改写或输出它。";
const CONTEXT_CLAUSE_EN =
  'This passage belongs to the section "{context}". That heading is context only: do not translate, rewrite, or output it.';

/**
 * Prepends the glossary block to a prompt.
 *
 * The block is its own paragraph ahead of the instruction, which is where the
 * official terminology template puts it. It is deliberately not merged into the
 * `，并且…` clause chain: that clause is asserted to quote no example syntax,
 * while the terminology template quotes the terms by design. A prompt with no
 * matching terms comes back byte-for-byte unchanged.
 */
function withTerminology(prompt, terms, sourceLanguage) {
  const block = buildTerminologyBlock(terms, sourceLanguage);
  if (!block) return prompt;

  return `${block}${sourceLanguage === "zh" ? "\n" : "\n\n"}${prompt}`;
}

/**
 * Basic-mode Hy-MT2 prompt. `preserveMarks` appends the blog-specific
 * annotation clause, `preserveStructure` the inline-formatting clause, and
 * `context` the enclosing section path. Each is attached only where it applies,
 * so a plain paragraph is not handed examples it might echo. `terms` are the
 * glossary entries this unit's own text matched, if any.
 */
export function buildTranslatePrompt({
  sourceText,
  sourceLanguage,
  targetLanguage,
  preserveMarks = false,
  preserveStructure = false,
  context = "",
  terms = [],
}) {
  const target = LANGUAGE_NAMES[targetLanguage][sourceLanguage];
  const clausesZh = [
    preserveMarks ? MARKS_CLAUSE_ZH : "",
    preserveStructure ? STRUCTURE_CLAUSE_ZH : "",
    context ? CONTEXT_CLAUSE_ZH.replace("{context}", context) : "",
  ]
    .filter(Boolean)
    .join("");
  const clausesEn = [
    preserveMarks ? MARKS_CLAUSE_EN : "",
    preserveStructure ? STRUCTURE_CLAUSE_EN : "",
    context ? CONTEXT_CLAUSE_EN.replace("{context}", context) : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (sourceLanguage === "zh") {
    const extra = clausesZh ? `，并且${clausesZh}` : "";
    return withTerminology(
      `将以下文本翻译为 \`${target}\`，注意**只需要输出翻译后的结果，不要额外解释**${extra}：\n\n${sourceText}`,
      terms,
      sourceLanguage
    );
  }

  const extra = clausesEn ? ` ${clausesEn}` : "";
  return withTerminology(
    `Translate the following text into \`${target}\`. Note that you should **only output the translated result without any additional explanation**.${extra}\n\n${sourceText}`,
    terms,
    sourceLanguage
  );
}

const TITLE_STYLE = {
  zh: "简洁专业的英文技术博客标题，实词首字母大写",
  en: "简洁专业的中文技术博客标题",
};

/**
 * Title prompt in the official style-controlled mode. The basic template
 * translates headlines literally (`推理算力` -> "Reasoning computing power"),
 * while naming a style recovers the headline register the site had before.
 */
export function buildTitlePrompt({ sourceText, sourceLanguage, targetLanguage, terms = [] }) {
  const target = LANGUAGE_NAMES[targetLanguage][sourceLanguage];
  const style = TITLE_STYLE[sourceLanguage];

  if (sourceLanguage === "zh") {
    return withTerminology(
      `请将以下文本翻译为 \`${target}\`。\n注意翻译的风格要严格符合【**\`${style}\`**】\n\n${sourceText}`,
      terms,
      sourceLanguage
    );
  }

  return withTerminology(
    `Please translate the following text into \`${target}\`. Note that the translation style must strictly conform to [**\`${style}\`**]:\n\n${sourceText}`,
    terms,
    sourceLanguage
  );
}

/**
 * Delimiter-mode prompt for the tag list: tags are joined with a rare ` @@ `
 * separator so one call translates all of them and the result can be split
 * back deterministically.
 */
export function buildTagsPrompt({ tags, sourceLanguage, targetLanguage, terms = [] }) {
  const target = LANGUAGE_NAMES[targetLanguage][sourceLanguage];
  const joined = tags.join(" @@ ");

  if (sourceLanguage === "zh") {
    return withTerminology(
      `请将以下文本准确翻译为 \`${target}\`。你必须在译文中**保留等量的分隔符 \` @@ \`，绝对不可遗漏、转义或翻译该符号，并注意分隔符的位置**：\n\n${joined}`,
      terms,
      sourceLanguage
    );
  }

  return withTerminology(
    `Please accurately translate the following text into \`${target}\`. You must **retain the exact same number of \` @@ \` delimiters in the translation. Strictly do not omit, escape, or translate these symbols, and pay close attention to their placement**:\n\n${joined}`,
    terms,
    sourceLanguage
  );
}

/**
 * Structured-data mode prompt for the visible text nodes of embedded HTML
 * blocks: the model translates JSON values only and must keep keys untouched.
 */
export function buildHtmlTextPrompt({ htmlText, sourceLanguage, targetLanguage, terms = [] }) {
  const target = LANGUAGE_NAMES[targetLanguage][sourceLanguage];
  const data = JSON.stringify(htmlText, null, 2);

  if (sourceLanguage === "zh") {
    return withTerminology(
      [
        `*# 任务目标*`,
        `将下方文本中的 JSON 格式数据翻译为 \`${target}\`。`,
        ``,
        `*# 严格约束*`,
        `1. **结构锁定**：绝对保持原有的 JSON 数据结构、缩进和层级完全不变。`,
        `2. **选择性翻译**：仅翻译面向用户展示的可见文本内容。`,
        `3. **禁止修改**：**严禁**翻译或更改任何键名 (Key)。`,
        ``,
        `*# 数据输入*`,
        data,
      ].join("\n"),
      terms,
      sourceLanguage
    );
  }

  return withTerminology(
    [
      `*### Task*`,
      `Translate the user-facing text within the following JSON data into \`${target}\`.`,
      ``,
      `*### Strict Rules*`,
      `1. **Structure Preservation:** You MUST preserve the original JSON data structure, nesting, hierarchy, and indentation exactly as they are.`,
      `2. **Selective Translation:** Translate ONLY the visible, user-facing text content/values.`,
      `3. **Strict Non-Translation:** NEVER translate or alter any keys.`,
      ``,
      `*### Source Data*`,
      data,
    ].join("\n"),
    terms,
    sourceLanguage
  );
}

/**
 * Prompt for a fenced block that carries Chinese text (a formula, a table, or
 * a comment inside sample code). The clause mirrors Hy-MT2's structured-data
 * rules: translate what a reader must read, keep code, identifiers, operators
 * and layout byte-identical.
 */
export function buildFencedPrompt({ sourceText, sourceLanguage, targetLanguage, terms = [] }) {
  const target = LANGUAGE_NAMES[targetLanguage][sourceLanguage];

  if (sourceLanguage === "zh") {
    return withTerminology(
      `将以下文本翻译为 \`${target}\`，注意**只需要输出翻译后的结果，不要额外解释**。` +
        `这段内容位于 Markdown 代码块内：只翻译面向读者的自然语言和中文注释；` +
        `代码、公式符号（如 = ÷ × 等）、标识符、变量名、数字、缩进与换行必须原样保留。\n\n${sourceText}`,
      terms,
      sourceLanguage
    );
  }

  return withTerminology(
    `Translate the following text into \`${target}\`. Note that you should **only output the translated result without any additional explanation**. ` +
      `This content sits inside a Markdown code block: translate only reader-facing natural language and comments; ` +
      `keep code, formula symbols (such as = ÷ ×), identifiers, variable names, numbers, indentation and line breaks exactly as they are.\n\n${sourceText}`,
    terms,
    sourceLanguage
  );
}

const CODE_FENCE_START = /^[ \t]*(?:`{3,}|~{3,})/;
const PLACEHOLDER_LINE_PATTERN = /^[ \t]*\[\[html-block-\d+\]\][ \t]*$/;
const HEADING_LINE_PATTERN = /^(#{1,6})[ \t]+(.*)$/;

/**
 * Splits one markdown region into blocks on blank lines.
 *
 * A block is either a maximal run of non-blank lines or a lone
 * `[[html-block-N]]` placeholder line, which is carried over verbatim rather
 * than mixed into prose the model might rewrite. `leading` is the exact
 * whitespace that preceded each block and `trailing` the whitespace after the
 * last one, so `blocks.map(b => b.leading + b.text).join("") + trailing`
 * reproduces the region byte for byte.
 */
export function splitProseBlocks(content) {
  const lines = (typeof content === "string" ? content : "").split("\n");
  const blocks = [];
  let index = 0;

  while (index < lines.length) {
    if (lines[index].trim() === "") {
      index += 1;
      continue;
    }

    if (PLACEHOLDER_LINE_PATTERN.test(lines[index])) {
      blocks.push({ kind: "placeholder", text: lines[index] });
      index += 1;
      continue;
    }

    const start = index;
    while (
      index < lines.length &&
      lines[index].trim() !== "" &&
      !PLACEHOLDER_LINE_PATTERN.test(lines[index])
    ) {
      index += 1;
    }

    blocks.push({ kind: "prose", text: lines.slice(start, index).join("\n") });
  }

  let cursor = 0;
  for (const block of blocks) {
    const found = content.indexOf(block.text, cursor);
    block.leading = content.slice(cursor, found);
    cursor = found + block.text.length;
  }

  return { blocks, trailing: content.slice(cursor) };
}

/**
 * Splits an oversized block into pieces that concatenate back exactly.
 *
 * Each piece carries the separator that followed it, so even a hard cut through
 * one enormous line rejoins without inventing whitespace the source never had.
 */
export function splitOversizedBlock(content, maxChars = MAX_CHUNK_CHARS) {
  const pieces = [];
  let remaining = content;

  while (remaining.length > maxChars) {
    let pieceEnd;
    let nextStart;
    const paragraphCut = remaining.lastIndexOf("\n\n", maxChars);

    if (paragraphCut >= maxChars * 0.5) {
      pieceEnd = paragraphCut + 1;
      nextStart = paragraphCut + 2;
    } else {
      const lineCut = remaining.lastIndexOf("\n", maxChars);
      if (lineCut >= maxChars * 0.5) {
        pieceEnd = lineCut;
        nextStart = lineCut + 1;
      } else {
        pieceEnd = maxChars;
        nextStart = maxChars;
      }
    }

    pieces.push({
      text: remaining.slice(0, pieceEnd),
      separator: remaining.slice(pieceEnd, nextStart),
    });
    remaining = remaining.slice(nextStart);
  }

  if (remaining.length > 0) {
    pieces.push({ text: remaining, separator: "" });
  }

  return pieces;
}

/**
 * Orders a body into translation units.
 *
 * A unit is the smallest piece that can be reused on its own: one paragraph,
 * one heading, one CJK-bearing code fence, or one placeholder line carried over
 * verbatim. Units are content-addressed rather than positional, so inserting a
 * paragraph does not invalidate the units after it. Each records the enclosing
 * section path as `context`, which joins the cache key: editing a heading
 * invalidates that section and nothing else.
 *
 * Every unit also records the exact separator that preceded it (`leading`), so
 * `assembleBody` rebuilds the markdown byte for byte. Fenced code blocks that
 * contain no CJK have nothing to translate and stay verbatim; a CJK-bearing
 * fence keeps its markers out of the prompt and only sends its body.
 */
export function extractBodyUnits(body) {
  const segments = splitMarkdownSegments(body);
  const units = [];
  const headingStack = [];
  let pending = "";

  const currentContext = () => headingStack.map((entry) => entry.text).join(" › ");

  /** Pushes an oversized-aware prose block; returns the gap that follows it. */
  const pushProse = (text, leading, context) => {
    let gap = leading;
    for (const piece of splitOversizedBlock(text)) {
      units.push({ kind: "prose", text: piece.text, source: piece.text, context, leading: gap });
      gap = piece.separator;
    }
    return gap;
  };

  for (const [segmentIndex, segment] of segments.entries()) {
    if (CODE_FENCE_START.test(segment.content)) {
      const fenced = splitFenceBlock(segment.content);
      const carriesCjk = Boolean(fenced) && /[\u3400-\u9fff]/.test(fenced.inner);

      units.push(
        carriesCjk
          ? {
              kind: "fenced",
              text: segment.content,
              source: fenced.inner,
              context: currentContext(),
              prefix: fenced.prefix,
              suffix: fenced.suffix,
              leading: pending,
            }
          : { kind: "verbatim", text: segment.content, source: "", context: "", leading: pending }
      );
      pending = "";
    } else {
      const { blocks, trailing } = splitProseBlocks(segment.content);
      let gap = pending;

      for (const block of blocks) {
        const blockLeading = gap + block.leading;
        gap = "";

        if (block.kind === "placeholder") {
          units.push({
            kind: "verbatim",
            text: block.text,
            source: "",
            context: "",
            leading: blockLeading,
          });
          continue;
        }

        const lines = block.text.split("\n");
        const heading = lines[0].match(HEADING_LINE_PATTERN);

        if (heading) {
          const level = heading[1].length;
          const parentContext = headingStack
            .filter((entry) => entry.level < level)
            .map((entry) => entry.text)
            .join(" › ");

          units.push({
            kind: "prose",
            text: lines[0],
            source: lines[0],
            context: parentContext,
            leading: blockLeading,
          });

          while (headingStack.length > 0 && headingStack[headingStack.length - 1].level >= level) {
            headingStack.pop();
          }
          headingStack.push({ level, text: heading[2].trim() });

          // A heading is its own unit; only push a trailing block if the
          // heading shared its block with following lines.
          const rest = lines.slice(1).join("\n");
          if (rest !== "") {
            gap = pushProse(rest, "\n", currentContext());
          }
          continue;
        }

        gap = pushProse(block.text, blockLeading, currentContext());
      }

      pending = gap + trailing;
    }

    if (segmentIndex < segments.length - 1) {
      pending += "\n";
    }
  }

  return { units, trailing: pending };
}

/**
 * Rebuilds the placeholder body from its units.
 *
 * Identity translations must reproduce the source exactly; that property is
 * what lets the pipeline round-trip a cached body without drift. Fence markers
 * come from the unit, never from the model.
 */
export function assembleBody(units, trailing) {
  let result = "";

  for (const unit of units) {
    if (unit.kind === "verbatim") {
      result += unit.leading + unit.text;
      continue;
    }

    const translation = typeof unit.translation === "string" ? unit.translation : unit.source;
    const text = unit.prefix !== undefined ? `${unit.prefix}${translation}${unit.suffix}` : translation;
    result += unit.leading + text;
  }

  return result + trailing;
}

/**
 * Orders committed units the way their sources appear in the document.
 *
 * Units are translated concurrently, so the order in which they finish is
 * arbitrary. Writing that order into a git-committed cache would reshuffle the
 * file's keys whenever nothing meaningful changed, so the map is rebuilt from
 * the plan instead. A key that was never committed is skipped, and a key used
 * by two units keeps its first position.
 */
export function orderUnitsByPlan(committed, orderedKeys) {
  const result = {};

  for (const key of orderedKeys) {
    if (committed[key] !== undefined && !(key in result)) {
      result[key] = committed[key];
    }
  }

  return result;
}

/**
 * Splits a delimiter-mode tag translation back into one entry per source tag.
 * Throws when the separator count drifted so a misaligned tag list is never
 * written into the cache.
 */
export function splitTranslatedTags(translated, expectedCount) {
  const parts = translated.split("@@").map((part) => part.trim());

  if (parts.length !== expectedCount) {
    throw new Error(
      `Tags translation lost the @@ separator: expected ${expectedCount} tags, got ${parts.length}. 已拒绝写入缓存。`
    );
  }

  return parts;
}

export function parseCliOptions(argv) {
  const args = argv.slice(2);
  const force = args.includes("--force");
  const dryRun = args.includes("--check") || args.includes("--dry-run");
  let only = null;
  let concurrency = DEFAULT_CONCURRENCY;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--only" || arg.startsWith("--only=")) {
      only = arg.startsWith("--only=") ? arg.slice("--only=".length) : args[index + 1] ?? "";
      if (!arg.startsWith("--only=")) index += 1;
    } else if (arg === "--concurrency" || arg.startsWith("--concurrency=")) {
      const raw = arg.startsWith("--concurrency=")
        ? arg.slice("--concurrency=".length)
        : args[index + 1] ?? "";
      if (!arg.startsWith("--concurrency=")) index += 1;
      const parsed = Number.parseInt(raw, 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        concurrency = parsed;
      }
    }
  }

  return { force, dryRun, only: only || null, concurrency };
}

/**
 * Runs `worker` over every item with at most `limit` in flight.
 *
 * Units are independent, so a bounded pool is enough to keep the model busy.
 * The first failure stops the queue and is rethrown only after every in-flight
 * unit has settled, so no rejection escapes unobserved.
 */
async function mapWithConcurrency(items, limit, worker) {
  const queue = [...items];
  const size = Math.max(1, Math.min(limit, queue.length));
  let failure = null;

  const runners = Array.from({ length: size }, async () => {
    while (failure === null && queue.length > 0) {
      const item = queue.shift();
      try {
        await worker(item);
      } catch (error) {
        failure = failure ?? error;
      }
    }
  });

  await Promise.all(runners);

  if (failure !== null) {
    throw failure;
  }
}

async function main() {
  const { force, dryRun, only, concurrency } = parseCliOptions(process.argv);
  const baseUrl = process.env.HY_MT2_BASE_URL || DEFAULT_BASE_URL;
  const model = process.env.HY_MT2_MODEL || DEFAULT_MODEL;

  // Metadata read, never inference, so `--check` stays free of model calls. A
  // server that does not report digests degrades the identity instead of
  // failing the run: see `readModelDigest`.
  const modelDigest = await readModelDigest(baseUrl, model);
  if (modelDigest === null) {
    console.warn(
      `Could not read a model digest from ${ollamaTagsUrl(baseUrl)}; ` +
        `this run cannot notice a re-created or swapped ${model}.`
    );
  }

  const allPaths = await listPostPaths();
  const sourcePaths = only
    ? allPaths.filter(
        (sourcePath) => path.posix.basename(sourcePath, ".mdx") === only || sourcePath === only
      )
    : allPaths;

  if (sourcePaths.length === 0) {
    if (only) {
      console.error(`No post matches --only ${only}.`);
      process.exitCode = 1;
    } else {
      console.log("No content posts found.");
    }
    return;
  }

  const failures = [];
  const summary = { written: 0, fresh: 0, skipped: 0, reused: 0, translated: 0, pending: 0 };

  for (const sourcePath of sourcePaths) {
    let outcome;
    try {
      outcome = await translatePost({ sourcePath, baseUrl, model, modelDigest, force, dryRun, concurrency });
    } catch (error) {
      failures.push(`${sourcePath}: ${error.message}`);
      console.error(`Failed ${sourcePath}: ${error.message}`);
      continue;
    }

    summary.reused += outcome.reused;
    summary.translated += outcome.translated;
    summary.pending += outcome.pending;

    if (outcome.status === "translated") summary.written += 1;
    else if (outcome.status === "fresh") summary.fresh += 1;
    else if (outcome.status === "skipped") summary.skipped += 1;
  }

  const label = dryRun ? "check" : "run";
  const scope = only ? ` (--only ${only})` : "";
  console.log(
    `Translation ${label}${scope} complete: ${summary.written} written, ${summary.fresh} fresh, ` +
      `${summary.skipped} skipped, ${failures.length} failed; units ${summary.reused} reused, ` +
      `${summary.translated} translated, ${summary.pending} pending.`
  );

  if (failures.length > 0) {
    process.exitCode = 1;
  } else if (dryRun && summary.pending > 0) {
    // `--check` exists to gate CI: a stale cache is a failure, not a note.
    process.exitCode = 1;
  }
}

async function translatePost({ sourcePath, baseUrl, model, modelDigest, force, dryRun, concurrency }) {
  const source = await fs.readFile(sourcePath, "utf8");
  const parsed = parseFrontmatter(source);
  const title = normalizeString(parsed.frontmatter.title);
  const excerpt = normalizeString(parsed.frontmatter.excerpt);
  const tags = normalizeStringArray(parsed.frontmatter.tags);
  const body = parsed.body;
  const sourceLanguage = getSourceLanguage(parsed.frontmatter.language, `${title}\n${excerpt}\n${body}`);

  if (!sourceLanguage) {
    console.warn(`Skipping ${sourcePath}: unable to detect source language.`);
    return { status: "skipped", reused: 0, translated: 0, pending: 0 };
  }

  const targetLanguage = getTargetLanguage(sourceLanguage);
  const sourceHash = createSourceHash(source);
  const cachePath = toCachePath(sourcePath);
  const previousCache = await readTranslationCache(cachePath);
  const previousUnits =
    previousCache && typeof previousCache.units === "object" && previousCache.units !== null
      ? previousCache.units
      : {};

  // What produced this text besides the source and the prompts. Changing either
  // input changes every unit at once, which is why it is compared here instead
  // of being folded into 87 unit keys.
  const generation = { parameters: GENERATION_PARAMETERS, modelDigest };
  const generationMoved =
    hasGeneration(previousCache) && generationRequiresRetranslation(previousCache.generation, generation);

  if (generationMoved) {
    console.warn(
      `${sourcePath}: the model or the sampling parameters changed since this cache was written; ` +
        `retranslating every unit.`
    );
  }

  // The generation identity is part of what makes a cache self-describing, so a
  // cache that never recorded one gets rewritten once — reusing every unit, not
  // retranslating — rather than keeping a gap in what the file can prove about
  // itself.
  const generationRecorded = hasGeneration(previousCache);

  if (
    !force &&
    !generationMoved &&
    !dryRun &&
    generationRecorded &&
    isTranslationCacheFresh(previousCache, { sourceHash, targetLanguage, model })
  ) {
    console.log(`Skipping ${sourcePath}: fresh translation cache exists.`);
    return { status: "fresh", reused: 0, translated: 0, pending: 0 };
  }

  if (!dryRun && previousCache && !generationRecorded && !generationMoved) {
    console.log(`${sourcePath}: recording the model generation for this cache.`);
  }

  const request = { baseUrl, model, sourceLanguage, targetLanguage };
  const nextUnits = {};

  // Only the terms a unit's own text contains are injected: handing the model
  // the whole table makes it invent words. The selection feeds the unit's cache
  // key, so it must not depend on which units share a batch.
  const termsOf = (unitSource) => selectGlossaryTerms(unitSource, sourceLanguage);

  const keyOf = (kind, unitSource, context = "", terms = termsOf(unitSource)) =>
    createUnitKey({ kind, source: unitSource, context, model, termsHash: createTermsHash(terms) });

  const cachedByKey = (key) => {
    if (force || generationMoved) return null;
    const cached = previousUnits[key];
    return cached && typeof cached.translation === "string" && cached.translation.trim() !== ""
      ? cached.translation
      : null;
  };

  const commit = (unit, translation) => {
    // Reused translations are validated too. The cache otherwise freezes a
    // one-off mistake: a unit's key only moves when its source or its terms
    // change, so a wrong translation of unchanged text would never be revisited.
    validateGlossaryTerms({
      translation,
      terms: unit.terms ?? [],
      label: unit.label ?? unit.kind,
    });

    nextUnits[unit.key] = {
      kind: unit.kind,
      source: unit.source,
      context: unit.context,
      translation,
    };
  };

  /**
   * Translates one unit, re-sampling when the glossary check rejects a sample.
   *
   * A rejection is a meaning-level problem, not a transport one, so it is not
   * retried inside `translateField`; it is retried here, where the unit and its
   * terms are known. The last error is re-thrown so a systematically wrong
   * prompt still stops the run instead of publishing a compromise.
   */
  const translateWithGlossaryRetry = async (unit) => {
    let lastError;

    for (let attempt = 1; attempt <= GLOSSARY_MAX_ATTEMPTS; attempt += 1) {
      const translation = await translateField(request, unit.prompt, unit.label);

      try {
        validateGlossaryTerms({ translation, terms: unit.terms ?? [], label: unit.label });
        return translation;
      } catch (error) {
        lastError = error;
        console.warn(
          `  ! ${unit.label}: ${error.message} Retrying (${attempt}/${GLOSSARY_MAX_ATTEMPTS}).`
        );
      }
    }

    throw lastError;
  };

  // ---- plan every unit ----------------------------------------------------
  const { body: placeholderBody, blocks } = extractHtmlBlocks(body);
  const bodyPlan = extractBodyUnits(placeholderBody);
  const htmlNodes = planHtmlTextUnits(blocks);

  const titleTerms = termsOf(title);
  const headerUnits = [
    {
      key: keyOf("title", title, "", titleTerms),
      kind: "title",
      source: title,
      context: "",
      terms: titleTerms,
      label: "title",
      prompt: buildTitlePrompt({ sourceText: title, sourceLanguage, targetLanguage, terms: titleTerms }),
    },
  ];

  if (excerpt) {
    const excerptTerms = termsOf(excerpt);
    headerUnits.push({
      key: keyOf("excerpt", excerpt, "", excerptTerms),
      kind: "excerpt",
      source: excerpt,
      context: "",
      terms: excerptTerms,
      label: "excerpt",
      prompt: buildTranslatePrompt({
        sourceText: excerpt,
        sourceLanguage,
        targetLanguage,
        preserveMarks: hasInlineMarks(excerpt),
        preserveStructure: hasInlineStructure(excerpt),
        terms: excerptTerms,
      }),
    });
  }

  const tagsSource = tags.join(" @@ ");
  if (tags.length > 0) {
    const tagsTerms = termsOf(tagsSource);
    headerUnits.push({
      key: keyOf("tags", tagsSource, "", tagsTerms),
      kind: "tags",
      source: tagsSource,
      context: "",
      terms: tagsTerms,
      label: "tags",
      prompt: buildTagsPrompt({ tags, sourceLanguage, targetLanguage, terms: tagsTerms }),
    });
  }

  // Diagram labels travel as one JSON batch, so two different term sets apply
  // and they are deliberately not the same one:
  //
  //   - `promptTerms` is selected from the whole diagram. The batch prompt and
  //     the cache key must depend only on the document, never on which labels
  //     happened to be pending, or a shrinking batch would change the prompt
  //     while leaving every key alone.
  //   - `terms` is selected from that label's own source, because that is what
  //     its translation has to honour. Enforcing the whole-diagram set on every
  //     label would demand `on-device` in labels that never mention 端侧.
  const diagramTerms = termsOf(htmlNodes.map((node) => node.source).join("\n"));

  const htmlUnits = htmlNodes.map((node) => ({
    key: keyOf("htmltext", node.source, "", diagramTerms),
    kind: "htmltext",
    source: node.source,
    context: "",
    promptTerms: diagramTerms,
    terms: termsOf(node.source),
    slot: node.slot,
  }));

  const bodyUnits = bodyPlan.units
    .map((unit, index) => {
      if (unit.kind === "verbatim") return null;

      const terms = termsOf(unit.source);

      return {
        index,
        key: keyOf(unit.kind, unit.source, unit.context, terms),
        kind: unit.kind,
        source: unit.source,
        context: unit.context,
        terms,
        label: `body unit ${index + 1}/${bodyPlan.units.length}`,
        prompt:
          unit.kind === "fenced"
            ? buildFencedPrompt({ sourceText: unit.source, sourceLanguage, targetLanguage, terms })
            : buildTranslatePrompt({
                sourceText: unit.source,
                sourceLanguage,
                targetLanguage,
                // The clause names the literal mark syntax, and Hy-MT2 otherwise
                // echoes those examples into the output as if they were body
                // text. Only units that actually carry marks get it, and the
                // formatting clause rides along only where there is formatting.
                preserveMarks: hasInlineMarks(unit.source),
                preserveStructure: hasInlineStructure(unit.source),
                context: unit.context,
                terms,
              }),
      };
    })
    .filter(Boolean);

  // ---- separate cache hits from work --------------------------------------
  const reusedKeys = new Set();
  const pendingHeader = [];
  const pendingHtml = new Map();
  const pendingBody = new Map();

  const resolve = (unit, pendingMap) => {
    const cached = cachedByKey(unit.key);
    if (cached !== null) {
      commit(unit, cached);
      reusedKeys.add(unit.key);
      return;
    }

    if (pendingMap === undefined) {
      pendingHeader.push(unit);
    } else if (!pendingMap.has(unit.key)) {
      pendingMap.set(unit.key, unit);
    }
  };

  for (const unit of headerUnits) resolve(unit);
  for (const unit of htmlUnits) resolve(unit, pendingHtml);
  for (const unit of bodyUnits) resolve(unit, pendingBody);

  const pendingTotal = pendingHeader.length + pendingHtml.size + pendingBody.size;
  const totalCalls = pendingHeader.length + (pendingHtml.size > 0 ? 1 : 0) + pendingBody.size;
  let callsDone = 0;

  // A full retranslation of a long post is minutes of local model time with no
  // other output, so every model call reports as it lands.
  const noteCall = (label, chars) => {
    callsDone += 1;
    console.log(`  [${callsDone}/${totalCalls}] ${label} (${chars} chars)`);
  };

  if (dryRun) {
    console.log(
      `${sourcePath}: ${reusedKeys.size} units reusable, ${pendingTotal} to translate ` +
        `(header ${pendingHeader.length}, diagram ${pendingHtml.size}, body ${pendingBody.size}; ` +
        `${totalCalls} calls).`
    );
    return { status: "check", reused: reusedKeys.size, translated: 0, pending: pendingTotal };
  }

  console.log(
    `${sourcePath}: ${reusedKeys.size} units reused, ${pendingTotal} to translate with ${model} ` +
      `(${totalCalls} calls, concurrency ${concurrency}).`
  );

  // ---- translate what is missing ------------------------------------------
  // Header fields are cheap to check and expensive to get wrong: a bad title
  // must fail in seconds, not after the whole body has been retranslated.
  await mapWithConcurrency(pendingHeader, concurrency, async (unit) => {
    commit(unit, await translateWithGlossaryRetry(unit));
    noteCall(unit.label, unit.source.length);
  });

  const headerTranslation = (unit) => String(nextUnits[unit.key]?.translation ?? "");
  const titleUnit = headerUnits[0];
  const excerptUnit = excerpt ? headerUnits[1] : null;
  const tagsUnit = tags.length > 0 ? headerUnits[headerUnits.length - 1] : null;
  const translatedTitle = headerTranslation(titleUnit).trim();
  const translatedExcerpt = excerptUnit ? headerTranslation(excerptUnit).trim() : "";
  const translatedTags =
    tagsUnit !== null ? splitTranslatedTags(headerTranslation(tagsUnit), tags.length) : [];

  validateTranslatedField({ text: translatedTitle, sourceText: title, targetLanguage, label: "标题" });
  if (translatedExcerpt) {
    validateTranslatedField({
      text: translatedExcerpt,
      sourceText: excerpt,
      targetLanguage,
      label: "摘要",
    });
  }
  for (const [index, tag] of translatedTags.entries()) {
    validateTranslatedField({
      text: tag,
      sourceText: tags[index] ?? "",
      targetLanguage,
      label: `标签 ${index + 1}`,
      requireTranslated: false,
    });
  }

  // Diagram labels travel as one JSON batch, but only the missing nodes are
  // sent: changing one label costs one small call, not a whole-diagram one.
  let translatedHtmlText;
  if (htmlUnits.length > 0) {
    if (pendingHtml.size > 0) {
      const missPayload = {};
      for (const unit of pendingHtml.values()) {
        missPayload[unit.slot] = unit.source;
      }

      const htmlPrompt = buildHtmlTextPrompt({
        htmlText: missPayload,
        sourceLanguage,
        targetLanguage,
        terms: diagramTerms,
      });

      // The whole batch is re-sampled when the glossary check rejects any of its
      // labels, because the labels share one call. A failed attempt may have
      // written some units into `nextUnits`; that is harmless, since a final
      // failure throws before the cache is written.
      let htmlError;
      for (let attempt = 1; attempt <= GLOSSARY_MAX_ATTEMPTS; attempt += 1) {
        const rawHtmlText = await translateField(request, htmlPrompt, "htmlText");
        const parsedHtmlText = parseJsonObject(rawHtmlText);
        if (!parsedHtmlText) {
          throw new Error("Hy-MT2 returned non-JSON htmlText. Diagnostics saved for inspection.");
        }
        validateHtmlText(parsedHtmlText, missPayload, targetLanguage);

        try {
          for (const unit of pendingHtml.values()) {
            commit(unit, decodeHtmlEntities(String(parsedHtmlText[unit.slot]).trim()));
          }
          htmlError = null;
          break;
        } catch (error) {
          htmlError = error;
          console.warn(`  ! htmlText: ${error.message} Retrying (${attempt}/${GLOSSARY_MAX_ATTEMPTS}).`);
        }
      }

      if (htmlError) throw htmlError;

      noteCall(`diagram (${pendingHtml.size} labels)`, Object.values(missPayload).join("").length);
    }

    translatedHtmlText = {};
    for (const unit of htmlUnits) {
      translatedHtmlText[unit.slot] = nextUnits[unit.key].translation;
    }
  }

  // ---- body ---------------------------------------------------------------
  await mapWithConcurrency([...pendingBody.values()], concurrency, async (unit) => {
    commit(unit, await translateWithGlossaryRetry(unit));
    noteCall(unit.label, unit.source.length);
  });

  for (const unit of bodyUnits) {
    const translation = nextUnits[unit.key]?.translation;
    if (typeof translation !== "string") {
      throw new Error(`Missing translation for body unit ${unit.index + 1}.`);
    }
    bodyPlan.units[unit.index].translation = translation;
  }

  const assembledBody = assembleBody(bodyPlan.units, bodyPlan.trailing);
  const finalBody = restoreHtmlBlocks(assembledBody, blocks, translatedHtmlText);
  validateNoLeftoverPlaceholders(finalBody);
  validateFencesPreserved(body, finalBody);
  validateInlineMarksPreserved(body, finalBody);
  validateInlineStructurePreserved(body, finalBody);
  validateTextHygiene({ text: finalBody, sourceText: body, targetLanguage, label: "译文正文" });
  validateActuallyTranslated(finalBody, targetLanguage);

  // Emit the unit map in document order, not commit order. Under concurrency
  // the commit order depends on which request lands first, and a cache that is
  // committed to git must not churn its key order when nothing else changed.
  const orderedUnits = orderUnitsByPlan(
    nextUnits,
    [...headerUnits, ...htmlUnits, ...bodyUnits].map((unit) => unit.key)
  );

  const cache = {
    version: TRANSLATION_CACHE_VERSION,
    pipeline: TRANSLATION_PIPELINE_VERSION,
    glossary: TRANSLATION_GLOSSARY_VERSION,
    sourcePath,
    sourceHash,
    sourceLanguage,
    targetLanguage,
    model,
    generation,
    mode: "hy-mt2",
    title: translatedTitle,
    excerpt: translatedExcerpt,
    tags: translatedTags,
    body: finalBody,
    units: orderedUnits,
  };

  // The cache is the one place where the published fields and the units they
  // were assembled from sit side by side; if they disagree, no reader can tell
  // which half is right.
  const inconsistencies = findCacheInconsistencies(cache);
  if (inconsistencies.length > 0) {
    throw new Error(
      `${sourcePath}: refusing to write a cache that contradicts itself:\n  - ${inconsistencies.join("\n  - ")}`
    );
  }

  await fs.mkdir(path.dirname(cachePath), { recursive: true });
  await fs.writeFile(cachePath, `${JSON.stringify(cache, null, 2)}\n`);
  console.log(`Wrote ${cachePath} (${Object.keys(orderedUnits).length} units cached).`);
  return { status: "translated", reused: reusedKeys.size, translated: pendingTotal, pending: 0 };
}

function parseSimpleYaml(source) {
  const result = {};
  const lines = source.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim() || line.trimStart().startsWith("#")) {
      continue;
    }

    const match = line.match(/^([A-Za-z0-9_-]+):(?:\s*(.*))?$/);
    if (!match) {
      continue;
    }

    const key = match[1];
    const value = match[2] ?? "";

    if (value === "") {
      const items = [];
      while (index + 1 < lines.length) {
        const nextLine = lines[index + 1];
        const itemMatch = nextLine.match(/^\s+-\s+(.*)$/);
        if (!itemMatch) {
          break;
        }
        items.push(parseScalar(itemMatch[1]));
        index += 1;
      }
      result[key] = items.length > 0 ? items : "";
      continue;
    }

    result[key] = parseScalar(value);
  }

  return result;
}

function parseScalar(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    return trimmed.slice(1, -1);
  }

  if (trimmed === "true") {
    return true;
  }

  if (trimmed === "false") {
    return false;
  }

  return trimmed;
}

function normalizeString(value) {
  return typeof value === "string" ? value : "";
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => String(item));
}

function getSourceLanguage(frontmatterLanguage, text) {
  if (frontmatterLanguage === "en" || frontmatterLanguage === "zh") {
    return frontmatterLanguage;
  }

  return detectLanguage(text);
}

async function listPostPaths() {
  let entries;
  try {
    entries = await fs.readdir(POSTS_DIR, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }
    throw error;
  }

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".mdx"))
    .map((entry) => path.posix.join(POSTS_DIR, entry.name))
    .sort();
}

/**
 * Reads a cache document, tolerating absence and corruption.
 *
 * A missing or unparsable cache is simply "no reusable units": the post gets
 * retranslated rather than failing, which is what makes a hand-edited or
 * half-committed cache recoverable.
 */
async function readTranslationCache(cachePath) {
  try {
    return JSON.parse(await fs.readFile(cachePath, "utf8"));
  } catch {
    return null;
  }
}

const REQUEST_MAX_ATTEMPTS = 3;
const REQUEST_BASE_RETRY_DELAY_MS = 2_000;

// How many samples a unit may take before a glossary rejection ends the run.
// The glossary check is the only one that judges meaning, and a local 7B model
// occasionally drops a required term on an otherwise fine translation; aborting
// a whole post for one unlucky sample would be worse than re-asking. A prompt
// that is systematically wrong still fails, after a bounded number of calls.
const GLOSSARY_MAX_ATTEMPTS = 3;

// How long to wait for the metadata read that identifies the local model.
const MODEL_DIGEST_TIMEOUT_MS = 5_000;

/**
 * The Ollama tag list for a base URL, used only to read model digests.
 *
 * The chat endpoint is an OpenAI-compatible `${base}/v1`; Ollama's own metadata
 * lives one level up. A base URL without a `/v1` suffix is used as it is.
 */
export function ollamaTagsUrl(baseUrl) {
  const trimmed = String(baseUrl).replace(/\/+$/, "");
  const root = trimmed.endsWith("/v1") ? trimmed.slice(0, -3) : trimmed;

  return `${root}/api/tags`;
}

/**
 * The digest of a model in an Ollama tag listing, or null when it is absent.
 *
 * Ollama identifies a model by name and digest. The name survives an
 * `ollama create` from an edited Modelfile or a different GGUF while the digest
 * does not, which is exactly the swap the cache has to notice. Names are matched
 * with and without an explicit `:tag`, because a model created as `hy-mt2-7b`
 * reports itself as `hy-mt2-7b:latest`.
 */
export function findModelDigest(models, model) {
  if (!Array.isArray(models)) return null;

  const wanted = String(model);

  for (const entry of models) {
    if (!entry || typeof entry !== "object") continue;

    const names = [entry.name, entry.model].filter((name) => typeof name === "string");
    if (!names.some((name) => name === wanted || name.split(":")[0] === wanted)) continue;

    return typeof entry.digest === "string" && entry.digest !== "" ? entry.digest : null;
  }

  return null;
}

/**
 * Reads the local model's digest, or null when the endpoint does not report one.
 *
 * Best effort on purpose. The chat endpoint is the only interface the pipeline
 * truly needs, and a proxy that exposes `/v1` alone cannot answer `/api/tags`;
 * an unreadable digest degrades the identity (a swapped model goes unnoticed
 * until the parameters or the source change) but must never fail a run.
 */
async function readModelDigest(baseUrl, model) {
  try {
    const response = await fetch(ollamaTagsUrl(baseUrl), {
      signal: AbortSignal.timeout(MODEL_DIGEST_TIMEOUT_MS),
    });
    if (!response.ok) return null;

    const payload = await response.json();
    return findModelDigest(payload?.models, model);
  } catch {
    return null;
  }
}

/**
 * Rejects a response the model cut short.
 *
 * A response stopped by the token budget is not a translation: the model breaks
 * off mid-sentence and every structural validator still passes, because nothing
 * about the text is malformed — the truncated unit would then be cached and
 * published. `finish_reason` is the only signal that says so, so it is checked
 * before the text reaches the validators.
 */
export function assertResponseComplete(payload, label) {
  const finishReason = payload?.choices?.[0]?.finish_reason;

  if (finishReason === "length") {
    throw new Error(
      `Hy-MT2 hit the token limit for ${label} (finish_reason: "length") and the text was cut short. ` +
        `Raise num_predict in scripts/translation/Modelfile or shorten the unit; nothing was written to the cache.`
    );
  }
}

/**
 * One field/chunk translation against the local (or any OpenAI-compatible)
 * Hy-MT2 server. Unlike the old chat-model pipeline there is no JSON envelope:
 * the model answers with plain translated text, which the validators then
 * check. Connection failures point at the setup steps instead of a bare stack.
 */
export async function translateField({ baseUrl, model, sourceLanguage, targetLanguage }, prompt, label) {
  const endpoint = `${baseUrl.replace(/\/+$/, "")}/chat/completions`;
  const request = {
    model,
    stream: false,
    messages: [{ role: "user", content: prompt }],
    ...GENERATION_PARAMETERS,
  };

  let rawResponse = "";
  for (let attempt = 1; attempt <= REQUEST_MAX_ATTEMPTS; attempt += 1) {
    let response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
    } catch (error) {
      throw new Error(
        `Cannot reach the Hy-MT2 server at ${endpoint}: ${error.message}. ` +
          `Start it with \`ollama serve\` and register the model once with ` +
          `\`ollama create ${DEFAULT_MODEL} -f scripts/translation/Modelfile\`.`
      );
    }

    rawResponse = await response.text();
    if (response.ok) {
      break;
    }

    if (!isRetryableStatus(response.status) || attempt === REQUEST_MAX_ATTEMPTS) {
      throw new Error(`Hy-MT2 request failed with HTTP ${response.status}: ${rawResponse.slice(0, 500)}`);
    }

    console.warn(
      `Hy-MT2 returned HTTP ${response.status} for ${label}; retrying (attempt ${attempt + 1}/${REQUEST_MAX_ATTEMPTS}).`
    );
    await sleep(REQUEST_BASE_RETRY_DELAY_MS * attempt);
  }

  let payload;
  try {
    payload = JSON.parse(rawResponse);
  } catch {
    await writeInvalidResponse(rawResponse);
    throw new Error(`Hy-MT2 returned invalid JSON for ${label}. Diagnostics saved to ${DIAGNOSTICS_PATH}.`);
  }

  const content = payload.choices?.[0]?.message?.content;
  if (typeof content !== "string" || content.trim() === "") {
    await writeInvalidResponse(rawResponse);
    throw new Error(`Hy-MT2 returned an empty translation for ${label}. Diagnostics saved to ${DIAGNOSTICS_PATH}.`);
  }

  try {
    assertResponseComplete(payload, label);
  } catch (error) {
    await writeInvalidResponse(rawResponse);
    throw new Error(`${error.message} Diagnostics saved to ${DIAGNOSTICS_PATH}.`);
  }

  return content.trim();
}

export function validateHtmlText(htmlText, expected, targetLanguage) {
  if (!htmlText || typeof htmlText !== "object") {
    throw new Error("Hy-MT2 response is missing translated htmlText for embedded HTML blocks.");
  }

  const missing = Object.keys(expected).filter(
    (key) => typeof htmlText[key] !== "string" || htmlText[key].trim() === ""
  );

  if (missing.length > 0) {
    throw new Error(`Hy-MT2 response is missing htmlText translations for keys: ${missing.join(", ")}.`);
  }

  // Diagram labels are reader-facing text, so they get the same hygiene rules as
  // body prose. Entities are compared after decoding on both sides: the writer
  // escapes each value exactly once, so a decoded entity is never a defect.
  for (const key of Object.keys(expected)) {
    validateTextHygiene({
      text: decodeHtmlEntities(htmlText[key]),
      sourceText: decodeHtmlEntities(expected[key]),
      targetLanguage,
      label: `图表文本 ${key}`,
    });
  }
}

/**
 * Refuses a body that still carries an unrestored HTML placeholder.
 *
 * `restoreHtmlBlocks` replaces the first occurrence of each placeholder and
 * throws when one is missing entirely, so a model that echoed or duplicated a
 * placeholder can leave a second copy behind and still pass that check.
 */
export function validateNoLeftoverPlaceholders(body) {
  const leftover = (typeof body === "string" ? body : "").match(/\[\[html-block-\d+\]\]/g);

  if (leftover) {
    throw new Error(
      `译文里残留未还原的占位符：${[...new Set(leftover)].join(", ")}。已拒绝写入缓存。`
    );
  }
}

/**
 * Refuses a "translation" that is really the source text.
 *
 * Models occasionally echo the input back. Every structural check still
 * passes in that case, so a build would publish a page in the wrong language.
 * Measured on prose only: code fences legitimately keep their original text.
 */
export function validateActuallyTranslated(translatedBody, targetLanguage, label = "译文正文") {
  const prose = (typeof translatedBody === "string" ? translatedBody : "").replace(
    /```[\s\S]*?```/g,
    ""
  );
  const cjk = (prose.match(/[\u3400-\u9fff]/g) ?? []).length;
  const total = prose.replace(/\s/g, "").length;

  if (total === 0) {
    throw new Error(`${label}为空。已拒绝写入缓存。`);
  }

  const ratio = cjk / total;
  const percent = `${(ratio * 100).toFixed(1)}%`;

  if (targetLanguage === "en" && ratio > 0.05) {
    throw new Error(`${label}仍是中文（中文占比 ${percent}），判定为未翻译。已拒绝写入缓存。`);
  }

  if (targetLanguage === "zh" && ratio < 0.3) {
    throw new Error(`${label}缺少中文（中文占比 ${percent}），判定为未翻译。已拒绝写入缓存。`);
  }
}

/**
 * Counts the author's inline annotation marks in a body.
 *
 * Fenced blocks and inline code are stripped first so a `==` that is being
 * quoted as code does not inflate the count.
 */
export function summariseInlineMarks(text) {
  const source = typeof text === "string" ? text : "";
  const prose = source.replace(/```[\s\S]*?```/g, "").replace(/`[^`\n]*`/g, "");

  return {
    delimiters: (prose.match(/==/g) ?? []).length,
    notes: (prose.match(/\^\[/g) ?? []).length,
    colors: [...prose.matchAll(/==([a-z_]+)\|/g)].map((match) => match[1]).sort(),
  };
}

/**
/**
 * Every fence marker line in a body, in document order.
 *
 * Opening and closing follow the renderer (and CommonMark 4.5): a block opens
 * on a line holding three or more backticks or tildes and closes on a line that
 * repeats the same character at least as many times with no info string. Lines
 * inside a block are never mistaken for markers, so a ``` inside a `~~~` block
 * does not count as one.
 */
export function listFenceMarkers(text) {
  const lines = (typeof text === "string" ? text : "").split("\n");
  const markers = [];
  let index = 0;

  while (index < lines.length) {
    const open = lines[index].match(FENCE_START_PATTERN);
    if (!open) {
      index += 1;
      continue;
    }

    const closer = fenceCloserPattern(open[1]);
    let closeIndex = -1;
    for (let scan = index + 1; scan < lines.length; scan += 1) {
      if (closer.test(lines[scan])) {
        closeIndex = scan;
        break;
      }
    }

    markers.push(lines[index]);
    if (closeIndex === -1) {
      // An unclosed fence owns the rest of the document.
      break;
    }

    markers.push(lines[closeIndex]);
    index = closeIndex + 1;
  }

  return markers;
}

/**
 * Refuses a body whose fenced blocks changed shape.
 *
 * Fence markers are re-attached from the source after translation, so any
 * difference means the model emitted a fence of its own inside prose; a stray
 * ``` silently swallows the rest of the page as code, which no other validator
 * here would notice. Comparing the marker lines themselves rather than only
 * their number also catches a marker that came back as a different character, a
 * longer run, or a changed info string.
 */
export function validateFencesPreserved(sourceBody, translatedBody) {
  const before = listFenceMarkers(sourceBody);
  const after = listFenceMarkers(translatedBody);

  if (before.length !== after.length) {
    throw new Error(
      `代码围栏数量 ${before.length} → ${after.length}，Markdown 结构已被破坏。已拒绝写入缓存。`
    );
  }

  const drift = before.findIndex((line, position) => line !== after[position]);
  if (drift !== -1) {
    throw new Error(
      `第 ${Math.floor(drift / 2) + 1} 个代码围栏的标记被改动：` +
        `${JSON.stringify(before[drift])} → ${JSON.stringify(after[drift])}，` +
        "Markdown 结构已被破坏。已拒绝写入缓存。"
    );
  }
}

/**
 * Whether a piece of prose actually carries the author's annotation marks.
 *
 * Hy-MT2 tends to echo the literal `==color|text==` / `^[text]` examples from
 * the preservation clause straight into its output, so that clause is only
 * attached where marks really exist.
 */
export function hasInlineMarks(text) {
  const marks = summariseInlineMarks(text);
  return marks.delimiters > 0 || marks.notes > 0;
}

/**
 * Refuses a translation that lost, duplicated, or recoloured the author's
 * marks.
 *
 * The translation model rewrites sentences rather than markup, but it is free
 * to reorder clauses, and a dropped `==` would silently turn an emphasised
 * judgement into plain prose. Failing here keeps a bad translation out of the
 * cache instead of publishing it.
 */
export function validateInlineMarksPreserved(sourceBody, translatedBody) {
  const before = summariseInlineMarks(sourceBody);
  const after = summariseInlineMarks(translatedBody);
  const problems = [];

  if (before.delimiters !== after.delimiters) {
    problems.push(`== 标记符数量 ${before.delimiters} → ${after.delimiters}`);
  }
  if (before.notes !== after.notes) {
    problems.push(`页边批注数量 ${before.notes} → ${after.notes}`);
  }
  if (before.colors.join(",") !== after.colors.join(",")) {
    problems.push(
      `颜色名集合 [${before.colors.join(", ")}] → [${after.colors.join(", ")}]`
    );
  }

  if (problems.length > 0) {
    throw new Error(
      `翻译后行内标记与原文不一致：${problems.join("；")}。已拒绝写入缓存，请重跑或更换模型。`
    );
  }
}

const INLINE_CODE_PATTERN = /`([^`\n]+)`/g;
const ITALIC_SPAN_PATTERN = /(?<!\*)\*(?![\s*])[^*\n]*[^\s*](?<!\*)\*(?!\*)/g;
const LINK_PATTERN = /\[[^\]\n]*\]\(([^)\s]+)\)/g;
const MOJIBAKE_PATTERN =
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u200B-\u200F\u2028\u2029\u2060\uFEFF\uFFFD]/;
const HTML_ENTITY_PATTERN = /&(?:amp|lt|gt|quot|apos|nbsp|#\d+|#x[0-9a-fA-F]+);/g;
const CJK_SENTENCE_PUNCTUATION_PATTERN = /[。，；！？、]/g;
const DEGENERATE_REPEAT_PATTERN = /(.{12,80})\1{2,}/;
const FIELD_PLACEHOLDER_PATTERN = /\[\[html-block-\d+\]\]/;

// Phrases that only ever appear in this script's own prompts. Checked against
// the source so a post that legitimately discusses translation still passes.
const INSTRUCTION_LEAK_PHRASES = [
  "只需要输出",
  "翻译为",
  "以下是翻译",
  "这段话属于小节",
  "该小节标题仅供",
  "Translate the following",
  "only output the translated",
  "Here is the translation",
  "belongs to the section",
  "That heading is context only",
];

/** Fenced blocks, removed so their contents are not read as author markup. */
function stripFencedBlocks(text) {
  return (typeof text === "string" ? text : "").replace(
    /^[ \t]*[`~]{3,}[^\n]*\n[\s\S]*?^[ \t]*[`~]{3,}[ \t]*$/gm,
    ""
  );
}

/**
 * The author's inline markup, summarised from prose only.
 *
 * Fenced blocks and inline code are stripped before counting: code is carried
 * over verbatim, so a `**` or a `[` inside a fence is not one of the author's
 * markers. The marker set is the one documented in docs/insights-markup.md.
 */
export function summariseInlineStructure(text) {
  const prose = stripFencedBlocks(text);

  return {
    bold: (prose.match(/\*\*/g) ?? []).length,
    italic: (prose.match(ITALIC_SPAN_PATTERN) ?? []).length,
    strike: (prose.match(/~~/g) ?? []).length,
    code: [...prose.matchAll(INLINE_CODE_PATTERN)].map((match) => match[1]),
    linkUrls: [...prose.matchAll(LINK_PATTERN)].map((match) => match[1]),
    headings: [...prose.matchAll(/^(#{1,6}) /gm)].map((match) => match[1]).join(","),
    listItems: (prose.match(/^[ \t]*(?:[-*+]|\d+\.) /gm) ?? []).length,
  };
}

const INLINE_STRUCTURE_LABELS = [
  ["Markdown 行内代码", "code"],
  ["链接地址", "linkUrls"],
  ["标题层级", "headings"],
  ["列表项数量", "listItems"],
  ["粗体 ** 数量", "bold"],
  ["斜体 * 数量", "italic"],
  ["删除线 ~~ 数量", "strike"],
];

/**
 * Whether a chunk carries inline formatting that must survive translation.
 */
export function hasInlineStructure(text) {
  const structure = summariseInlineStructure(text);

  return (
    structure.bold > 0 ||
    structure.italic > 0 ||
    structure.strike > 0 ||
    structure.code.length > 0 ||
    structure.linkUrls.length > 0 ||
    structure.headings.length > 0 ||
    structure.listItems > 0
  );
}

/**
 * Refuses a translation that dropped, added or rewrote the author's inline
 * markup.
 *
 * The model rewrites sentences, and a `**` that quietly disappears turns an
 * emphasised judgement into plain prose — the text stays valid Markdown, so no
 * structural check notices. Values are compared, not just counts: link targets
 * must stay byte-identical, and inline code keeps the identifiers a reader is
 * meant to copy.
 */
export function validateInlineStructurePreserved(sourceBody, translatedBody) {
  const before = summariseInlineStructure(sourceBody);
  const after = summariseInlineStructure(translatedBody);
  const problems = [];

  for (const [label, key] of INLINE_STRUCTURE_LABELS) {
    const expected = JSON.stringify(before[key]);
    const actual = JSON.stringify(after[key]);
    if (expected !== actual) {
      problems.push(`${label} ${expected} → ${actual}`);
    }
  }

  if (problems.length > 0) {
    throw new Error(
      `翻译后 Markdown 行内标记与原文不一致：${problems.join("；")}。已拒绝写入缓存，请重跑或更换模型。`
    );
  }
}

/**
 * Character-level sanity check for any translated string.
 *
 * Covers what no structural check can see: replacement characters and control
 * bytes from a broken decode, HTML entities the model invented (which render as
 * a literal `&amp;`), Chinese sentence punctuation left inside an English
 * sentence, text the model repeated until it ran out of room, and this script's
 * own prompt wording leaking into the output.
 */
export function validateTextHygiene({ text, sourceText = "", targetLanguage, label }) {
  const value = typeof text === "string" ? text : "";
  const source = typeof sourceText === "string" ? sourceText : "";
  const problems = [];

  const mojibake = value.match(MOJIBAKE_PATTERN);
  if (mojibake) {
    const codePoint = mojibake[0].codePointAt(0).toString(16).toUpperCase().padStart(4, "0");
    problems.push(`出现乱码或控制字符 U+${codePoint}`);
  }

  const entities = (value.match(HTML_ENTITY_PATTERN) ?? []).length;
  const sourceEntities = (source.match(HTML_ENTITY_PATTERN) ?? []).length;
  if (entities > sourceEntities) {
    problems.push(`HTML 实体泄漏 ${sourceEntities} → ${entities}`);
  }

  if (targetLanguage === "en") {
    const punctuation = [...new Set(value.match(CJK_SENTENCE_PUNCTUATION_PATTERN) ?? [])];
    if (punctuation.length > 0) {
      problems.push(`英文译文里残留中文标点 ${punctuation.join("")}`);
    }
  }

  const leaked = INSTRUCTION_LEAK_PHRASES.find(
    (phrase) => value.includes(phrase) && !source.includes(phrase)
  );
  if (leaked) {
    problems.push(`疑似把提示词写进了译文：${leaked}`);
  }

  const repeated = stripFencedBlocks(value).match(DEGENERATE_REPEAT_PATTERN);
  if (repeated) {
    problems.push(`译文出现重复退化片段：${repeated[1].slice(0, 24)}`);
  }

  if (problems.length > 0) {
    throw new Error(`${label}未通过输出检查：${problems.join("；")}。已拒绝写入缓存。`);
  }
}

/**
 * Checks a translated header field (title, excerpt, tag).
 *
 * These fields go straight into the page shell, so a newline or a leftover
 * placeholder breaks the layout rather than just the prose. Titles and excerpts
 * must also read as translated text; tags are exempt because this blog keeps
 * product names (`AI`, `GPU`) in its Chinese tags.
 */
export function validateTranslatedField({
  text,
  sourceText = "",
  targetLanguage,
  label,
  requireTranslated = true,
}) {
  const value = (typeof text === "string" ? text : "").trim();

  if (value === "") {
    throw new Error(`${label}译文为空。已拒绝写入缓存。`);
  }

  if (/[\n\r]/.test(value)) {
    throw new Error(`${label}译文包含换行，会破坏页面结构。已拒绝写入缓存。`);
  }

  if (FIELD_PLACEHOLDER_PATTERN.test(value) || FENCE_START_PATTERN.test(value)) {
    throw new Error(`${label}译文残留了 Markdown 结构标记。已拒绝写入缓存。`);
  }

  validateTextHygiene({ text: value, sourceText, targetLanguage, label });

  if (requireTranslated) {
    validateActuallyTranslated(value, targetLanguage, label);
  }
}

function parseJsonObject(content) {
  if (typeof content !== "string") {
    return null;
  }

  const fenceMatch = content.trim().match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  const jsonText = fenceMatch ? fenceMatch[1] : content.trim();

  try {
    const parsed = JSON.parse(jsonText);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function isRetryableStatus(status) {
  return status === 408 || status === 429 || status >= 500;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function writeInvalidResponse(rawResponse) {
  await fs.mkdir(path.dirname(DIAGNOSTICS_PATH), { recursive: true });
  await fs.writeFile(DIAGNOSTICS_PATH, rawResponse);
}

const isCli = process.argv[1] === fileURLToPath(import.meta.url);

if (isCli) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
