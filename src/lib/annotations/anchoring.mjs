/**
 * Locates a stored quote inside the article's flat text content.
 *
 * Local annotations are anchored by the quoted text plus a little surrounding
 * context rather than by a numeric offset. Offsets break as soon as the author
 * edits the article; a quote either still exists (re-anchor) or does not (the
 * annotation is re-attached only where the reader can still see it).
 */

/**
 * @param {string} text flat text content of the article
 * @param {{ quote?: string, prefix?: string, suffix?: string } | null | undefined} anchor
 * @returns {{ start: number, end: number } | null} offsets into `text`
 */
export function resolveQuoteOffsets(text, anchor) {
  const quote = anchor?.quote;
  if (typeof text !== "string" || typeof quote !== "string" || quote.length === 0) {
    return null;
  }

  const candidates = [];
  let cursor = 0;

  while (cursor <= text.length - quote.length) {
    const index = text.indexOf(quote, cursor);
    if (index === -1) break;
    candidates.push(index);
    cursor = index + 1;
  }

  if (candidates.length === 0) return null;

  const prefix = anchor.prefix ?? "";
  const suffix = anchor.suffix ?? "";

  if (candidates.length === 1 || (prefix === "" && suffix === "")) {
    return { start: candidates[0], end: candidates[0] + quote.length };
  }

  let bestStart = candidates[0];
  let bestScore = -1;

  for (const start of candidates) {
    let score = 0;
    if (prefix && text.slice(Math.max(0, start - prefix.length), start).endsWith(prefix)) {
      score += prefix.length;
    }
    if (
      suffix &&
      text.slice(start + quote.length, start + quote.length + suffix.length).startsWith(suffix)
    ) {
      score += suffix.length;
    }
    if (score > bestScore) {
      bestScore = score;
      bestStart = start;
    }
  }

  return { start: bestStart, end: bestStart + quote.length };
}

/**
 * Builds the anchor for a freshly made selection.
 *
 * @param {string} text flat article text
 * @param {number} start
 * @param {number} end
 * @param {number} [contextLength]
 */
export function buildAnchor(text, start, end, contextLength = 24) {
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end <= start) {
    throw new RangeError("buildAnchor 需要合法的 start/end。");
  }

  return {
    quote: text.slice(start, end),
    prefix: text.slice(Math.max(0, start - contextLength), start),
    suffix: text.slice(end, end + contextLength),
  };
}

/** Maps a flat-text offset back to a DOM (node, offset) pair. */
export function locateTextOffset(root, target) {
  const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  let consumed = 0;
  let node = walker.nextNode();

  while (node) {
    const length = node.textContent?.length ?? 0;
    if (consumed + length >= target) {
      return { node, offset: target - consumed };
    }
    consumed += length;
    node = walker.nextNode();
  }

  return null;
}

/** Flat text content of an element, matching the offsets `locateTextOffset` uses. */
export function readFlatText(root) {
  const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);

  let text = "";
  let node = walker.nextNode();
  while (node) {
    text += node.textContent ?? "";
    node = walker.nextNode();
  }
  return text;
}
