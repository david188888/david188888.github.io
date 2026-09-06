#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { splitMarkdownSegments } from "../src/lib/content/markdown-segments.mjs";

const DEFAULT_BASE_URL = "https://openrouter.ai/api/v1";
const DEFAULT_MODEL = "z-ai/glm-5.2:free";
const SITE_URL = "https://david188888.github.io";
const POSTS_DIR = "content/posts";
const TRANSLATION_DIR = "content/generated/translations/posts";
const DIAGNOSTICS_PATH = "local/translation-diagnostics/last-invalid-response.txt";

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
 * Replaces every embedded HTML block in the body with a stable placeholder
 * line so the translation model never has to reproduce raw markup. Returns the
 * placeholder body plus the extracted blocks in document order.
 */
export function extractHtmlBlocks(body) {
  const segments = splitMarkdownSegments(body);
  const blocks = [];
  const lines = [];

  for (const segment of segments) {
    if (segment.type !== "html") {
      lines.push(segment.content);
      continue;
    }

    const token = `html-block-${blocks.length + 1}`;
    blocks.push({ token, html: segment.content });
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

    result = result.replace(placeholderPattern, () => finalHtml);
  }

  return result;
}

export function buildTranslationRequest({
  model,
  sourceLanguage,
  targetLanguage,
  title,
  body,
  excerpt,
  tags,
  htmlText,
}) {
  return {
    model,
    stream: false,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: [
          "You are a professional bilingual content translator.",
          "Follow baoyu-translate normal mode: analyze the source first, then translate.",
          "Rewrite naturally instead of translating literally.",
          "Translate portfolio blog content with a business/formal style.",
          "Preserve markdown structure, code fences, links, numbers, and factual claims.",
          "The body may contain placeholder lines like [[html-block-1]] that mark embedded HTML blocks.",
          "Keep every placeholder exactly as-is on its own line; never translate, reorder, merge, or drop placeholders.",
          "Translate each value in htmlText naturally and return htmlText with identical keys.",
          "Return only valid JSON with translated title, excerpt, tags, body, and htmlText fields.",
        ].join(" "),
      },
      {
        role: "user",
        content: JSON.stringify({
          sourceLanguage,
          targetLanguage,
          style: ["business", "formal"],
          fields: {
            title,
            excerpt,
            tags,
            body,
          },
          ...(htmlText ? { htmlText } : {}),
        }),
      },
    ],
  };
}

async function main() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const baseUrl = process.env.OPENROUTER_BASE_URL || DEFAULT_BASE_URL;
  const model = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;
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
      outcome = await translatePost({ sourcePath, baseUrl, apiKey, model });
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

async function translatePost({ sourcePath, baseUrl, apiKey, model }) {
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

  if (await isFreshCache(cachePath, { sourceHash, targetLanguage })) {
    console.log(`Skipping ${sourcePath}: fresh translation cache exists.`);
    return "skipped";
  }

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is required to translate content with missing or stale cache.");
  }

  const { body: placeholderBody, blocks } = extractHtmlBlocks(body);
  const htmlText = buildHtmlTextPayload(blocks);

  const request = buildTranslationRequest({
    model,
    sourceLanguage,
    targetLanguage,
    title,
    body: placeholderBody,
    excerpt,
    tags,
    htmlText,
  });

  const translated = await requestTranslation({ baseUrl, apiKey, request });

  if (htmlText) {
    validateHtmlText(translated.htmlText, htmlText);
  }

  const finalBody = restoreHtmlBlocks(translated.body, blocks, translated.htmlText);
  const cache = {
    sourcePath,
    sourceHash,
    sourceLanguage,
    targetLanguage,
    model,
    mode: "normal",
    style: ["business", "formal"],
    title: translated.title,
    excerpt: translated.excerpt,
    tags: translated.tags,
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

const REQUEST_MAX_ATTEMPTS = 6;
const REQUEST_BASE_RETRY_DELAY_MS = 5_000;
const REQUEST_MAX_RETRY_DELAY_MS = 60_000;

export async function requestTranslation({ baseUrl, apiKey, request }) {
  const endpoint = `${baseUrl.replace(/\/+$/, "")}/chat/completions`;

  let rawResponse = "";
  for (let attempt = 1; attempt <= REQUEST_MAX_ATTEMPTS; attempt += 1) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": SITE_URL,
        "X-Title": "david-homepage",
      },
      body: JSON.stringify(request),
    });

    rawResponse = await response.text();
    if (response.ok) {
      break;
    }

    if (!isRetryableStatus(response.status) || attempt === REQUEST_MAX_ATTEMPTS) {
      throw new Error(
        `OpenRouter translation request failed with HTTP ${response.status}: ${redactSecrets(rawResponse)}`
      );
    }

    const retryDelayMs =
      readRetryDelayMs(rawResponse) ??
      Math.min(REQUEST_BASE_RETRY_DELAY_MS * 2 ** (attempt - 1), REQUEST_MAX_RETRY_DELAY_MS);
    console.warn(
      `OpenRouter returned HTTP ${response.status}; retrying in ${Math.round(retryDelayMs / 1000)}s (attempt ${attempt + 1}/${REQUEST_MAX_ATTEMPTS}).`
    );
    await sleep(retryDelayMs);
  }

  let payload;
  try {
    payload = JSON.parse(rawResponse);
  } catch {
    await writeInvalidResponse(rawResponse);
    throw new Error(`OpenRouter returned invalid JSON. Diagnostics saved to ${DIAGNOSTICS_PATH}.`);
  }

  const content = payload.choices?.[0]?.message?.content;
  const translated = parseTranslatedContent(content);
  if (!translated) {
    await writeInvalidResponse(rawResponse);
    throw new Error(`OpenRouter returned an invalid translation shape. Diagnostics saved to ${DIAGNOSTICS_PATH}.`);
  }

  return translated;
}

function parseTranslatedContent(content) {
  if (typeof content !== "string") {
    return null;
  }

  const jsonText = stripJsonFence(content);
  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return null;
  }

  if (typeof parsed.title !== "string" || typeof parsed.body !== "string") {
    return null;
  }

  return {
    title: parsed.title,
    excerpt: typeof parsed.excerpt === "string" ? parsed.excerpt : "",
    tags: Array.isArray(parsed.tags) ? parsed.tags.map((tag) => String(tag)) : [],
    body: parsed.body,
    htmlText: parsed.htmlText && typeof parsed.htmlText === "object" ? parsed.htmlText : null,
  };
}

export function validateHtmlText(htmlText, expected) {
  if (!htmlText || typeof htmlText !== "object") {
    throw new Error("OpenRouter response is missing translated htmlText for embedded HTML blocks.");
  }

  const missing = Object.keys(expected).filter(
    (key) => typeof htmlText[key] !== "string" || htmlText[key].trim() === ""
  );

  if (missing.length > 0) {
    throw new Error(`OpenRouter response is missing htmlText translations for keys: ${missing.join(", ")}.`);
  }
}

function stripJsonFence(content) {
  const trimmed = content.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return fenceMatch ? fenceMatch[1] : trimmed;
}

function isRetryableStatus(status) {
  return status === 408 || status === 429 || status >= 500;
}

function readRetryDelayMs(rawResponse) {
  try {
    const retryAfter = JSON.parse(rawResponse)?.error?.metadata?.raw;
    if (typeof retryAfter !== "string") {
      return null;
    }
    const seconds = Number(JSON.parse(retryAfter)?.retry_after_seconds);
    return Number.isFinite(seconds) && seconds >= 0 ? Math.min(seconds * 1000, 60_000) : null;
  } catch {
    return null;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function writeInvalidResponse(rawResponse) {
  await fs.mkdir(path.dirname(DIAGNOSTICS_PATH), { recursive: true });
  await fs.writeFile(DIAGNOSTICS_PATH, rawResponse);
}

function redactSecrets(text) {
  return text.replace(/sk-or-v1-[A-Za-z0-9]+/g, "sk-or-v1-[redacted]");
}

const isCli = process.argv[1] === fileURLToPath(import.meta.url);

if (isCli) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
