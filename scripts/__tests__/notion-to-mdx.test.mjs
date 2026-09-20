import { describe, expect, it } from "vitest";
import { renderMarkdownToHtml } from "../../src/lib/content/posts";
import {
  ConversionError,
  convertBodySection,
  convertInlineAnnotations,
  convertNotionFetch,
  extractBodySection,
  extractPageContent,
  parseDiscussions,
  parseMetadataCallout,
  renderFrontmatter,
  splitBlocks,
  stripDiscussionSpans,
} from "../notion-to-mdx.mjs";

/**
 * Mirrors the real `notion_fetch` payload shape: no blank lines between blocks,
 * one line per paragraph, tabs indenting callout children, and comments both
 * declared in <page-discussions> and anchored via a discussion-urls span.
 */
const FETCH = `<page url="https://app.notion.com/p/abc" icon="icons/book_gray">
<page-discussions discussion-count="3" url="pageDiscussions://abc">
<example-discussions>
<discussion id="discussion://abc/block1/d1" comment-count="1" resolved="false" type="comment" context="inline" text-context="段二">
<comment id="c1" url="https://x" user-url="user://u" datetime="2026-09-11T05:25:44.628Z">给自己的思考笔记</comment>
</discussion>
<discussion id="discussion://abc/block2/d2" comment-count="1" resolved="false" type="comment" context="inline" text-context="段三">
<comment id="c2" url="https://x" user-url="user://u" datetime="2026-09-11T05:26:00.000Z">[发布] 台积电在这里提供的是芯片加工能力</comment>
</discussion>
<discussion id="discussion://abc/block4/d3" comment-count="1" resolved="true" type="comment" context="inline" text-context="段五">
<comment id="c3" url="https://x" user-url="user://u" datetime="2026-09-11T05:27:00.000Z">[发布] 已解决，不该发布</comment>
</discussion>
</example-discussions>
</page-discussions>
<content>
<empty-block/>
# 撰写规范
这段属于写作规范，不是正文
---
# 正文
<callout icon="🔗" color="blue_bg">
	**同步元数据（编辑正文时请保留本块）**
	- 源文件：\`content/posts/2026-09-05-ai-chip-infrastructure-token-economics.mdx\`
	- 发布标题：Agent 时代的 AI 基建，钱会流向哪里
	- 日期：2026-09-05 ｜ 语言：zh（中文源稿，英文版由翻译脚本生成）
	- 标签：AI / Chips / Strategy
	- 摘要：Agent 正在把 AI 芯片竞争从单颗芯片推向整套系统。
</callout>
第一段正文，带 <span color="red">**红字加粗**</span> 与 <span underline="true">下划线</span>，还有 <span color="yellow_bg">底色高亮</span>。
<span discussion-urls="discussion://abc/block1/d1">第二段正文，评论只是给自己的笔记。</span>
<span discussion-urls="discussion://abc/block2/d2">第三段正文，评论标了发布前缀。</span>
## 一个小节
- 列表项一
- 列表项二
\`\`\`plain text
每百万有效 Token 成本 = 每小时成本 ÷ 每小时产出 × 1,000,000
\`\`\`
<figure class="demo">
  <svg viewBox="0 0 10 10"><text>Flow</text></svg>
</figure>
<span discussion-urls="discussion://abc/block4/d3">第四段正文，评论已解决。</span>
1. 有序项一
2. 有序项二
</content>
</page>`;

describe("fetch payload parsing", () => {
  it("extracts the content block", () => {
    expect(extractPageContent(FETCH)).toContain("# 正文");
  });

  it("fails loudly when there is no content block", () => {
    expect(() => extractPageContent("<page></page>")).toThrow(ConversionError);
  });

  it("reads discussion state and comment bodies", () => {
    const discussions = parseDiscussions(FETCH);

    expect(discussions.size).toBe(3);
    expect(discussions.get("discussion://abc/block1/d1")).toMatchObject({
      resolved: false,
      context: "inline",
      comments: ["给自己的思考笔记"],
    });
    expect(discussions.get("discussion://abc/block4/d3").resolved).toBe(true);
  });

  it("takes only the 正文 section", () => {
    const section = extractBodySection(extractPageContent(FETCH));

    expect(section).toContain("第一段正文");
    expect(section).not.toContain("写作规范");
  });

  it("stops at the next top-level heading but keeps nested article headings", () => {
    const section = extractBodySection(
      "# 正文\n文章开头\n## 保留的二级标题\n### 保留的三级标题\n# 调研结果（可供阅读）\n内部附件\n# 思路整理\n内部笔记"
    );

    expect(section).toContain("文章开头");
    expect(section).toContain("## 保留的二级标题");
    expect(section).toContain("### 保留的三级标题");
    expect(section).not.toContain("# 调研结果（可供阅读）");
    expect(section).not.toContain("内部附件");
    expect(section).not.toContain("# 思路整理");
  });

  it("does not stop at a heading example inside a fenced code block", () => {
    const section = extractBodySection(
      "# 正文\n````markdown\n```text\n# 示例标题\n```\n````\n代码块后的正文\n# 调研结果（可供阅读）\n内部附件"
    );

    expect(section).toContain("# 示例标题");
    expect(section).toContain("代码块后的正文");
    expect(section).not.toContain("# 调研结果（可供阅读）");
    expect(section).not.toContain("内部附件");
  });

  it("fails loudly when 正文 is missing", () => {
    expect(() => extractBodySection("<content># 思路整理\n一些内容</content>")).toThrow(
      /找不到 "# 正文"/
    );
  });
});

describe("metadata callout", () => {
  it("maps the callout onto frontmatter fields", () => {
    const section = extractBodySection(extractPageContent(FETCH));
    const metadata = parseMetadataCallout(section);

    expect(metadata.sourcePath).toBe(
      "content/posts/2026-09-05-ai-chip-infrastructure-token-economics.mdx"
    );
    expect(metadata.frontmatter).toEqual({
      title: "Agent 时代的 AI 基建，钱会流向哪里",
      date: "2026-09-05",
      language: "zh",
      excerpt: "Agent 正在把 AI 芯片竞争从单颗芯片推向整套系统。",
      tags: ["AI", "Chips", "Strategy"],
    });
  });

  it("fails loudly when the callout is absent", () => {
    expect(() => parseMetadataCallout("没有 callout 的正文")).toThrow(/找不到「同步元数据」/);
  });

  it("fails loudly when a required field is missing", () => {
    expect(() =>
      parseMetadataCallout('<callout>\n\t- 发布标题：标题\n\t- 日期：2026-09-05\n</callout>')
    ).toThrow(/缺少「源文件」/);
  });
});

describe("discussion spans", () => {
  it("unwraps the anchor and remembers the discussion", () => {
    const { text, discussionIds } = stripDiscussionSpans(
      '<span discussion-urls="discussion://a/1">正文</span>'
    );

    expect(text).toBe("正文");
    expect(discussionIds).toEqual(["discussion://a/1"]);
  });

  it("supports the self-closing form", () => {
    const { text, discussionIds } = stripDiscussionSpans('前<span discussion-urls="discussion://a/2"/>后');

    expect(text).toBe("前后");
    expect(discussionIds).toEqual(["discussion://a/2"]);
  });

  it("collects several discussions anchored to one block", () => {
    const { discussionIds } = stripDiscussionSpans(
      '<span discussion-urls="discussion://a/1 discussion://a/2">正文</span>'
    );

    expect(discussionIds).toEqual(["discussion://a/1", "discussion://a/2"]);
  });
});

describe("inline annotation mapping", () => {
  it("maps text colour, background colour and underline onto the same mark", () => {
    expect(convertInlineAnnotations('<span color="red">风险</span>')).toBe("==red|风险==");
    expect(convertInlineAnnotations('<span color="red_bg">风险</span>')).toBe("==red|风险==");
    expect(convertInlineAnnotations('<span underline="true">重点</span>')).toBe("==blue|重点==");
  });

  it("keeps markdown emphasis inside the marked run", () => {
    expect(convertInlineAnnotations('<span color="red">***瓶颈***</span>')).toBe("==red|***瓶颈***==");
  });

  it("warns instead of silently dropping an unknown colour", () => {
    const warnings = [];
    const result = convertInlineAnnotations('<span color="chartreuse">文字</span>', (m) => warnings.push(m));

    expect(result).toBe("文字");
    expect(warnings[0]).toMatch(/未知的 Notion 颜色/);
  });

  it("collapses mentions to their visible label", () => {
    expect(convertInlineAnnotations('<mention-page url="https://x">某页面</mention-page>')).toBe("某页面");
    expect(convertInlineAnnotations('<mention-date start="2026-01-01"/>')).toBe("");
  });

  it("merges adjacent annotations with the same mapped colour", () => {
    expect(
      convertInlineAnnotations('<span underline="true">前半</span><span underline="true">**后半**</span>')
    ).toBe("==blue|前半**后半**==");
  });
});

describe("block splitting", () => {
  it("treats each plain line as its own paragraph", () => {
    const blocks = splitBlocks("第一段\n第二段\n第三段");

    expect(blocks.map((block) => block.type)).toEqual(["paragraph", "paragraph", "paragraph"]);
  });

  it("groups consecutive bullet lines into one list", () => {
    const blocks = splitBlocks("- 一\n- 二\n\n正文");

    expect(blocks[0]).toMatchObject({ type: "ul", items: ["一", "二"] });
    expect(blocks[1]).toMatchObject({ type: "paragraph" });
  });

  it("keeps a tab-indented paragraph after an ordered list as normal prose", () => {
    const { chunks } = convertBodySection(
      "1. 第三项\n\t这是第三项后的续段，必须保留为普通段落。\n下一段"
    );

    expect(chunks).toEqual([
      "1. 第三项",
      "这是第三项后的续段，必须保留为普通段落。",
      "下一段",
    ]);
    expect(chunks[1]).not.toMatch(/^\t/);
  });

  it("keeps a code fence as a single block", () => {
    const blocks = splitBlocks("```plain text\n第一行\n\n第三行\n```\n后文");

    expect(blocks[0].type).toBe("code");
    expect(blocks[0].lines).toHaveLength(5);
    expect(blocks[1]).toMatchObject({ type: "paragraph" });
  });

  it("keeps an embedded HTML figure as a single block", () => {
    const blocks = splitBlocks('<figure class="demo">\n  <svg><text>Flow</text></svg>\n</figure>\n后文');

    expect(blocks[0]).toMatchObject({ type: "html" });
    expect(blocks[0].lines).toHaveLength(3);
    expect(blocks[1].text ?? blocks[1].lines[0]).toBe("后文");
  });

  it("does not mistake an inline span paragraph for an HTML block", () => {
    const blocks = splitBlocks('<span color="red">**金字塔**</span>的结构，结论先行');

    expect(blocks[0]).toMatchObject({ type: "paragraph" });
  });

  it("drops empty-block placeholders", () => {
    expect(splitBlocks("<empty-block/>\n正文\n<empty-block/>")).toHaveLength(1);
  });
});

describe("comment publication policy", () => {
  const section = extractBodySection(extractPageContent(FETCH));
  const discussions = parseDiscussions(FETCH);

  it("publishes every unresolved comment by default, with no marker needed", () => {
    const { chunks, report } = convertBodySection(section, { discussions });

    expect(report.notesPublished).toEqual([
      "给自己的思考笔记",
      "台积电在这里提供的是芯片加工能力",
    ]);
    expect(chunks).toContain("^[给自己的思考笔记]");
    expect(chunks).toContain("^[台积电在这里提供的是芯片加工能力]");
    expect(report.notesSkipped).toEqual([]);
  });

  it("strips a [发布] prefix if one is present", () => {
    const { report } = convertBodySection(section, { discussions });

    expect(report.notesPublished).not.toContain("[发布] 台积电在这里提供的是芯片加工能力");
  });

  it("keeps mark-only available as an opt-in", () => {
    const { report } = convertBodySection(section, { discussions, comments: "mark-only" });

    expect(report.notesPublished).toEqual(["台积电在这里提供的是芯片加工能力"]);
    expect(report.notesSkipped.map((note) => note.text)).toEqual(["给自己的思考笔记"]);
  });

  it("publishes nothing in none mode", () => {
    const { chunks, report } = convertBodySection(section, { discussions, comments: "none" });

    expect(report.notesPublished).toEqual([]);
    expect(chunks.some((chunk) => chunk.startsWith("^["))).toBe(false);
  });

  it("never publishes a resolved discussion, which is the way to keep one out", () => {
    const { report } = convertBodySection(section, { discussions });

    expect(report.notesPublished).not.toContain("已解决，不该发布");
  });

  it("places a note on the chunk directly after its paragraph", () => {
    const { chunks } = convertBodySection(section, { discussions, comments: "mark-only" });
    const noteIndex = chunks.findIndex((chunk) => chunk.startsWith("^["));

    expect(chunks[noteIndex]).toBe("^[台积电在这里提供的是芯片加工能力]");
    expect(chunks[noteIndex - 1]).toContain("第三段正文");
  });
});

describe("conversion output shape", () => {
  it("keeps lists and code fences as single blocks when joined", () => {
    const result = convertNotionFetch(FETCH);

    expect(result.body).toContain("- 列表项一\n- 列表项二");
    expect(result.body).toContain("```text\n每百万有效 Token 成本");
    expect(result.body).not.toMatch(/-\s列表项一\n\n-\s列表项二/);
  });

  it("passes embedded HTML through verbatim", () => {
    const result = convertNotionFetch(FETCH);

    expect(result.body).toContain('<figure class="demo">');
    expect(result.body).toContain("<svg viewBox=\"0 0 10 10\">");
  });

  it("converts colour annotations into the site mark syntax", () => {
    const result = convertNotionFetch(FETCH);

    expect(result.body).toContain("==red|**红字加粗**==");
    expect(result.body).toContain("==blue|下划线==");
    expect(result.body).toContain("==yellow|底色高亮==");
  });

  it("consumes the sync-metadata callout instead of publishing its internal fields", () => {
    const { mdx } = convertNotionFetch(FETCH);

    expect(mdx).not.toMatch(/同步元数据|源文件：|发布标题：|日期：|标签：|摘要：/);
    expect(mdx).toContain("第一段正文");
  });

  it("produces frontmatter with title, date, language, excerpt and tags", () => {
    const result = convertNotionFetch(FETCH);

    expect(result.mdx.startsWith("---\n")).toBe(true);
    expect(result.mdx).toContain('title: "Agent 时代的 AI 基建，钱会流向哪里"');
    expect(result.mdx).toContain('date: "2026-09-05"');
    expect(result.mdx).toContain("language: zh");
    expect(result.mdx).toContain("tags:\n  - AI\n  - Chips\n  - Strategy");
  });

  it("preserves a legacy permalink from the existing post", () => {
    const existing = '---\ntitle: "旧"\npermalink: /posts/2026/09/demo/\n---\n\n旧正文\n';
    const result = convertNotionFetch(FETCH, { existingSource: existing });

    expect(result.mdx).toContain("permalink: \"/posts/2026/09/demo/\"");
  });

  it("excludes the 撰写规范 section", () => {
    expect(convertNotionFetch(FETCH).body).not.toContain("不属于正文");
  });
});

describe("html fences", () => {
  const markup = '```html\n<figure class="demo">\n  <svg viewBox="0 0 10 10"><text>Flow</text></svg>\n</figure>\n```';

  it("unwraps a ```html fence whose body is markup", () => {
    const { chunks, report } = convertBodySection(`${markup}\n后文`);

    expect(chunks[0]).toBe(
      '<figure class="demo">\n  <svg viewBox="0 0 10 10"><text>Flow</text></svg>\n</figure>'
    );
    expect(chunks[0]).not.toContain("```");
    expect(chunks[1]).toBe("后文");
    expect(report.htmlFencesUnwrapped).toBe(1);
  });

  it("unwrapped markup renders as live HTML instead of escaped source text", () => {
    const { chunks } = convertBodySection(markup);
    const html = renderMarkdownToHtml(chunks.join("\n\n"));

    expect(html).toContain('<svg viewBox="0 0 10 10">');
    expect(html).not.toContain("<pre><code>");
    expect(html).not.toContain("&lt;figure");
  });

  it("keeps a fenced diagram as escaped code when the fence is not html", () => {
    const { chunks, report } = convertBodySection(markup.replace("```html", "```markdown"));
    const html = renderMarkdownToHtml(chunks.join("\n\n"));

    expect(chunks[0]).toContain("```markdown");
    expect(report.htmlFencesUnwrapped).toBe(0);
    expect(html).toContain("<pre><code>");
  });

  it("keeps a ```html fence whose body is prose rather than markup", () => {
    const { chunks, report } = convertBodySection("```html\n把 <b> 写在同一行\n```");

    expect(chunks[0]).toBe("```html\n把 <b> 写在同一行\n```");
    expect(report.htmlFencesUnwrapped).toBe(0);
  });

  it("keeps fences in other languages verbatim", () => {
    const { chunks, report } = convertBodySection("```js\nconst a = 1;\n```");

    expect(chunks[0]).toBe("```js\nconst a = 1;\n```");
    expect(report.htmlFencesUnwrapped).toBe(0);
  });

  it("does not count fences that were never present", () => {
    const { report } = convertNotionFetch(FETCH);

    expect(report.htmlFencesUnwrapped).toBe(0);
  });
});

describe("renderer compatibility", () => {
  it("renders the converted body, note and marks included", () => {
    const html = renderMarkdownToHtml(convertNotionFetch(FETCH).body);

    expect(html).toContain('<h2>一个小节</h2>');
    expect(html).toMatch(/<span class="mk mk-red" data-mark="mk-[a-z0-9]+-\d+">/);
    expect(html).toContain('<ol><li>有序项一</li><li>有序项二</li></ol>');
    expect(html).toMatch(
      /<aside class="side-note" role="note" data-note="note-[a-z0-9]+-\d+">台积电在这里提供的是芯片加工能力<\/aside>/
    );
    expect(html).toContain("<svg viewBox=\"0 0 10 10\">");
    expect(html).toContain("<pre><code>");
  });

  it("produces a note-pair attached to the right paragraph", () => {
    const html = renderMarkdownToHtml(convertNotionFetch(FETCH).body);

    expect(html).toMatch(
      /<div class="note-pair"><p>第三段正文[^<]*<\/p><aside class="side-note"/
    );
  });
});

describe("renderFrontmatter", () => {
  it("omits empty optional fields", () => {
    const yaml = renderFrontmatter({ title: "标题", date: "2026-09-05", language: "zh", excerpt: "", tags: [] });

    expect(yaml).toBe('---\ntitle: "标题"\ndate: "2026-09-05"\nlanguage: zh\n---');
  });

  it("escapes quotes in values", () => {
    expect(renderFrontmatter({ title: '带 "引号" 的标题' })).toContain('title: "带 \\"引号\\" 的标题"');
  });
});
