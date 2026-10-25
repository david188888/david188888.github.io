/**
 * How a post source file is read, shared by the build-time translator
 * (`scripts/translate-content.mjs`) and the site loader
 * (`src/lib/content/posts.ts`).
 *
 * Both sides must agree on the frontmatter and on which language a post is
 * written in: the script translates into the other language and the site looks
 * up that same target, so a disagreement would publish nothing or the wrong
 * cache. They used to carry separate copies of this logic.
 */

/**
 * Splits `---` frontmatter from the body. Only the YAML subset the posts use is
 * supported: `key: value` scalars and `key:` followed by `- item` lists. Values
 * are always strings; quotes around a scalar are stripped.
 *
 * @param {string} source
 * @returns {{ frontmatter: Record<string, string | string[]>, body: string }}
 */
export function parseFrontmatter(source) {
  if (!source.startsWith("---\n")) return { frontmatter: {}, body: source };
  const closingIndex = source.indexOf("\n---", 4);
  if (closingIndex === -1) return { frontmatter: {}, body: source };

  const bodyStart = source.startsWith("\n", closingIndex + 4) ? closingIndex + 5 : closingIndex + 4;
  return {
    frontmatter: parseSimpleYaml(source.slice(4, closingIndex)),
    body: source.slice(bodyStart),
  };
}

/**
 * @param {string} source
 * @returns {Record<string, string | string[]>}
 */
function parseSimpleYaml(source) {
  /** @type {Record<string, string | string[]>} */
  const result = {};
  const lines = source.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim() || line.trimStart().startsWith("#")) continue;

    const match = line.match(/^([A-Za-z0-9_-]+):(?:\s*(.*))?$/);
    if (!match) continue;

    const key = match[1];
    const value = match[2] ?? "";
    if (value === "") {
      /** @type {string[]} */
      const items = [];
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

/**
 * @param {string} value
 * @returns {string}
 */
function parseScalar(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

/**
 * Character-share heuristic. Returns `null` for short or mixed text, in which
 * case the post must declare `language:` explicitly.
 *
 * @param {string} text
 * @returns {{ language: "zh" | "en" | null, confidence: "high" | "ambiguous" }}
 */
export function detectSourceLanguage(text) {
  const chineseCount = (text.match(/[㐀-鿿]/g) ?? []).length;
  const englishCount = (text.match(/[A-Za-z]/g) ?? []).length;
  const totalSignal = chineseCount + englishCount;

  if (chineseCount >= 8 && chineseCount / Math.max(totalSignal, 1) >= 0.35) {
    return { language: "zh", confidence: "high" };
  }

  if (englishCount >= 20 && englishCount / Math.max(totalSignal, 1) >= 0.75) {
    return { language: "en", confidence: "high" };
  }

  return { language: null, confidence: "ambiguous" };
}

/**
 * An explicit `language:` wins; otherwise detect from title, excerpt and body.
 *
 * @param {Record<string, unknown>} frontmatter
 * @param {string} body
 * @returns {"zh" | "en" | null}
 */
export function getSourceLanguage(frontmatter, body) {
  if (frontmatter.language === "en" || frontmatter.language === "zh") {
    return frontmatter.language;
  }
  const title = typeof frontmatter.title === "string" ? frontmatter.title : "";
  const excerpt = typeof frontmatter.excerpt === "string" ? frontmatter.excerpt : "";
  return detectSourceLanguage(`${title}\n${excerpt}\n${body}`).language;
}

/**
 * @param {"zh" | "en"} sourceLanguage
 * @returns {"zh" | "en"}
 */
export function getTargetLanguage(sourceLanguage) {
  if (sourceLanguage === "zh") return "en";
  if (sourceLanguage === "en") return "zh";
  throw new Error(`Unsupported source language: ${sourceLanguage}`);
}
