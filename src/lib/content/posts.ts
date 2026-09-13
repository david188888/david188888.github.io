import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";
import MarkdownIt from "markdown-it";
import type { Locale } from "@/i18n/locales";
import { defaultLocale } from "@/i18n/locales";
import { createAnnotationIdFactory } from "./annotation-ids.mjs";
import { createSourceHash, findCacheInconsistencies, isTranslationCacheFresh } from "./cache";
import { extractInlineMarks, restoreInlineMarks } from "./inline-marks.mjs";
import { splitMarkdownSegments } from "./markdown-segments.mjs";
import { detectSourceLanguage, getTargetLanguage } from "./language";
import { fitEmbeddedSvgText } from "./svg-text-fit.mjs";

/**
 * Per-document id factory for author-authored marks. Reset at the start of
 * every `renderMarkdownToHtml` call so occurrence numbering is scoped to one
 * rendered page.
 */
let annotationIds = createAnnotationIdFactory();

export function resetAnnotationIds(): void {
  annotationIds = createAnnotationIdFactory();
}

/**
 * Inline Markdown is handled by markdown-it; block structure is still handled
 * by this module's own block renderer so author-authored block HTML keeps
 * passing through verbatim.
 *
 * `html: false` keeps paragraphs safe: a bare tag written mid-sentence stays
 * escaped text, exactly as before this renderer existed.
 */
const inlineMarkdown = new MarkdownIt({
  html: false,
  linkify: false,
  breaks: false,
  typographer: false,
});

// Only absolute http(s) links become anchors. Relative and other schemes stay
// literal text, matching the previous inline renderer's behavior.
inlineMarkdown.validateLink = (url: string) => /^https?:\/\//i.test(url);

const defaultLinkOpenRule =
  inlineMarkdown.renderer.rules.link_open ??
  ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options));

// Attribute order is pinned (href, rel, target) so rendered output stays
// byte-stable for snapshot-style assertions.
inlineMarkdown.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  tokens[idx].attrSet("href", tokens[idx].attrGet("href") ?? "");
  tokens[idx].attrSet("rel", "noreferrer");
  tokens[idx].attrSet("target", "_blank");
  return defaultLinkOpenRule(tokens, idx, options, env, self);
};

const POSTS_DIR = "content/posts";
const CACHE_DIR = "content/generated/translations/posts";

export interface LocalizedPost {
  slug: string;
  title: string;
  excerpt: string;
  date?: string;
  tags: string[];
  body: string;
  bodyHtml: string;
  locale: Locale;
}

interface ParsedPost {
  frontmatter: Record<string, unknown>;
  body: string;
}

interface TranslationCache {
  version?: number;
  sourceHash?: string;
  targetLanguage?: Locale;
  pipeline?: string;
  glossary?: string;
  title?: string;
  excerpt?: string;
  tags?: string[];
  body?: string;
  units?: Record<string, unknown>;
}

export function getPostSlugs(): string[] {
  if (!existsSync(POSTS_DIR)) return [];
  // Every published `.mdx` is returned, including one whose translation cache is
  // stale. Filtering here used to drop such a post from the routes and listings
  // while the build stayed green, so the article silently 404'd. A stale cache
  // is now surfaced by `getLocalizedPost` below, which fails the build with an
  // actionable message instead.
  return readdirSync(POSTS_DIR)
    .filter((name) => name.endsWith(".mdx"))
    .map((name) => basename(name, ".mdx"))
    .sort();
}

export function getLocalizedPosts(locale: Locale = defaultLocale): LocalizedPost[] {
  return getPostSlugs()
    .map((slug) => getLocalizedPost(slug, locale))
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
}

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function selectPublishedPosts(
  posts: readonly LocalizedPost[],
  today: Date = new Date()
): LocalizedPost[] {
  const cutoff = today.toISOString().slice(0, 10);

  return [...posts]
    .filter((post) => {
      if (!post.date || !DATE_ONLY_PATTERN.test(post.date)) return true;
      return post.date <= cutoff;
    })
    .sort((a, b) => {
      const aDate = DATE_ONLY_PATTERN.test(a.date ?? "") ? a.date ?? "" : "";
      const bDate = DATE_ONLY_PATTERN.test(b.date ?? "") ? b.date ?? "" : "";
      return bDate.localeCompare(aDate);
    });
}

export function getPublishedPosts(
  locale: Locale = defaultLocale,
  today: Date = new Date()
): LocalizedPost[] {
  return selectPublishedPosts(getLocalizedPosts(locale), today);
}

export function getLocalizedPost(slug: string, locale: Locale = defaultLocale): LocalizedPost {
  const postPath = join(POSTS_DIR, `${slug}.mdx`);
  const source = readFileSync(postPath, "utf8");
  const sourceHash = createSourceHash(source);
  const { frontmatter, body } = parseFrontmatter(source);
  const sourceLanguage = getSourceLanguage(frontmatter, body);

  if (!sourceLanguage) {
    throw new Error(`${postPath}: ambiguous language. Add language: en or language: zh.`);
  }

  if (locale === sourceLanguage) {
    return createPost({
      slug,
      locale,
      frontmatter,
      title: stringValue(frontmatter.title, slug),
      excerpt: stringValue(frontmatter.excerpt),
      tags: arrayValue(frontmatter.tags),
      body,
    });
  }

  const targetLanguage = getTargetLanguage(sourceLanguage);
  if (locale !== targetLanguage) {
    throw new Error(`${postPath}: unsupported target locale ${locale}.`);
  }

  const cache = readTranslationCache(slug);
  if (!isFreshCache(cache, sourceHash, targetLanguage)) {
    throw new Error(
      `${postPath}: missing or stale translation cache — the ${targetLanguage} page cannot be built. ` +
        `The cache goes stale when the source changes or the pipeline version changes. ` +
        `Run npm run translate:content and commit the cache together with the MDX.`
    );
  }

  // Freshness says the cache belongs to this source; this says the cache agrees
  // with itself. A body edited without its units (or the other way round) would
  // otherwise be published as if nothing had happened.
  const problems = findCacheInconsistencies(cache);
  if (problems.length > 0) {
    throw new Error(
      `${postPath}: the ${targetLanguage} translation cache contradicts itself:\n  - ${problems.join("\n  - ")}\n` +
        `Run npm run translate:content to rebuild it; do not edit the cache by hand.`
    );
  }

  return createPost({
    slug,
    locale,
    frontmatter,
    title: stringValue(cache.title, slug),
    excerpt: stringValue(cache.excerpt),
    tags: arrayValue(cache.tags),
    body: stringValue(cache.body),
  });
}

function parseFrontmatter(source: string): ParsedPost {
  if (!source.startsWith("---\n")) return { frontmatter: {}, body: source };
  const closingIndex = source.indexOf("\n---", 4);
  if (closingIndex === -1) return { frontmatter: {}, body: source };

  const frontmatterSource = source.slice(4, closingIndex);
  const bodyStart = source.startsWith("\n", closingIndex + 4) ? closingIndex + 5 : closingIndex + 4;
  return {
    frontmatter: parseSimpleYaml(frontmatterSource),
    body: source.slice(bodyStart),
  };
}

function parseSimpleYaml(source: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = source.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim() || line.trimStart().startsWith("#")) continue;

    const match = line.match(/^([A-Za-z0-9_-]+):(?:\s*(.*))?$/);
    if (!match) continue;

    const key = match[1];
    const value = match[2] ?? "";
    if (value === "") {
      const items: string[] = [];
      while (index + 1 < lines.length) {
        const itemMatch = lines[index + 1].match(/^\s+-\s+(.*)$/);
        if (!itemMatch) break;
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

function parseScalar(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function getSourceLanguage(frontmatter: Record<string, unknown>, body: string): Locale | null {
  if (frontmatter.language === "en" || frontmatter.language === "zh") {
    return frontmatter.language;
  }
  return detectSourceLanguage(`${stringValue(frontmatter.title)}\n${stringValue(frontmatter.excerpt)}\n${body}`)
    .language;
}

function readTranslationCache(slug: string): TranslationCache {
  const cachePath = join(CACHE_DIR, `${slug}.json`);
  if (!existsSync(cachePath)) return {};
  return JSON.parse(readFileSync(cachePath, "utf8")) as TranslationCache;
}

function isFreshCache(cache: TranslationCache, sourceHash: string, targetLanguage: Locale): boolean {
  // The pipeline version is part of freshness: a prompt or validator change
  // must invalidate old caches instead of silently republishing them.
  return isTranslationCacheFresh(cache, { sourceHash, targetLanguage });
}

function createPost({
  slug,
  locale,
  frontmatter,
  title,
  excerpt,
  tags,
  body,
}: {
  slug: string;
  locale: Locale;
  frontmatter: Record<string, unknown>;
  title: string;
  excerpt: string;
  tags: string[];
  body: string;
}): LocalizedPost {
  return {
    slug,
    title,
    excerpt,
    date: stringValue(frontmatter.date) || undefined,
    tags,
    body,
    bodyHtml: renderMarkdownToHtml(body),
    locale,
  };
}

export function renderMarkdownToHtml(markdown: string): string {
  resetAnnotationIds();

  return splitMarkdownSegments(markdown)
    .map((segment) =>
      segment.type === "html"
        ? sanitizeEmbeddedHtml(segment.content)
        : renderMarkdownBlocks(segment.content)
    )
    .filter((part) => part.length > 0)
    .join("\n");
}

function renderMarkdownBlocks(markdown: string): string {
  const blocks = markdown.trim().split(/\n{2,}/);
  const rendered: string[] = [];

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    const note = renderNoteBlock(trimmed);
    if (note === null) {
      rendered.push(renderMarkdownBlock(trimmed));
      continue;
    }

    const previous = rendered.pop();
    if (previous === undefined || !previous.startsWith("<p>")) {
      throw new Error(
        `批注块 ^[...] 必须紧跟在它要标注的段落之后。当前它前面是 ${
          previous === undefined ? "本区块的开头" : "一个非段落块"
        }：${trimmed.slice(0, 40)}`
      );
    }

    rendered.push(
      `<div class="note-pair">${previous}` +
        `<aside class="side-note" role="note" data-note="${note.id}">${note.html}</aside></div>`
    );
  }

  return rendered.filter((part) => part.length > 0).join("\n");
}

/**
 * Renders a `^[内容]` margin note, or returns null when the block is ordinary
 * content.
 *
 * Notes attach to the paragraph directly above them. Anchoring to an exact
 * phrase is deliberately not supported yet, so `^[#短语|内容]` fails loudly
 * rather than being parsed as note text that starts with a hash.
 */
function renderNoteBlock(block: string): { html: string; id: string } | null {
  if (!block.startsWith("^[")) return null;

  if (!block.endsWith("]")) {
    throw new Error(`批注块缺少收尾的 "]"：${block.slice(0, 40)}`);
  }

  const raw = block.slice(2, -1).trim().replace(/\s*\n\s*/g, " ");

  if (raw.startsWith("#")) {
    throw new Error(
      "批注暂不支持锚点短语写法 ^[#短语|内容]；请改写为 ^[内容]，把要标注的原话直接写进正文。"
    );
  }

  if (!raw) {
    throw new Error("批注内容为空：^[]");
  }

  return { html: renderInlineMarkdown(raw), id: annotationIds("note", raw) };
}

function renderMarkdownBlock(trimmed: string): string {
  if (trimmed.startsWith("```") && trimmed.endsWith("```")) {
    const code = trimmed.replace(/^```[^\n]*\n?/, "").replace(/\n?```$/, "");
    return `<pre><code>${escapeHtml(code)}</code></pre>`;
  }
  if (trimmed.startsWith("### ")) return `<h3>${renderInlineMarkdown(trimmed.slice(4))}</h3>`;
  if (trimmed.startsWith("## ")) return `<h2>${renderInlineMarkdown(trimmed.slice(3))}</h2>`;
  if (trimmed.startsWith("# ")) return `<h1>${renderInlineMarkdown(trimmed.slice(2))}</h1>`;

  const lines = trimmed.split(/\r?\n/);
  if (lines.every((line) => line.startsWith("- "))) {
    return `<ul>${lines.map((line) => `<li>${renderInlineMarkdown(line.slice(2))}</li>`).join("")}</ul>`;
  }
  if (lines.every((line) => /^\d+\.\s/.test(line))) {
    return `<ol>${lines
      .map((line) => `<li>${renderInlineMarkdown(line.replace(/^\d+\.\s/, ""))}</li>`)
      .join("")}</ol>`;
  }

  return `<p>${renderInlineMarkdown(trimmed).replace(/\n/g, "<br />")}</p>`;
}

/**
 * Author-authored block HTML is rendered verbatim, but executable content is
 * stripped first: <script> blocks, inline event handler attributes, and
 * javascript: URLs. Everything else (svg, figure, div, class/style attrs) is
 * preserved so embedded diagrams keep working with the site stylesheet.
 */
/**
 * Author-authored block HTML is rendered verbatim, but executable content is
 * stripped first: <script> blocks, inline event handler attributes, and
 * javascript: URLs. Everything else (svg, figure, div, class/style attrs) is
 * preserved so embedded diagrams keep working with the site stylesheet.
 *
 * Diagram labels are then fitted to their boxes: the drawings are authored in
 * Chinese, so translated labels routinely overrun the rectangles they sit in.
 * See `svg-text-fit.mjs` for why that happens at render time.
 */
function sanitizeEmbeddedHtml(html: string): string {
  return fitEmbeddedSvgText(
    html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, "")
      .replace(/<script\b[^>]*\/>/gi, "")
      .replace(/<script\b[^>]*>/gi, "")
      .replace(/<\/script\s*>/gi, "")
      .replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
      .replace(
        /\s(href|src|xlink:href)\s*=\s*(?:"\s*javascript:[^"]*"|'\s*javascript:[^']*'|javascript:[^\s>]*)/gi,
        ""
      )
  );
}


/**
 * Renders a single inline run: standard Markdown emphasis plus the site's own
 * `==color|text==` colored-underline mark.
 *
 * Marks are lifted out before parsing and restored afterwards, so mark
 * contents can still contain `**bold**` while `==` inside backticks stays
 * literal text.
 */
function renderInlineMarkdown(value: string): string {
  const { text, marks } = extractInlineMarks(value);
  const html = inlineMarkdown.renderInline(text);
  return restoreInlineMarks(
    html,
    marks,
    (content) => inlineMarkdown.renderInline(content),
    (mark) => annotationIds("mk", mark.content)
  );
}
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function arrayValue(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}
