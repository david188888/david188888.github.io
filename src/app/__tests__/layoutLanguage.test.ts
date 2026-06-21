import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const layout = readFileSync("src/app/layout.tsx", "utf8");

describe("document language bootstrap", () => {
  it("sets the document language from the locale path before hydration", () => {
    expect(layout).toContain("document.documentElement.lang");
    expect(layout).toContain('locale === "zh" ? "zh" : "en"');
    expect(layout.indexOf("<head>")).toBeLessThan(layout.indexOf("<body"));
  });
});
