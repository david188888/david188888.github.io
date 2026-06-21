import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("src/app/globals.css", "utf8");

describe("balanced academic homepage styles", () => {
  it("defines balanced cards without removed decorations", () => {
    expect(css).toMatch(/\.academic-card\s*\{[\s\S]*?min-height:\s*clamp\(9\.5rem,/);
    expect(css).toMatch(/\.academic-card\s*\{[\s\S]*?border-radius:\s*0\.75rem/);
    expect(css).toMatch(
      /\.academic-card\s*\{[\s\S]*?grid-template-columns:\s*minmax\(10rem,\s*11\.25rem\)\s+minmax\(0,\s*1fr\)/
    );
    expect(css).not.toMatch(/\.academic-card::before/);
    expect(css).not.toMatch(/\.academic-card-arrow/);
  });

  it("uses surface-only interaction and one-column mobile cards", () => {
    expect(css).toMatch(/\.academic-card:hover[^{]*\{[\s\S]*?translateY\(-0\.25rem\)/);
    expect(css).toMatch(
      /@media\s*\(max-width:\s*767px\)[\s\S]*\.academic-card\s*\{[\s\S]*?grid-template-columns:\s*1fr/
    );
  });

  it("defines reading progress and reduced motion", () => {
    expect(css).toMatch(/\.home-reading-progress\s*\{/);
    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  });

  it("uses a two-row mobile masthead with scrollable navigation", () => {
    expect(css).toMatch(
      /@media\s*\(max-width:\s*767px\)[\s\S]*\.home-nav-inner\s*\{[\s\S]*?grid-template-columns:\s*1fr/
    );
    expect(css).toMatch(
      /@media\s*\(max-width:\s*767px\)[\s\S]*\.home-nav-items\s*\{[\s\S]*?overflow-x:\s*auto/
    );
  });
});
