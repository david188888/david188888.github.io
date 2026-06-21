import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("src/app/globals.css", "utf8");

describe("aligned page CSS contracts", () => {
  it("defines the shared grid, sticky rail, and active marker", () => {
    expect(css).toMatch(/\.aligned-section-row\s*\{/);
    expect(css).toMatch(
      /grid-template-columns:\s*minmax\(0,\s*0\.78fr\)\s+minmax\(0,\s*2fr\)/
    );
    expect(css).toMatch(/\.aligned-section-marker\s*\{[\s\S]*?position:\s*sticky/);
    expect(css).toMatch(/\[data-active="true"\]/);
  });

  it("switches to one content column below 768px", () => {
    expect(css).toMatch(/@media\s*\(max-width:\s*767px\)/);
    expect(css).toMatch(/\.aligned-section-row\s*\{[\s\S]*?grid-template-columns:\s*1fr/);
    expect(css).toMatch(/\.aligned-quick-nav\s*\{[\s\S]*?display:\s*flex/);
    expect(css).toMatch(/\.home-nav-mobile-language\s*\{[\s\S]*?display:\s*block/);
  });
});
