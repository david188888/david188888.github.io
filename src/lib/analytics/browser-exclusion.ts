import { analyticsConfig } from "@/config/analytics";

export const ANALYTICS_EXCLUSION_KEY = "analytics-excluded";
export const ANALYTICS_DISABLE_KEY = `ga-disable-${analyticsConfig.trackingId}`;

// null means storage cannot be read, not that the browser is excluded.
export function readBrowserExclusion(): boolean | null {
  try { return window.localStorage.getItem(ANALYTICS_EXCLUSION_KEY) === "true"; }
  catch { return null; }
}

export function saveBrowserExclusion(excluded: boolean): boolean {
  try {
    window.localStorage.setItem(ANALYTICS_EXCLUSION_KEY, String(excluded));
    // Stop an already loaded tag immediately. Reload starts a fresh tag only
    // when the saved preference allows it; already sent events cannot be undone.
    (window as unknown as Record<string, unknown>)[ANALYTICS_DISABLE_KEY] = true;
    window.location.reload();
    return true;
  } catch { return false; }
}
