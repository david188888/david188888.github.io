# AGENTS.md

个人学术主页：Next.js 静态导出，部署到 GitHub Pages。中英双路由；博客文章在
Notion 里写作、同步为 MDX，再由本机 Hy-MT2 模型翻译成另一语言。
项目规则以本文件为准（`.gitignore` 忽略了 `CLAUDE.md`）。

## 怎么跑

```bash
npm install
npm run dev            # 本地开发
npm run test:run       # 全部 Vitest，提交前必过
npm run build          # 静态导出到 out/，提交前必过
```

翻译依赖本机 Ollama 上的 `hy-mt2-7b`（先 `ollama serve`）：

```bash
npm run translate:content -- --check   # 只报告要重译多少单元，不调模型
npm run translate:content              # 增量翻译，只重译改动过的单元
```

## 技术栈

Next.js 15 App Router、React 19、TypeScript(strict)、Tailwind 3、Vitest。
博客是「纯 Markdown + YAML frontmatter」的 `.mdx` 文件，由
`src/lib/content/posts.ts` 自己解析、`markdown-it` 渲染——**没有 MDX 编译器参与**。

## 目录与硬约束

- `content/posts/*.mdx`：已发布文章，唯一被站点读取的内容目录；**文件名即 URL**，
  frontmatter 里的 `permalink` 不参与路由。
- `content/generated/translations/posts/*.json`：**翻译缓存，必须与源文件一起提交**。
  它是生成物，不要手改；缓存过期或 pipeline 版本不符时，目标语言的页面会直接抛错、
  让 build 失败，而不会把文章从路由和列表里静默隐藏。
- `content/drafts/`：草稿区，不参与构建；写作与发布约定见 `content/drafts/README.md`。
- `docs/insights-markup.md`：正文行内标记（`==red|文字==`、`^[批注]`）的唯一权威定义。
  渲染器、Notion 转换脚本、翻译校验三处都按它实现，改规则必须同步改三处。
- `scripts/translate-content.mjs`：增量翻译管线；缓存契约在
  `src/lib/content/translation-cache.mjs`（脚本与站点共用）。改 prompt、切分或校验后
  必须升 `TRANSLATION_PIPELINE_VERSION`，否则旧缓存会被当成新鲜译文继续发布。
- `src/lib/content/translation-glossary.mjs`：术语表，专有名词与统一译法的唯一来源。
  它同样由脚本与站点共用：内容哈希以 `glossary` 写进每条翻译缓存并参与新鲜度判定，
  所以**改术语表不需要手动升版本**，但必须重跑 `translate:content`（站点会先报
  build 失败）。只有「该单元源文里命中」的术语会注入 prompt 与缓存键，改一条术语
  只重译受影响的单元。术语命中译文违规时管线会先重采样若干次，仍不过才中止。
- `scripts/notion-to-mdx.mjs`：Notion → MDX 的确定性转换；完整同步流程见 README
  的 “Syncing An Existing Post From Notion”。正文里的图表以**无围栏的块级 HTML** 落进
  MDX：```` ```html ```` 围栏内的标记语言会被转换脚本自动拆掉围栏，因为
  `src/lib/content/markdown-segments.mjs` 规定围栏块永远不会被提升为实时 HTML，
  留着围栏等于把图表当源码文本发到页面上。
- `.agents/skills/`：随仓库发布的 skill（DSH 只扫这里）。`.claude/` 不被 git 跟踪，
  其中的 skill 只是本机 Claude Code 副本。
- `src/config/profile.ts`：首页、CV、论文等双语资料的唯一来源。

## 提交前

1. `npm run test:run` 与 `npm run build` 全绿。
2. 改过文章后确认翻译缓存同步更新：`npm run translate:content -- --check` 退出码为 0。
3. 不要提交 `.env`、`local/`、`.next/`、`out/` 或其他构建产物。
