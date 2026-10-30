---
name: homepage-post-sync
description: 已发布博客文章的 Notion 编辑循环与发布链路。当用户说"同步到博客""把 Notion 正文同步过去""更新已发布文章""我在 Notion 改完了帮我发布""重新生成翻译缓存"等时使用。负责 david-homepage（/Users/david/codespace/david-homepage）content/posts/ 正式文章的 Notion→MDX 同步、英文翻译缓存重建、测试构建和提交推送。写新文章或初稿用 strategic-investment-writing，本 Skill 只管已发布文章的编辑同步。
version: 1.0.0
---

# Homepage Post Sync（Notion 编辑循环）

david-homepage 的正式文章（`content/posts/*.mdx`）发布后，用户在 Notion「知识笔记」库的对应页面编辑中文正文；Agent 负责把 Notion 改动同步回 MDX，并走完翻译、构建、提交、部署链路。

## Notion 页面结构约定

- `# 正文` 区块 = 文章正文主体。同步时跳过开头的「同步元数据」callout，其余按顺序转换为 Markdown。
- 「同步元数据」callout = frontmatter 来源：发布标题→title，摘要→excerpt，标签→tags，日期→date，源文件路径指示目标 MDX 文件。callout 里的源文件路径和发布 URL 不允许改（URL 由文件名决定）。
- 正文中的 ```html 代码块 = 内嵌 SVG 图（如 supply-chain-diagram）的源码，同步时从代码块原样取出写回 MDX，不做任何改写；代码块前的「供应链图说明」提示段落不同步。
- 正文里的行内标记按 `docs/insights-markup.md` 处理：Notion 的文字颜色 / 背景色 / 下划线统一归约为 `==color|文字==`，段落上的评论变为该段之后的 `^[内容]`。**所有评论默认发布成页边注，不需要任何前缀**；不想发布的唯一步骤是在 Notion 里把该讨论标记为已解决。
- 页面「思路整理」区（含草稿提纲笔记）不是正文，不同步。

## 同步流程

1. 用 `notion_fetch` 取页面，**必须带 `include_discussions: true`**，把完整输出存成临时文件。只有带 discussions 的 fetch 才同时包含「评论正文」和「评论挂在哪个段落」，转换脚本依赖这两者。
2. 跑确定性转换脚本，不要手工重建正文：

   ```bash
   node scripts/notion-to-mdx.mjs --input <fetch.txt> --source content/posts/<slug>.mdx > /tmp/new.mdx
   ```

   先看 stderr 的转换报告（块数、下划线数、已发布批注、未发布评论、警告），再 `diff /tmp/new.mdx content/posts/<slug>.mdx` 确认改动只来自用户的编辑意图。确认无误后用 `--write` 落盘。

   分两段阅读：脚本写入时**只读 stdout 到文件**，报告在 stderr，不要把两者混在一起。

3. `npm run translate:content`。sourceHash 变化后整篇重新翻译，不只是改动段落。

   脚本会依次校验四件事，任一不过就报错并**拒绝写缓存**：译文 JSON 结构、`[[html-block-N]]` 占位符全部还原（无残留）、行内标记保真度（`==` 数量、`^[` 数量、颜色名集合）、以及**到底有没有翻译**（按正文的中文占比判定，代码块内不计）。

   .env 由 `--env-file-if-exists` 自动加载，不需要手动 export。

4. review `content/generated/translations/posts/<slug>.json`：核对专业术语，并确认英文版正文没有中文残留、SVG 图与图注在、无 `[[html-block-` 残留。
5. `npm run test:run` + `npm run build`。
6. MDX 与翻译 JSON 一起 git add + commit + push master；GitHub Actions 自动部署 GitHub Pages，部署后线上验证中英文两版。

## 翻译失败时的处理（实测经验）

OpenRouter 的免费模型池**不可用于长文翻译**。2026-09 一次同步实测：`minimax/minimax-m3:free` 与 `z-ai/glm-5.2:free` 已下架；随后依次尝试 7 个免费模型，结果是空响应、非法 JSON、字段结构错、上游 429，全部失败。其中一次更危险：模型把原文原样抄回，只翻了标题，**结构校验全部通过**——这就是现在加上「是否真翻译」校验的原因。

默认用 `.env` 里配置的 OpenRouter 便宜模型；若失败，先看报错再决定是否换模型。

## 正文里不要留内部说明

2026-09 实测踩到：作者在 `# 正文` 里写了一行「**供应链图说明**：……同步回博客时请原样保留。」，那是写给同步流程的指令，但它会被当作正常段落渲染，直接印在公开页面上。

同步时如果发现正文里出现类似「同步」「保留」「请勿修改」这类面向流程的句子，**主动告诉用户**，建议删掉或移到 `# 思路整理`。转换脚本会忠实保留它，不会替你删除。

## 红线

- 不重命名 MDX 文件：文件名决定文章 URL，重命名即断外链。
- frontmatter 的 `permalink` 是遗留死字段，loader 不读取，不要依赖或修改它。
- `date` 必须 YYYY-MM-DD 且不晚于当天，否则文章被发布过滤挡在列表外。
- 翻译缓存 JSON 内含整篇 MDX 的 sourceHash 与 pipeline/glossary 版本：MDX 改一个字缓存即失效，目标语言页面在构建时直接抛错（不会静默从列表里消失，那正是 2026-09 修掉的缺陷）。所以 MDX 改动后必须重跑 translate:content，且 MDX 与 JSON 必须同一次 commit。
- 内嵌 HTML 块渲染时会剥离 `<script>`、`on*` 事件属性和 `javascript:` URL；保持块级结构（行首标签开始、匹配闭合标签结束）。新增 CSS 类需同步改 `src/app/globals.css`（`.supply-chain-*` 在此）。
- 行内标记的语法、失败模式、Notion 映射以 `david-homepage` 仓库的 `docs/insights-markup.md` 为准，不要在同步时凭印象改写标记。标记不成对、颜色名不在白名单、批注前不是段落，渲染器都会直接抛错并中断构建。
- 评论的发布规则只有一条：**默认全部发布，已解决的 discussion 跳过**。不要靠评论内容判断「这条是不是给读者看的」。
- 页边注只能挂段落。评论挂在标题、列表项、代码块上时脚本会跳过并写进报告，遇到这种情况要主动告诉用户，让他决定是否改成段落评论。
- 提交时不要把仓库里 untracked 的 `.Codex/`、`.codex/`、`output/` 等本机杂项带进 commit。`.agents/skills/` 例外：它是随仓库发布的一部分（DSH 只扫这里），项目自己的 `scripts/__tests__/hy-mt2-skill.test.mjs` 会断言它存在。

## Notion 侧注意

- 用户在 Notion 插入图片、表格或其他富媒体时，同步前先确认处理方式：表格转 Markdown 表格；图片需下载放入 `public/` 并改写为站内路径。
- 若 Notion 正文里没有 SVG 代码块但 MDX 原文有（可能被误删），同步前先从 MDX 原文找回并提醒用户。
- **「同步元数据」callout 绝不能是 Notion 同步块（synced block）**。从另一篇文章复制时，粘贴出来的是指向同一原块的 reference，两篇共享同一份内容：改一处就同时改掉另一篇的「源文件」和「发布标题」，直接破坏另一篇的同步链路。2026-09-19 实测踩到（文章一被文章二覆盖），修法是在两个页面上分别把 synced block 换成普通 callout。复制 callout 后务必确认它不是同步块。
- 新文章如果缺 `# 正文` 标题或「同步元数据」callout，转换脚本会直接报错（取不到正文范围和 frontmatter）。这两块要先补，再跑同步。
- 正文里带缩进说明段落的编号列表会被渲染器切断：块按空行切分，每个列表项会变成各自从「1.」开始的单条列表。遇到这种结构，建议作者在 Notion 里改成标题 3 + 段落（`notion-to-mdx.mjs` 会把 Notion 标题 1/2/3 映射为 `#`/`##`/`###`）。
- **翻译管线不检查英文译文里残留的中文字符**（只查中文标点），本地 7B 模型偶发把提示词里的目标语言名「英语」写进译文开头。2026-09-19 实测一次。定点修法：删掉该单元的缓存条目、把缓存里的 `glossary` 字段改成任意非当前值，再跑 `translate:content`（不加 `--force`）——其余单元会按内容寻址复用，只重译那一个；脚本会重写整个缓存文件。根治要在管线里加校验，但那必须同时升 `TRANSLATION_PIPELINE_VERSION`，会让所有文章的缓存失效并整体重译，不要顺手做。
- 文章二类新文章的流程：先在 Notion 补 `# 正文` 与 callout，用转换脚本产出 MDX（新文件没有 `--source`，脚本不写 `permalink`，可按文章一的手工补一行），再走翻译与构建。
