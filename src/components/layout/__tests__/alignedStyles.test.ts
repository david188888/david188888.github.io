import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("src/app/globals.css", "utf8");
const editorialCss = readFileSync("src/components/home/editorial.css", "utf8");

describe("aligned page CSS contracts", () => {
  it("defines the shared grid, sticky rail, and active marker", () => {
    expect(css).toMatch(/\.aligned-section-row\s*\{/);
    expect(css).toMatch(
      /grid-template-columns:\s*var\(--aligned-rail\)\s+minmax\(0,\s*1fr\)/
    );
    expect(css).toMatch(/\.aligned-section-marker\s*\{[\s\S]*?position:\s*sticky/);
    expect(css).toMatch(/\[data-active="true"\]/);
  });

  it("keeps the rail a narrow fixed gutter rather than a content column", () => {
    // 左栏只承载章节标记；固定宽度（而不是按比例分栏）才能保证正文拿到绝大部分宽度。
    expect(css).toMatch(/\.aligned-page-shell\s*\{[\s\S]*?--aligned-rail:\s*11rem/);
    expect(css).not.toMatch(/grid-template-columns:\s*minmax\(0,\s*0\.78fr\)/);
  });

  it("caps the reading measure so the wider article column does not widen body text", () => {
    expect(css).toMatch(
      /\.aligned-article-prose\s+\.insight-body\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*39rem\)\s+minmax\(11rem,\s*1fr\)/
    );
    expect(css).toMatch(/\.aligned-article-prose\s+\.side-note\s*\{[\s\S]*?max-width:/);
  });

  it("widens the rail only on the insights list page, whose rail label is a two-word phrase", () => {
    // 该覆盖与基础值同特异度（都是单类选择器），所以必须定义在基础值之后。
    const override = css.indexOf(".aligned-page-shell--insights-list");
    expect(override).toBeGreaterThan(css.indexOf("--aligned-rail: 11rem"));
    expect(css).toMatch(/\.aligned-page-shell--insights-list\s*\{[\s\S]*?--aligned-rail:\s*14rem/);
  });

  it("uses one compact rail-label treatment at every breakpoint", () => {
    expect(css).toMatch(
      /\.aligned-section-link\s*\{[\s\S]*?gap:\s*0\.5rem[\s\S]*?letter-spacing:\s*0\.1em/
    );
  });

  it("switches to one content column below 768px", () => {
    expect(css).toMatch(/@media\s*\(max-width:\s*767px\)/);
    expect(css).toMatch(/\.aligned-section-row\s*\{[\s\S]*?grid-template-columns:\s*1fr/);
    expect(css).toMatch(/\.aligned-quick-nav\s*\{[\s\S]*?display:\s*flex/);
  });

  it("restores a scoped editorial rhythm without changing the annotation grid", () => {
    expect(editorialCss).toMatch(/\.ed-root \.aligned-article-prose\s*\{[\s\S]*?font-size:\s*17px[\s\S]*?line-height:\s*1\.85/);
    expect(editorialCss).toMatch(/\.ed-root \.aligned-article-prose \.insight-body > p[\s\S]*?margin-top:\s*1\.8em/);
    expect(editorialCss).toMatch(/\.ed-root \.aligned-article-prose \.insight-body > h2[\s\S]*?margin-top:\s*2\.8em/);
    expect(editorialCss).toMatch(/\.ed-root \.aligned-article-prose code::before[\s\S]*?content:\s*none/);
    expect(editorialCss).toMatch(/\.ed-root \.aligned-article-prose code::after[\s\S]*?content:\s*none/);
    expect(editorialCss).toMatch(/\.ed-root \.aligned-article-prose \.insight-body > \.note-pair > p/);
  });
});
