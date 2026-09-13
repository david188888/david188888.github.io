/**
 * Fits embedded diagram labels to the box they sit in.
 *
 * The diagrams are authored in Chinese, where a label like 产能、良率与认证 is a
 * handful of full-width glyphs. The English it translates to is two to three
 * times wider, and SVG `<text>` never wraps, so the translated article drew
 * labels far outside their rectangles. Measured on the published post: 21 of 34
 * labels overflowed their box in English against 0 in Chinese, the worst being a
 * 1026-unit sentence in a 632-unit box.
 *
 * This runs in the renderer rather than in the translation pipeline on purpose.
 * A label's translation does not change, only the geometry around it, so baking
 * the wrap into the committed cache would force a pipeline version bump plus a
 * full retranslation for a purely presentational fix — and it would leave the
 * geometry frozen in a generated artifact. Doing it here also lays out the
 * Chinese and English pages by the same rule.
 *
 * The layout is estimated, not measured: `globals.css` owns the font sizes and
 * the browser owns the metrics, while this module only needs to know whether a
 * label is roughly too wide, and how to break it sensibly. A line that still
 * cannot fit on its own is squeezed with `textLength`, so a box can never be
 * overflowed even when the estimate is off.
 */

/** Font sizes in SVG user units; `svg-text-fit.test.ts` keeps these in step with `globals.css`. */
export const EMBEDDED_TEXT_FONT_SIZES = {
  "supply-chain-heading": 22,
  "supply-chain-subheading": 14,
  "supply-chain-node-small": 14,
};

/** Diagram text carries no class of its own inside a node group; `.supply-chain-*-node text` sets this. */
export const DEFAULT_EMBEDDED_FONT_SIZE = 17;

/** Average advance of a Latin glyph, relative to the font size. Measured at ~0.53 on the live diagram. */
const LATIN_ADVANCE_RATIO = 0.56;

/** Breathing room kept between a label and the edge of its rectangle. */
const RECT_PADDING = 12;

/** Breathing room kept between a label and the drawing's right and bottom edges. */
const EDGE_MARGIN = 60;

/** Line height as a multiple of the font size. */
const LINE_HEIGHT_RATIO = 1.25;

/**
 * Full-width glyphs: CJK ideographs, kana, Hangul, full-width forms. These
 * advance one em, which is why a Chinese label and its English translation
 * differ so much in width.
 */
const FULL_WIDTH_PATTERN = /[\u2e80-\u9fff\u3000-\u303f\u3040-\u30ff\uac00-\ud7ff\uf900-\ufaff\ufe30-\ufe4f\uff00-\uffef]/;

function isFullWidth(character) {
  return FULL_WIDTH_PATTERN.test(character);
}

/** Estimated advance width of one label, in SVG user units. */
export function measureDiagramLabel(text, fontSize) {
  let width = 0;

  for (const character of text) {
    width += isFullWidth(character) ? fontSize : fontSize * LATIN_ADVANCE_RATIO;
  }

  return width;
}

/**
 * Splits a label into the smallest pieces a line break may separate.
 *
 * Latin runs stay whole so words are never cut; each full-width glyph is its own
 * piece, which is where a Chinese label may break.
 */
function splitLabelTokens(text) {
  const tokens = [];
  let word = "";

  const flush = () => {
    if (word !== "") tokens.push(word);
    word = "";
  };

  for (const character of text) {
    if (character === " ") {
      flush();
      if (tokens.length > 0) tokens.push(" ");
      continue;
    }
    if (isFullWidth(character)) {
      flush();
      tokens.push(character);
      continue;
    }
    word += character;
  }

  flush();
  return tokens;
}

/** Greedy line breaking; a token wider than the line keeps a line to itself. */
export function wrapDiagramLabel(text, maxWidth, fontSize) {
  const tokens = splitLabelTokens(text);
  const lines = [];
  let current = "";

  for (const token of tokens) {
    if (token === " ") {
      if (current !== "") current += " ";
      continue;
    }

    // Spaces are their own tokens, so nothing is inserted between glyphs: a
    // Chinese label must never gain the spaces an English one has.
    const candidate = `${current}${token}`;

    if (current !== "" && measureDiagramLabel(candidate, fontSize) > maxWidth) {
      lines.push(current.trimEnd());
      current = token;
      continue;
    }

    current = candidate;
  }

  if (current.trim() !== "") lines.push(current.trimEnd());
  return lines.length > 0 ? lines : [text];
}

function readAttribute(attributes, name) {
  const match = attributes.match(new RegExp(`\\b${name}="(-?[\\d.]+)"`));
  return match ? Number(match[1]) : null;
}

function setAttribute(attributes, name, value) {
  const pattern = new RegExp(`\\b${name}="[^"]*"`);
  return pattern.test(attributes) ? attributes.replace(pattern, `${name}="${value}"`) : `${attributes} ${name}="${value}"`;
}

function round(value) {
  return Math.round(value * 100) / 100;
}

/** The font size a `<text>` element renders at: its own, then the stylesheet's class. */
function fontSizeFor(attributes) {
  const inline = readAttribute(attributes, "font-size");
  if (inline !== null) return inline;

  const className = attributes.match(/\bclass="([^"]*)"/);
  if (!className) return DEFAULT_EMBEDDED_FONT_SIZE;

  for (const name of className[1].split(/\s+/)) {
    if (EMBEDDED_TEXT_FONT_SIZES[name] !== undefined) return EMBEDDED_TEXT_FONT_SIZES[name];
  }

  return DEFAULT_EMBEDDED_FONT_SIZE;
}

/** Every rectangle in the drawing, in document order. */
function readRects(html) {
  const rects = [];

  for (const match of html.matchAll(/<rect\b([^>]*)\/?>/g)) {
    const x = readAttribute(match[1], "x");
    const y = readAttribute(match[1], "y");
    const width = readAttribute(match[1], "width");
    const height = readAttribute(match[1], "height");
    if (x === null || y === null || width === null || height === null) continue;
    rects.push({ x, y, width, height });
  }

  return rects;
}

/** The smallest rectangle around a point, or null when the label floats free. */
function boxAround(rects, x, y) {
  let best = null;

  for (const rect of rects) {
    if (x < rect.x || x > rect.x + rect.width) continue;
    if (y < rect.y || y > rect.y + rect.height) continue;
    if (best === null || rect.width * rect.height < best.width * best.height) best = rect;
  }

  return best;
}

/** `viewBox="0 0 width height"`, when the drawing declares one. */
function readViewBox(html) {
  const match = html.match(/viewBox="\s*(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s*"/);
  if (!match) return null;
  return { width: Number(match[3]), height: Number(match[4]) };
}

/** Font scales tried, largest first, before a label is squeezed to fit. */
const LABEL_FONT_SCALES = [1, 0.9, 0.8, 0.7];

/**
 * Rewrites one `<text>` element so its label fits.
 *
 * A label that already fits comes back byte-for-byte unchanged, which is what
 * keeps the Chinese page exactly as the author wrote it. A label that needs more
 * than one line is broken into `<tspan>`s that keep the author's baseline and
 * grow downwards. When the box has no room for the extra lines, the label is
 * retried at a smaller size before anything else, because a slightly smaller
 * label reads better than one stretched or clipped by its box; only when no
 * readable size fits is the line squeezed with `textLength`.
 */
function fitLabel({ match, attributes, content, rects, viewBox }) {
  const text = content.trim();
  if (text === "") return match;

  const x = readAttribute(attributes, "x");
  const y = readAttribute(attributes, "y");
  if (x === null || y === null) return match;

  const box = boxAround(rects, x, y);
  const baseFontSize = fontSizeFor(attributes);

  const boxBottom = box ? box.y + box.height : viewBox ? viewBox.height : null;
  const boxRight = box ? box.width : viewBox ? viewBox.width - x : null;
  if (boxBottom === null || boxRight === null) return match;

  const available = boxRight - (box ? RECT_PADDING * 2 : EDGE_MARGIN);
  if (available <= 0) return match;
  if (measureDiagramLabel(text, baseFontSize) <= available) return match;

  for (const scale of LABEL_FONT_SCALES) {
    const fontSize = round(baseFontSize * scale);
    const lines = wrapDiagramLabel(text, available, fontSize);

    if (lines.length === 1 && measureDiagramLabel(text, fontSize) > available) continue;

    const lineHeight = round(fontSize * LINE_HEIGHT_RATIO);
    if ((lines.length - 1) * lineHeight > boxBottom - y - fontSize * 0.35) continue;

    const scaled = scale === 1 ? attributes : setAttribute(attributes, "font-size", fontSize);

    if (lines.length === 1) {
      return `<text${scaled}>${text}</text>`;
    }

    const tspans = lines
      .map((line, index) => {
        const dy = index === 0 ? 0 : lineHeight;
        const fits = measureDiagramLabel(line, fontSize) <= available;
        const squeeze = fits ? "" : ` textLength="${round(available)}" lengthAdjust="spacingAndGlyphs"`;

        return `<tspan x="${round(x)}" dy="${dy}"${squeeze}>${line}</tspan>`;
      })
      .join("");

    return `<text${scaled}>${tspans}</text>`;
  }

  // Nothing readable fits: squeeze the single line so it can never leave the box.
  const squeezed = setAttribute(
    setAttribute(attributes, "textLength", round(available)),
    "lengthAdjust",
    "spacingAndGlyphs"
  );

  return `<text${squeezed}>${text}</text>`;
}

/**
 * Fits every label in an embedded diagram. Labels outside any rectangle are
 * measured against the drawing's own viewBox, so a long caption cannot run past
 * the right edge either.
 */
export function fitEmbeddedSvgText(html) {
  if (typeof html !== "string" || !html.includes("<text")) return html;

  const rects = readRects(html);
  const viewBox = readViewBox(html);

  return html.replace(/<text\b([^>]*?)(\/?)>([^<>]*)<\/text>/g, (match, attributes, selfClosing, content) => {
    if (selfClosing === "/") return match;

    return fitLabel({ match, attributes, content, rects, viewBox });
  });
}
