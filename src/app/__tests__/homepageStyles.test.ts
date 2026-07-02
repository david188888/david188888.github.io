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

  it("redistributes desktop whitespace without changing the centered fallback", () => {
    const baseRailStyles = css.match(/\n  \.home-section-rail \{([\s\S]*?)\n  \}/)?.[1] ?? "";
    const baseContainerStyles = css.match(/\n  \.academic-home-container \{([\s\S]*?)\n  \}/)?.[1] ?? "";
    const desktopHomepageStyles =
      css.match(/@media \(min-width: 1320px\) \{([\s\S]*?)\n  \}/)?.[1] ?? "";

    expect(baseRailStyles).toContain("display: none");
    expect(baseContainerStyles).toContain("width: min(64rem, calc(100vw - 2rem))");
    expect(baseContainerStyles).toContain("margin: 0 auto");
    expect(desktopHomepageStyles).toContain(
      "--home-rail-height: clamp(20rem, 56vh, 28rem)"
    );
    expect(desktopHomepageStyles).toContain(
      "left: max(2rem, calc((100vw - 64rem) / 2 - 10rem))"
    );
    expect(desktopHomepageStyles).toContain(
      "width: min(70rem, calc(100vw - 12.5rem))"
    );
    expect(desktopHomepageStyles).toContain(
      "margin-left: max(11rem, calc((100vw - 64rem) / 2))"
    );
    expect(desktopHomepageStyles).toContain("margin-right: auto");
    expect(desktopHomepageStyles).toContain("gap: clamp(3rem, 5vw, 4rem)");
  });

  it("defines approved homepage motion hooks", () => {
    expect(css).toContain("--home-motion-fast");
    expect(css).toContain("--home-motion-reveal");
    expect(css).toContain("--home-tilt-glare-opacity: 0.32");
    expect(css).toMatch(/\.home-stagger-line\s*\{[\s\S]*?filter:\s*blur\(var\(--home-motion-blur\)\)/);
    expect(css).toMatch(/\.home-stagger-group\.is-shown\s+\.home-stagger-line/);
    expect(css).toMatch(/\.home-card-tilt\s*\{[\s\S]*?perspective:\s*var\(--home-tilt-perspective\)/);
    expect(css).toMatch(/\.home-card-tilt-glare\s*\{[\s\S]*?radial-gradient/);
    expect(css).toMatch(/\.home-section-rail-pill\s*\{[\s\S]*?transition:[\s\S]*?transform/);
    expect(css).toMatch(/\.home-section-rail-item\s*\{[\s\S]*?top:\s*var\(--rail-item-y\)/);
    expect(css).toMatch(/\.home-section-nav-link\[aria-current="true"\]/);
    expect(css).not.toMatch(/\.home-nav-link::after/);
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
