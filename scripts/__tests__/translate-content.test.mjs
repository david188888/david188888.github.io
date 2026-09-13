import { describe, expect, it } from "vitest";
import {
  applyTextTranslations,
  assembleBody,
  assertResponseComplete,
  buildHtmlTextPrompt,
  buildTagsPrompt,
  buildTitlePrompt,
  buildTranslatePrompt,
  createSourceHash as createScriptSourceHash,
  decodeHtmlEntities,
  extractBodyUnits,
  extractHtmlBlocks,
  extractTextNodes,
  findModelDigest,
  hasInlineMarks,
  hasInlineStructure,
  listFenceMarkers,
  ollamaTagsUrl,
  orderUnitsByPlan,
  parseFrontmatter,
  parseCliOptions,
  planHtmlTextUnits,
  restoreHtmlBlocks,
  splitFenceBlock,
  splitOversizedBlock,
  splitProseBlocks,
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
import {
  createUnitKey,
  isTranslationCacheFresh,
  TRANSLATION_CACHE_VERSION,
  TRANSLATION_PIPELINE_VERSION,
} from "../../src/lib/content/translation-cache.mjs";
import {
  buildTerminologyBlock,
  createGlossaryHash,
  createTermsHash,
  selectGlossaryTerms,
  validateGlossaryTerms,
  TRANSLATION_GLOSSARY,
  TRANSLATION_GLOSSARY_VERSION,
} from "../../src/lib/content/translation-glossary.mjs";
import { renderMarkdownToHtml } from "../../src/lib/content/posts.ts";
import { splitMarkdownSegments } from "../../src/lib/content/markdown-segments.mjs";

describe("assertResponseComplete", () => {
  const payload = (finishReason) => ({ choices: [{ finish_reason: finishReason, message: { content: "text" } }] });

  it("rejects a response the model cut short", () => {
    expect(() => assertResponseComplete(payload("length"), "body unit 3/12")).toThrow(
      /hit the token limit for body unit 3\/12 \(finish_reason: "length"\)/
    );
  });

  it("accepts a response that stopped on its own", () => {
    expect(() => assertResponseComplete(payload("stop"), "body unit 1/12")).not.toThrow();
  });

  it("accepts a payload that omits finish_reason", () => {
    expect(() => assertResponseComplete({ choices: [{ message: { content: "text" } }] }, "label")).not.toThrow();
    expect(() => assertResponseComplete(undefined, "label")).not.toThrow();
  });
});

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

describe("translation glossary", () => {
  it("selects only the terms a unit's own text contains", () => {
    const both = selectGlossaryTerms("端侧芯片要等待长鑫之类的企业", "zh");
    expect(both.map((term) => term.source).sort()).toEqual(["端侧", "长鑫"].sort());
    expect(both.map((term) => term.target).sort()).toEqual(["CXMT", "on-device"].sort());

    const one = selectGlossaryTerms("端侧构成第二条需求曲线", "zh");
    expect(one).toHaveLength(1);
    expect(one[0]).toMatchObject({ source: "端侧", target: "on-device", enforce: true });

    expect(selectGlossaryTerms("普通段落，没有任何术语。", "zh")).toEqual([]);
  });

  it("resolves the longest alias inside one entry", () => {
    expect(selectGlossaryTerms("长鑫存储宣布扩产", "zh")[0].source).toBe("长鑫存储");
  });

  it("reads the table in the source direction", () => {
    const terms = selectGlossaryTerms("many companies like CXMT", "en");

    expect(terms).toHaveLength(1);
    expect(terms[0]).toMatchObject({ source: "CXMT", target: "长鑫存储", enforce: false });
  });

  it("keeps aliases unambiguous across entries", () => {
    for (const side of ["zh", "en"]) {
      const opposite = side === "zh" ? "en" : "zh";
      const keys = TRANSLATION_GLOSSARY.flatMap((entry) => entry[side].map((key) => ({ key, entry })));

      for (const outer of keys) {
        for (const inner of keys) {
          if (outer.entry === inner.entry || outer.key === inner.key) continue;
          if (!outer.key.includes(inner.key)) continue;

          // A narrower phrase may sit on top of a broader term only when its
          // target builds on the broader target. Otherwise one passage matches
          // two entries with unrelated instructions and the model has to guess.
          expect(
            outer.entry[opposite][0].includes(inner.entry[opposite][0]),
            `${outer.key} (${outer.entry[opposite][0]}) overlaps ${inner.key} (${inner.entry[opposite][0]})`
          ).toBe(true);
        }
      }
    }
  });

  it("hashes the table by content and not by layout", () => {
    const a = [{ zh: ["甲"], en: ["A"] }];

    expect(createGlossaryHash(a)).toBe(createGlossaryHash([{ zh: ["甲"], en: ["A"] }]));
    expect(createGlossaryHash(a)).not.toBe(createGlossaryHash([{ zh: ["甲"], en: ["B"] }]));
    expect(createGlossaryHash(a)).toMatch(/^[0-9a-f]{64}$/);
    expect(TRANSLATION_GLOSSARY_VERSION).toBe(createGlossaryHash(TRANSLATION_GLOSSARY).slice(0, 8));
  });

  it("hashes selected terms, including their rules", () => {
    const base = [{ source: "长鑫", target: "CXMT", enforce: true, forbid: ["GigaDevice"] }];

    expect(createTermsHash([])).toBe("");
    expect(createTermsHash(base)).toBe(createTermsHash([...base]));
    expect(createTermsHash(base)).not.toBe(createTermsHash([{ ...base[0], target: "ChangXin" }]));
    expect(createTermsHash(base)).not.toBe(createTermsHash([{ ...base[0], forbid: [] }]));
  });

  it("writes the terminology block in the official wording", () => {
    const terms = selectGlossaryTerms("端侧", "zh");

    expect(buildTerminologyBlock(terms, "zh")).toBe("参考下面的翻译：\n`端侧` 翻译成 `on-device`");
    expect(buildTerminologyBlock(terms, "en")).toBe(
      "Reference the following translations:\n`端侧` translates to `on-device`"
    );
    expect(buildTerminologyBlock([], "zh")).toBe("");
  });

  it("selects the phrase entry alongside the term it builds on", () => {
    const terms = selectGlossaryTerms("中间展示端侧设备形成的第二条需求曲线。", "zh");

    expect(terms.map((term) => term.source)).toEqual(["端侧设备", "端侧"]);
    expect(terms.map((term) => term.target)).toEqual(["on-device hardware", "on-device"]);
  });

  it("rejects a published translation of 长鑫 as another company", () => {
    const terms = selectGlossaryTerms("（例如出现很多长鑫之类的企业）", "zh");

    expect(() =>
      validateGlossaryTerms({
        translation: "(for example, with the emergence of many companies like GigaDevice)",
        terms,
        label: "body unit 21/48",
      })
    ).toThrow(/body unit 21\/48未通过术语检查.*GigaDevice/);

    expect(() =>
      validateGlossaryTerms({ translation: "companies like CXMT", terms, label: "body unit 21/48" })
    ).not.toThrow();
  });

  it("requires the canonical spelling when an entry enforces one", () => {
    const terms = selectGlossaryTerms("端侧是第二条曲线", "zh");

    expect(() => validateGlossaryTerms({ translation: "The edge side is the second curve.", terms })).toThrow(
      /on-device/
    );
    expect(() => validateGlossaryTerms({ translation: "The client side is the second curve.", terms })).toThrow(
      /on-device/
    );
    expect(() => validateGlossaryTerms({ translation: "On-device is the second curve.", terms })).not.toThrow();
    expect(() => validateGlossaryTerms({ translation: "on device computing", terms })).not.toThrow();
  });

  it("does not fire on text without glossary terms", () => {
    expect(() => validateGlossaryTerms({ translation: "cutting-edge technologies", terms: [] })).not.toThrow();
  });

  it("prefixes the glossary block without touching the clause chain", () => {
    const source = "承担**更长的建设周期**的投入，例如出现很多长鑫之类的企业。";
    const terms = selectGlossaryTerms(source, "zh");
    const prompt = buildTranslatePrompt({
      sourceText: source,
      sourceLanguage: "zh",
      targetLanguage: "en",
      preserveStructure: true,
      terms,
    });

    expect(prompt.startsWith("参考下面的翻译：\n`长鑫` 翻译成 `CXMT`\n将以下文本翻译为 `英语`")).toBe(true);

    const clause = prompt.slice(prompt.indexOf("，并且"), prompt.indexOf("：\n\n"));
    expect(clause).not.toMatch(/[*=^`]/);
  });

  it("leaves a prompt with no matching terms byte-for-byte unchanged", () => {
    const plain = { sourceText: "普通正文。", sourceLanguage: "zh", targetLanguage: "en" };

    expect(buildTranslatePrompt({ ...plain, terms: [] })).toBe(buildTranslatePrompt(plain));
    expect(buildTranslatePrompt(plain).startsWith("将以下文本翻译为")).toBe(true);
  });

  it("carries a version that a prompt-shape change has to bump", () => {
    // Guards against editing the prompts without deciding what happens to the
    // caches written by the previous shape.
    expect(TRANSLATION_PIPELINE_VERSION).toBe("hy-mt2-v3");
  });
});

describe("body units for incremental reuse", () => {
  it("reassembles a body byte-for-byte from its units", () => {
    const body = [
      "开头段落。",
      "",
      "```python",
      "print('hi')",
      "```",
      "",
      "```text",
      "每百万 Token 成本",
      "```",
      "",
      "## 小节",
      "",
      "结尾段落。",
    ].join("\n");
    const plan = extractBodyUnits(body);

    expect(assembleBody(plan.units, plan.trailing)).toBe(body);
    // A CJK-bearing fence carries reader-facing text; a CJK-free one does not.
    expect(plan.units.some((unit) => unit.kind === "fenced")).toBe(true);
    expect(plan.units.some((unit) => unit.kind === "verbatim")).toBe(true);
  });

  it("keeps fence markers out of the unit source for a fenced formula", () => {
    const plan = extractBodyUnits("```text\n每百万 Token 成本 = 成本 ÷ 产出\n```");
    const unit = plan.units[0];

    expect(unit.kind).toBe("fenced");
    expect(unit.prefix).toBe("```text\n");
    expect(unit.suffix).toBe("\n```");
    expect(unit.source).toContain("每百万 Token 成本");
    expect(unit.source).not.toContain("```");
  });

  it("carries a CJK-free fence over verbatim", () => {
    const plan = extractBodyUnits("```python\nprint('hi')\n```");
    expect(plan.units[0].kind).toBe("verbatim");
  });

  it("keeps an html placeholder out of prose so the model cannot rewrite it", () => {
    const body = "前段。\n\n[[html-block-1]]\n\n后段。";
    const plan = extractBodyUnits(body);
    const placeholder = plan.units.find((unit) => unit.text.includes("[[html-block-1]]"));

    expect(placeholder.kind).toBe("verbatim");
    expect(plan.units.filter((unit) => unit.kind === "prose")).toHaveLength(2);
    expect(assembleBody(plan.units, plan.trailing)).toBe(body);
  });

  it("splits an oversized block into pieces that concatenate exactly", () => {
    const paragraphs = Array.from({ length: 6 }, (_v, index) => `第${index}段 ` + "字".repeat(120));
    const block = paragraphs.join("\n\n");
    const pieces = splitOversizedBlock(block, 300);

    expect(pieces.length).toBeGreaterThan(1);
    expect(pieces.every((piece) => piece.text.length <= 300)).toBe(true);
    expect(pieces.map((piece) => piece.text + piece.separator).join("")).toBe(block);
  });

  it("keeps every other paragraph's unit identity when one is edited", () => {
    // The old greedy packer broke exactly this: inserting text shifted every
    // later chunk boundary, so a one-paragraph edit invalidated the whole tail.
    const before = extractBodyUnits("第一段。\n\n第二段。\n\n第三段。\n\n第四段。").units;
    const after = extractBodyUnits("第一段。\n\n第二段改长了，加了一句话。\n\n第三段。\n\n第四段。").units;
    const identity = (unit) =>
      createUnitKey({ kind: unit.kind, source: unit.source, context: unit.context, model: "m", termsHash: "" });

    const beforeKeys = new Set(before.filter((unit) => unit.kind !== "verbatim").map(identity));
    const untouched = after.filter((unit) => unit.source === "第三段。" || unit.source === "第四段。");

    expect(untouched).toHaveLength(2);
    for (const unit of untouched) {
      expect(beforeKeys.has(identity(unit))).toBe(true);
    }
  });

  it("folds the enclosing section path into a unit's context", () => {
    const plan = extractBodyUnits("## 利润来源\n\n### 上游制造\n\n晶圆与封装决定供给。");
    const prose = plan.units.find((unit) => unit.source.startsWith("晶圆"));

    expect(prose.context).toBe("利润来源 › 上游制造");
    // A heading only carries its parent as context, never itself.
    expect(plan.units.find((unit) => unit.source === "## 利润来源").context).toBe("");
    expect(plan.units.find((unit) => unit.source === "### 上游制造").context).toBe("利润来源");
  });

  it("splits one markdown region on blank lines and keeps the separators", () => {
    const content = "甲\n\n乙\n\n\n丙\n";
    const { blocks, trailing } = splitProseBlocks(content);

    expect(blocks.map((block) => block.text)).toEqual(["甲", "乙", "丙"]);
    expect(blocks.map((block) => block.leading + block.text).join("") + trailing).toBe(content);
  });

  it("commits units in document order, not completion order", () => {
    // Concurrency makes the commit order arbitrary; the cache file must not
    // reshuffle its keys when nothing meaningful changed.
    const committed = {
      c: { translation: "3" },
      a: { translation: "1" },
      b: { translation: "2" },
    };

    expect(Object.keys(orderUnitsByPlan(committed, ["a", "b", "c"]))).toEqual(["a", "b", "c"]);
    // A repeated key keeps its first slot; a key that never committed is skipped.
    expect(Object.keys(orderUnitsByPlan(committed, ["a", "a", "missing", "c"]))).toEqual(["a", "c"]);
    expect(orderUnitsByPlan(committed, [])).toEqual({});
  });

  it("flags only prose that actually carries annotation marks", () => {
    expect(hasInlineMarks("普通正文，没有标记。")).toBe(false);
    expect(hasInlineMarks("一处 ==red|风险==")).toBe(true);
    expect(hasInlineMarks("正文\n\n^[一条批注]")).toBe(true);
  });
});

describe("model digest lookup", () => {
  it("derives the Ollama tag endpoint from the chat base URL", () => {
    expect(ollamaTagsUrl("http://localhost:11434/v1")).toBe("http://localhost:11434/api/tags");
    expect(ollamaTagsUrl("http://localhost:11434/v1/")).toBe("http://localhost:11434/api/tags");
    expect(ollamaTagsUrl("http://localhost:11434")).toBe("http://localhost:11434/api/tags");
  });

  it("finds a model by name with or without an explicit tag", () => {
    const models = [
      { name: "other:latest", digest: "zz" },
      { name: "hy-mt2-7b:latest", digest: "1c5ce930" },
    ];

    expect(findModelDigest(models, "hy-mt2-7b")).toBe("1c5ce930");
    expect(findModelDigest(models, "hy-mt2-7b:latest")).toBe("1c5ce930");
  });

  it("reports no digest rather than a wrong one", () => {
    expect(findModelDigest([{ name: "other:latest", digest: "zz" }], "hy-mt2-7b")).toBeNull();
    expect(findModelDigest([{ name: "hy-mt2-7b:latest" }], "hy-mt2-7b")).toBeNull();
    expect(findModelDigest(undefined, "hy-mt2-7b")).toBeNull();
  });
});

describe("translation cache contract", () => {
  const base = {
    version: TRANSLATION_CACHE_VERSION,
    sourceHash: "abc",
    targetLanguage: "en",
    pipeline: TRANSLATION_PIPELINE_VERSION,
    glossary: TRANSLATION_GLOSSARY_VERSION,
    model: "hy-mt2-7b",
    body: "text",
  };

  it("accepts a cache written by the current pipeline", () => {
    expect(isTranslationCacheFresh(base, { sourceHash: "abc", targetLanguage: "en" })).toBe(true);
    expect(
      isTranslationCacheFresh(base, { sourceHash: "abc", targetLanguage: "en", model: "hy-mt2-7b" })
    ).toBe(true);
  });

  it("rejects a cache written by an older pipeline", () => {
    expect(isTranslationCacheFresh({ ...base, pipeline: "hy-mt2-v1" }, {
      sourceHash: "abc",
      targetLanguage: "en",
    })).toBe(false);
    // A v1 cache has no pipeline field at all and must not be trusted.
    const { pipeline: _dropped, ...v1 } = base;
    expect(isTranslationCacheFresh(v1, { sourceHash: "abc", targetLanguage: "en" })).toBe(false);
  });

  it("rejects a cache produced by a different model when the caller names one", () => {
    expect(
      isTranslationCacheFresh(base, { sourceHash: "abc", targetLanguage: "en", model: "other-model" })
    ).toBe(false);
  });

  it("rejects stale, empty or malformed caches", () => {
    expect(isTranslationCacheFresh(base, { sourceHash: "changed", targetLanguage: "en" })).toBe(false);
    expect(isTranslationCacheFresh(base, { sourceHash: "abc", targetLanguage: "zh" })).toBe(false);
    expect(isTranslationCacheFresh({ ...base, body: "" }, { sourceHash: "abc", targetLanguage: "en" })).toBe(false);
    expect(isTranslationCacheFresh(null, { sourceHash: "abc", targetLanguage: "en" })).toBe(false);
  });

  it("rejects a cache written under a different glossary", () => {
    expect(
      isTranslationCacheFresh({ ...base, glossary: "00000000" }, { sourceHash: "abc", targetLanguage: "en" })
    ).toBe(false);

    // A cache written before the glossary existed has no field at all.
    const { glossary: _dropped, ...preGlossary } = base;
    expect(isTranslationCacheFresh(preGlossary, { sourceHash: "abc", targetLanguage: "en" })).toBe(false);
  });

  it("moves a unit key when the model, the context, the terms or the pipeline changes", () => {
    const unit = { kind: "prose", source: "正文", context: "小节", model: "hy-mt2-7b", termsHash: "" };
    const key = createUnitKey(unit);

    expect(createUnitKey({ ...unit })).toBe(key);
    expect(createUnitKey({ ...unit, model: "other" })).not.toBe(key);
    expect(createUnitKey({ ...unit, context: "别的小节" })).not.toBe(key);
    expect(createUnitKey({ ...unit, source: "别的正文" })).not.toBe(key);
    expect(createUnitKey({ ...unit, pipelineVersion: "old" })).not.toBe(key);
    expect(createUnitKey({ ...unit, termsHash: "a1b2c3d4" })).not.toBe(key);
  });

  it("refuses to build a unit key without a terms hash", () => {
    // A caller that forgets termsHash would key its units differently from one
    // that passes it, and the mismatch would never surface.
    expect(() => createUnitKey({ kind: "prose", source: "正文" })).toThrow(/termsHash/);
  });
});

describe("embedded HTML diagram text", () => {
  it("decodes entities before the model sees them and escapes exactly once", () => {
    const html = "<text>R&amp;D 投入</text>";

    // The model must receive the logical text, not the markup that encodes it.
    expect(extractTextNodes(html)).toEqual(["R&D 投入"]);

    // Whether the model answers with the decoded or the encoded form, the
    // published markup carries the entity exactly once.
    expect(applyTextTranslations(html, ["R&D investment"])).toBe("<text>R&amp;D investment</text>");
    expect(applyTextTranslations(html, ["R&amp;D investment"])).toBe("<text>R&amp;D investment</text>");
  });

  it("round-trips an entity-bearing diagram without drift", () => {
    const body = '前段。\n\n<figure><text>R&amp;D 投入</text></figure>\n';
    const { body: placeholder, blocks } = extractHtmlBlocks(body);
    const nodes = planHtmlTextUnits(blocks);
    const translations = Object.fromEntries(nodes.map((node) => [node.slot, node.source]));

    expect(restoreHtmlBlocks(placeholder, blocks, translations)).toBe(body);
  });

  it("never hands a <style> or <script> body to the model", () => {
    const html = '<svg><style>.a > .b { fill: red }</style><script>const x = 1;</script><text>标签</text></svg>';

    expect(extractTextNodes(html)).toEqual(["标签"]);
    expect(applyTextTranslations(html, ["Label"])).toBe(
      '<svg><style>.a > .b { fill: red }</style><script>const x = 1;</script><text>Label</text></svg>'
    );
  });

  it("still translates the accessible title and description of a diagram", () => {
    const html = '<svg><title>架构图</title><desc>从左到右</desc><text>节点</text></svg>';
    expect(extractTextNodes(html)).toEqual(["架构图", "从左到右", "节点"]);
  });

  it("keeps <title>/<desc> indices aligned when a <style> block sits between them", () => {
    const html = '<svg><title>架构图</title><style>text{fill:red}</style><text>节点</text></svg>';
    expect(extractTextNodes(html)).toEqual(["架构图", "节点"]);
    expect(applyTextTranslations(html, ["Architecture", "Node"])).toBe(
      '<svg><title>Architecture</title><style>text{fill:red}</style><text>Node</text></svg>'
    );
  });

  it("decodes numeric character references too", () => {
    expect(decodeHtmlEntities("&#65;&#x42;&amp;&unknown;")).toBe("AB&&unknown;");
  });

  it("normalises an entity the model invents instead of publishing it literally", () => {
    // Because the value is decoded before it is escaped, an "&amp;" from the
    // model lands in the markup as a real "&" — never the visible "&amp;" the
    // previous single-escape pipeline could publish.
    expect(applyTextTranslations("<text>甲乙</text>", ["A &amp; B"])).toBe("<text>A &amp; B</text>");
  });

  it("runs the same hygiene rules on diagram labels as on body prose", () => {
    expect(() => validateHtmlText({ "1.1": "GPU\uFFFD" }, { "1.1": "核心部件" }, "en")).toThrow(/乱码/);
    expect(() => validateHtmlText({ "1.1": "GPU\uFF0CASIC" }, { "1.1": "核心部件" }, "en")).toThrow(
      /中文标点/
    );
  });
});

describe("translation CLI options", () => {
  it("defaults to a plain run at the documented concurrency", () => {
    expect(parseCliOptions(["node", "translate-content.mjs"])).toEqual({
      force: false,
      dryRun: false,
      only: null,
      concurrency: 4,
    });
  });

  it("recognises --force and both spellings of the dry run", () => {
    expect(parseCliOptions(["node", "s", "--force"]).force).toBe(true);
    expect(parseCliOptions(["node", "s", "--check"]).dryRun).toBe(true);
    expect(parseCliOptions(["node", "s", "--dry-run"]).dryRun).toBe(true);
  });

  it("accepts --only and --concurrency with a space or an equals sign", () => {
    expect(parseCliOptions(["node", "s", "--only", "post-a"]).only).toBe("post-a");
    expect(parseCliOptions(["node", "s", "--only=post-b"]).only).toBe("post-b");
    expect(parseCliOptions(["node", "s", "--concurrency", "8"]).concurrency).toBe(8);
    expect(parseCliOptions(["node", "s", "--concurrency=2"]).concurrency).toBe(2);
  });

  it("ignores a nonsensical concurrency instead of hanging on zero runners", () => {
    expect(parseCliOptions(["node", "s", "--concurrency", "0"]).concurrency).toBe(4);
    expect(parseCliOptions(["node", "s", "--concurrency", "many"]).concurrency).toBe(4);
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

  it("treats a tilde fence as a fence when extracting units", () => {
    const unit = extractBodyUnits("~~~text\n每百万 Token 成本\n~~~").units[0];

    expect(unit.kind).toBe("fenced");
    expect(unit.prefix).toBe("~~~text\n");
    expect(unit.suffix).toBe("\n~~~");
    expect(unit.source).toBe("每百万 Token 成本");
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
