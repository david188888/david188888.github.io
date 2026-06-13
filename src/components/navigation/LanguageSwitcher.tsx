"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { localeLabels, locales, type Locale } from "@/i18n/locales";
import { getLocaleFromPathname, switchLocalePathname } from "@/i18n/routing";

interface LanguageSwitcherProps {
  variant?: "home" | "masthead";
}

export function LanguageSwitcher({ variant = "masthead" }: LanguageSwitcherProps) {
  const pathname = usePathname() ?? "/";
  const currentLocale = getLocaleFromPathname(pathname);
  const isHome = variant === "home";

  function handleSelect(locale: Locale) {
    try {
      window.localStorage.setItem("preferredLocale", locale);
    } catch {
      // Ignore unavailable storage; navigation should still work.
    }
  }

  return (
    <div
      className={
        isHome
          ? "flex items-center gap-1 border-l border-[rgba(166,182,206,0.18)] pl-2"
          : "flex items-center gap-1"
      }
      aria-label="Language selector"
    >
      {locales.map((locale) => {
        const isActive = locale === currentLocale;
        return (
          <Link
            key={locale}
            href={switchLocalePathname(pathname, locale)}
            onClick={() => handleSelect(locale)}
            aria-current={isActive ? "page" : undefined}
            className={
              isHome
                ? `rounded px-1.5 py-1 text-[0.72rem] font-semibold no-underline transition-colors ${
                    isActive
                      ? "text-[#eef3fc]"
                      : "text-[rgba(202,212,228,0.68)] hover:text-[#eef3fc]"
                  }`
                : `rounded px-1.5 py-0.5 text-xs no-underline transition-colors ${
                    isActive
                      ? "font-bold text-[var(--global-masthead-link-color)]"
                      : "text-[var(--global-masthead-link-color)] hover:text-[var(--global-masthead-link-color-hover)]"
                  }`
            }
          >
            {localeLabels[locale]}
          </Link>
        );
      })}
    </div>
  );
}
