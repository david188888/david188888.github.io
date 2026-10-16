import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import { analyticsConfig } from "@/config/analytics";
import { googleAnalyticsBootstrap } from "../google-tag";
import { ANALYTICS_DISABLE_KEY, ANALYTICS_EXCLUSION_KEY } from "../browser-exclusion";

function browserContext(hostname: string) {
  const tags: { id?: string; src?: string; async?: boolean }[] = [];
  const stored = new Map<string, string>();
  const listeners: ((event: { key: string | null }) => void)[] = [];
  let reloads = 0;
  const window = {
    location: { hostname, reload: () => { reloads++; } }, dataLayer: [] as ArrayLike<unknown>[],
    localStorage: { getItem: (key: string) => stored.get(key) ?? null },
    addEventListener: (_name: string, listener: (event: { key: string | null }) => void) => listeners.push(listener),
  };
  const document = {
    getElementById: (id: string) => tags.find((tag) => tag.id === id),
    createElement: () => ({}),
    head: { appendChild: (tag: (typeof tags)[number]) => tags.push(tag) },
  };
  return { window, document, tags, stored, listeners, reloads: () => reloads };
}

describe("global Google Analytics bootstrap", () => {
  it("queues one automatic configuration for the shared property before loading the tag", () => {
    const context = browserContext(analyticsConfig.hostname);
    let commandsAtLoad: unknown[][] = [];
    const append = context.document.head.appendChild;
    context.document.head.appendChild = (tag) => {
      commandsAtLoad = context.window.dataLayer.map((command) => Array.from(command));
      return append(tag);
    };

    runInNewContext(googleAnalyticsBootstrap, context);

    expect(commandsAtLoad).toHaveLength(2);
    expect(commandsAtLoad[0][0]).toBe("js");
    expect(commandsAtLoad[1]).toEqual([
      "config", analyticsConfig.trackingId,
      { allow_google_signals: false, allow_ad_personalization_signals: false },
    ]);
    expect(context.tags).toEqual([{
      id: "ga4-tag",
      async: true,
      src: `https://www.googletagmanager.com/gtag/js?id=${analyticsConfig.trackingId}`,
    }]);
    // Google handles page loads and history changes; we enqueue no second,
    // manual page_view alongside its automatic measurement.
    expect(commandsAtLoad.some(([command]) => command === "event")).toBe(false);
  });

  it.each(["localhost", "127.0.0.1", "[::1]", "preview.example.com", "other.github.io"])(
    "does not load Google or queue events on %s", (hostname) => {
      const context = browserContext(hostname);
      runInNewContext(googleAnalyticsBootstrap, context);
      expect(context.tags).toEqual([]);
      expect(context.window.dataLayer).toEqual([]);
    },
  );

  it("does not initialize twice if the bootstrap runs again", () => {
    const context = browserContext(analyticsConfig.hostname);
    runInNewContext(googleAnalyticsBootstrap, context);
    runInNewContext(googleAnalyticsBootstrap, context);
    expect(context.tags).toHaveLength(1);
    expect(context.window.dataLayer).toHaveLength(2);
  });

  it("preserves commands already queued in the data layer", () => {
    const context = browserContext(analyticsConfig.hostname);
    const existing = ["existing-command"];
    context.window.dataLayer.push(existing);
    runInNewContext(googleAnalyticsBootstrap, context);
    expect(context.window.dataLayer[0]).toBe(existing);
    expect(context.window.dataLayer).toHaveLength(3);
  });

  it("excludes a saved browser before queuing configuration or loading Google", () => {
    const context = browserContext(analyticsConfig.hostname);
    context.stored.set(ANALYTICS_EXCLUSION_KEY, "true");
    runInNewContext(googleAnalyticsBootstrap, context);
    expect(context.window).toHaveProperty(ANALYTICS_DISABLE_KEY, true);
    expect(context.tags).toEqual([]); expect(context.window.dataLayer).toEqual([]);
    expect(context.listeners).toHaveLength(1);
  });

  it("preserves an existing opt-out flag set by another privacy tool", () => {
    const context = browserContext(analyticsConfig.hostname);
    Object.assign(context.window, { [ANALYTICS_DISABLE_KEY]: true });
    runInNewContext(googleAnalyticsBootstrap, context);
    expect(context.window).toHaveProperty(ANALYTICS_DISABLE_KEY, true);
  });

  it.each([false, true])("reloads other open tabs when exclusion changes from %s", (excluded) => {
    const context = browserContext(analyticsConfig.hostname);
    context.stored.set(ANALYTICS_EXCLUSION_KEY, String(excluded));
    runInNewContext(googleAnalyticsBootstrap, context);
    context.listeners[0]({ key: "unrelated" });
    expect(context.reloads()).toBe(0);
    context.stored.set(ANALYTICS_EXCLUSION_KEY, String(!excluded));
    context.listeners[0]({ key: ANALYTICS_EXCLUSION_KEY });
    expect(context.window).toHaveProperty(ANALYTICS_DISABLE_KEY, true);
    expect(context.reloads()).toBe(1);
  });

  it("resumes other tabs when site storage is cleared and tolerates blocked storage", () => {
    const context = browserContext(analyticsConfig.hostname);
    context.stored.set(ANALYTICS_EXCLUSION_KEY, "true");
    runInNewContext(googleAnalyticsBootstrap, context);
    context.stored.clear(); context.listeners[0]({ key: null });
    expect(context.reloads()).toBe(1);
    const blocked = browserContext(analyticsConfig.hostname);
    blocked.window.localStorage.getItem = () => { throw new Error("blocked"); };
    expect(() => runInNewContext(googleAnalyticsBootstrap, blocked)).not.toThrow();
    expect(blocked.tags).toHaveLength(1);
  });
});
