import { describe, expect, it } from "vitest";
import {
  applyTextTranslations,
  buildHtmlTextPrompt,
  buildTagsPrompt,
  buildTitlePrompt,
  buildTranslatePrompt,
  chunkMarkdownBody,
  createSourceHash as createScriptSourceHash,
  extractHtmlBlocks,
  extractTextNodes,
  hasInlineMarks,
  hasInlineStructure,
  listFenceMarkers,
  parseFrontmatter,
  restoreHtmlBlocks,
  splitFenceBlock,
  splitTranslatedTags,
  summariseInlineMarks,
  summariseInlineStructure,
  toCachePath,
  validateActuallyTranslated,
  validateFencesPreserved,
  validateHtmlText,
  validateInlineMarksPreserved,
  validateInlineStructurePreserved,
  validateNoLeftoverPlaceholders,
  validateTextHygiene,
  validateTranslatedField,
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

  it("extracts fenced html blocks but leaves other fences verbatim", () => {
    const source = [
      "Para",
      "",
      "```html",
      '<figure class="x">',
      "  <text>云平台</text>",
      "</figure>",
      "```",
      "",
      "```text",
      "<div>sample</div>",
      "```",
      "",
      "Tail",
    ].join("\n");

    const { body, blocks } = extractHtmlBlocks(source);

    expect(blocks).toHaveLength(1);
    expect(blocks[0].html).toContain("云平台");
    expect(blocks[0].prefix).toBe("```html\n");
    expect(body).toContain("[[html-block-1]]");
    expect(body).toContain("```text");
    expect(body).not.toContain("云平台");

    const restored = restoreHtmlBlocks(
      "段落\n\n[[html-block-1]]\n\n```text\n<div>sample</div>\n```\n\n结尾",
      blocks,
      { "1.1": "Cloud platforms" }
    );
    expect(restored).toContain("```html");
    expect(restored).toContain("<text>Cloud platforms</text>");
    expect(restored).toContain("```text");
    expect(restored).not.toContain("[[html-block-1]]");

    // The closing marker keeps its own line: without the wrapper newline the
    // fence would glue onto the last markup line and the block would swallow
    // the rest of the page.
    expect(restored).toContain("</figure>\n```");
    expect(restored.split("\n").filter((line) => /^[ \t]*```/.test(line))).toHaveLength(4);
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

describe("Hy-MT2 prompt builders", () => {
  it("uses the Chinese instruction wording with a full language name for zh sources", () => {
    const prompt = buildTranslatePrompt({
      sourceText: "你好世界",
      sourceLanguage: "zh",
      targetLanguage: "en",
    });
    expect(prompt).toContain("将以下文本翻译为 `英语`");
    expect(prompt).toContain("只需要输出翻译后的结果");
    expect(prompt).toContain("你好世界");
    expect(prompt).not.toContain("html-block");
  });

  it("appends the annotation-mark clause only when preserveMarks is set", () => {
    const plain = buildTranslatePrompt({
      sourceText: "标题",
      sourceLanguage: "zh",
      targetLanguage: "en",
    });
    const guarded = buildTranslatePrompt({
      sourceText: "正文 [[html-block-1]]",
      sourceLanguage: "zh",
      targetLanguage: "en",
      preserveMarks: true,
    });
    expect(plain).not.toContain("行内标记");
    expect(guarded).toContain("行内标记");
    expect(guarded).toContain("[[html-block-N]]");
    expect(guarded).toContain("颜色名不翻译");
  });

  it("uses the English instruction wording for en sources", () => {
    const prompt = buildTranslatePrompt({
      sourceText: "Hello world",
      sourceLanguage: "en",
      targetLanguage: "zh",
      preserveMarks: true,
    });
    expect(prompt).toContain("Translate the following text into `Chinese`");
    expect(prompt).toContain("only output the translated result");
    expect(prompt).toContain("margin notes");
  });

  it("asks for the formatting clause only where formatting exists", () => {
    expect(hasInlineStructure("普通正文，没有任何格式。")).toBe(false);
    expect(hasInlineStructure("承担**更长的建设周期**的投入。")).toBe(true);
    expect(hasInlineStructure("详见 [报告](https://example.com/a)。")).toBe(true);
    expect(hasInlineStructure("```text\n** 代码块里的星号\n```")).toBe(false);
  });

  it("says the marked text is translated like any other prose", () => {
    const prompt = buildTranslatePrompt({
      sourceText: "承担**更长的建设周期**的投入。",
      sourceLanguage: "zh",
      targetLanguage: "en",
      preserveStructure: true,
    });

    expect(prompt).toContain("标记里的文字和普通正文一样正常翻译");
  });

  it("keeps literal mark syntax out of the formatting clause", () => {
    const prompt = buildTranslatePrompt({
      sourceText: "承担**更长的建设周期**的投入。",
      sourceLanguage: "zh",
      targetLanguage: "en",
      preserveStructure: true,
    });
    const clause = prompt.slice(prompt.indexOf("，并且"), prompt.indexOf("：\n\n"));

    expect(clause).toContain("加粗");
    // Hy-MT2 echoes literal mark examples into the body, so the clause must
    // never quote the syntax it is describing.
    expect(clause).not.toMatch(/[*=^`]/);
  });

  it("combines the annotation and formatting clauses when both apply", () => {
    const prompt = buildTranslatePrompt({
      sourceText: "承担**更长的建设周期**，==red|风险== 见 ^[批注]。",
      sourceLanguage: "zh",
      targetLanguage: "en",
      preserveMarks: true,
      preserveStructure: true,
    });

    expect(prompt).toContain("行内标记");
    expect(prompt).toContain("加粗");
  });

  it("names a headline style for titles instead of translating them literally", () => {
    const prompt = buildTitlePrompt({
      sourceText: "Agent 时代的推理算力",
      sourceLanguage: "zh",
      targetLanguage: "en",
    });
    expect(prompt).toContain("风格");
    expect(prompt).toContain("技术博客标题");
    expect(prompt).toContain("Agent 时代的推理算力");
  });

  it("joins tags with the @@ delimiter under the delimiter-preserving template", () => {
    const prompt = buildTagsPrompt({
      tags: ["人工智能", "芯片"],
      sourceLanguage: "zh",
      targetLanguage: "en",
    });
    expect(prompt).toContain("人工智能 @@ 芯片");
    expect(prompt).toContain("分隔符");
  });

  it("builds a structured-data prompt that pins htmlText keys", () => {
    const prompt = buildHtmlTextPrompt({
      htmlText: { "1.1": "用户请求", "1.2": "有效 Token" },
      sourceLanguage: "zh",
      targetLanguage: "en",
    });
    expect(prompt).toContain("JSON");
    expect(prompt).toContain('"1.1": "用户请求"');
    expect(prompt).toContain("严禁");
  });
});

describe("body chunking for the Hy-MT2 context window", () => {
  it("rejoins chunked content exactly and carries code fences separately", () => {
    const body = "开头段落。\n\n```python\n# 注释\nprint('hi')\n```\n\n结尾段落。";
    const chunks = chunkMarkdownBody(body);

    expect(chunks.map((chunk) => chunk.content).join("\n")).toBe(body);

    // A fence holding CJK is reader-facing text (comments, formulas) and is
    // translated under the fenced-prompt rules; a CJK-free fence is untouched.
    const cjkFence = chunks.find((chunk) => chunk.content.includes("print('hi')"));
    expect(cjkFence.kind).toBe("fenced");

    const pureCode = "```python\nprint('hi')\n```";
    expect(chunkMarkdownBody(pureCode)[0].kind).toBe("verbatim");
  });

  it("keeps fence markers out of the prompt for a fenced formula", () => {
    const chunks = chunkMarkdownBody("```text\n每百万 Token 成本 = 成本 ÷ 产出\n```");
    const chunk = chunks[0];

    expect(chunk.kind).toBe("fenced");
    expect(chunk.prefix).toBe("```text\n");
    expect(chunk.suffix).toBe("\n```");
    expect(chunk.inner).toContain("每百万 Token 成本");
    expect(chunk.inner).not.toContain("```");
    expect(`${chunk.prefix}${chunk.inner}${chunk.suffix}`).toBe(chunk.content);
  });

  it("flags only prose that actually carries annotation marks", () => {
    expect(hasInlineMarks("普通正文，没有标记。")).toBe(false);
    expect(hasInlineMarks("一处 ==red|风险==")).toBe(true);
    expect(hasInlineMarks("正文\n\n^[一条批注]")).toBe(true);
  });

  it("packs small segments together but never crosses the character budget", () => {
    const segments = ["a".repeat(100), "b".repeat(100), "c".repeat(100)];
    const body = segments.join("\n\n");
    const chunks = chunkMarkdownBody(body, 250);

    expect(chunks).toHaveLength(2);
    expect(chunks.every((chunk) => chunk.content.length <= 250)).toBe(true);
    expect(chunks.map((chunk) => chunk.content).join("\n")).toBe(body);
  });

  it("splits a single oversized segment on paragraph boundaries, byte-exact", () => {
    const paragraphs = Array.from({ length: 6 }, (_v, index) => `第${index}段 ` + "字".repeat(120));
    const body = paragraphs.join("\n\n");
    const chunks = chunkMarkdownBody(body, 300);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.content.length <= 300)).toBe(true);
    expect(chunks.map((chunk) => chunk.content).join("\n")).toBe(body);
  });
});

describe("delimiter-mode tag splitting", () => {
  it("splits translated tags back into one entry per source tag", () => {
    expect(splitTranslatedTags("AI @@ Chips @@ Strategy", 3)).toEqual(["AI", "Chips", "Strategy"]);
  });

  it("throws when the separator count drifted", () => {
    expect(() => splitTranslatedTags("AI Chips Strategy", 3)).toThrow(/@@ separator/);
  });
});

describe("inline annotation marks across translation", () => {
  it("counts delimiters, notes and colour names", () => {
    expect(summariseInlineMarks("一处 ==red|风险== 与一处 ==blue|机会==\n\n^[一条批注]")).toEqual({
      delimiters: 4,
      notes: 1,
      colors: ["blue", "red"],
    });
  });

  it("ignores marks quoted as code", () => {
    expect(summariseInlineMarks("行内 `==不是标记==` 和\n\n```text\n==也不算==\n```\n\n真标记 ==red|风险==")).toEqual({
      delimiters: 2,
      notes: 0,
      colors: ["red"],
    });
  });

  it("accepts a translation that keeps every mark", () => {
    const source = "我担心 ==red|供给领先真实使用量== 。\n\n^[利润不会平均留在所有环节。]";
    const translated =
      "I worry that ==red|supply is running ahead of real usage==。\n\n^[Profit does not stay evenly across every stage.]";

    expect(() => validateInlineMarksPreserved(source, translated)).not.toThrow();
  });

  it("accepts reordered clauses as long as every mark survives", () => {
    const source = "A ==red|一== B ==blue|二==";
    const translated = "==blue|Two== comes before ==red|One== in English word order";

    expect(() => validateInlineMarksPreserved(source, translated)).not.toThrow();
  });

  it("rejects a dropped mark", () => {
    expect(() =>
      validateInlineMarksPreserved("一处 ==red|风险== 和 ==blue|机会==", "One ==red|risk== only")
    ).toThrow(/行内标记与原文不一致/);
  });

  it("rejects a dropped margin note", () => {
    expect(() => validateInlineMarksPreserved("正文。\n\n^[批注]", "Body only.")).toThrow(
      /页边批注数量/
    );
  });

  it("rejects a translated colour name", () => {
    expect(() =>
      validateInlineMarksPreserved("==red|风险==", "==红|risk==")
    ).toThrow(/颜色名集合/);
  });

  it("rejects a duplicated mark", () => {
    expect(() => validateInlineMarksPreserved("==red|风险==", "==red|risk== and ==red|risk=="))
      .toThrow(/行内标记与原文不一致/);
  });

  it("tolerates a body with no marks at all", () => {
    expect(() => validateInlineMarksPreserved("纯文字正文。", "Plain prose only.")).not.toThrow();
  });
});

describe("unguarded translation failures", () => {
  it("rejects a body whose fenced blocks no longer balance", () => {
    const source = "Intro\n\n```text\n公式\n```\n\nOutro";
    expect(() => validateFencesPreserved(source, "Intro\n\n``text\nformula\n```\n\nOutro")).toThrow(
      /代码围栏数量/
    );
    expect(() =>
      validateFencesPreserved(source, "Intro\n\n```text\nformula\n```\n\nOutro")
    ).not.toThrow();
  });

  it("rejects a body that still contains an HTML placeholder", () => {
    expect(() => validateNoLeftoverPlaceholders("text\n\n[[html-block-1]]\n\nmore")).toThrow(
      /残留未还原的占位符/
    );
  });

  it("accepts a body whose placeholders were restored", () => {
    expect(() => validateNoLeftoverPlaceholders("text\n\n<figure>ok</figure>\n\nmore")).not.toThrow();
  });

  it("rejects an English target that came back in Chinese", () => {
    expect(() =>
      validateActuallyTranslated("Agent 的工作方式正在把竞争推向整套系统，这是中文正文。", "en")
    ).toThrow(/判定为未翻译/);
  });

  it("accepts a real English target", () => {
    expect(() =>
      validateActuallyTranslated("Agents are pushing chip competition toward whole systems.", "en")
    ).not.toThrow();
  });

  it("ignores code fences when measuring, since code legitimately stays put", () => {
    const body = "English prose.\n\n```text\n每百万有效 Token 成本 = 成本 ÷ 产出\n```\n\nMore English prose.";
    expect(() => validateActuallyTranslated(body, "en")).not.toThrow();
  });

  it("rejects a Chinese target that came back in English", () => {
    expect(() => validateActuallyTranslated("Plain English body only.", "zh")).toThrow(
      /判定为未翻译/
    );
  });

  it("accepts a real Chinese target", () => {
    expect(() => validateActuallyTranslated("这是一段中文译文，应该通过校验。", "zh")).not.toThrow();
  });

  it("rejects an empty body", () => {
    expect(() => validateActuallyTranslated("   \n  ", "en")).toThrow(/正文为空/);
  });
});

describe("fence markers are compared, not just counted", () => {
  it("accepts a body whose fence markers came back byte-identical", () => {
    const source = "Intro\n\n```text\n公式\n```\n\nOutro";
    expect(() =>
      validateFencesPreserved(source, "Intro\n\n```text\nformula\n```\n\nOutro")
    ).not.toThrow();
  });

  it("rejects a marker that came back as a longer backtick run", () => {
    const source = "Intro\n\n```text\n公式\n```\n\nOutro";
    expect(() =>
      validateFencesPreserved(source, "Intro\n\n````text\nformula\n````\n\nOutro")
    ).toThrow(/第 1 个代码围栏的标记被改动/);
  });

  it("rejects an info string the model rewrote", () => {
    const source = "Intro\n\n```text\n公式\n```\n\nOutro";
    expect(() =>
      validateFencesPreserved(source, "Intro\n\n```txt\nformula\n```\n\nOutro")
    ).toThrow(/标记被改动/);
  });

  it("rejects a tilde fence the model added to prose", () => {
    const source = "Intro\n\n```text\n公式\n```\n\nOutro";
    const translated = "Intro\n\n~~~\nstray\n~~~\n\n```text\nformula\n```\n\nOutro";
    expect(() => validateFencesPreserved(source, translated)).toThrow(/代码围栏数量/);
  });

  it("rejects a fence added to a body that had none", () => {
    expect(() => validateFencesPreserved("只有正文。", "只有正文。\n\n```\n")).toThrow(/代码围栏数量/);
  });

  it("does not count a fence-looking line inside a tilde block", () => {
    expect(listFenceMarkers("~~~\n```\n~~~")).toEqual(["~~~", "~~~"]);
  });

  it("refuses to split a fence that never closes", () => {
    expect(splitFenceBlock("```text\n没有收尾")).toBeNull();
  });

  it("keeps an indented html fence indented through extract and restore", () => {
    const source = "Intro\n\n  ```html\n  <figure>\n    <text>云</text>\n  </figure>\n  ```\n\nOutro";
    const { body, blocks } = extractHtmlBlocks(source);

    expect(body).toBe("Intro\n\n[[html-block-1]]\n\nOutro");

    const restored = restoreHtmlBlocks(body, blocks, { "1.1": "Cloud" });

    expect(restored).toBe(source.replace("云", "Cloud"));
    expect(() => validateFencesPreserved(source, restored)).not.toThrow();
  });

  it("treats a tilde fence as a fence when chunking", () => {
    const chunk = chunkMarkdownBody("~~~text\n每百万 Token 成本\n~~~")[0];

    expect(chunk.kind).toBe("fenced");
    expect(chunk.prefix).toBe("~~~text\n");
    expect(chunk.suffix).toBe("\n~~~");
    expect(chunk.inner).toBe("每百万 Token 成本");
  });
});

describe("inline markup conservation", () => {
  it("rejects a bold span that lost its markers", () => {
    expect(() =>
      validateInlineStructurePreserved(
        "它们也承担**更长的建设周期**与更重的资本投入。",
        "They also involve longer construction periods and heavier capital investment."
      )
    ).toThrow(/粗体 \*\* 数量/);
  });

  it("accepts a translation that keeps every marker", () => {
    expect(() =>
      validateInlineStructurePreserved(
        "承担**更长的建设周期**，详见 [报告](https://example.com/a)。",
        "It carries **longer construction cycles**, see the [report](https://example.com/a)."
      )
    ).not.toThrow();
  });

  it("rejects a rewritten link target", () => {
    expect(() =>
      validateInlineStructurePreserved(
        "详见 [报告](https://example.com/a)。",
        "See the [report](https://example.com/b)."
      )
    ).toThrow(/链接地址/);
  });

  it("rejects a dropped inline code span", () => {
    expect(() =>
      validateInlineStructurePreserved("设置 `num_ctx` 参数。", "Set the num_ctx parameter.")
    ).toThrow(/行内代码/);
  });

  it("rejects a changed heading level", () => {
    expect(() => validateInlineStructurePreserved("## 标题\n\n正文。", "### Title\n\nBody.")).toThrow(
      /标题层级/
    );
  });

  it("rejects a list that was flattened into prose", () => {
    expect(() =>
      validateInlineStructurePreserved("- 第一项\n- 第二项", "The first item and the second item.")
    ).toThrow(/列表项数量/);
  });

  it("ignores marker characters that live inside a code fence", () => {
    expect(() =>
      validateInlineStructurePreserved(
        "正文。\n\n```text\n** 不是标记 **\n```",
        "Body.\n\n```text\n** not a marker **\n```"
      )
    ).not.toThrow();
  });

  it("counts an italic span but not a spaced asterisk pair", () => {
    expect(summariseInlineStructure("这是 *强调* 文字").italic).toBe(1);
    expect(summariseInlineStructure("成本 = 单价 * 数量 * 折扣").italic).toBe(0);
  });
});

describe("output hygiene", () => {
  const label = "译文正文";

  it("rejects a replacement character", () => {
    expect(() =>
      validateTextHygiene({ text: "Broken \uFFFD text", targetLanguage: "en", label })
    ).toThrow(/乱码或控制字符/);
  });

  it("rejects a control character", () => {
    expect(() =>
      validateTextHygiene({ text: "Broken \u0000 text", targetLanguage: "en", label })
    ).toThrow(/乱码或控制字符/);
  });

  it("rejects an HTML entity the source never had", () => {
    expect(() =>
      validateTextHygiene({ text: "a &amp; b", sourceText: "a & b", targetLanguage: "en", label })
    ).toThrow(/HTML 实体泄漏/);
  });

  it("keeps an HTML entity the author wrote", () => {
    expect(() =>
      validateTextHygiene({
        text: "a &amp; b",
        sourceText: "a &amp; b",
        targetLanguage: "en",
        label,
      })
    ).not.toThrow();
  });

  it("rejects Chinese sentence punctuation left in an English line", () => {
    expect(() =>
      validateTextHygiene({
        text: "Profit does not stay evenly。",
        targetLanguage: "en",
        label,
      })
    ).toThrow(/中文标点/);
  });

  it("allows the same punctuation when the target is Chinese", () => {
    expect(() =>
      validateTextHygiene({ text: "利润不会平均留在所有环节。", targetLanguage: "zh", label })
    ).not.toThrow();
  });

  it("rejects text the model repeated until it ran out of room", () => {
    expect(() =>
      validateTextHygiene({ text: "the same clause ".repeat(4), targetLanguage: "en", label })
    ).toThrow(/重复退化/);
  });

  it("rejects prompt wording leaking into the output", () => {
    expect(() =>
      validateTextHygiene({
        text: "只需要输出翻译后的结果",
        sourceText: "原文正文",
        targetLanguage: "zh",
        label,
      })
    ).toThrow(/提示词/);
  });

  it("keeps that wording when the source itself discusses it", () => {
    expect(() =>
      validateTextHygiene({
        text: "把它翻译为英文",
        sourceText: "把它翻译为英文",
        targetLanguage: "zh",
        label,
      })
    ).not.toThrow();
  });
});

describe("translated header fields", () => {
  it("rejects a title that came back with a newline", () => {
    expect(() =>
      validateTranslatedField({
        text: "Title\nSecond line",
        sourceText: "标题",
        targetLanguage: "en",
        label: "标题",
      })
    ).toThrow(/换行/);
  });

  it("rejects a title that is still in the source language", () => {
    expect(() =>
      validateTranslatedField({
        text: "Agent 时代的推理算力",
        sourceText: "Agent 时代的推理算力",
        targetLanguage: "en",
        label: "标题",
      })
    ).toThrow(/判定为未翻译/);
  });

  it("rejects a leftover placeholder in a field", () => {
    expect(() =>
      validateTranslatedField({
        text: "Title [[html-block-1]]",
        sourceText: "标题",
        targetLanguage: "en",
        label: "标题",
      })
    ).toThrow(/结构标记/);
  });

  it("accepts a translated title", () => {
    expect(() =>
      validateTranslatedField({
        text: "Computing Power for Reasoning in the Agent Era",
        sourceText: "Agent 时代的推理算力",
        targetLanguage: "en",
        label: "标题",
      })
    ).not.toThrow();
  });

  it("accepts an untranslated tag when translation is not required", () => {
    expect(() =>
      validateTranslatedField({
        text: "GPU",
        sourceText: "GPU",
        targetLanguage: "en",
        label: "标签 1",
        requireTranslated: false,
      })
    ).not.toThrow();
  });
});
