# 博客草稿区

放在这里的 `.md` / `.mdx` 文件**不会出现在网站上**——构建链路(velite、posts.ts、翻译脚本)只扫描 `content/posts/`,不碰本目录。

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
2. 移动到 `content/posts/<date>-<slug>.mdx`(命名沿用现有惯例,如 `2012-08-14-blog-post-1.mdx`)
3. 运行 `npm run translate:content` 生成另一语言的翻译缓存
4. 构建验证后提交

## 内嵌 HTML 可视化

正文里可以直接写块级 HTML(如 `<figure>…SVG…</figure>`)来渲染流程图、供应链图等可视化。规则:

- 块级元素独占一行起始(如 `<figure …>`),延伸到匹配的闭合标签;元素内部允许空行
- 可以直接使用站点样式类,如 `globals.css` 里的 `.supply-chain-*` 系列
- 渲染前会自动剥离 `<script>`、`on*` 事件属性和 `javascript:` 链接,行内散落的 HTML 仍按纯文本转义
- 翻译时 HTML 块整体被替换为 `[[html-block-N]]` 占位符,块内可见文字单独交给模型翻译后回填,不会被模型破坏
