# 网站访问统计

## 查看方式

打开 `/stats/`（英文版 `/en/stats/`），点击「连接 Google」，使用拥有
**David Homepage** 读取权限的 Google 账号完成只读授权。授权后可直接查看全站
7／30 天浏览次数、活跃用户、会话、每日浏览趋势、热门页面、来源渠道，以及独立的
近 30 分钟活跃用户。也可通过「打开 Google 看板」进入官方报表。

令牌与报表仅保留在当前页面内存，刷新／关闭后需要重新连接；授权过期或断开连接会
清除本页数据。断开不会撤销 Google 账号中已授予的权限，可在 Google 账号的第三方
连接设置中撤销。作者工具登录仍只用于文章批注，不能授予 GA4 数据访问权限。

未配置 OAuth Client ID 时会明确显示配置待完成，不会显示示例数字或伪造的零。

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
正式站点已部署或 Google 已收到事件。后台设置改变后需重新验收。当前已通过 Data API 读取到该媒体资源的真实历史报表，但这不能代替下方逐页事件次数的验收。

## 站内报表口径

- 7 天是 `6daysAgo..today`，30 天是 `29daysAgo..today`，均包含今天，由媒体资源时区解释。
- 一次 `batchRunReports` 中分别查询无维度的区间总计、按日浏览量、按 `pagePath` 的
  前 10 个页面，以及按 `sessionDefaultChannelGroup` 的前 10 个渠道会话。
- 全站活跃用户直接读取区间总计，不能把每日或逐页用户相加；没有首页过滤条件。
- 实时 `runRealtimeReport` 独立请求，失败不会抹掉已成功的历史报表。
- 无数据、加载、缺少权限、超额、请求超时、无效响应分别展示。图表只连接 API 返回的
  日期点，表格提供全部返回值；缺失日期不补零。Google 的阈值、抽样等限制会提示。
- 无自动轮询；切换范围或手动刷新时读取，15 秒超时。取消、断开、过期和卸载使旧响应失效。

## Google Cloud 与 OAuth 配置

1. 专用项目 `david-homepage-analytics`（编号 `486642833218`），启用
   `analyticsdata.googleapis.com`。2026-10-16 已在控制台确认启用。
2. Google Auth Platform 创建应用信息，个人 Gmail 使用 External、Testing，添加
   自己的账号为测试用户。此为个人私用看板，不需要向公众提供私人报表。
3. 创建 Web 应用 OAuth 客户端，授权 JavaScript 来源包括
   `https://david188888.github.io`，本地按实际使用加入 `http://localhost:4317`
   等来源（scheme、host、port 必须完全一致）。GIS popup token model 不使用重定向 URI。
4. 只申请 `https://www.googleapis.com/auth/analytics.readonly`。此作用域可读取授权账号
   有权访问的 Analytics 数据，站点代码仅查询媒体资源 `525415859`。
5. 将公开 Client ID 写入本机 `.env.local` 的
   `NEXT_PUBLIC_GOOGLE_ANALYTICS_CLIENT_ID`；GitHub Actions 仓库变量设置为
   `GOOGLE_ANALYTICS_CLIENT_ID`。客户端密钥不使用、不放进仓库或网页。
6. 配置／修改后重新构建。用户亲自确认实际 Google 授权后，核对真实 API 响应和页面数值。
   发布前检查正式 origin 已列入授权来源。Google 项目如尚在 Testing，只允许所列测试账号。

### 已完成的配置

- Cloud 项目已创建，Analytics Data API 已启用。
- 用户已接受用户数据政策，Google 控制台已确认创建 OAuth 应用配置。
- Web 客户端 `David Homepage Stats Web` 已经用户确认并创建，公开 Client ID 已写入被忽略的 `.env.local` 和 GitHub Actions 仓库变量。
- 允许来源为正式网站、`http://127.0.0.1:4317`、`http://localhost:4317` 与 `http://localhost`；没有重定向 URI。
- 初次连接时的测试名单缺失错误（`403 access_denied`）已通过加入当前账号解决。
- 已在 Cloud 受众页面保存当前账号为唯一测试用户，控制台确认 1 个测试用户；重新连接后已成功读取真实历史报表。
- 实时 API 在没有活动时实际返回 HTTP 200 与仅含 `kind: analyticsData#runRealtimeReport` 的响应。解析器已兼容此明确空响应，其他缺失／损坏响应仍报错。
- 发布状态以 GitHub Pages 部署记录为准；本地成功不代表正式来源的授权流程已验收。

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
- 原始全站标签已通过 PR #21 合并，GitHub Pages Actions `38767476215` 的 build／deploy 均成功。
- 正式主机的请求次数、`page_location` 与 GA4 实际收数仍待浏览器及官方报表验收；部署成功不等于已收数。

### 2026-10-16 站内看板本地验证

- 412 项 Vitest 通过，静态构建通过，`git diff --check` 通过。
- 覆盖区间口径、总计解析、空报表、无效日期／指标、HTTP 错误、取消、过期、旧授权回调和旧范围响应隔离。
- 已验证中英文未配置状态，320px 页面均无横向溢出；真实授权后的桌面历史报表已显示。
- 带真实 Client ID 的构建通过；本地 Google 授权组件加载成功，连接按钮可触发授权流程。
- 真实账号连接及历史报表读取已通过；真实实时空响应已通过解析回放与回归测试。修复后的实时卡片、授权后窄屏布局及正式来源授权流程尚未完成浏览器复验。

## 官方参考

- [GA4 单页应用衡量](https://developers.google.com/analytics/devguides/collection/ga4/single-page-applications)
- [页面浏览及避免重复计数](https://developers.google.com/analytics/devguides/collection/ga4/views)
- [Next.js Script](https://nextjs.org/docs/app/guides/scripts)
- [Analytics Data API batchRunReports](https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/properties/batchRunReports)
- [Google Identity Services token model](https://developers.google.com/identity/oauth2/web/guides/use-token-model)
- [GA4 Data API schema](https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema)
