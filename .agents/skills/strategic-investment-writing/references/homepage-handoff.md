# Homepage MDX handoff

本文档只在用户明确要求生成或写入个人主页 Insights 内容时读取。

## 目标项目

- 项目目录：`/Users/david/codespace/david-homepage`
- Draft 目录：`content/drafts/`。该目录不会进入网站构建，适合跨对话持续修改。
- 正式文章目录：`content/posts/`。只有用户明确要求进入发布流程时才使用。
- 正式文章文件名：`<YYYY-MM-DD>-<slug>.mdx`
- 文件名不含 `.mdx` 的部分会成为 Insights 文章 URL。

## Draft 归档

如果用户只要求“把 Draft 放进项目”或“便于其他对话继续优化”，将文件保存为：

`/Users/david/codespace/david-homepage/content/drafts/<topic-slug>.md`

保留文章正文、来源和待讨论项。Draft 可以带完整 frontmatter，但不需要翻译缓存，也不运行正式发布流程。除非用户明确要求，不要移动到 `content/posts/`。



```yaml
---
title: "文章标题"
date: "2026-09-03"
language: zh
excerpt: "一句话说明文章判断。"
tags:
  - AI
  - Strategy
  - Investment
---
```

按文章实际内容选择 tags，不为凑数量添加标签。日期使用用户指定的发布日期；用户未指定时使用当前日期，并明确这是 Draft date 还是预定发布日期。

## 写入前检查

1. 读取目标目录和现有文章，确认 slug 不重复。
2. 检查文章正文是否适合公开阅读，删除未核验的内部备注和占位符。
3. 保留事实来源或文末关键来源，避免把调研过程全部暴露在正文里。
4. 中文源稿默认 `language: zh`；英文源稿默认 `language: en`。
5. 只生成文件或按用户明确要求写入，不自动 commit、push、部署或发布。

## 写入后检查

根据项目 README：

```text
npm run translate:content
npm run test:run
npm run build
```

翻译缓存必须与源文件一起审阅。若翻译 API 所需环境变量不可用，停止在 handoff 结果，告诉用户 MDX 已生成但翻译缓存和 build 尚未完成，不要伪称已发布。

## 交付语言

向用户说明：

- 文件路径和文章 slug
- 是否只是生成 Draft，还是已写入 homepage 项目
- 测试和 build 是否通过
- 翻译缓存是否生成
- 仍需用户确认的标题、发布日期、英文版本和公开发布决定
