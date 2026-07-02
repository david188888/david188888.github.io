"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { defaultLocale, type Locale } from "@/i18n/locales";
import { localizedHref } from "@/i18n/links";
import { homeSectionNavigation, type HomeSectionId } from "@/components/navigation/homeSectionNavigation";

interface HomeSectionRailProps {
  locale?: Locale;
}

interface SectionMeasurement {
  id: HomeSectionId;
  start: number;
}

interface SectionStop extends SectionMeasurement {
  position: number;
}

interface RailVisualState {
  activeId: HomeSectionId;
  itemPositions: Record<HomeSectionId, number>;
  pillHeight: number;
  pillY: number;
  ready: boolean;
}

const DEFAULT_POSITIONS = homeSectionNavigation.reduce<Record<HomeSectionId, number>>((positions, section, index) => {
  positions[section.id] = homeSectionNavigation.length > 1 ? index / (homeSectionNavigation.length - 1) : 0;
  return positions;
}, {} as Record<HomeSectionId, number>);

const initialRailState: RailVisualState = {
  activeId: "profile",
  itemPositions: DEFAULT_POSITIONS,
  pillHeight: 32,
  pillY: 0,
  ready: false,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function buildSectionStops(
  measurements: readonly SectionMeasurement[],
  maxScrollY = Number.POSITIVE_INFINITY,
): SectionStop[] {
  if (measurements.length === 0) return [];

  const reachableMax = Math.max(0, maxScrollY);
  const sorted = measurements
    .map((measurement) => ({
      ...measurement,
      start: clamp(measurement.start, 0, reachableMax),
    }))
    .sort((a, b) => a.start - b.start);
  const firstStart = sorted[0]?.start ?? 0;
  const lastStart = sorted[sorted.length - 1]?.start ?? firstStart;
  const span = Math.max(1, lastStart - firstStart);

  return sorted.map((measurement, index) => ({
    ...measurement,
    position: sorted.length > 1 ? clamp((measurement.start - firstStart) / span, 0, 1) : index,
  }));
}

export function resolveSectionRailProgress(stops: readonly SectionStop[], scrollY: number) {
  if (stops.length === 0) {
    return { activeId: "profile" as HomeSectionId, progress: 0, spanShare: 1 };
  }

  const activeIndex = stops.reduce((currentIndex, stop, index) => (scrollY >= stop.start ? index : currentIndex), 0);
  const activeStop = stops[activeIndex] ?? stops[0];
  const nextStop = stops[activeIndex + 1];
  const previousStop = stops[activeIndex - 1];

  if (!nextStop) {
    const previousSpan = previousStop ? Math.max(1, activeStop.start - previousStop.start) : 1;
    const totalSpan = Math.max(1, (stops[stops.length - 1]?.start ?? activeStop.start) - (stops[0]?.start ?? activeStop.start));
    return {
      activeId: activeStop.id,
      progress: activeStop.position,
      spanShare: clamp(previousSpan / totalSpan, 0.12, 0.48),
    };
  }

  const segmentSpan = Math.max(1, nextStop.start - activeStop.start);
  const localProgress = clamp((scrollY - activeStop.start) / segmentSpan, 0, 1);
  const totalSpan = Math.max(1, (stops[stops.length - 1]?.start ?? nextStop.start) - (stops[0]?.start ?? activeStop.start));

  return {
    activeId: activeStop.id,
    progress: activeStop.position + (nextStop.position - activeStop.position) * localProgress,
    spanShare: clamp(segmentSpan / totalSpan, 0.12, 0.48),
  };
}

function calculatePillHeight(trackHeight: number, spanShare: number) {
  return clamp(trackHeight * (0.07 + spanShare * 0.18), 28, 58);
}

export function HomeSectionRail({ locale = defaultLocale }: HomeSectionRailProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const [railState, setRailState] = useState<RailVisualState>(initialRailState);

  const updateRail = useCallback(() => {
    frameRef.current = null;

    const trackHeight = trackRef.current?.getBoundingClientRect().height ?? 0;
    const navOffset = 140;
    const maxScrollY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const measurements = homeSectionNavigation
      .map((section) => {
        const element = document.getElementById(section.id);
        if (!element) return null;

        return {
          id: section.id,
          start: Math.max(0, element.getBoundingClientRect().top + window.scrollY - navOffset),
        };
      })
      .filter((measurement): measurement is SectionMeasurement => Boolean(measurement));

    const stops = buildSectionStops(measurements, maxScrollY);
    const progress = resolveSectionRailProgress(stops, window.scrollY);
    const itemPositions = stops.reduce<Record<HomeSectionId, number>>((positions, stop) => {
      positions[stop.id] = stop.position;
      return positions;
    }, { ...DEFAULT_POSITIONS });
    const pillHeight = calculatePillHeight(trackHeight || 280, progress.spanShare);
    const pillY = progress.progress * Math.max(0, (trackHeight || 280) - pillHeight);

    setRailState({
      activeId: progress.activeId,
      itemPositions,
      pillHeight,
      pillY,
      ready: true,
    });
  }, []);

  useEffect(() => {
    function scheduleUpdate() {
      if (frameRef.current !== null) return;
      frameRef.current = window.requestAnimationFrame(updateRail);
    }

    scheduleUpdate();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [updateRail]);

  const railStyle = {
    "--rail-pill-y": `${railState.pillY}px`,
    "--rail-pill-height": `${railState.pillHeight}px`,
  } as CSSProperties;

  return (
    <nav className="home-section-rail" aria-label="Homepage sections" data-ready={railState.ready ? "true" : "false"} style={railStyle}>
      <div className="home-section-rail-inner">
        <div ref={trackRef} className="home-section-rail-track" aria-hidden="true">
          <span className="home-section-rail-pill" />
        </div>
        <ol className="home-section-rail-list">
          {homeSectionNavigation.map((section) => {
            const isActive = section.id === railState.activeId;
            const itemStyle = {
              "--rail-item-y": `${railState.itemPositions[section.id] * 100}%`,
            } as CSSProperties;

            return (
              <li key={section.id} className="home-section-rail-item" style={itemStyle}>
                <a
                  className="home-section-rail-link"
                  href={localizedHref(`/#${section.id}`, locale)}
                  aria-current={isActive ? "true" : undefined}
                >
                  {section.labels[locale]}
                </a>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
