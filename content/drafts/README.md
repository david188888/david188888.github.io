# 博客草稿区

放在这里的 `.md` / `.mdx` 文件**不会出现在网站上**——构建链路（`src/lib/content/posts.ts` 与翻译脚本）只扫描 `content/posts/`，不碰本目录。

## 写作约定

frontmatter 尽量写全,发布时 agent 会帮你校验和补齐:

```markdown
---
title: 文章标题
date: 2026-08-25
permalink: /posts/2026/08/my-post/
tags:
  - tag1
  - tag2
language: zh   # 可省略,会自动检测;检测失败时必须显式声明
---

正文从这里开始……
```

## 发布流程(告诉 agent "发布 xxx" 即可)

1. 校验/补全 frontmatter(date、permalink、tags、language)
2. 移动到 `content/posts/<date>-<slug>.mdx`（文件名直接决定 URL，例如 `2026-09-05-ai-chip-infrastructure-token-economics.mdx`；frontmatter 里的 `permalink` 不参与路由）
3. 翻译走增量缓存：先 `npm run translate:content -- --check` 看要重译几个单元，再 `npm run translate:content`。只改动一段时只有那一段会重译，其余按内容寻址复用（校验不通过会拒绝写入，按报错重跑；旧缓存保持不变，不会发出半成品译文）
4. 构建验证后提交

## 已发布文章的 Notion 回同步

已发布文章在 Notion 里修改后，用确定性转换脚本同步回 `content/posts/`（脚本不联网）：

```bash
# 1. 用 notion_fetch 取页面（必须带 include_discussions: true），完整输出存到
#    local/notion-fetch/<date>-<slug>.txt（local/ 已被 gitignore）
# 2. 转换回已发布的 MDX，保留原 frontmatter
node scripts/notion-to-mdx.mjs \
  --input local/notion-fetch/<date>-<slug>.txt \
  --source content/posts/<date>-<slug>.mdx \
  --write
# 3. 只重译真正改动过的单元
npm run translate:content -- --check   # 预览复用与待译数量，不调模型
npm run translate:content
# 4. 验证后把 MDX 和翻译缓存一起提交
npm run test:run && npm run build
```

- 不加 `--write` 时 MDX 输出到 stdout、转换报告输出到 stderr，可当 dry run 用。
- `--comments=all|mark-only|none` 控制页边注，默认 `all`；Notion 里已 resolve 的 discussion 一律跳过，这是不发布某条评论的唯一方式。
- 文字颜色、背景色、下划线统一归约为 `==red|文字==`，评论变为 `^[文字]`，完整语法见 `docs/insights-markup.md`。
- 正文是标记语言的 ```` ```html ```` 围栏会被拆掉、写回成无围栏的块级 HTML，报告会列出拆了几个。渲染器永远不会把围栏内容提升为实时 HTML，留着围栏图表会被当源码文本发布。

## 内嵌 HTML 可视化

正文里可以直接写块级 HTML(如 `<figure>…SVG…</figure>`)来渲染流程图、供应链图等可视化。规则:

- 块级元素独占一行起始(如 `<figure …>`),延伸到匹配的闭合标签;元素内部允许空行
- 可以直接使用站点样式类,如 `globals.css` 里的 `.supply-chain-*` 系列
- 渲染前会自动剥离 `<script>`、`on*` 事件属性和 `javascript:` 链接,行内散落的 HTML 仍按纯文本转义
- 翻译时 HTML 块整体被替换为 `[[html-block-N]]` 占位符,块内可见文字单独交给模型翻译后回填,不会被模型破坏
