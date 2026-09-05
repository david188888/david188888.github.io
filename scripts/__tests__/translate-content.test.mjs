import { describe, expect, it } from "vitest";
import {
  applyTextTranslations,
  buildTranslationRequest,
  createSourceHash as createScriptSourceHash,
  extractHtmlBlocks,
  extractTextNodes,
  parseFrontmatter,
  restoreHtmlBlocks,
  toCachePath,
  validateHtmlText,
} from "../translate-content.mjs";
import { createSourceHash as createRuntimeSourceHash } from "../../src/lib/content/cache.ts";
import { renderMarkdownToHtml } from "../../src/lib/content/posts.ts";
import { splitMarkdownSegments } from "../../src/lib/content/markdown-segments.mjs";

describe("translate-content helpers", () => {
  it("parses frontmatter and body", () => {
    const parsed = parseFrontmatter("---\ntitle: Hello\nlanguage: en\n---\n\nBody");
    expect(parsed.frontmatter.title).toBe("Hello");
    expect(parsed.frontmatter.language).toBe("en");
    expect(parsed.body.trim()).toBe("Body");
  });

  it("creates stable post cache paths", () => {
    expect(toCachePath("content/posts/2026-06-13-my-note.mdx")).toBe("content/generated/translations/posts/2026-06-13-my-note.json");
  });

  it("builds OpenRouter requests without exposing secrets", () => {
    const request = buildTranslationRequest({
      model: "z-ai/glm-5.2:free",
      sourceLanguage: "en",
      targetLanguage: "zh",
      title: "AI Strategy",
      body: "Intro\n\n[[html-block-1]]\n\nOutro",
      excerpt: "",
      tags: [],
      htmlText: { "1.1": "用户请求" },
    });
    expect(request.model).toBe("z-ai/glm-5.2:free");
    expect(request.stream).toBe(false);
    expect(request.response_format).toEqual({ type: "json_object" });
    const serialized = JSON.stringify(request.messages);
    expect(serialized).toContain("[[html-block-1]]");
    expect(serialized).toContain("htmlText");
    expect(serialized).not.toContain("sk-or-");
  });

  it("omits htmlText when the body has no embedded HTML blocks", () => {
    const request = buildTranslationRequest({
      model: "z-ai/glm-5.2:free",
      sourceLanguage: "en",
      targetLanguage: "zh",
      title: "AI Strategy",
      body: "Plain body.",
      excerpt: "",
      tags: [],
      htmlText: undefined,
    });
    expect(JSON.stringify(request.messages)).not.toContain("htmlText\":");
  });

  it("extracts embedded HTML blocks and leaves stable placeholders", () => {
    const source = "Para\n\n<figure class=\"x\">\n\n  <text>你好</text>\n\n</figure>\n\nPara2";
    const { body, blocks } = extractHtmlBlocks(source);

    expect(body).toBe("Para\n\n[[html-block-1]]\n\nPara2");
    expect(blocks).toHaveLength(1);
    expect(blocks[0].token).toBe("html-block-1");
    expect(blocks[0].html).toContain("<text>你好</text>");
  });

  it("extracts visible text nodes in document order", () => {
    const nodes = extractTextNodes('<figure>\n  <text> 用户请求 </text>\n  <text>有效 Token</text>\n</figure>');
    expect(nodes).toEqual(["用户请求", "有效 Token"]);
  });

  it("applies text translations while preserving surrounding whitespace", () => {
    const html = "<text> 用户请求 </text>";
    expect(applyTextTranslations(html, ["User request"])).toBe("<text> User request </text>");
    expect(applyTextTranslations(html, [null])).toBe(html);
    expect(applyTextTranslations(html, ["a & b <c>"])).toBe("<text> a &amp; b &lt;c&gt; </text>");
  });

  it("restores translated blocks and fails loudly on lost placeholders", () => {
    const source = 'Para\n\n<figure class="x">\n  <text>用户请求</text>\n</figure>\n\nPara2';
    const { body, blocks } = extractHtmlBlocks(source);
    const translatedBody = "段落\n\n[[html-block-1]]\n\n尾声";

    const restored = restoreHtmlBlocks(translatedBody, blocks, { "1.1": "User request" });
    expect(restored).toContain('<figure class="x">');
    expect(restored).toContain("<text>User request</text>");
    expect(restored).not.toContain("[[html-block-1]]");

    expect(() => restoreHtmlBlocks("no placeholder here", blocks, {})).toThrow(/placeholder/);
  });

  it("validates htmlText completeness before writing the cache", () => {
    expect(() => validateHtmlText(null, { "1.1": "x" })).toThrow(/htmlText/);
    expect(() => validateHtmlText({ "1.1": "" }, { "1.1": "x" })).toThrow(/1\.1/);
    expect(() => validateHtmlText({ "1.1": "ok" }, { "1.1": "x" })).not.toThrow();
  });

  it("uses the runtime raw-source hash contract", () => {
    const source = "---\ntitle: Example\nlanguage: en\n---\n\n# Body\n";
    expect(createScriptSourceHash(source)).toBe(createRuntimeSourceHash(source));
  });

  it("invalidates hashes for frontmatter and whitespace-only changes", () => {
    const source = "---\ntitle: Example\n---\n\nBody\n";
    const frontmatterChange = "---\ntitle: Changed\n---\n\nBody\n";
    const whitespaceChange = "---\ntitle: Example\n---\n\nBody  \n";

    for (const changed of [frontmatterChange, whitespaceChange]) {
      expect(createScriptSourceHash(changed)).not.toBe(createScriptSourceHash(source));
      expect(createRuntimeSourceHash(changed)).not.toBe(createRuntimeSourceHash(source));
      expect(createScriptSourceHash(changed)).toBe(createRuntimeSourceHash(changed));
    }
  });

  it("rejects structured object input", () => {
    expect(() => createScriptSourceHash({ frontmatter: {}, body: "Body" })).toThrow();
  });

  it("stays in contract with the runtime HTML block renderer", () => {
    const fixture = [
      "## Heading",
      "",
      '<figure class="x">',
      "",
      "  <text>内部</text>",
      "",
      "</figure>",
      "",
      "```text",
      "<div>code</div>",
      "```",
      "",
      "Tail",
    ].join("\n");

    const scriptBlocks = extractHtmlBlocks(fixture).blocks;
    const runtimeHtmlSegments = splitMarkdownSegments(fixture)
      .filter((segment) => segment.type === "html")
      .map((segment) => segment.content);

    expect(scriptBlocks.map((block) => block.html)).toEqual(runtimeHtmlSegments);
    expect(scriptBlocks).toHaveLength(1);

    const rendered = renderMarkdownToHtml(fixture);
    expect(rendered).toContain('<figure class="x">');
    expect(rendered).toContain("<text>内部</text>");
    expect(rendered).toContain("&lt;div&gt;code&lt;/div&gt;");
  });
});
