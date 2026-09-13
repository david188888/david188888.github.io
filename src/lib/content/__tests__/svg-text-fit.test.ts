import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { renderMarkdownToHtml } from "../posts";
import {
  DEFAULT_EMBEDDED_FONT_SIZE,
  EMBEDDED_TEXT_FONT_SIZES,
  fitEmbeddedSvgText,
  measureDiagramLabel,
  wrapDiagramLabel,
} from "../svg-text-fit.mjs";

const GLOBALS_CSS = readFileSync("src/app/globals.css", "utf8");

/** Declarations of the first rule whose selector mentions `fragment`. */
function ruleDeclarations(fragment: string): string {
  for (const chunk of GLOBALS_CSS.split("}")) {
    const brace = chunk.indexOf("{");
    if (brace === -1) continue;
    if (chunk.slice(0, brace).includes(fragment)) return chunk.slice(brace);
  }

  return "";
}

/** A diagram shaped like the ones the posts embed. */
function diagram(body: string): string {
  return (
    '<figure class="supply-chain-diagram">\n  <div class="supply-chain-diagram-scroll">\n' +
    `    <svg viewBox="0 0 1120 720" role="img">\n${body}\n    </svg>\n  </div>\n</figure>`
  );
}

const NARROW_BOX = '<rect x="896" y="87" width="174" height="130" />';
const WIDE_BOX = '<rect x="244" y="268" width="632" height="200" />';
const LONG_LABEL = "Production capacity, yield rate, and certification";
const SCENE_LABEL =
  "SoCs, memory, and device manufacturers handle local inference; the frequency of use and product gross margins determine whether the demand can be fulfilled";

/** The size a fitted `<text>` element ended up at. */
function emittedFontSize(html: string): number | null {
  const match = html.match(/<text[^>]*\bfont-size="([\d.]+)"/);
  return match ? Number(match[1]) : null;
}

describe("diagram label measurement", () => {
  it("counts a full-width glyph as one em", () => {
    expect(measureDiagramLabel("端侧第二曲线", 14)).toBeCloseTo(6 * 14);
    expect(measureDiagramLabel("abc", 14)).toBeCloseTo(3 * 14 * 0.56);
  });

  it("wraps on spaces without cutting words", () => {
    const lines = wrapDiagramLabel(LONG_LABEL, 150, 14);

    expect(lines.length).toBeGreaterThan(1);
    expect(lines.join(" ").replace(/\s+/g, " ")).toBe(LONG_LABEL);
    for (const line of lines) expect(line).not.toMatch(/^ | $/);
  });

  it("wraps a full-width label between glyphs", () => {
    expect(wrapDiagramLabel("产能、良率与认证", 60, 14).length).toBeGreaterThan(1);
  });

  it("keeps a label that already fits on one line", () => {
    expect(wrapDiagramLabel("有效任务", 184, 14)).toEqual(["有效任务"]);
  });
});

describe("diagram font sizes stay in step with the stylesheet", () => {
  it("matches every class this module knows about", () => {
    for (const [className, fontSize] of Object.entries(EMBEDDED_TEXT_FONT_SIZES)) {
      expect(ruleDeclarations(`.${className}`), className).toContain(`font-size: ${fontSize}px`);
    }
  });

  it("matches the size node titles inherit", () => {
    expect(ruleDeclarations(".supply-chain-node text")).toContain(
      `font-size: ${DEFAULT_EMBEDDED_FONT_SIZE}px`
    );
  });
});

describe("fitting diagram labels", () => {
  it("leaves a label that fits byte-for-byte alone", () => {
    const source = diagram(`${NARROW_BOX}\n      <text class="supply-chain-node-small" x="983" y="156">Wafer yield</text>`);

    expect(fitEmbeddedSvgText(source)).toBe(source);
  });

  it("leaves a label without coordinates alone", () => {
    const source = diagram("<text>Flow</text>");

    expect(fitEmbeddedSvgText(source)).toBe(source);
  });

  it("breaks a translated label into lines that fit its box", () => {
    const fitted = fitEmbeddedSvgText(
      diagram(`${WIDE_BOX}\n      <text class="supply-chain-node-small" x="560" y="320">${SCENE_LABEL}</text>`)
    );

    expect(fitted.match(/<tspan/g)?.length).toBeGreaterThan(1);
    expect(fitted).toContain('dy="0"');
    // The author's baseline stays where it was: the label grows downwards.
    expect(fitted).toContain('y="320"');
    // It fitted at full size, so no override is emitted.
    expect(emittedFontSize(fitted)).toBeNull();
    for (const line of fitted.match(/<tspan[^>]*>([^<]*)<\/tspan>/g) ?? []) {
      expect(measureDiagramLabel(line.replace(/<[^>]*>/g, ""), 14)).toBeLessThanOrEqual(608);
    }
  });

  it("shrinks the label before squeezing it into a small box", () => {
    const fitted = fitEmbeddedSvgText(
      diagram(`${NARROW_BOX}\n      <text class="supply-chain-node-small" x="983" y="181">${LONG_LABEL}</text>`)
    );

    const fontSize = emittedFontSize(fitted);

    expect(fontSize).not.toBeNull();
    expect(fontSize!).toBeGreaterThanOrEqual(9);
    expect(fontSize!).toBeLessThan(14);
    expect(fitted.match(/<tspan/g)?.length).toBeGreaterThan(1);
    expect(fitted).not.toContain("textLength");
  });

  it("squeezes a label when no readable size fits", () => {
    const fitted = fitEmbeddedSvgText(
      diagram(
        '<rect x="588" y="500" width="210" height="20" />\n' +
          '      <text class="supply-chain-node-small" x="693" y="510">Valid tasks, utilization rate, and contract renewal</text>'
      )
    );

    expect(fitted).toContain('textLength="186"');
    expect(fitted).toContain('lengthAdjust="spacingAndGlyphs"');
    expect(fitted).not.toContain("<tspan");
  });

  it("bounds a label that floats outside every rectangle by the viewBox", () => {
    const fitted = fitEmbeddedSvgText(
      diagram(
        '      <text class="supply-chain-subheading" x="50" y="680">From left to right, it shows how demand signals are transmitted upstream. Ultimately, upstream supply still needs to be tied back to valid tasks, utilization rate, and cash returns.</text>'
      )
    );

    expect(fitted).toContain("<tspan");
    expect(fitted).toContain('x="50"');
  });

  it("is idempotent", () => {
    const wrapped = fitEmbeddedSvgText(
      diagram(`${WIDE_BOX}\n      <text class="supply-chain-node-small" x="560" y="320">${SCENE_LABEL}</text>`)
    );
    const shrunk = fitEmbeddedSvgText(
      diagram(`${NARROW_BOX}\n      <text class="supply-chain-node-small" x="983" y="181">${LONG_LABEL}</text>`)
    );
    const squeezed = fitEmbeddedSvgText(
      diagram('<rect x="588" y="500" width="210" height="20" />\n      <text class="supply-chain-node-small" x="693" y="510">Valid tasks, utilization rate, and contract renewal</text>')
    );

    expect(fitEmbeddedSvgText(wrapped)).toBe(wrapped);
    expect(fitEmbeddedSvgText(shrunk)).toBe(shrunk);
    expect(fitEmbeddedSvgText(squeezed)).toBe(squeezed);
  });

  it("leaves descriptions and titles alone", () => {
    const source = diagram(
      "<desc>A description that is far longer than any box it might sit in, entirely untouched.</desc>\n      <title>Diagram</title>"
    );

    expect(fitEmbeddedSvgText(source)).toBe(source);
  });

  it("runs inside the body renderer", () => {
    const html = renderMarkdownToHtml(
      diagram(`${WIDE_BOX}\n      <text class="supply-chain-node-small" x="560" y="320">${SCENE_LABEL}</text>`)
    );

    expect(html).toContain("<tspan");
    expect(html).toContain('<figure class="supply-chain-diagram">');
  });
});
