import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";
import type { Locale } from "@/i18n/locales";
import { defaultLocale } from "@/i18n/locales";
import { createSourceHash } from "./cache";
import { splitMarkdownSegments } from "./markdown-segments.mjs";
import { detectSourceLanguage, getTargetLanguage } from "./language";

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
  sourceHash?: string;
  targetLanguage?: Locale;
  title?: string;
  excerpt?: string;
  tags?: string[];
  body?: string;
}

export function getPostSlugs(): string[] {
  if (!existsSync(POSTS_DIR)) return [];
  return readdirSync(POSTS_DIR)
    .filter((name) => name.endsWith(".mdx"))
    .map((name) => basename(name, ".mdx"))
    .filter((slug) => hasFreshTranslationCache(slug))
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
    throw new Error(`${postPath}: missing or stale translation cache. Run npm run translate:content.`);
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

function hasFreshTranslationCache(slug: string): boolean {
  const postPath = join(POSTS_DIR, `${slug}.mdx`);
  if (!existsSync(postPath)) return false;

  const source = readFileSync(postPath, "utf8");
  const sourceHash = createSourceHash(source);
  const { frontmatter, body } = parseFrontmatter(source);
  const sourceLanguage = getSourceLanguage(frontmatter, body);
  if (!sourceLanguage) return false;

  const cache = readTranslationCache(slug);
  return isFreshCache(cache, sourceHash, getTargetLanguage(sourceLanguage));
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
  return Boolean(
    cache.sourceHash === sourceHash &&
      cache.targetLanguage === targetLanguage &&
      typeof cache.body === "string" &&
      cache.body.length > 0
  );
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
  return blocks
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
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

      return `<p>${renderInlineMarkdown(trimmed).replace(/\n/g, "<br />")}</p>`;
    })
    .filter((part) => part.length > 0)
    .join("\n");
}

/**
 * Author-authored block HTML is rendered verbatim, but executable content is
 * stripped first: <script> blocks, inline event handler attributes, and
 * javascript: URLs. Everything else (svg, figure, div, class/style attrs) is
 * preserved so embedded diagrams keep working with the site stylesheet.
 */
function sanitizeEmbeddedHtml(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, "")
    .replace(/<script\b[^>]*\/>/gi, "")
    .replace(/<script\b[^>]*>/gi, "")
    .replace(/<\/script\s*>/gi, "")
    .replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(
      /\s(href|src|xlink:href)\s*=\s*(?:"\s*javascript:[^"]*"|'\s*javascript:[^']*'|javascript:[^\s>]*)/gi,
      ""
    );
}


function renderInlineMarkdown(value: string): string {
  return escapeHtml(value).replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)<]+)\)/g,
    '<a href="$2" rel="noreferrer" target="_blank">$1</a>'
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
