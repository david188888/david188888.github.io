"use client";

import Script from "next/script";
import { useEffect, useState, useSyncExternalStore } from "react";
import { analyticsConfig } from "@/config/analytics";
import type { Locale } from "@/i18n/locales";
import { getMessages } from "@/i18n/messages";
import type { AnalyticsError, DailyViews, RankedValue } from "@/lib/analytics/dashboard-data";
import { DashboardSession } from "@/lib/analytics/dashboard-session";
import styles from "./StatsDashboard.module.css";

const copy = {
  zh: {
    title: "全站访问概览", connect: "连接 Google", connecting: "等待 Google 授权…", disconnect: "断开连接", refresh: "刷新数据",
    intro: "连接有权查看此媒体资源的 Google 账号，即可在这里查看真实数据。只申请统计数据的读取权限。",
    privacy: "授权和报表仅保留在当前页面内存中；刷新、关闭页面或授权过期后需要重新连接。断开连接会清除本页数据，不会撤销 Google 账号中已授予的权限。",
    missing: "站内看板正在配置中。现在仍可打开 Google 看板查看统计。", scriptLoading: "正在加载 Google 授权…", scriptError: "Google 授权组件加载失败，请检查网络或拦截设置后重新加载页面。",
    expired: "Google 授权已过期，请重新连接。", days7: "近 7 天", days30: "近 30 天", loading: "正在读取…", noData: "所选范围暂无数据", ready: "已连接 · 只读访问",
    views: "浏览次数", users: "活跃用户", sessions: "会话", live: "实时活跃用户", liveRange: "最近 30 分钟", viewsHelp: "所有页面浏览次数之和", usersHelp: "GA4 识别的活跃用户", sessionsHelp: "GA4 统计的访问会话",
    trend: "每日浏览趋势", table: "查看每日数据", date: "日期", pages: "热门页面", sources: "来源渠道", top10: "前 10 项", sourceUnit: "会话", zone: "报表时区", fetched: "获取时间", unknownZone: "未返回", limited: "Google 提示此报表可能受隐私阈值、抽样或数据限制影响，结果可能不完整。",
    delay: "范围包含今天，按 GA4 媒体资源时区计算。常规报表存在处理延迟；图表只展示 API 返回的日期，未返回的日期不补为零。", unavailable: "暂无可展示的数据",
    errors: { expired: "授权已过期，请重新连接。", permission: "当前账号没有此 GA4 媒体资源的读取权限，或未允许读取统计数据。请换用有权限的账号连接。", apiDisabled: "Google 项目尚未启用 Analytics Data API。", quota: "Google API 请求额度暂时受限，请稍后刷新。", network: "读取失败或请求超时，请检查网络后刷新。", invalidResponse: "Google 返回的数据不完整，暂时无法展示，请稍后重试。", authorization: "未完成只读授权，请重新连接并允许读取统计数据。", popup: "Google 授权窗口未能完成，请允许弹窗后重试。" },
  },
  en: {
    title: "Site traffic overview", connect: "Connect Google", connecting: "Waiting for Google…", disconnect: "Disconnect", refresh: "Refresh data",
    intro: "Connect a Google account with access to this property to view real statistics here. Only read access to Analytics is requested.",
    privacy: "Authorization and reports stay in this page’s memory. Reconnect after reloading, closing the page or expiration. Disconnect clears this page without revoking the grant in your Google account.",
    missing: "The inline dashboard is being configured. You can still open Google Analytics to view your reports.", scriptLoading: "Loading Google authorization…", scriptError: "Google authorization failed to load. Check your connection or blockers and reload the page.",
    expired: "Google authorization expired. Please reconnect.", days7: "Last 7 days", days30: "Last 30 days", loading: "Loading…", noData: "No data for this period", ready: "Connected · Read only",
    views: "Views", users: "Active users", sessions: "Sessions", live: "Realtime active users", liveRange: "Last 30 minutes", viewsHelp: "Views across all pages", usersHelp: "Active users identified by GA4", sessionsHelp: "Visits measured as GA4 sessions",
    trend: "Daily page views", table: "View daily data", date: "Date", pages: "Top pages", sources: "Traffic channels", top10: "Top 10", sourceUnit: "Sessions", zone: "Report time zone", fetched: "Fetched", unknownZone: "Not provided", limited: "Google indicates privacy thresholds, sampling or data restrictions may affect this report. Results may be incomplete.",
    delay: "Includes today, in the GA4 property’s time zone. Standard reports have processing delays. Only dates returned by the API are plotted; missing dates are not filled with zeros.", unavailable: "No data to display",
    errors: { expired: "Authorization expired. Please reconnect.", permission: "This account lacks access to this GA4 property, or Analytics access was not granted. Connect an authorized account.", apiDisabled: "Analytics Data API is not enabled for the Google project.", quota: "Google API quota is temporarily limited. Try refreshing later.", network: "The request failed or timed out. Check your connection and refresh.", invalidResponse: "Google returned an incomplete response. Please try again later.", authorization: "Read-only authorization was not completed. Reconnect and allow Analytics access.", popup: "The Google authorization window could not complete. Allow popups and try again." },
  },
};
type Text = typeof copy.zh | typeof copy.en;
function Problem({ error, text }: { error?: AnalyticsError; text: Text }) {
  return error ? <p role="alert" className={styles.notice}>{text.errors[error.code]}</p> : null;
}
function Trend({ points, text }: { points: DailyViews[]; text: Text }) {
  if (!points.length) return <p>{text.noData}</p>;
  const start = Date.parse(points[0].date), end = Date.parse(points[points.length - 1].date);
  const max = Math.max(1, ...points.map((point) => point.views));
  const x = (date: string) => end === start ? 310 : 40 + (Date.parse(date) - start) / (end - start) * 540;
  const y = (views: number) => 160 - views / max * 130;
  return <>
    <svg className={styles.chart} viewBox="0 0 620 200" role="img" aria-label={text.trend}>
      <line x1="40" y1="160" x2="580" y2="160" stroke="currentColor" opacity=".25" />
      <text x="8" y="30" fill="currentColor" fontSize="12">{max}</text><text x="16" y="163" fill="currentColor" fontSize="12">0</text>
      <polyline points={points.map((point) => `${x(point.date)},${y(point.views)}`).join(" ")} fill="none" stroke="var(--global-link-color)" strokeWidth="3" />
      {points.map((point) => <circle key={point.date} cx={x(point.date)} cy={y(point.views)} r="3" fill="var(--global-link-color)"><title>{point.date}: {point.views}</title></circle>)}
      <text x="40" y="190" fill="currentColor" fontSize="12">{points[0].date}</text><text x="580" y="190" textAnchor="end" fill="currentColor" fontSize="12">{points[points.length - 1].date}</text>
    </svg>
    <details><summary>{text.table}</summary><table className={styles.table}><thead><tr><th>{text.date}</th><th>{text.views}</th></tr></thead><tbody>{points.map((point) => <tr key={point.date}><td>{point.date}</td><td>{point.views.toLocaleString()}</td></tr>)}</tbody></table></details>
  </>;
}
function Ranking({ rows, unit, text }: { rows: RankedValue[]; unit: string; text: Text }) {
  const max = Math.max(1, ...rows.map((row) => row.value));
  return rows.length ? <ol className={styles.ranking}>{rows.map((row, index) => <li key={`${row.label}-${index}`}><div><span>{row.label}</span><strong>{row.value.toLocaleString()} <small>{unit}</small></strong></div><div className={styles.track} aria-hidden="true"><span style={{ width: `${row.value / max * 100}%` }} /></div></li>)}</ol> : <p>{text.noData}</p>;
}
export function StatsDashboard({ locale }: { locale: Locale }) {
  const text = copy[locale === "en" ? "en" : "zh"];
  const { stats } = getMessages(locale).pages;
  const [session] = useState(() => new DashboardSession());
  const state = useSyncExternalStore(session.subscribe, session.getSnapshot, session.getServerSnapshot);
  const [script, setScript] = useState<"loading" | "ready" | "error">("loading");
  const configured = !!analyticsConfig.oauthClientId;
  useEffect(() => {
    if (!configured || script !== "loading") return;
    const timer = setTimeout(() => setScript("error"), 15000);
    return () => clearTimeout(timer);
  }, [configured, script]);
  useEffect(() => {
    const check = () => session.checkExpiry();
    document.addEventListener("visibilitychange", check);
    return () => { document.removeEventListener("visibilitychange", check); session.dispose(); };
  }, [session]);
  const connected = state.connection === "connected";
  const history = state.history.data;
  const number = (value: number | undefined | null) => value == null ? "—" : value.toLocaleString(locale === "en" ? "en-US" : "zh-CN");
  return <section className={styles.dashboard} aria-labelledby="inline-stats-title">
    {configured && <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onReady={() => setScript(window.google?.accounts.oauth2 ? "ready" : "error")} onError={() => setScript("error")} />}
    <div className={styles.heading}><h2 id="inline-stats-title">{text.title}</h2><a href={analyticsConfig.dashboardUrl} target="_blank" rel="noopener noreferrer">{stats.openDashboard}</a></div>
    <p>{stats.coverageDescription}</p>
    {!connected && <p>{configured ? text.intro : text.missing}</p>}
    <div className={styles.controls}>
      {connected ? <><label className={styles.period}><span>{text.ready}</span><select aria-label={locale === "en" ? "Report period" : "统计范围"} value={state.days} onChange={(event) => session.setDays(Number(event.target.value) as 7 | 30)}><option value={7}>{text.days7}</option><option value={30}>{text.days30}</option></select></label><button onClick={session.refresh}>{text.refresh}</button><button onClick={session.disconnect}>{text.disconnect}</button></> : <>
        <button className={styles.primary} disabled={!configured || script !== "ready" || state.connection === "authorizing"} onClick={() => { if (window.google) session.connect(window.google.accounts.oauth2); }}>{state.connection === "authorizing" ? text.connecting : text.connect}</button>
        {state.connection === "authorizing" && <button onClick={session.disconnect}>{text.disconnect}</button>}
      </>}
    </div>
    <div aria-live="polite">{configured && script === "loading" && <p>{text.scriptLoading}</p>}{configured && script === "error" && <p role="alert">{text.scriptError}</p>}{state.connection === "expired" && <p>{text.expired}</p>}<Problem error={state.error} text={text} /></div>
    {connected && <>
      <div className={styles.cards}>
        {[[text.views, history?.summary?.views, text.viewsHelp], [text.users, history?.summary?.users, text.usersHelp], [text.sessions, history?.summary?.sessions, text.sessionsHelp]].map(([label, value, hint]) => <div className={styles.card} key={label as string}><h3>{label}</h3><strong>{number(value as number | undefined)}</strong><p>{state.history.status === "loading" ? text.loading : hint}</p><small>{state.days === 7 ? text.days7 : text.days30}</small></div>)}
        <div className={styles.card}><h3>{text.live}</h3><strong>{number(state.realtime.data)}</strong><p>{state.realtime.status === "loading" ? text.loading : text.liveRange}</p><Problem error={state.realtime.error} text={text} />{state.realtime.status === "success" && state.realtime.data === null && <small>{text.unavailable}</small>}{state.realtime.fetchedAt && <small>{text.fetched}: {new Date(state.realtime.fetchedAt).toLocaleTimeString()}</small>}</div>
      </div>
      <Problem error={state.history.error} text={text} />
      {history && <>
        {!history.summary && <p>{text.noData}</p>}{history.limited && <p className={styles.notice}>{text.limited}</p>}
        <section className={styles.panel}><h3>{text.trend}</h3><Trend points={history.trend} text={text} /></section>
        <div className={styles.rankings}><section className={styles.panel}><h3>{text.pages} <small>{text.top10}</small></h3><Ranking rows={history.pages} unit={text.views} text={text} /></section><section className={styles.panel}><h3>{text.sources} <small>{text.top10}</small></h3><Ranking rows={history.sources} unit={text.sourceUnit} text={text} /></section></div>
        <p className={styles.meta}>{text.zone}: {history.timeZone ?? text.unknownZone} · {text.fetched}: {state.history.fetchedAt && new Date(state.history.fetchedAt).toLocaleString()}</p>
      </>}
      <p className={styles.meta}>{text.delay}</p>
    </>}
    <p className={styles.meta}>{text.privacy}</p>
  </section>;
}
