import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import { analyticsConfig } from "@/config/analytics";
import { googleAnalyticsBootstrap } from "../google-tag";

function browserContext(hostname: string) {
  const tags: { id?: string; src?: string; async?: boolean }[] = [];
  const window = { location: { hostname }, dataLayer: [] as ArrayLike<unknown>[] };
  const document = {
    getElementById: (id: string) => tags.find((tag) => tag.id === id),
    createElement: () => ({}),
    head: { appendChild: (tag: (typeof tags)[number]) => tags.push(tag) },
  };
  return { window, document, tags };
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
});
