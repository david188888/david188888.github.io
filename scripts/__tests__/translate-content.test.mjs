import { describe, expect, it } from "vitest";
import { buildMiMoRequest, parseFrontmatter, toCachePath } from "../translate-content.mjs";

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

  it("builds MiMo OpenAI-compatible requests without exposing secrets", () => {
    const request = buildMiMoRequest({
      model: "mimo-v2.5-pro",
      sourceLanguage: "en",
      targetLanguage: "zh",
      title: "AI Strategy",
      body: "This is a business note.",
      excerpt: "",
      tags: [],
    });
    expect(request.model).toBe("mimo-v2.5-pro");
    expect(request.stream).toBe(false);
    expect(JSON.stringify(request.messages)).toContain("business/formal");
    expect(JSON.stringify(request.messages)).not.toContain("tp-");
  });
});
