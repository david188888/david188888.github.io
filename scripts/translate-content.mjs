#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_BASE_URL = "https://token-plan-sgp.xiaomimimo.com/v1";
const DEFAULT_MODEL = "mimo-v2.5-pro";
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

export function createSourceHash(input) {
  const source =
    typeof input === "string"
      ? input
      : JSON.stringify({
          frontmatter: input.frontmatter ?? {},
          body: input.body ?? "",
        });

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

export function buildMiMoRequest({ model, sourceLanguage, targetLanguage, title, body, excerpt, tags }) {
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
          "Return only valid JSON with translated title, excerpt, tags, and body fields.",
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
        }),
      },
    ],
  };
}

async function main() {
  const apiKey = process.env.MIMO_API_KEY;
  const baseUrl = process.env.MIMO_BASE_URL || DEFAULT_BASE_URL;
  const model = process.env.MIMO_MODEL || DEFAULT_MODEL;
  const sourcePaths = await listPostPaths();

  if (sourcePaths.length === 0) {
    console.log("No content posts found.");
    return;
  }

  let translatedCount = 0;
  let skippedCount = 0;

  for (const sourcePath of sourcePaths) {
    const source = await fs.readFile(sourcePath, "utf8");
    const parsed = parseFrontmatter(source);
    const title = normalizeString(parsed.frontmatter.title);
    const excerpt = normalizeString(parsed.frontmatter.excerpt);
    const tags = normalizeStringArray(parsed.frontmatter.tags);
    const body = parsed.body;
    const sourceLanguage = getSourceLanguage(parsed.frontmatter.language, `${title}\n${excerpt}\n${body}`);

    if (!sourceLanguage) {
      console.warn(`Skipping ${sourcePath}: unable to detect source language.`);
      skippedCount += 1;
      continue;
    }

    const targetLanguage = getTargetLanguage(sourceLanguage);
    const sourceHash = createSourceHash({ frontmatter: parsed.frontmatter, body });
    const cachePath = toCachePath(sourcePath);

    if (await isFreshCache(cachePath, { sourceHash, targetLanguage })) {
      console.log(`Skipping ${sourcePath}: fresh translation cache exists.`);
      skippedCount += 1;
      continue;
    }

    if (!apiKey) {
      throw new Error("MIMO_API_KEY is required to translate content with missing or stale cache.");
    }

    const request = buildMiMoRequest({
      model,
      sourceLanguage,
      targetLanguage,
      title,
      body,
      excerpt,
      tags,
    });

    const translated = await requestTranslation({ baseUrl, apiKey, request });
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
      body: translated.body,
    };

    await fs.mkdir(path.dirname(cachePath), { recursive: true });
    await fs.writeFile(cachePath, `${JSON.stringify(cache, null, 2)}\n`);
    console.log(`Wrote ${cachePath}.`);
    translatedCount += 1;
  }

  console.log(`Translation cache complete: ${translatedCount} written, ${skippedCount} skipped.`);
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

async function requestTranslation({ baseUrl, apiKey, request }) {
  const endpoint = `${baseUrl.replace(/\/+$/, "")}/chat/completions`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  const rawResponse = await response.text();
  if (!response.ok) {
    throw new Error(`MiMo translation request failed with HTTP ${response.status}: ${redactSecrets(rawResponse)}`);
  }

  let payload;
  try {
    payload = JSON.parse(rawResponse);
  } catch {
    await writeInvalidResponse(rawResponse);
    throw new Error(`MiMo returned invalid JSON. Diagnostics saved to ${DIAGNOSTICS_PATH}.`);
  }

  const content = payload.choices?.[0]?.message?.content;
  const translated = parseTranslatedContent(content);
  if (!translated) {
    await writeInvalidResponse(rawResponse);
    throw new Error(`MiMo returned an invalid translation shape. Diagnostics saved to ${DIAGNOSTICS_PATH}.`);
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
  };
}

function stripJsonFence(content) {
  const trimmed = content.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return fenceMatch ? fenceMatch[1] : trimmed;
}

async function writeInvalidResponse(rawResponse) {
  await fs.mkdir(path.dirname(DIAGNOSTICS_PATH), { recursive: true });
  await fs.writeFile(DIAGNOSTICS_PATH, rawResponse);
}

function redactSecrets(text) {
  return text.replace(/tp-[A-Za-z0-9_-]+/g, "tp-[redacted]");
}

const isCli = process.argv[1] === fileURLToPath(import.meta.url);

if (isCli) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
