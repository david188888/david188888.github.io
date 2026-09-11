/**
 * Persistence shape for the reading-side annotation layer.
 *
 * Everything here is per-browser. Published marks come from Notion and are
 * mirrored into the article at build time; this module only records which of
 * them this browser has hidden, plus any marks the reader added locally.
 */

export const STORAGE_VERSION = 1;

const MAX_LOCAL_ANNOTATIONS = 200;

/**
 * @typedef {{
 *   id: string,
 *   quote: string,
 *   prefix: string,
 *   suffix: string,
 *   note: string,
 *   createdAt: number,
 * }} LocalAnnotation
 *
 * @typedef {{ hidden: string[], local: LocalAnnotation[] }} AnnotationState
 */

/** @param {string} slug @param {string} locale */
export function storageKey(slug, locale) {
  return `david-homepage:annotations:v${STORAGE_VERSION}:${locale}:${slug}`;
}

/** @returns {AnnotationState} */
export function createEmptyState() {
  return { hidden: [], local: [] };
}

const isString = (value) => typeof value === "string";

/**
 * Coerces anything read back from storage into the expected shape. Storage is
 * user-editable and survives version drift, so unrecognised entries are dropped
 * rather than trusted.
 *
 * @param {unknown} raw
 * @returns {AnnotationState}
 */
export function normaliseState(raw) {
  if (!raw || typeof raw !== "object") return createEmptyState();

  const hidden = Array.isArray(raw.hidden)
    ? [...new Set(raw.hidden.filter(isString).filter((id) => id.length > 0))]
    : [];

  const local = Array.isArray(raw.local)
    ? raw.local
        .filter((entry) => entry && typeof entry === "object")
        .filter((entry) => isString(entry.id) && entry.id.length > 0)
        .filter((entry) => isString(entry.quote) && entry.quote.length > 0)
        .map((entry) => ({
          id: entry.id,
          quote: entry.quote,
          prefix: isString(entry.prefix) ? entry.prefix : "",
          suffix: isString(entry.suffix) ? entry.suffix : "",
          note: isString(entry.note) ? entry.note : "",
          createdAt: typeof entry.createdAt === "number" ? entry.createdAt : 0,
        }))
        .slice(0, MAX_LOCAL_ANNOTATIONS)
    : [];

  return { hidden, local };
}

/**
 * Adds or removes a published mark id.
 *
 * @param {AnnotationState} state
 * @param {string} id
 * @returns {AnnotationState}
 */
export function toggleHidden(state, id) {
  const hidden = state.hidden.includes(id)
    ? state.hidden.filter((entry) => entry !== id)
    : [...state.hidden, id];
  return { ...state, hidden };
}

/** @param {AnnotationState} state @param {string[]} ids @returns {AnnotationState} */
export function hideIds(state, ids) {
  return { ...state, hidden: [...new Set([...state.hidden, ...ids])] };
}

/** @param {AnnotationState} state @param {string[]} ids @returns {AnnotationState} */
export function restoreIds(state, ids) {
  const removing = new Set(ids);
  return { ...state, hidden: state.hidden.filter((id) => !removing.has(id)) };
}

/** @param {AnnotationState} state @param {LocalAnnotation} annotation @returns {AnnotationState} */
export function addLocalAnnotation(state, annotation) {
  return { ...state, local: [annotation, ...state.local].slice(0, MAX_LOCAL_ANNOTATIONS) };
}

/** @param {AnnotationState} state @param {string} id @returns {AnnotationState} */
export function removeLocalAnnotation(state, id) {
  return { ...state, local: state.local.filter((entry) => entry.id !== id) };
}

/**
 * Creates an identifier for a reader-authored mark.
 *
 * @param {() => number} [now]
 * @param {() => number} [random]
 */
export function createLocalId(now = Date.now, random = Math.random) {
  const suffix = Math.floor(random() * 0xffffff).toString(36).padStart(5, "0");
  return `local-${now().toString(36)}-${suffix}`;
}
