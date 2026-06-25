"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type MouseEvent,
} from "react";
import Link from "next/link";
import { defaultLocale, type Locale } from "@/i18n/locales";
import { localizedHref } from "@/i18n/links";
import { LanguageSwitcher } from "./LanguageSwitcher";

interface HomeNavProps {
  locale?: Locale;
}

const homeSectionNavigation = [
  { id: "profile", labels: { en: "Profile", zh: "主页" } },
  { id: "education", labels: { en: "Education", zh: "教育" } },
  { id: "research", labels: { en: "Research", zh: "研究" } },
  { id: "experience", labels: { en: "Experience", zh: "经历" } },
  { id: "insights", labels: { en: "Insights", zh: "随笔" } },
] as const;

export function HomeNav({ locale = defaultLocale }: HomeNavProps) {
  const itemRefs = useRef<Record<string, HTMLLIElement | null>>({});
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<(typeof homeSectionNavigation)[number]["id"]>("profile");
  const [indicator, setIndicator] = useState({ left: 0, width: 0, isVisible: false });

  const moveIndicator = useCallback((sectionId: string, isVisible = true) => {
    const item = itemRefs.current[sectionId];
    if (!item) return;

    setIndicator({
      left: item.offsetLeft,
      width: item.offsetWidth,
      isVisible,
    });
  }, []);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 50);

      let currentSection: typeof activeSection = "profile";
      for (const item of homeSectionNavigation) {
        const section = document.getElementById(item.id);
        if (section && section.getBoundingClientRect().top <= 140) {
          currentSection = item.id;
        }
      }
      setActiveSection(currentSection);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  useEffect(() => {
    moveIndicator(activeSection);
  }, [activeSection, moveIndicator]);

  function previewIndicator(event: MouseEvent<HTMLElement> | FocusEvent<HTMLElement>) {
    moveIndicator(event.currentTarget.dataset.sectionId ?? activeSection);
  }

  const indicatorStyle: CSSProperties = {
    transform: `translateX(${indicator.left}px)`,
    width: `${indicator.width}px`,
    opacity: indicator.isVisible ? 1 : 0,
  };

  return (
    <nav
      className={`home-nav fixed top-0 left-0 right-0 z-[100] px-[clamp(0.4rem,2vw,1.5rem)] border-b backdrop-blur-[14px] transition-all duration-400 ${
        scrolled
          ? "bg-[rgba(6,8,13,0.95)] border-[rgba(166,182,206,0.18)] shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
          : "bg-[rgba(6,8,13,0.78)] border-[rgba(166,182,206,0.1)]"
      }`}
      aria-label="Home navigation"
    >
      <div className="home-nav-inner flex items-center justify-between max-w-[1280px] mx-auto">
        <Link
          href={localizedHref("/", locale)}
          className="home-nav-brand font-serif text-lg font-semibold text-[#eef3fc] no-underline hover:text-[#f2f6ff] tracking-wide"
        >
          HongYu Liu
        </Link>
        <ul className="home-nav-items home-section-nav flex items-center m-0 p-0 list-none" onMouseLeave={() => moveIndicator(activeSection)}>
          <li className="home-section-nav-indicator" aria-hidden="true" style={indicatorStyle} />
          {homeSectionNavigation.map((item) => {
            const isActive = item.id === activeSection;
            return (
              <li
                key={item.id}
                ref={(node) => {
                  itemRefs.current[item.id] = node;
                }}
                className="home-nav-item home-section-nav-item"
                data-section-id={item.id}
                onMouseEnter={previewIndicator}
                onFocus={previewIndicator}
                onBlur={() => moveIndicator(activeSection)}
              >
                <a
                  href={localizedHref(`/#${item.id}`, locale)}
                  aria-current={isActive ? "true" : undefined}
                  className="home-nav-link home-section-nav-link font-sans text-[0.82rem] font-medium text-[rgba(202,212,228,0.88)] no-underline tracking-wider transition-colors duration-200 hover:text-[#eef3fc]"
                >
                  {item.labels[locale]}
                </a>
              </li>
            );
          })}
          <li className="m-0">
            <LanguageSwitcher variant="home" />
          </li>
        </ul>
      </div>
    </nav>
  );
}
