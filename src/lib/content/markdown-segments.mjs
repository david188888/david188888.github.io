const HTML_VOID_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "source",
  "track",
  "wbr",
]);

const HTML_BLOCK_START_PATTERN = /^\s*<([a-zA-Z][a-zA-Z0-9-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/;
const HTML_COMMENT_START_PATTERN = /^\s*<!--/;
const CODE_FENCE_PATTERN = /^\s*```/;

/**
 * Splits a markdown source string into ordered segments.
 *
 * `markdown` segments keep their original line structure and are safe to feed
 * through the structural markdown renderer (every HTML tag inside them gets
 * escaped as before). `html` segments are block-level author-authored HTML
 * (for example an inline `<figure>...</figure>` diagram) that spans whole
 * lines, may cross blank lines, and must be rendered verbatim.
 *
 * Fenced code blocks are always treated as markdown so that HTML-looking
 * sample code is never promoted to a live HTML block.
 */
export function splitMarkdownSegments(markdown) {
  if (typeof markdown !== "string") {
    throw new TypeError("splitMarkdownSegments expects a markdown string.");
  }

  const lines = markdown.split(/\r?\n/);
  const segments = [];
  let markdownBuffer = [];
  let index = 0;

  const flushMarkdown = () => {
    if (markdownBuffer.length > 0) {
      segments.push({ type: "markdown", content: markdownBuffer.join("\n") });
      markdownBuffer = [];
    }
  };

  while (index < lines.length) {
    const line = lines[index];

    if (CODE_FENCE_PATTERN.test(line)) {
      flushMarkdown();
      const fenceEnd = findCodeFenceEnd(lines, index);
      segments.push({ type: "markdown", content: lines.slice(index, fenceEnd + 1).join("\n") });
      index = fenceEnd + 1;
      continue;
    }

    const start = matchHtmlBlockStart(line);
    if (start) {
      flushMarkdown();
      const end = findHtmlBlockEnd(lines, index, start);
      segments.push({ type: "html", content: lines.slice(index, end + 1).join("\n") });
      index = end + 1;
      continue;
    }

    markdownBuffer.push(line);
    index += 1;
  }

  flushMarkdown();
  return segments;
}

function findCodeFenceEnd(lines, startIndex) {
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    if (CODE_FENCE_PATTERN.test(lines[index])) {
      return index;
    }
  }
  return lines.length - 1;
}

function matchHtmlBlockStart(line) {
  if (HTML_COMMENT_START_PATTERN.test(line)) {
    return { comment: true };
  }

  const match = line.match(HTML_BLOCK_START_PATTERN);
  if (!match) {
    return null;
  }

  return { comment: false, name: match[1], attrs: match[2] };
}

function findHtmlBlockEnd(lines, startIndex, start) {
  if (start.comment) {
    for (let index = startIndex; index < lines.length; index += 1) {
      if (lines[index].includes("-->")) {
        return index;
      }
    }
    return lines.length - 1;
  }

  if (HTML_VOID_TAGS.has(start.name.toLowerCase()) || start.attrs.trimEnd().endsWith("/")) {
    return startIndex;
  }

  const openPattern = new RegExp(
    `<${escapeRegExp(start.name)}((?:[^>"']|"[^"]*"|'[^']*')*)>`,
    "g"
  );
  const closePattern = new RegExp(`</${escapeRegExp(start.name)}\\s*>`, "g");
  let depth = 0;

  for (let index = startIndex; index < lines.length; index += 1) {
    const line = lines[index];
    for (const match of line.matchAll(openPattern)) {
      if (!match[1].trimEnd().endsWith("/")) {
        depth += 1;
      }
    }
    for (const match of line.matchAll(closePattern)) {
      depth -= 1;
    }
    if (depth <= 0) {
      return index;
    }
  }

  // Unclosed block: treat everything up to the end of the document as HTML so
  // a typo degrades predictably instead of silently splitting mid-element.
  return lines.length - 1;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
