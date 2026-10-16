import { afterEach, describe, expect, it, vi } from "vitest";
import { ANALYTICS_DISABLE_KEY, ANALYTICS_EXCLUSION_KEY, readBrowserExclusion, saveBrowserExclusion } from "../browser-exclusion";

afterEach(() => vi.unstubAllGlobals());
describe("browser-local analytics exclusion", () => {
  it.each([false, true])("saves %s and disables a loaded tag before reloading", (excluded) => {
    const window = { localStorage: { setItem: vi.fn() }, location: { reload: vi.fn(() => {
      expect(window).toHaveProperty(ANALYTICS_DISABLE_KEY, true);
    }) } };
    vi.stubGlobal("window", window);
    expect(saveBrowserExclusion(excluded)).toBe(true);
    expect(window.localStorage.setItem).toHaveBeenCalledWith(ANALYTICS_EXCLUSION_KEY, String(excluded));
    expect(window.location.reload).toHaveBeenCalledOnce();
  });
  it("reads saved exclusion without confusing storage failure with inclusion", () => {
    const getItem = vi.fn().mockReturnValueOnce(null).mockReturnValueOnce("true").mockImplementationOnce(() => { throw new Error("blocked"); });
    vi.stubGlobal("window", { localStorage: { getItem } });
    expect(readBrowserExclusion()).toBe(false);
    expect(readBrowserExclusion()).toBe(true);
    expect(readBrowserExclusion()).toBe(null);
  });
  it("does not reload or claim success when persistence fails", () => {
    const window = { localStorage: { setItem: () => { throw new Error("blocked"); } }, location: { reload: vi.fn() } };
    vi.stubGlobal("window", window);
    expect(saveBrowserExclusion(true)).toBe(false);
    expect(window.location.reload).not.toHaveBeenCalled();
    expect(window).not.toHaveProperty(ANALYTICS_DISABLE_KEY);
  });
});
