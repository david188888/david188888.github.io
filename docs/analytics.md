# 网站访问统计

## 查看方式

打开正式网站的 `/stats/`（英文版 `/en/stats/`），点击「打开 Google 看板」。
使用拥有 **David Homepage** 访问权限的 Google 账号登录即可。网站无需另行登录，
统计页不会读取或公开私人报表数据；下方的作者工具登录只用于文章批注。

GA4 配置集中在 `src/config/analytics.ts`：账号 `385095568`、媒体资源 `525415859`、
Web 衡量 ID `G-6S2MZXN5QQ`、正式主机 `david188888.github.io`。

## 统计范围与口径

- 唯一根布局为所有 HTML 路由加载相同标签。首页、Insights 列表和正文、项目、CV、
  publications、其他子页及中英文版本全部汇总到同一媒体资源，保留各自页面路径。
- 用户直接打开文章即可记录，不必先经过首页。Google 的增强型衡量负责首次加载与
  History API 导航，包括客户端跳转、前进和后退；站点不手动发送第二份 `page_view`。
- **浏览次数（Views）**按页面浏览累加：首页 → 一篇文章通常是两次浏览。
- **活跃用户（Active users）**与 **会话（Sessions）**由 GA4 识别与处理，
  全站人数应看全站指标，不能把各页面的用户数相加。不同设备、隐私设置会影响识别。
- PDF 等直接静态附件不执行 JavaScript，不能当作
  HTML 页面记录；Google 已启用的文件下载衡量可记录站内下载链接点击。
- 标签只在正式主机加载；localhost、127.0.0.1 和其他预览域名不会向真实媒体资源发送数据。
- 数据从上线后开始收集，不补回此前未记录的访问；常规报表有处理延迟。

Google 为该衡量 ID 下发的公开标签配置于 2026-10-16 包含
`vtp_enablePageView: true`、`vtp_enableHistoryEvents: true`，以及目标数据流的
`__ccd_em_page_view.vtp_historyEvents: true`。这些是当时的配置证据，并不表示
正式站点已部署或 Google 已收到事件。后台设置改变后需重新验收。

## 看板里看什么

1. 首页选择日期范围与 **Views**，查看全站总浏览量和趋势。
2. **网页和屏幕（Pages and screens）**查看各篇文章、页面的浏览量。
3. **流量获取（Traffic acquisition）**查看来源渠道。
4. **实时（Realtime）**检查刚发生的访问；**DebugView**用于核对单次测试事件。

菜单位置可能随 GA4 报告集合而不同，可用 Google Analytics 内搜索定位报告。
网站统计入口使用用户提供的媒体资源首页地址，不依赖易变的具体报表 URL。

## 上线验收

本地先跑 `npm run test:run` 和 `npm run build`。测试验证正式主机的一次初始化、
排队顺序和预览排除；静态导出应在所有 HTML 路由包含 `ga4-init`。

发布后在未拦截 Google Analytics 的浏览器中验证：

1. GA4 管理 → 数据流 → Web → 增强型衡量 → 网页浏览 → 高级设置，确认
   「网页加载」与「基于浏览器历史记录事件的网页更改」均启用。
2. 直接打开一篇文章，然后从首页通过站内链接进入该文章、其他子页、中英文版本，
   再测试前进和后退。Chrome Network 应看到 `g/collect` 请求：
   `tid=G-6S2MZXN5QQ`、`en=page_view`，`dl` 为对应地址，
   一次真实页面导航对应一次页面浏览，且标题、来源页正确。
3. 在 GA4 Realtime / DebugView 检查相同页面路径和事件次数。浏览器发出请求
   与 GA4 已收到数据是两项验收，不能只凭脚本存在宣称已完成。

本地静态预览刻意不加载 Google 标签，因此本地通过不代表线上收数已验证。

### 2026-10-16 本地验证记录

- 391 项 Vitest 通过；Next.js 静态构建（含类型检查）通过。
- 44 个导出 HTML 均包含全局 `ga4-init`；中英文统计页都指向正确媒体资源。
- 浏览器验证 1280px 桌面，以及 320px 中英文页面无横向溢出；本地存在引导脚本，
  但没有加载外部 Google 标签。可选作者登录能展开并显示错误凭据提示。
- 尚未发布本次修改；正式主机的请求次数、`page_location` 与 GA4 收数待发布后验证。

## 官方参考

- [GA4 单页应用衡量](https://developers.google.com/analytics/devguides/collection/ga4/single-page-applications)
- [页面浏览及避免重复计数](https://developers.google.com/analytics/devguides/collection/ga4/views)
- [Next.js Script](https://nextjs.org/docs/app/guides/scripts)
