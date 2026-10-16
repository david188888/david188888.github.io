"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/locales";
import { readBrowserExclusion, saveBrowserExclusion } from "@/lib/analytics/browser-exclusion";
import styles from "./StatsDashboard.module.css";

export function BrowserExclusionControl({ locale }: { locale: Locale }) {
  const en = locale === "en";
  const [excluded, setExcluded] = useState<boolean | null>(null);
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => { setExcluded(readBrowserExclusion()); setChecked(true); }, []);
  function toggle() {
    if (excluded === null) return;
    setError(!saveBrowserExclusion(!excluded));
  }
  return <section className={styles.panel} aria-labelledby="browser-exclusion-title">
    <h2 id="browser-exclusion-title" className={styles.controlTitle}>{en ? "Your own visits" : "自己的访问"}</h2>
    <p role="status">{!checked ? (en ? "Checking this browser…" : "正在检查此浏览器…") : excluded === null ?
      (en ? "Cannot read this browser’s saved setting." : "无法读取此浏览器的保存设置。") : excluded ?
      (en ? "This browser is excluded from future analytics collection." : "此浏览器已排除：后续访问不再发送统计。") :
      (en ? "This browser is not excluded. Visits to the live site may be counted." : "此浏览器尚未排除：访问正式网站可能计入统计。")}</p>
    <div className={styles.controls}><button disabled={!checked || excluded === null} onClick={toggle}>
      {excluded ? (en ? "Include this browser again" : "恢复统计此浏览器") : (en ? "Exclude this browser" : "排除此浏览器的访问")}
    </button></div>
    <p className={styles.meta}>{en ?
      "Saving reloads this page and other open site tabs; reconnect Google afterward. Applies to this browser profile only. Set up other devices and browsers separately; incognito or clearing site data resets it. Past visits cannot be removed by this switch." :
      "保存会刷新当前页面及其他已打开的本站标签页，之后需重新连接 Google。仅对当前浏览器配置生效；手机、其他浏览器和无痕窗口需分别设置，清除网站数据会重置。此开关无法扣除历史访问。"}</p>
    {(error || (checked && excluded === null)) && <p role="alert" className={styles.notice}>{en ?
      "The setting could not be saved or read. Allow site storage in your browser and reload; exclusion has not been confirmed." :
      "设置未能保存或读取。请允许浏览器保存本站数据后重新加载；目前无法确认已排除。"}</p>}
  </section>;
}
