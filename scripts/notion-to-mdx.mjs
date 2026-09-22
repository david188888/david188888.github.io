#!/usr/bin/env node
/**
 * Notion -> MDX converter for published Insights posts.
 *
 * Input is one `notion_fetch` payload captured with `include_discussions: true`.
 * That single payload is self-contained: it carries the `# 正文` section, the
 * `同步元数据` callout, embedded HTML code fences, inline colour/underline
 * annotations, and — critically — both the comment bodies and the paragraph
 * each comment is anchored to (`<span discussion-urls="...">`).
 *
 * Block model. Notion-flavoured Markdown separates blocks with newlines rather
 * than blank lines ("Notion renders blocks with appropriate spacing, so there
 * is almost never a need to use empty lines"). One plain line is therefore one
 * paragraph block; intra-paragraph breaks use `<br>`. Blank lines are dropped.
 *
 * Usage:
 *   node scripts/notion-to-mdx.mjs --input <fetch.txt> [--source <post.mdx>]
 *        [--comments=publish-all|mark-only|none] [--write]
 *
 * MDX goes to stdout unless `--write` is given. The conversion report always
 * goes to stderr so stdout stays pipeable.
 */

import fs from "node:fs";
import path from "node:path";

import {
  MARK_COLORS,
  formatInlineMark,
  validateInlineMarks,
} from "../src/lib/content/inline-marks.mjs";

/**
 * Comment publication policy.
 *
 * `all` (default): every comment on an unresolved discussion becomes a margin
 * note. Nothing is filtered by what a comment "looks like" — the author
 * decides in Notion, and resolving the discussion is the one supported way to
 * keep a working note out of the published article.
 *
 * `mark-only` and `none` remain available as explicit opt-ins.
 */
const COMMENT_MODES = ["all", "mark-only", "none"];

/** Comment prefixes that opt a comment in when running with mark-only. */
const PUBLISH_MARKERS = ["[发布]", "[publish]", "[pub]"];

const BODY_HEADING = "# 正文";

const RE_EMPTY_BLOCK = /^\s*<empty-block\/>\s*$/;
const RE_FENCE = /^\s*```/;
const RE_DIVIDER = /^\s*---\s*$/;
const RE_HEADING = /^(#{1,6})\s+(.*)$/;
const RE_BULLET = /^\s*[-*]\s+(.*)$/;
const RE_ORDERED = /^\s*\d+\.\s+(.*)$/;
/** A line that opens a raw HTML block, excluding inline `<span>` annotations. */
const RE_RAW_HTML_START = /^\s*<(?!\/?span\b)([a-zA-Z][a-zA-Z0-9-]*)/;

/** A line that opens block-level markup: a tag or an HTML comment. */
const RE_MARKUP_START = /^\s*(?:<!--|<(?!\/?span\b)[a-zA-Z][a-zA-Z0-9-]*)/;

export class ConversionError extends Error {
  constructor(message) {
    super(message);
    this.name = "ConversionError";
  }
}

/* ────────────────────────────── fetch payload ───────────────────────────── */

/** Pulls the page content out of a `notion_fetch` payload. */
export function extractPageContent(fetchText) {
  if (typeof fetchText !== "string") {
    throw new TypeError("extractPageContent expects a string.");
  }

  const match = fetchText.match(/<content>\n?([\s\S]*?)\n?<\/content>/);
  if (!match) {
    throw new ConversionError(
      "输入里找不到 <content> 区块。请确认传的是 notion_fetch 的完整输出。"
    );
  }

  return match[1];
}

/**
 * Collects every inline discussion with its resolution state and comment
 * bodies, keyed by the full discussion URL so it can be matched against the
 * `discussion-urls` attribute on the anchored block.
 */
export function parseDiscussions(fetchText) {
  const discussions = new Map();
  const pattern = /<discussion\b([^>]*)>([\s\S]*?)<\/discussion>/g;
  let match;

  while ((match = pattern.exec(fetchText)) !== null) {
    const attrs = match[1];
    const id = attrs.match(/\bid="([^"]+)"/)?.[1];
    if (!id) continue;

    const comments = [];
    const commentPattern = /<comment\b[^>]*>([\s\S]*?)<\/comment>/g;
    let commentMatch;
    while ((commentMatch = commentPattern.exec(match[2])) !== null) {
      const text = decodeEntities(commentMatch[1]).trim();
      if (text) comments.push(text);
    }

    const existing = discussions.get(id);
    if (existing) {
      existing.comments.push(...comments);
      continue;
    }

    discussions.set(id, {
      id,
      resolved: /\bresolved="true"/.test(attrs),
      context: attrs.match(/\bcontext="([^"]+)"/)?.[1] ?? "unknown",
      comments,
    });
  }

  return discussions;
}

/* ────────────────────────────── section slicing ─────────────────────────── */

/** Returns the text between `# 正文` and the next top-level heading. */
export function extractBodySection(content) {
  const lines = content.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === BODY_HEADING);

  if (start === -1) {
    throw new ConversionError(`Notion 页面里找不到 "${BODY_HEADING}" 标题，无法确定正文范围。`);
  }

  let fence;
  for (let index = start + 1; index < lines.length; index += 1) {
    const trimmed = lines[index].trimStart();
    if (fence) {
      const closingFence = trimmed.match(/^([`~]{3,})\s*$/)?.[1];
      if (
        closingFence &&
        closingFence[0] === fence.character &&
        closingFence.length >= fence.length &&
        [...closingFence].every((character) => character === fence.character)
      ) {
        fence = undefined;
      }
      continue;
    }

    const openingFence = trimmed.match(/^(`{3,}|~{3,})/)?.[1];
    if (openingFence) {
      fence = { character: openingFence[0], length: openingFence.length };
      continue;
    }

    if (/^#\s+/.test(lines[index])) {
      return lines.slice(start + 1, index).join("\n");
    }
  }

  return lines.slice(start + 1).join("\n");
}

/** Reads the `同步元数据` callout that carries frontmatter and the source path. */
export function parseMetadataCallout(section) {
  const match = section.match(/<callout\b[^>]*>([\s\S]*?)<\/callout>/);
  if (!match) {
    throw new ConversionError("正文开头找不到「同步元数据」callout，无法确定 frontmatter。");
  }

  const raw = match[1];
  const pick = (label) => {
    const line = raw.match(new RegExp(`^\\s*-\\s*${label}[：:]\\s*(.*)$`, "m"));
    return line ? line[1].replace(/`([^`]*)`/g, "$1").trim() : "";
  };

  const sourcePath = pick("源文件");
  const title = pick("发布标题");
  const dateLine = pick("日期");

  if (!sourcePath) throw new ConversionError("同步元数据 callout 里缺少「源文件」。");
  if (!title) throw new ConversionError("同步元数据 callout 里缺少「发布标题」。");

  const date = (dateLine.match(/\d{4}-\d{2}-\d{2}/) ?? [""])[0];
  if (!date) throw new ConversionError("同步元数据 callout 的「日期」里找不到 YYYY-MM-DD。");

  const languageMatch = dateLine.match(/语言[：:]\s*([a-zA-Z-]+)/);
  const language = languageMatch && /^en/i.test(languageMatch[1]) ? "en" : "zh";

  const tags = pick("标签")
    .split(/[/／,，]/)
    .map((tag) => tag.trim())
    .filter(Boolean);

  return {
    sourcePath,
    frontmatter: { title, date, language, excerpt: pick("摘要"), tags },
  };
}

/* ────────────────────────────── block splitting ─────────────────────────── */

/** True when the line opens a raw HTML block rather than an inline annotation. */
function isRawHtmlBlockStart(line) {
  return RE_RAW_HTML_START.test(line);
}

/**
 * True when a fenced body opens as block-level markup rather than sample code.
 *
 * Only the first non-empty line is inspected: a diagram written on the Notion
 * side always starts with its outermost element (or a leading HTML comment), so
 * this separates "the author embedded a figure" from "the author quoted some
 * HTML", without having to parse the body.
 */
function looksLikeMarkup(lines) {
  const first = lines.find((line) => line.trim() !== "");
  return first !== undefined && RE_MARKUP_START.test(first);
}

/**
 * Splits the body into block descriptors. One plain line is one paragraph, per
 * Notion's no-blank-line block model; only fenced code, callouts, tables and
 * raw HTML blocks span multiple lines.
 */
export function splitBlocks(section) {
  const lines = section.split(/\r?\n/);
  const blocks = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (line.trim() === "" || RE_EMPTY_BLOCK.test(line)) {
      index += 1;
      continue;
    }

    if (RE_FENCE.test(line)) {
      const start = index;
      index += 1;
      while (index < lines.length && !RE_FENCE.test(lines[index])) index += 1;
      if (index < lines.length) index += 1;
      blocks.push({ type: "code", lines: lines.slice(start, index) });
      continue;
    }

    if (/^\s*<callout\b/.test(line)) {
      const start = index;
      index += 1;
      while (index < lines.length && !/^\s*<\/callout>\s*$/.test(lines[index])) index += 1;
      if (index < lines.length) index += 1;
      blocks.push({ type: "callout", lines: lines.slice(start, index) });
      continue;
    }

    if (/^\s*<table\b/.test(line)) {
      const start = index;
      index += 1;
      while (index < lines.length && !/^\s*<\/table>\s*$/.test(lines[index])) index += 1;
      if (index < lines.length) index += 1;
      blocks.push({ type: "table", lines: lines.slice(start, index) });
      continue;
    }

    if (RE_DIVIDER.test(line)) {
      blocks.push({ type: "divider" });
      index += 1;
      continue;
    }

    const heading = line.match(RE_HEADING);
    if (heading && !isRawHtmlBlockStart(line)) {
      blocks.push({ type: "heading", level: heading[1].length, text: heading[2] });
      index += 1;
      continue;
    }

    if (RE_BULLET.test(line) && !isRawHtmlBlockStart(line)) {
      const items = [];
      while (index < lines.length && RE_BULLET.test(lines[index])) {
        items.push(lines[index].match(RE_BULLET)[1]);
        index += 1;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    if (RE_ORDERED.test(line)) {
      const items = [];
      while (index < lines.length && RE_ORDERED.test(lines[index])) {
        items.push(lines[index].match(RE_ORDERED)[1]);
        index += 1;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    if (isRawHtmlBlockStart(line)) {
      const tag = line.match(RE_RAW_HTML_START)[1];
      const start = index;
      if (!new RegExp(`</${tag}\\s*>`, "i").test(line)) {
        index += 1;
        while (index < lines.length && !new RegExp(`</${tag}\\s*>`, "i").test(lines[index])) {
          index += 1;
        }
      }
      blocks.push({ type: "html", lines: lines.slice(start, index + 1) });
      index += 1;
      continue;
    }

    // A child paragraph in Notion enhanced Markdown is tab-indented. Outside
    // structural blocks (callout/table/code/HTML), it is still prose; retaining
    // that tab would turn it into an unintended Markdown code block.
    blocks.push({ type: "paragraph", lines: [line.replace(/^\t+/, "")] });
    index += 1;
  }

  return blocks;
}

/* ────────────────────────── inline annotation mapping ───────────────────── */

const DISCUSSION_SPAN_PATTERN =
  /<span\b[^>]*\bdiscussion-urls="([^"]+)"[^>]*>([\s\S]*?)<\/span>|<span\b[^>]*\bdiscussion-urls="([^"]+)"[^>]*\/>/g;

/**
 * Removes the discussion wrapper Notion adds around a commented block while
 * remembering which discussions were anchored there.
 */
export function stripDiscussionSpans(text) {
  const discussionIds = [];
  const stripped = text.replace(DISCUSSION_SPAN_PATTERN, (_full, urls, inner, selfClosingUrls) => {
    const raw = urls ?? selfClosingUrls ?? "";
    for (const url of raw.split(/\s+/).filter(Boolean)) discussionIds.push(url);
    return inner ?? "";
  });

  return { text: stripped, discussionIds: [...new Set(discussionIds)] };
}

/**
 * Maps Notion rich-text annotations onto the site's own mark syntax.
 *
 * Notion text colours, background colours and underlines all collapse into the
 * same reader-facing treatment (a coloured underline), so the renderer only
 * ever has to understand one inline mark.
 */
export function convertInlineAnnotations(text, warn = () => {}) {
  let result = text;

  result = result.replace(
    /<span\b[^>]*\bcolor="([a-z_]+)"[^>]*>([\s\S]*?)<\/span>/g,
    (_full, color, inner) => {
      const base = color.replace(/_bg$/, "");
      if (!MARK_COLORS.includes(base)) {
        warn(`未知的 Notion 颜色 "${color}"，已按纯文本处理。`);
        return inner;
      }
      return formatInlineMark(inner, base);
    }
  );

  result = result.replace(
    /<span\b[^>]*\bunderline="true"[^>]*>([\s\S]*?)<\/span>/g,
    (_full, inner) => formatInlineMark(inner)
  );

  result = result
    .replace(/<mention-[a-z-]+\b[^>]*>([\s\S]*?)<\/mention-[a-z-]+>/g, "$1")
    .replace(/<mention-[a-z-]+\b[^>]*\/>/g, "");

  // Notion can split one continuous underline/colour run into adjacent spans.
  // Merge identical runs so the site's delimiter-based mark syntax stays valid.
  let previous;
  do {
    previous = result;
    result = result.replace(/==([a-z]+)\|([\s\S]*?)====\1\|/g, "==$1|$2");
  } while (result !== previous);

  if (/<span\b/.test(result)) {
    const leftovers = [...result.matchAll(/<span\b[^>]*>/g)].map((m) => m[0]);
    warn(`存在未支持的 span 标记，已按原始文本保留：${leftovers.join(" ")}`);
  }

  return result;
}

/* ─────────────────────────────── conversion ─────────────────────────────── */

function decodeEntities(value) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

/** Fence labels the site ignores; normalise them so diffs stay stable. */
function normaliseFenceLanguage(raw) {
  const language = raw.trim().toLowerCase().replace(/\s+/g, "");
  if (language === "" || language.startsWith("plain")) return "text";
  return language;
}

function parseTableBlock(lines) {
  const rows = [];
  let headerRow = false;
  let current = null;

  for (const line of lines) {
    if (/<table\b/.test(line)) {
      headerRow = /header-row="true"/.test(line);
      continue;
    }
    if (/<tr\b/.test(line)) {
      current = [];
      continue;
    }
    if (/<\/tr>/.test(line)) {
      if (current) rows.push(current);
      current = null;
      continue;
    }
    if (!current) continue;
    for (const cell of line.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/g)) {
      current.push(cell[1].trim());
    }
  }

  return { rows, headerRow };
}

/**
 * Converts the 正文 section into MDX chunks.
 *
 * A chunk is one renderer-level block and may contain internal newlines (lists,
 * code fences, embedded HTML). Chunks are joined with a blank line later, which
 * is what the blog renderer uses to tell blocks apart. Getting this wrong
 * silently turns a list into a paragraph, so lists and fences stay single
 * chunks on purpose.
 */
export function convertBodySection(section, options = {}) {
  const { comments = "all", warn = () => {}, discussions = new Map() } = options;

  const chunks = [];
  const report = {
    blocks: 0,
    marks: 0,
    htmlFencesUnwrapped: 0,
    notesPublished: [],
    notesSkipped: [],
    warnings: [],
  };

  const localWarn = (message) => {
    if (!report.warnings.includes(message)) report.warnings.push(message);
    warn(message);
  };

  /** Unresolved discussions anchored to a block, in document order. */
  const unresolvedHere = (discussionIds) =>
    discussionIds.map((id) => discussions.get(id)).filter((entry) => entry && !entry.resolved);

  const takePublishableNotes = (discussionIds, blockLabel) => {
    const publishable = [];

    for (const entry of unresolvedHere(discussionIds)) {
      for (const comment of entry.comments) {
        const marker = PUBLISH_MARKERS.find((candidate) =>
          comment.toLowerCase().startsWith(candidate.toLowerCase())
        );

        if (comments === "none") {
          report.notesSkipped.push({ reason: "comments=none", text: comment });
          continue;
        }
        if (comments === "mark-only" && !marker) {
          report.notesSkipped.push({ reason: "未加 [发布] 前缀", text: comment });
          continue;
        }
        if (blockLabel !== "段落") {
          report.notesSkipped.push({
            reason: `评论挂在${blockLabel}上，页边注只能挂段落`,
            text: comment,
          });
          continue;
        }

        publishable.push(marker ? comment.slice(marker.length).trim() : comment);
      }
    }

    return publishable;
  };

  const countMarks = (text) => (text.match(/==/g) ?? []).length / 2;

  /** Converts one inline run and records its marks. */
  const convertRun = (rawText) => {
    const { text } = stripDiscussionSpans(rawText);
    const converted = convertInlineAnnotations(text, localWarn);
    validateInlineMarks(converted);
    report.marks += countMarks(converted);
    return converted;
  };

  /** Emits a paragraph (or list item) plus any publishable margin note after it. */
  const emitTextBlock = (rawText, blockLabel) => {
    const { discussionIds } = stripDiscussionSpans(rawText);
    const notes = takePublishableNotes(discussionIds, blockLabel);

    chunks.push(convertRun(rawText));

    for (const note of notes) {
      chunks.push(`^[${convertRun(note)}]`);
      report.notesPublished.push(note);
    }
  };

  for (const block of splitBlocks(section)) {
    // The metadata callout is consumed by parseMetadataCallout.
    if (block.type === "callout") continue;

    report.blocks += 1;

    switch (block.type) {
      case "divider":
        // A Notion divider becomes a `---` line, which the site renders as a
        // section rule. Dropping it here silently lost an author's structure.
        chunks.push("---");
        break;

      case "paragraph":
        emitTextBlock(block.lines.join("\n"), "段落");
        break;

      case "heading": {
        if (block.level > 3) {
          localWarn(`四级及以下标题已降为三级：${block.text.slice(0, 24)}`);
        }
        const level = Math.min(block.level, 3);
        const { discussionIds } = stripDiscussionSpans(block.text);
        takePublishableNotes(discussionIds, "标题");
        chunks.push(`${"#".repeat(level)} ${convertRun(block.text)}`);
        break;
      }

      case "ul":
      case "ol": {
        const marker = block.type === "ul" ? "- " : "1. ";
        const items = block.items.map((item) => {
          const { discussionIds } = stripDiscussionSpans(item);
          const notes = takePublishableNotes(discussionIds, "列表项");
          return { text: `${marker}${convertRun(item)}`, notes };
        });

        // A list is one block, so its items must not be separated by blank lines.
        chunks.push(items.map((item) => item.text).join("\n"));

        for (const item of items) {
          for (const note of item.notes) {
            chunks.push(`^[${convertRun(note)}]`);
            report.notesPublished.push(note);
          }
        }
        break;
      }

      case "code": {
        const rawLanguage = block.lines[0].replace(/^\s*```/, "");
        const language = normaliseFenceLanguage(rawLanguage);
        const fencedBody = block.lines.slice(1, -1);

        // A ```html fence whose body is markup is author-written block HTML,
        // not sample code. The renderer never promotes fenced content to live
        // HTML (`src/lib/content/markdown-segments.mjs`), so keeping the fence
        // publishes the diagram as escaped source text. Drop the fence and emit
        // the markup as a block-level HTML chunk instead.
        if (language === "html" && looksLikeMarkup(fencedBody)) {
          chunks.push(fencedBody.map((line) => stripDiscussionSpans(line).text).join("\n"));
          report.htmlFencesUnwrapped += 1;
          break;
        }

        if (language !== rawLanguage.trim()) {
          localWarn(`代码块语言已规范为 "${language}"（原为 "${rawLanguage.trim()}"）。`);
        }
        chunks.push(["```" + language, ...fencedBody, "```"].join("\n"));
        break;
      }

      case "html":
        // Author-authored block HTML (for example an inline <figure> diagram)
        // is passed through verbatim so the site can render it as-is.
        chunks.push(block.lines.map((line) => stripDiscussionSpans(line).text).join("\n"));
        break;

      case "table": {
        const { rows, headerRow } = parseTableBlock(block.lines);
        if (rows.length === 0) {
          localWarn("遇到空表格，已跳过。");
          break;
        }
        const width = Math.max(...rows.map((row) => row.length));
        const pad = (row) => [
          ...row.map((cell) => convertRun(cell)),
          ...Array.from({ length: width - row.length }, () => ""),
        ];
        const header = headerRow
          ? pad(rows[0])
          : Array.from({ length: width }, (_, index) => `列 ${index + 1}`);
        const body = headerRow ? rows.slice(1).map(pad) : rows.map(pad);
        chunks.push(
          [
            `| ${header.join(" | ")} |`,
            `| ${header.map(() => "---").join(" | ")} |`,
            ...body.map((row) => `| ${row.join(" | ")} |`),
          ].join("\n")
        );
        break;
      }

      default:
        localWarn(`未处理的块类型：${block.type}`);
    }
  }

  return { chunks, report };
}

/* ──────────────────────────────── assembling ────────────────────────────── */

function yamlValue(value) {
  return `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

const FRONTMATTER_ORDER = ["title", "date", "language", "permalink", "excerpt"];

export function renderFrontmatter(frontmatter, preserved = {}) {
  const merged = { ...frontmatter };

  // `permalink` is a legacy field the loader does not read, but keeping it
  // stable means diffs stay honest when updating an existing post.
  if (merged.permalink === undefined && preserved.permalink !== undefined) {
    merged.permalink = preserved.permalink;
  }

  const lines = ["---"];

  for (const key of FRONTMATTER_ORDER) {
    if (merged[key] === undefined || merged[key] === "") continue;
    // `language` stays unquoted to match the existing posts byte for byte.
    lines.push(key === "language" ? `${key}: ${merged[key]}` : `${key}: ${yamlValue(merged[key])}`);
  }

  const tags = merged.tags ?? [];
  if (tags.length > 0) {
    lines.push("tags:");
    for (const tag of tags) lines.push(`  - ${tag}`);
  }

  for (const [key, value] of Object.entries(merged)) {
    if (FRONTMATTER_ORDER.includes(key) || key === "tags") continue;
    lines.push(`${key}: ${yamlValue(value)}`);
  }

  lines.push("---");
  return lines.join("\n");
}

export function parseExistingFrontmatter(source) {
  if (!source || !source.startsWith("---\n")) return {};
  const end = source.indexOf("\n---", 4);
  if (end === -1) return {};

  const result = {};
  for (const line of source.slice(4, end).split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) continue;
    result[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
  return result;
}

/** Full conversion: one `notion_fetch` payload -> MDX document. */
export function convertNotionFetch(fetchText, options = {}) {
  const { existingSource = "", comments = "mark-only" } = options;

  const content = extractPageContent(fetchText);
  const discussions = parseDiscussions(fetchText);
  const section = extractBodySection(content);
  const metadata = parseMetadataCallout(section);
  const { chunks, report } = convertBodySection(section, { discussions, comments });

  const frontmatter = renderFrontmatter(metadata.frontmatter, parseExistingFrontmatter(existingSource));
  const body = `${chunks.join("\n\n").trimEnd()}\n`;

  return {
    sourcePath: metadata.sourcePath,
    frontmatter: metadata.frontmatter,
    body,
    mdx: `${frontmatter}\n\n${body}`,
    report,
  };
}

/* ─────────────────────────────────── CLI ────────────────────────────────── */

const COMMENT_MODES_HELP = "all | mark-only | none";

function parseArgs(argv) {
  const args = { comments: "all", write: false };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--write") args.write = true;
    else if (arg === "--input") args.input = argv[++index];
    else if (arg === "--source") args.source = argv[++index];
    else if (arg.startsWith("--comments=")) args.comments = arg.slice("--comments=".length);
    else if (arg === "--comments") args.comments = argv[++index];
    else if (arg === "--help" || arg === "-h") args.help = true;
    else throw new ConversionError(`未知参数：${arg}`);
  }

  if (!COMMENT_MODES.includes(args.comments)) {
    throw new ConversionError(
      `--comments 只能是 ${COMMENT_MODES.join(" | ")}，收到 "${args.comments}"。`
    );
  }

  return args;
}

const USAGE = [
  "用法: node scripts/notion-to-mdx.mjs --input <fetch.txt> [--source <post.mdx>]",
  `       [--comments=${COMMENT_MODES_HELP}] [--write]`,
  "",
  "  --input      notion_fetch 的完整输出（须带 include_discussions: true）",
  "  --source     现有 MDX 文件，用于保留 permalink",
  "  --comments   all（默认，全部发布）| mark-only | none",
  "  --write      写回 --source 指定的文件；不加则只输出到 stdout",
  "",
  "默认把所有评论都发布成页边注。已 resolve 的 discussion 会被跳过，",
  "所以不想发布某条评论时，在 Notion 里把它标记为已解决即可。",
  "",
].join("\n");

function formatReport(result) {
  const { report } = result;
  const out = [""];
  out.push(`目标源文件：${result.sourcePath}`);
  out.push(`转换块数：${report.blocks} ｜ 彩色下划线：${report.marks} 处`);
  if (report.htmlFencesUnwrapped > 0) {
    out.push(
      `已拆掉 html 代码块的围栏：${report.htmlFencesUnwrapped} 处（围栏内的 HTML 会作为块级 HTML 渲染）`
    );
  }
  out.push(`已发布页边注：${report.notesPublished.length} 条`);
  for (const note of report.notesPublished) out.push(`  ✓ ${note}`);

  if (report.notesSkipped.length > 0) {
    out.push(`未发布评论：${report.notesSkipped.length} 条（未写入正文）`);
    for (const note of report.notesSkipped) out.push(`  · [${note.reason}] ${note.text}`);
  }

  if (report.warnings.length > 0) {
    out.push(`警告：${report.warnings.length} 条`);
    for (const warning of report.warnings) out.push(`  ! ${warning}`);
  }

  out.push("");
  return out.join("\n");
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || !args.input) {
    process.stdout.write(USAGE);
    return;
  }

  const fetchText = fs.readFileSync(args.input, "utf8");
  const existingSource = args.source ? fs.readFileSync(args.source, "utf8") : "";
  const result = convertNotionFetch(fetchText, { existingSource, comments: args.comments });

  process.stdout.write(result.mdx);
  process.stderr.write(formatReport(result));

  if (args.write) {
    if (!args.source) throw new ConversionError("--write 需要同时指定 --source。");
    fs.writeFileSync(args.source, result.mdx);
    process.stderr.write(`已写入 ${path.resolve(args.source)}\n`);
  }
}

if (process.argv[1] && import.meta.url === `file://${path.resolve(process.argv[1])}`) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`转换失败：${error.message}\n`);
    process.exitCode = 1;
  }
}
