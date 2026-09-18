"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { localeLabels, locales, type Locale } from "@/i18n/locales";
import { getLocaleFromPathname, switchLocalePathname } from "@/i18n/routing";

interface LanguageSwitcherProps {
  /** `editorial` matches the homepage/Insights masthead; the default suits the subpage masthead. */
  variant?: "masthead" | "editorial";
}

export function LanguageSwitcher({ variant = "masthead" }: LanguageSwitcherProps) {
  const pathname = usePathname() ?? "/";
  const currentLocale = getLocaleFromPathname(pathname);
  const isEditorial = variant === "editorial";

  function handleSelect(locale: Locale) {
    try {
      window.localStorage.setItem("preferredLocale", locale);
    } catch {
      // Ignore unavailable storage; navigation should still work.
    }
  }

  return (
    <div
      className={isEditorial ? "masthead-lang" : "flex items-center gap-1"}
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
              isEditorial
                ? undefined
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
