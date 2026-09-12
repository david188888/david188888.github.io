#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { splitMarkdownSegments } from "../src/lib/content/markdown-segments.mjs";

const DEFAULT_BASE_URL = "http://localhost:11434/v1";
const DEFAULT_MODEL = "hy-mt2-7b";
const POSTS_DIR = "content/posts";
const TRANSLATION_DIR = "content/generated/translations/posts";
const DIAGNOSTICS_PATH = "local/translation-diagnostics/last-invalid-response.txt";

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

export function createSourceHash(source) {
  if (typeof source !== "string") {
    throw new TypeError("createSourceHash expects a raw source string.");
  }

  return crypto.createHash("sha256").update(source).digest("hex");
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
const FENCED_HTML_PATTERN = /^```html[^\n]*\n([\s\S]*?)\n?```$/;

function matchFencedHtmlBlock(content) {
  const trimmed = content.trim();
  const match = trimmed.match(FENCED_HTML_PATTERN);
  if (!match) {
    return null;
  }

  return {
    inner: match[1],
    prefix: `${trimmed.slice(0, trimmed.indexOf("\n") + 1)}`,
    // The newline before the closing marker belongs to the wrapper, not to the
    // body: without it the restored fence glues onto the last markup line.
    suffix: "\n```",
  };
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
 * Visible text between tags inside an embedded HTML block (node labels,
 * legends, figcaption). Attributes are intentionally left untouched.
 */
export function extractTextNodes(html) {
  const nodes = [];
  const pattern = new RegExp(TEXT_NODE_PATTERN.source, "g");
  let match;

  while ((match = pattern.exec(html)) !== null) {
    const text = match[1].trim();
    if (text) {
      nodes.push(text);
    }
  }

  return nodes;
}

/**
 * Flat map of "blockIndex.nodeIndex" -> source text, mirroring the order that
 * extractTextNodes produces for each block. The model must return the same
 * keys so translations can be re-applied by position.
 */
export function buildHtmlTextPayload(blocks) {
  const htmlText = {};

  for (const [blockIndex, block] of blocks.entries()) {
    for (const [nodeIndex, text] of extractTextNodes(block.html).entries()) {
      htmlText[`${blockIndex + 1}.${nodeIndex + 1}`] = text;
    }
  }

  return Object.keys(htmlText).length > 0 ? htmlText : undefined;
}

function escapeXmlText(value) {
  return value
    .replace(/\s+/g, " ")
    .trim()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Applies per-node translations back into the HTML while preserving the
 * original indentation whitespace around each text node. Nodes without a
 * translation keep their source text.
 */
export function applyTextTranslations(html, translations) {
  let nodeIndex = 0;
  return html.replace(new RegExp(TEXT_NODE_PATTERN.source, "g"), (full, text) => {
    const core = text.trim();
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
    return `>${leading}${escapeXmlText(replacement)}${trailing}<`;
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
// Hy-MT2-Translator skill vendored under .claude/skills/hy-mt2-translator).
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

/**
 * Basic-mode Hy-MT2 prompt. `preserveMarks` appends the blog-specific
 * structure/annotation clause used for body chunks.
 */
export function buildTranslatePrompt({ sourceText, sourceLanguage, targetLanguage, preserveMarks = false }) {
  const target = LANGUAGE_NAMES[targetLanguage][sourceLanguage];

  if (sourceLanguage === "zh") {
    const extra = preserveMarks ? `，并且${MARKS_CLAUSE_ZH}` : "";
    return `将以下文本翻译为 \`${target}\`，注意**只需要输出翻译后的结果，不要额外解释**${extra}：\n\n${sourceText}`;
  }

  const extra = preserveMarks ? ` ${MARKS_CLAUSE_EN}` : "";
  return `Translate the following text into \`${target}\`. Note that you should **only output the translated result without any additional explanation**.${extra}\n\n${sourceText}`;
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
export function buildTitlePrompt({ sourceText, sourceLanguage, targetLanguage }) {
  const target = LANGUAGE_NAMES[targetLanguage][sourceLanguage];
  const style = TITLE_STYLE[sourceLanguage];

  if (sourceLanguage === "zh") {
    return `请将以下文本翻译为 \`${target}\`。\n注意翻译的风格要严格符合【**\`${style}\`**】\n\n${sourceText}`;
  }

  return `Please translate the following text into \`${target}\`. Note that the translation style must strictly conform to [**\`${style}\`**]:\n\n${sourceText}`;
}

/**
 * Delimiter-mode prompt for the tag list: tags are joined with a rare ` @@ `
 * separator so one call translates all of them and the result can be split
 * back deterministically.
 */
export function buildTagsPrompt({ tags, sourceLanguage, targetLanguage }) {
  const target = LANGUAGE_NAMES[targetLanguage][sourceLanguage];
  const joined = tags.join(" @@ ");

  if (sourceLanguage === "zh") {
    return `请将以下文本准确翻译为 \`${target}\`。你必须在译文中**保留等量的分隔符 \` @@ \`，绝对不可遗漏、转义或翻译该符号，并注意分隔符的位置**：\n\n${joined}`;
  }

  return `Please accurately translate the following text into \`${target}\`. You must **retain the exact same number of \` @@ \` delimiters in the translation. Strictly do not omit, escape, or translate these symbols, and pay close attention to their placement**:\n\n${joined}`;
}

/**
 * Structured-data mode prompt for the visible text nodes of embedded HTML
 * blocks: the model translates JSON values only and must keep keys untouched.
 */
export function buildHtmlTextPrompt({ htmlText, sourceLanguage, targetLanguage }) {
  const target = LANGUAGE_NAMES[targetLanguage][sourceLanguage];
  const data = JSON.stringify(htmlText, null, 2);

  if (sourceLanguage === "zh") {
    return [
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
    ].join("\n");
  }

  return [
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
  ].join("\n");
}

/**
 * Prompt for a fenced block that carries Chinese text (a formula, a table, or
 * a comment inside sample code). The clause mirrors Hy-MT2's structured-data
 * rules: translate what a reader must read, keep code, identifiers, operators
 * and layout byte-identical.
 */
export function buildFencedPrompt({ sourceText, sourceLanguage, targetLanguage }) {
  const target = LANGUAGE_NAMES[targetLanguage][sourceLanguage];

  if (sourceLanguage === "zh") {
    return (
      `将以下文本翻译为 \`${target}\`，注意**只需要输出翻译后的结果，不要额外解释**。` +
      `这段内容位于 Markdown 代码块内：只翻译面向读者的自然语言和中文注释；` +
      `代码、公式符号（如 = ÷ × 等）、标识符、变量名、数字、缩进与换行必须原样保留。\n\n${sourceText}`
    );
  }

  return (
    `Translate the following text into \`${target}\`. Note that you should **only output the translated result without any additional explanation**. ` +
    `This content sits inside a Markdown code block: translate only reader-facing natural language and comments; ` +
    `keep code, formula symbols (such as = ÷ ×), identifiers, variable names, numbers, indentation and line breaks exactly as they are.\n\n${sourceText}`
  );
}

const CODE_FENCE_START = /^\s*```/;

/**
 * Groups the placeholder body into translation chunks of at most maxChars.
 * Segment boundaries (including fenced code blocks) are never crossed, so
 * markdown structure survives reassembly. Fenced code blocks are returned as
 * `verbatim` chunks: a specialised translation model is more likely to mangle
 * code than to help it, so code is carried over untranslated (callers should
 * surface contained CJK so nothing is silently left behind). Fenced blocks
 * tagged `html` never reach this function — extractHtmlBlocks lifts them out
 * first, so only genuine sample code is carried over verbatim.
 */
/**
 * Splits a fenced block into its opening marker line, body and closing marker,
 * so the markers can be re-attached untouched after the body is translated.
 * Returns null for single-line fences that have no body to translate.
 */
function splitFence(content) {
  const firstNewline = content.indexOf("\n");
  if (firstNewline === -1) {
    return null;
  }

  const lastNewline = content.lastIndexOf("\n");
  if (lastNewline <= firstNewline) {
    return null;
  }

  const prefix = content.slice(0, firstNewline + 1);
  const suffix = content.slice(lastNewline);
  const inner = content.slice(prefix.length, lastNewline);

  return inner.trim() === "" ? null : { prefix, suffix, inner };
}

export function chunkMarkdownBody(body, maxChars = MAX_CHUNK_CHARS) {
  const segments = splitMarkdownSegments(body);
  const chunks = [];
  let buffer = [];

  const flush = () => {
    if (buffer.length > 0) {
      chunks.push({ kind: "translate", content: buffer.join("\n") });
      buffer = [];
    }
  };

  for (const segment of segments) {
    if (CODE_FENCE_START.test(segment.content)) {
      flush();
      const fenced = splitFence(segment.content);
      // A fence with no CJK has nothing to translate and is carried over
      // untouched; one with CJK holds reader-facing text (formula, table,
      // comment) that must not be left in the source language. The fence
      // markers themselves stay out of the prompt \u2014 a small model will drop a
      // backtick and break the block, so only the body is sent.
      chunks.push(
        fenced && /[\u3400-\u9fff]/.test(fenced.inner)
          ? { kind: "fenced", content: segment.content, prefix: fenced.prefix, suffix: fenced.suffix, inner: fenced.inner }
          : { kind: "verbatim", content: segment.content }
      );
      continue;
    }

    const candidate = [...buffer, segment.content].join("\n");
    if (buffer.length > 0 && candidate.length > maxChars) {
      flush();
    }

    if (segment.content.length > maxChars) {
      // A single oversized prose segment is split on blank lines, then on
      // single newlines as a last resort, so no chunk exceeds the budget.
      for (const piece of splitOversizedSegment(segment.content, maxChars)) {
        if (buffer.length > 0 && [...buffer, piece].join("\n").length > maxChars) {
          flush();
        }
        buffer.push(piece);
      }
      continue;
    }

    buffer.push(segment.content);
  }

  flush();
  return chunks;
}

function splitOversizedSegment(content, maxChars) {
  const pieces = [];
  let remaining = content;

  while (remaining.length > maxChars) {
    // Cut boundaries keep their newlines on the left piece so that joining
    // the final chunks with "\n" reproduces the source byte structure: a
    // paragraph break cut leaves "\n" on the left and the join adds the other.
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
        // No usable newline (a single huge line): hard cut. The rejoin adds
        // one newline that was not in the source — acceptable for this edge.
        pieceEnd = maxChars;
        nextStart = maxChars;
      }
    }
    pieces.push(remaining.slice(0, pieceEnd));
    remaining = remaining.slice(nextStart);
  }

  if (remaining.length > 0) {
    pieces.push(remaining);
  }

  return pieces;
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

async function main() {
  const force = process.argv.includes("--force");
  const baseUrl = process.env.HY_MT2_BASE_URL || DEFAULT_BASE_URL;
  const model = process.env.HY_MT2_MODEL || DEFAULT_MODEL;
  const sourcePaths = await listPostPaths();

  if (sourcePaths.length === 0) {
    console.log("No content posts found.");
    return;
  }

  let translatedCount = 0;
  let skippedCount = 0;
  const failures = [];

  for (const sourcePath of sourcePaths) {
    let outcome;
    try {
      outcome = await translatePost({ sourcePath, baseUrl, model, force });
    } catch (error) {
      failures.push(`${sourcePath}: ${error.message}`);
      console.error(`Failed ${sourcePath}: ${error.message}`);
      continue;
    }

    if (outcome === "translated") {
      translatedCount += 1;
    } else {
      skippedCount += 1;
    }
  }

  console.log(`Translation cache complete: ${translatedCount} written, ${skippedCount} skipped, ${failures.length} failed.`);
  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

async function translatePost({ sourcePath, baseUrl, model, force }) {
  const source = await fs.readFile(sourcePath, "utf8");
  const parsed = parseFrontmatter(source);
  const title = normalizeString(parsed.frontmatter.title);
  const excerpt = normalizeString(parsed.frontmatter.excerpt);
  const tags = normalizeStringArray(parsed.frontmatter.tags);
  const body = parsed.body;
  const sourceLanguage = getSourceLanguage(parsed.frontmatter.language, `${title}\n${excerpt}\n${body}`);

  if (!sourceLanguage) {
    console.warn(`Skipping ${sourcePath}: unable to detect source language.`);
    return "skipped";
  }

  const targetLanguage = getTargetLanguage(sourceLanguage);
  const sourceHash = createSourceHash(source);
  const cachePath = toCachePath(sourcePath);

  if (!force && (await isFreshCache(cachePath, { sourceHash, targetLanguage }))) {
    console.log(`Skipping ${sourcePath}: fresh translation cache exists.`);
    return "skipped";
  }

  const { body: placeholderBody, blocks } = extractHtmlBlocks(body);
  const htmlText = buildHtmlTextPayload(blocks);
  const chunks = chunkMarkdownBody(placeholderBody);

  const request = { baseUrl, model, sourceLanguage, targetLanguage };

  console.log(`${sourcePath}: translating title, excerpt, ${tags.length} tags, ${chunks.length} body chunks with ${model}.`);

  const translatedTitle = await translateField(request, buildTitlePrompt({
    sourceText: title,
    sourceLanguage,
    targetLanguage,
  }), "title");

  const translatedExcerpt = excerpt
    ? await translateField(request, buildTranslatePrompt({
        sourceText: excerpt,
        sourceLanguage,
        targetLanguage,
        preserveMarks: hasInlineMarks(excerpt),
      }), "excerpt")
    : "";

  const translatedTags = tags.length > 0
    ? splitTranslatedTags(
        await translateField(request, buildTagsPrompt({ tags, sourceLanguage, targetLanguage }), "tags"),
        tags.length
      )
    : [];

  const translatedChunks = [];
  for (const [index, chunk] of chunks.entries()) {
    if (chunk.kind === "verbatim") {
      translatedChunks.push(chunk.content);
      continue;
    }

    console.log(`  [${index + 1}/${chunks.length}] translating ${chunk.content.length} chars...`);

    if (chunk.kind === "fenced") {
      const translatedInner = await translateField(
        request,
        buildFencedPrompt({ sourceText: chunk.inner, sourceLanguage, targetLanguage }),
        `body chunk ${index + 1}`
      );
      translatedChunks.push(`${chunk.prefix}${translatedInner}${chunk.suffix}`);
      continue;
    }

    translatedChunks.push(
      await translateField(request, buildTranslatePrompt({
        sourceText: chunk.content,
        sourceLanguage,
        targetLanguage,
        // The clause names the literal mark syntax, and Hy-MT2 otherwise
        // echoes those examples into the output as if they were body text.
        // Only chunks that actually carry marks get it.
        preserveMarks: hasInlineMarks(chunk.content),
      }), `body chunk ${index + 1}`)
    );
  }

  let translatedHtmlText;
  if (htmlText) {
    const rawHtmlText = await translateField(
      request,
      buildHtmlTextPrompt({ htmlText, sourceLanguage, targetLanguage }),
      "htmlText"
    );
    translatedHtmlText = parseJsonObject(rawHtmlText);
    if (!translatedHtmlText) {
      throw new Error("Hy-MT2 returned non-JSON htmlText. Diagnostics saved for inspection.");
    }
    validateHtmlText(translatedHtmlText, htmlText);
  }

  const finalBody = restoreHtmlBlocks(translatedChunks.join("\n"), blocks, translatedHtmlText);
  validateNoLeftoverPlaceholders(finalBody);
  validateFencesPreserved(body, finalBody);
  validateInlineMarksPreserved(body, finalBody);
  validateActuallyTranslated(finalBody, targetLanguage);

  const cache = {
    sourcePath,
    sourceHash,
    sourceLanguage,
    targetLanguage,
    model,
    mode: "hy-mt2",
    title: translatedTitle.trim(),
    excerpt: translatedExcerpt.trim(),
    tags: translatedTags,
    body: finalBody,
  };

  await fs.mkdir(path.dirname(cachePath), { recursive: true });
  await fs.writeFile(cachePath, `${JSON.stringify(cache, null, 2)}\n`);
  console.log(`Wrote ${cachePath}.`);
  return "translated";
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

async function isFreshCache(cachePath, { sourceHash, targetLanguage }) {
  try {
    const cache = JSON.parse(await fs.readFile(cachePath, "utf8"));
    return (
      cache.sourceHash === sourceHash &&
      cache.targetLanguage === targetLanguage &&
      typeof cache.body === "string" &&
      cache.body.length > 0
    );
  } catch (error) {
    if (error.code === "ENOENT") {
      return false;
    }
    return false;
  }
}

const REQUEST_MAX_ATTEMPTS = 3;
const REQUEST_BASE_RETRY_DELAY_MS = 2_000;

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

  return content.trim();
}

export function validateHtmlText(htmlText, expected) {
  if (!htmlText || typeof htmlText !== "object") {
    throw new Error("Hy-MT2 response is missing translated htmlText for embedded HTML blocks.");
  }

  const missing = Object.keys(expected).filter(
    (key) => typeof htmlText[key] !== "string" || htmlText[key].trim() === ""
  );

  if (missing.length > 0) {
    throw new Error(`Hy-MT2 response is missing htmlText translations for keys: ${missing.join(", ")}.`);
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
export function validateActuallyTranslated(translatedBody, targetLanguage) {
  const prose = (typeof translatedBody === "string" ? translatedBody : "").replace(
    /```[\s\S]*?```/g,
    ""
  );
  const cjk = (prose.match(/[\u3400-\u9fff]/g) ?? []).length;
  const total = prose.replace(/\s/g, "").length;

  if (total === 0) {
    throw new Error("译文正文为空。已拒绝写入缓存。");
  }

  const ratio = cjk / total;
  const percent = `${(ratio * 100).toFixed(1)}%`;

  if (targetLanguage === "en" && ratio > 0.05) {
    throw new Error(`译文仍是中文（中文占比 ${percent}），判定为未翻译。已拒绝写入缓存。`);
  }

  if (targetLanguage === "zh" && ratio < 0.3) {
    throw new Error(`译文缺少中文（中文占比 ${percent}），判定为未翻译。已拒绝写入缓存。`);
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
 * Refuses a body whose fenced blocks no longer balance.
 *
 * Fence markers are re-attached from the source after translation, so a count
 * mismatch means a block was lost or a model emitted a fence inside prose. A
 * broken fence silently swallows the rest of the page as code, which no other
 * validator here would notice.
 */
export function validateFencesPreserved(sourceBody, translatedBody) {
  const countFences = (text) =>
    ((typeof text === "string" ? text : "").match(/^[ \t]*```/gm) ?? []).length;
  const before = countFences(sourceBody);
  const after = countFences(translatedBody);

  if (before !== after) {
    throw new Error(
      `代码围栏数量 ${before} → ${after}，Markdown 结构已被破坏。已拒绝写入缓存。`
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
