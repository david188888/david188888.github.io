"use client";

import type { UserPath } from "@/lib/analytics/dashboard-data";
import styles from "./UserPaths.module.css";

interface UserPathsProps {
  paths: UserPath[];
  locale: "zh" | "en";
}

export function UserPaths({ paths, locale }: UserPathsProps) {
  const text = {
    zh: {
      title: "今日访客路径",
      noData: "今天暂无访问记录",
      from: "来自",
      pages: "访问页面",
      userGroup: "访客组",
    },
    en: {
      title: "Today's visitor paths",
      noData: "No visits recorded today",
      from: "From",
      pages: "Pages visited",
      userGroup: "Visitor group",
    },
  };

  if (!paths.length) {
    return (
      <div className={styles.empty}>
        <p>{text[locale].noData}</p>
      </div>
    );
  }

  return (
    <section className={styles.container}>
      <h3 className={styles.title}>{text[locale].title}</h3>
      <div className={styles.paths}>
        {paths.map((path, idx) => (
          <details key={`${path.userId}-${idx}`} className={styles.pathCard}>
            <summary className={styles.pathHeader}>
              <div className={styles.userInfo}>
                <span className={styles.userId}>{path.userId}</span>
                <span className={styles.location}>
                  {text[locale].from} {path.city}, {path.country}
                </span>
                <span className={styles.device}>
                  {path.device} · {path.browser}
                </span>
              </div>
              <span className={styles.pageCount}>
                {path.events.length} {text[locale].pages}
              </span>
            </summary>
            <ul className={styles.eventList}>
              {path.events.map((event, eventIdx) => (
                <li key={eventIdx} className={styles.event}>
                  <code className={styles.pagePath}>{event.pagePath}</code>
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </section>
  );
}
