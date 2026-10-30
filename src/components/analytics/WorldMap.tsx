"use client";

import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import atlas from "world-atlas/countries-110m.json";
import type { RankedValue } from "@/lib/analytics/dashboard-data";
import styles from "./WorldMap.module.css";

const WIDTH = 960, HEIGHT = 470;
type Country = Feature<Geometry, { name: string }>;
const topology = atlas as unknown as Topology<{ countries: GeometryCollection<{ name: string }> }>;
const countries = (feature(topology, topology.objects.countries) as FeatureCollection<Geometry, { name: string }>)
  .features.filter((country) => country.properties.name !== "Antarctica") as Country[];
const projection = geoNaturalEarth1().fitSize([WIDTH, HEIGHT], { type: "FeatureCollection", features: countries });
const toPath = geoPath(projection);
const shapes = countries.map((country) => ({ name: country.properties.name, d: toPath(country) ?? "" }));

// GA4 country names that differ from the world-atlas (Natural Earth) names.
const atlasName: Record<string, string> = {
  "United States": "United States of America", "Congo - Kinshasa": "Dem. Rep. Congo", "Congo - Brazzaville": "Congo",
  "Dominican Republic": "Dominican Rep.", "Bosnia & Herzegovina": "Bosnia and Herz.", "North Macedonia": "Macedonia",
  "Côte d’Ivoire": "Côte d'Ivoire", "Central African Republic": "Central African Rep.", "South Sudan": "S. Sudan",
  "Türkiye": "Turkey", "Myanmar (Burma)": "Myanmar", "Solomon Islands": "Solomon Is.", "Falkland Islands (Islas Malvinas)": "Falkland Is.",
};
// Places too small for the 110m atlas are drawn as dots instead of shapes.
const smallPlaces: Record<string, [number, number]> = {
  "Singapore": [103.82, 1.35], "Hong Kong": [114.17, 22.32], "Macao": [113.54, 22.19], "Bahrain": [50.56, 26.07],
  "Malta": [14.38, 35.94], "Maldives": [73.22, 3.2], "Mauritius": [57.55, -20.35],
};

interface WorldMapProps {
  countries: RankedValue[];
  cities: RankedValue[];
  locale: "zh" | "en";
}

export function WorldMap({ countries: visits, cities, locale }: WorldMapProps) {
  const text = locale === "zh"
    ? { title: "访客地理分布", noData: "暂无地理数据", users: "用户", unknown: "未知位置", fewer: "少", more: "多" }
    : { title: "Visitor locations", noData: "No geographic data", users: "users", unknown: "Unknown location", fewer: "Fewer", more: "More" };
  const known = visits.filter((row) => row.label !== "(not set)");
  const unknown = visits.find((row) => row.label === "(not set)")?.value ?? 0;
  if (!known.length && !unknown) return <p className={styles.empty}>{text.noData}</p>;

  const max = Math.max(1, ...known.map((row) => row.value));
  // Square-root scale keeps one large country from washing out the rest.
  const strength = (users: number) => 0.3 + 0.7 * Math.sqrt(users / max);
  const byAtlasName = new Map(known.map((row) => [atlasName[row.label] ?? row.label, row]));
  const label = (row: RankedValue) => {
    const topCities = cities
      .map((city) => city.label.split(" · "))
      .filter(([country, , city]) => country === row.label && city && city !== "(not set)")
      .slice(0, 3).map((parts) => parts[2]);
    return `${row.label}: ${row.value} ${text.users}${topCities.length ? ` · ${topCities.join(", ")}` : ""}`;
  };
  const dots = known.filter((row) => smallPlaces[row.label]).map((row) => {
    const [x, y] = projection(smallPlaces[row.label]) ?? [0, 0];
    return { row, x, y };
  });

  return (
    <figure className={styles.container}>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className={styles.map} role="img" aria-label={text.title}>
        {shapes.map(({ name, d }) => {
          const row = byAtlasName.get(name);
          return (
            <path key={name} d={d} className={row ? styles.visited : styles.country}
              style={row ? { fillOpacity: strength(row.value) } : undefined}>
              <title>{row ? label(row) : name}</title>
            </path>
          );
        })}
        {dots.map(({ row, x, y }) => (
          <circle key={row.label} cx={x} cy={y} r={5} className={styles.dot} style={{ fillOpacity: strength(row.value) }}>
            <title>{label(row)}</title>
          </circle>
        ))}
      </svg>
      <figcaption className={styles.caption}>
        <span className={styles.scale}>{text.fewer}<span className={styles.gradient} aria-hidden="true" />{text.more}</span>
        {unknown > 0 && <span>{text.unknown}: {unknown} {text.users}</span>}
      </figcaption>
    </figure>
  );
}
