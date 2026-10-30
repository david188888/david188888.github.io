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
        {/* World map continents with better visibility */}
        <g fill="none" stroke="var(--global-text-color)" strokeWidth="2" opacity="0.3">
          {/* Asia */}
          <path d="M 680 140 L 750 130 L 820 140 L 870 155 L 910 180 L 920 210 L 910 240 L 880 265 L 840 275 L 800 270 L 770 255 L 750 235 L 735 210 L 730 185 L 740 160 L 720 180 L 700 200 L 685 220 L 680 245 L 690 270 L 710 285 L 740 290" />
          {/* Europe */}
          <path d="M 480 130 L 510 125 L 540 130 L 570 140 L 590 155 L 600 175 L 595 195 L 580 210 L 555 215 L 530 210 L 505 195 L 490 175 L 485 155" />
          {/* Africa */}
          <path d="M 480 200 L 510 195 L 540 200 L 565 215 L 585 240 L 595 275 L 600 310 L 595 345 L 580 375 L 555 395 L 525 405 L 495 405 L 470 395 L 450 375 L 440 345 L 435 310 L 440 275 L 450 240 L 465 220" />
          {/* North America */}
          <path d="M 120 135 L 160 125 L 200 130 L 240 145 L 270 165 L 290 190 L 295 220 L 285 250 L 265 275 L 235 290 L 200 295 L 165 285 L 135 265 L 115 235 L 105 200 L 110 165" />
          {/* South America */}
          <path d="M 260 280 L 285 275 L 310 285 L 325 305 L 335 335 L 340 370 L 335 405 L 320 430 L 295 445 L 270 450 L 245 445 L 225 430 L 215 405 L 215 370 L 220 335 L 230 305 L 245 290" />
          {/* Australia */}
          <path d="M 810 350 L 850 345 L 885 355 L 910 375 L 915 400 L 905 420 L 880 430 L 850 435 L 820 430 L 795 415 L 785 395 L 785 375" />
        </g>

        {/* Grid lines for reference */}
        <g stroke="var(--global-border-color)" strokeWidth="1" opacity="0.15">
          <line x1="50" y1="250" x2="950" y2="250" />
          <line x1="500" y1="50" x2="500" y2="450" />
        </g>

        {/* Location markers */}
        {locations.map((loc, idx) => {
          const { x, y } = project(loc.latitude, loc.longitude);
          const radius = 8 + (loc.users / maxUsers) * 20; // 8-28px radius
          const opacity = 0.8 + (loc.users / maxUsers) * 0.2;

          return (
            <g key={`${loc.country}-${loc.city}-${idx}`}>
              {/* Outer glow */}
              <circle
                cx={x}
                cy={y}
                r={radius + 6}
                fill="var(--global-link-color)"
                opacity={0.2}
              />
              {/* Main marker */}
              <circle
                cx={x}
                cy={y}
                r={radius}
                fill="var(--global-link-color)"
                opacity={opacity}
                stroke="rgba(255, 255, 255, 0.8)"
                strokeWidth="2.5"
                className={styles.marker}
              >
                <title>{`${loc.city}, ${loc.country}: ${loc.users} ${locale === "zh" ? "用户" : "users"}`}</title>
              </circle>
              {/* Inner highlight */}
              <circle
                cx={x}
                cy={y}
                r={radius * 0.4}
                fill="white"
                opacity={0.7}
              />
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={styles.dot} style={{ width: "8px", height: "8px" }} />
          {locale === "zh" ? "少量访客" : "Fewer visitors"}
        </span>
        <span className={styles.legendItem}>
          <span className={styles.dot} style={{ width: "16px", height: "16px" }} />
          {locale === "zh" ? "大量访客" : "More visitors"}
        </span>
      </div>
    </div>
  );
}
