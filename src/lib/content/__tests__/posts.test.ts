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

describe("renderMarkdownToHtml inline syntax", () => {
  /** Ids are content-derived; strip them when asserting markup shape. */
  const stripIds = (html: string) => html.replace(/ data-(mark|note)="[^"]*"/g, "");

  it("renders standard inline markdown", () => {
    const html = renderMarkdownToHtml(
      "普通 **加粗** 和 *斜体* 和 `代码` 和 [链接](https://e.com) 结尾"
    );

    expect(html).toBe(
      '<p>普通 <strong>加粗</strong> 和 <em>斜体</em> 和 <code>代码</code> 和 ' +
        '<a href="https://e.com" rel="noreferrer" target="_blank">链接</a> 结尾</p>'
    );
  });

  it("renders a bare ==mark== with the default color", () => {
    expect(stripIds(renderMarkdownToHtml("彩色 ==下划线== 结束"))).toBe(
      '<p>彩色 <span class="mk mk-blue">下划线</span> 结束</p>'
    );
  });

  it("renders an explicit mark color", () => {
    expect(stripIds(renderMarkdownToHtml("==red|红色下划线=="))).toBe(
      '<p><span class="mk mk-red">红色下划线</span></p>'
    );
  });

  it("allows a mark inside bold", () => {
    expect(stripIds(renderMarkdownToHtml("**带 ==red|下划线== 的加粗**"))).toBe(
      '<p><strong>带 <span class="mk mk-red">下划线</span> 的加粗</strong></p>'
    );
  });

  it("allows bold inside a mark", () => {
    expect(stripIds(renderMarkdownToHtml("==blue|带 **加粗** 的标记=="))).toBe(
      '<p><span class="mk mk-blue">带 <strong>加粗</strong> 的标记</span></p>'
    );
  });

  it("keeps == literal inside a code span", () => {
    expect(renderMarkdownToHtml("代码段保护 `==不是标记==` 结束")).toBe(
      '<p>代码段保护 <code>==不是标记==</code> 结束</p>'
    );
  });

  it("still escapes raw inline HTML written mid-sentence", () => {
    expect(renderMarkdownToHtml('前面 <span style="color:red">红字</span> 后面')).toBe(
      '<p>前面 &lt;span style=&quot;color:red&quot;&gt;红字&lt;/span&gt; 后面</p>'
    );
  });

  it("leaves text without inline syntax byte-for-byte unchanged", () => {
    expect(renderMarkdownToHtml("一段没有任何标记的中文正文，带逗号、句号和英文 AI 缩写。")).toBe(
      "<p>一段没有任何标记的中文正文，带逗号、句号和英文 AI 缩写。</p>"
    );
  });

  it("leaves underscores inside link destinations alone", () => {
    const html = renderMarkdownToHtml("[来源](https://e.com/a_b_c)\uff0c说明");

    expect(html).toContain('href="https://e.com/a_b_c"');
    expect(html).not.toContain("<em>");
  });

  it("fails loudly on an unclosed mark instead of printing the delimiters", () => {
    expect(() => renderMarkdownToHtml("这里 ==没有闭合")).toThrow(/没有闭合/);
  });

  it("fails loudly on an unknown mark color", () => {
    expect(() => renderMarkdownToHtml("==rede|拼错==")).toThrow(/不在允许列表内/);
  });

  it("applies inline syntax inside headings and list items", () => {
    const html = renderMarkdownToHtml("## 标题带 ==red|标记==\n\n- 列表 **加粗**\n- 列表二");

    expect(html).toMatch(/<h2>标题带 <span class="mk mk-red"[^>]*>标记<\/span><\/h2>/);
    expect(html).toContain("<ul><li>列表 <strong>加粗</strong></li><li>列表二</li></ul>");
  });

  it("gives every mark a stable content-derived id", () => {
    const html = renderMarkdownToHtml("==red|风险==");

    expect(html).toMatch(/data-mark="mk-[a-z0-9]+-1"/);
    expect(html).toBe(renderMarkdownToHtml("==red|风险=="));
  });

  it("numbers duplicate marks separately", () => {
    const ids = [...renderMarkdownToHtml("==red|风险== 和 ==red|风险==").matchAll(/data-mark="([^"]+)"/g)].map(
      (match) => match[1]
    );

    expect(ids).toHaveLength(2);
    expect(ids[0]).not.toBe(ids[1]);
  });

  it("keeps ids stable when text is inserted before a mark", () => {
    const idOf = (html: string) => html.match(/data-mark="([^"]+)"/)?.[1];

    expect(idOf(renderMarkdownToHtml("新增一段。\n\n==red|风险=="))).toBe(
      idOf(renderMarkdownToHtml("==red|风险=="))
    );
  });

  it("changes the id when the marked text itself changes", () => {
    const idOf = (html: string) => html.match(/data-mark="([^"]+)"/)?.[1];

    expect(idOf(renderMarkdownToHtml("==red|风险=="))).not.toBe(
      idOf(renderMarkdownToHtml("==red|机会=="))
    );
  });
});

describe("renderMarkdownToHtml margin notes", () => {
  const stripIds = (html: string) => html.replace(/ data-(mark|note)="[^"]*"/g, "");

  it("attaches a note to the paragraph above it", () => {
    expect(stripIds(renderMarkdownToHtml("一段正文。\n\n^[这是批注]"))).toBe(
      '<div class="note-pair"><p>一段正文。</p>' +
        '<aside class="side-note" role="note">这是批注</aside></div>'
    );
  });

  it("gives each note a stable id", () => {
    const html = renderMarkdownToHtml("正文。\n\n^[这是批注]");

    expect(html).toMatch(/data-note="note-[a-z0-9]+-1"/);
    expect(html).toBe(renderMarkdownToHtml("正文。\n\n^[这是批注]"));
  });

  it("keeps paragraphs without notes out of a note-pair", () => {
    const html = renderMarkdownToHtml("第一段。\n\n^[批注]\n\n第二段。");

    expect(html).toContain('<div class="note-pair"><p>第一段。</p>');
    expect(html.endsWith("<p>第二段。</p>")).toBe(true);
  });

  it("renders inline markdown inside note text", () => {
    expect(stripIds(renderMarkdownToHtml("正文。\n\n^[带 **加粗** 的批注]"))).toContain(
      '<aside class="side-note" role="note">带 <strong>加粗</strong> 的批注</aside>'
    );
  });

  it("joins multi-line note text into one paragraph", () => {
    expect(stripIds(renderMarkdownToHtml("正文。\n\n^[第一行\n第二行]"))).toContain(
      '<aside class="side-note" role="note">第一行 第二行</aside>'
    );
  });

  it("rejects a note that has no paragraph above it", () => {
    expect(() => renderMarkdownToHtml("^[孤立的批注]")).toThrow(/必须紧跟在/);
  });

  it("rejects a note attached to a heading", () => {
    expect(() => renderMarkdownToHtml("## 标题\n\n^[批注]")).toThrow(/必须紧跟在/);
  });

  it("rejects a note with a missing closing bracket", () => {
    expect(() => renderMarkdownToHtml("正文。\n\n^[没有收尾")).toThrow(/缺少收尾/);
  });

  it("rejects the unsupported anchor-phrase form instead of mis-parsing it", () => {
    expect(() => renderMarkdownToHtml("正文。\n\n^[#原话|批注]")).toThrow(/暂不支持锚点短语/);
  });

  it("rejects an empty note", () => {
    expect(() => renderMarkdownToHtml("正文。\n\n^[]")).toThrow(/批注内容为空/);
  });

  it("fails on a malformed mark inside a note", () => {
    expect(() => renderMarkdownToHtml("正文。\n\n^[带 ==未闭合的批注]")).toThrow(/没有闭合/);
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
