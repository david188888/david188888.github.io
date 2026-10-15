/**
 * Author unlock shared by the stats page's optional tools and article annotation
 * tools.
 *
 * This is a visibility gate, not authentication. The credentials ship inside
 * the client bundle, so anyone determined enough can read them; what the gate
 * actually buys is that the public never sees author-only article interfaces by
 * accident. The annotation tools only ever change the viewer's own browser.
 * /stats/ links are public; private analytics reports require Google sign-in.
 *
 * Because it is a convenience gate, unlocking is remembered in localStorage:
 * signing in once on one device keeps the author interfaces available on every
 * article from then on.
 */

/** Set to "1" once the author has signed in on this browser. */
export const AUTHOR_FLAG_KEY = "david-homepage:author";

/** The stats page keeps its own per-tab flag so a tab can be signed out alone. */
export const STATS_SESSION_KEY = "stats-auth";

const VALID_USER = "ZGF2aWRsaXU=";
const VALID_PASS = "TGh5MDQwNjE5";

function safeStorage(kind: "local" | "session"): Storage | null {
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

/**
 * Compares credentials against the encoded pair.
 *
 * `encode` is injectable so the comparison stays testable outside a browser.
 *
 * @param {string} username
 * @param {string} password
 * @param {(value: string) => string} [encode]
 */
export function matchesAuthorCredentials(
  username: string,
  password: string,
  encode: (value: string) => string = (value) => btoa(value)
): boolean {
  if (typeof username !== "string" || typeof password !== "string") return false;

  try {
    return encode(username) === VALID_USER && encode(password) === VALID_PASS;
  } catch {
    return false;
  }
}

/** True when this browser has already been unlocked as the author. */
export function isAuthorUnlocked(): boolean {
  const storage = safeStorage("local");
  if (!storage) return false;

  try {
    return storage.getItem(AUTHOR_FLAG_KEY) === "1";
  } catch {
    return false;
  }
}

/** Remembers the author unlock for this browser. */
export function unlockAuthor(): void {
  try {
    safeStorage("local")?.setItem(AUTHOR_FLAG_KEY, "1");
  } catch {
    /* private mode: the unlock simply will not persist */
  }
}

/** Forgets the author unlock; author interfaces disappear again. */
export function lockAuthor(): void {
  try {
    safeStorage("local")?.removeItem(AUTHOR_FLAG_KEY);
  } catch {
    /* ignore */
  }
}

/** Whether the optional stats author tools are signed in for this tab. */
export function isStatsAuthenticated(): boolean {
  try {
    return safeStorage("session")?.getItem(STATS_SESSION_KEY) === "true";
  } catch {
    return false;
  }
}

/**
 * Signs in to the stats author tools for this tab and unlocks author interfaces
 * everywhere for this browser.
 */
export function signInAsAuthor(): void {
  try {
    safeStorage("session")?.setItem(STATS_SESSION_KEY, "true");
  } catch {
    /* ignore */
  }
  unlockAuthor();
}

/** Signs out of the stats page for this tab only. */
export function signOutOfStats(): void {
  try {
    safeStorage("session")?.removeItem(STATS_SESSION_KEY);
  } catch {
    /* ignore */
  }
}
