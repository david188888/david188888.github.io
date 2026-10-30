"use client";

import { useMemo } from "react";
import type { GeoLocation } from "@/lib/analytics/dashboard-data";
import styles from "./WorldMap.module.css";

interface WorldMapProps {
  locations: GeoLocation[];
  locale: "zh" | "en";
}

export function WorldMap({ locations, locale }: WorldMapProps) {
  const maxUsers = useMemo(() =>
    Math.max(1, ...locations.map(loc => loc.users)),
    [locations]
  );

  // Convert lat/lng to SVG coordinates (simplified mercator projection)
  const project = (lat: number, lng: number) => {
    const x = ((lng + 180) / 360) * 900 + 50;
    const latRad = (lat * Math.PI) / 180;
    const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
    const y = 250 - (mercN / (2 * Math.PI)) * 400;
    return { x, y };
  };

  const text = {
    zh: { title: "访客地理分布", noData: "暂无地理数据" },
    en: { title: "Visitor locations", noData: "No geographic data" },
  };

  if (!locations.length) {
    return <p className={styles.empty}>{text[locale].noData}</p>;
  }

  return (
    <div className={styles.container}>
      <svg viewBox="0 0 1000 500" className={styles.map} role="img" aria-label={text[locale].title}>
        {/* Simplified world map outline */}
        <path
          d="M 50 250 Q 200 200 350 250 T 650 250 Q 800 200 950 250 L 950 400 Q 800 450 650 400 T 350 400 Q 200 450 50 400 Z"
          fill="var(--global-bg-color-light)"
          stroke="var(--global-border-color)"
          strokeWidth="1"
          opacity="0.3"
        />

        {/* Location markers */}
        {locations.map((loc, idx) => {
          const { x, y } = project(loc.latitude, loc.longitude);
          const radius = 3 + (loc.users / maxUsers) * 15; // 3-18px radius
          const opacity = 0.4 + (loc.users / maxUsers) * 0.6;

          return (
            <g key={`${loc.country}-${loc.city}-${idx}`}>
              <circle
                cx={x}
                cy={y}
                r={radius}
                fill="var(--global-link-color)"
                opacity={opacity}
                className={styles.marker}
              >
                <title>{`${loc.city}, ${loc.country}: ${loc.users} ${locale === "zh" ? "用户" : "users"}`}</title>
              </circle>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={styles.dot} style={{ width: "6px", height: "6px" }} />
          {locale === "zh" ? "少量访客" : "Fewer visitors"}
        </span>
        <span className={styles.legendItem}>
          <span className={styles.dot} style={{ width: "12px", height: "12px" }} />
          {locale === "zh" ? "大量访客" : "More visitors"}
        </span>
      </div>
    </div>
  );
}
