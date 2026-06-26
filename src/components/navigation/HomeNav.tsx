"use client";

import {
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import { defaultLocale, type Locale } from "@/i18n/locales";
import { localizedHref } from "@/i18n/links";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { homeSectionNavigation, type HomeSectionId } from "./homeSectionNavigation";

interface HomeNavProps {
  locale?: Locale;
}

export function HomeNav({ locale = defaultLocale }: HomeNavProps) {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<HomeSectionId>("profile");

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 50);

      let currentSection: HomeSectionId = "profile";
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
        <ul className="home-nav-items home-section-nav flex items-center m-0 p-0 list-none">
          {homeSectionNavigation.map((item) => {
            const isActive = item.id === activeSection;
            return (
              <li
                key={item.id}
                className="home-nav-item home-section-nav-item"
                data-section-id={item.id}
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
