import { describe, expect, it } from "vitest";
import type { LocalizedPost } from "../posts";
import { renderMarkdownToHtml, selectPublishedPosts } from "../posts";

function post(slug: string, date?: string): LocalizedPost {
  return {
    slug,
    title: slug,
    excerpt: `${slug} excerpt`,
    date,
    tags: [],
    body: slug,
    bodyHtml: `<p>${slug}</p>`,
    locale: "en",
  };
}

describe("renderMarkdownToHtml", () => {
  it("renders safe structural markdown while keeping inline HTML inert", () => {
    const html = renderMarkdownToHtml(
      "## Section\n\n- one\n- two\n\n[Source](https://example.com)\n\nInline <script>alert(1)</script> text"
    );

    expect(html).toContain("<h2>Section</h2>");
    expect(html).toContain("<ul><li>one</li><li>two</li></ul>");
    expect(html).toContain('<a href="https://example.com" rel="noreferrer" target="_blank">Source</a>');
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).not.toContain("<script>");
  });

  it("passes author-authored block HTML through verbatim", () => {
    const html = renderMarkdownToHtml(
      '## Before\n\n<figure class="chart">\n\n  <svg viewBox="0 0 10 10"><text>Flow</text></svg>\n\n</figure>\n\nAfter'
    );

    expect(html).toContain('<figure class="chart">');
    expect(html).toContain("<text>Flow</text>");
    expect(html).toContain("<p>After</p>");
  });

  it("strips executable content from embedded HTML blocks", () => {
    const html = renderMarkdownToHtml(
      '<div onclick="evil()"><a href="javascript:alert(1)">x</a><script>alert(2)</script></div>'
    );

    expect(html).toContain("<div><a>x</a>");
    expect(html).not.toContain("onclick");
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("alert");
  });

  it("keeps HTML-looking lines inside code fences escaped", () => {
    const html = renderMarkdownToHtml('```text\n<div>not html</div>\n```');

    expect(html).toContain("&lt;div&gt;not html&lt;/div&gt;");
    expect(html).not.toContain("<div>");
  });
});
describe("selectPublishedPosts", () => {
  const today = new Date("2026-06-21T12:00:00.000Z");

  it("excludes future dates and sorts published posts newest first", () => {
    const result = selectPublishedPosts(
      [post("older", "2025-01-01"), post("future", "2199-01-01"), post("latest", "2026-06-20")],
      today
    );

    expect(result.map(({ slug }) => slug)).toEqual(["latest", "older"]);
  });

  it("keeps undated and invalid-date records after dated records", () => {
    const result = selectPublishedPosts(
      [post("undated"), post("invalid", "draft"), post("dated", "2024-08-01")],
      today
    );

    expect(result.map(({ slug }) => slug)).toEqual(["dated", "undated", "invalid"]);
  });

  it("does not mutate the source array", () => {
    const source = [post("older", "2024-01-01"), post("newer", "2025-01-01")];

    selectPublishedPosts(source, today);

    expect(source.map(({ slug }) => slug)).toEqual(["older", "newer"]);
  });
});
