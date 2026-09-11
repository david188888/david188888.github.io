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

/**
 * Text walker over the article prose that skips everything which is not prose.
 *
 * Two things must stay out of the anchored text:
 *
 * 1. Margin notes. They carry words too, and including them would shift every
 *    offset behind a note as soon as one renders. Published notes and reader
 *    notes share the `side-note` class, so one check covers both.
 * 2. The newlines the renderer leaves between block elements. They are layout
 *    glue, and an offset landing on one resolves to a position between blocks —
 *    which is how a reader mark once ended up as a stray child of the body
 *    instead of inside its paragraph.
 *
 * @param {HTMLElement} root
 */
export function createArticleTextWalker(root) {
  const doc = root.ownerDocument ?? root;

  return doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      let element = node.parentElement;
      while (element) {
        if (element.classList?.contains("side-note")) return NodeFilter.FILTER_REJECT;
        element = element.parentElement;
      }

      if (node.parentElement === root && (node.textContent ?? "").trim() === "") {
        return NodeFilter.FILTER_REJECT;
      }

      return NodeFilter.FILTER_ACCEPT;
    },
  });
}

/**
 * Maps a flat-text offset back to a DOM (node, offset) pair.
 *
 * The comparison is strict: an offset equal to a node's end belongs to the
 * following node. Landing on the end of the previous node would produce a
 * position between elements, and inserting there would create a sibling rather
 * than a wrapper.
 */
export function locateTextOffset(root, target) {
  const walker = createArticleTextWalker(root);
  let consumed = 0;
  let node = walker.nextNode();

  while (node) {
    const length = node.textContent?.length ?? 0;
    if (consumed + length > target) {
      return { node, offset: target - consumed };
    }
    consumed += length;
    node = walker.nextNode();
  }

  const last = walker.previousNode();
  return last ? { node: last, offset: last.textContent?.length ?? 0 } : null;
}

/** Flat text content of the article prose, matching `locateTextOffset`. */
export function readFlatText(root) {
  const walker = createArticleTextWalker(root);

  let text = "";
  let node = walker.nextNode();
  while (node) {
    text += node.textContent ?? "";
    node = walker.nextNode();
  }
  return text;
}
