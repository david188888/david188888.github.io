/**
 * Stable identifiers for author-authored marks.
 *
 * The reading side stores per-browser hide/show state keyed by these ids. Ids
 * therefore have to survive editing the article: inserting or reordering
 * paragraphs must not move a hidden note onto a different note.
 *
 * A content hash does that. Editing a marked phrase changes its id, which makes
 * the local override fall back to "shown" — the safe direction, because the
 * mark the reader hid no longer exists.
 *
 * Ids are positional only as a tie-breaker (`-2`, `-3`, …) when two marks carry
 * byte-identical content.
 */

/** FNV-1a, 32-bit. Deterministic, dependency-free, plenty for a per-page key. */
export function stableHash(text) {
  if (typeof text !== "string") {
    throw new TypeError("stableHash expects a string.");
  }

  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(36).padStart(7, "0");
}

/**
 * Creates an id factory scoped to a single rendered document, so occurrence
 * numbering restarts for every page render.
 *
 * @returns {(kind: string, content: string) => string}
 */
export function createAnnotationIdFactory() {
  const occurrences = new Map();

  return (kind, content) => {
    const key = `${kind}\u0000${content}`;
    const occurrence = (occurrences.get(key) ?? 0) + 1;
    occurrences.set(key, occurrence);
    return `${kind}-${stableHash(content)}-${occurrence}`;
  };
}
