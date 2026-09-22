"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { localeLabels, locales, type Locale } from "@/i18n/locales";
import { getLocaleFromPathname, switchLocalePathname } from "@/i18n/routing";
import { useEffect, useRef, useState } from "react";

interface LanguageSwitcherProps {
  /** `editorial` matches the homepage/Insights masthead; the default suits the subpage masthead. */
  variant?: "masthead" | "editorial";
}

export function LanguageSwitcher({ variant = "masthead" }: LanguageSwitcherProps) {
  const pathname = usePathname() ?? "/";
  const currentLocale = getLocaleFromPathname(pathname);
  const isEditorial = variant === "editorial";
  const [open, setOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !switcherRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function handleSelect(locale: Locale) {
    try {
      window.localStorage.setItem("preferredLocale", locale);
    } catch {
      // Ignore unavailable storage; navigation should still work.
    }
  }

  return (
    <div ref={switcherRef} className={isEditorial ? "masthead-lang" : "relative flex items-center"}>
      <button
        type="button"
        className={isEditorial ? "masthead-lang-trigger" : "flex items-center gap-1 rounded px-1.5 py-0.5 text-xs"}
        aria-label={`Language: ${localeLabels[currentLocale]}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {isEditorial && <span className="masthead-globe" aria-hidden="true" />}
        <span>Language</span>
        <span aria-hidden="true">⌄</span>
      </button>
      {open && (
        <div
          className={isEditorial ? "masthead-lang-menu" : "absolute right-0 top-full z-20 mt-2 grid min-w-24 gap-1 rounded border bg-[var(--global-bg-color)] p-1 shadow"}
          role="menu"
          aria-label="Language options"
        >
      {locales.map((locale) => {
        const isActive = locale === currentLocale;
        return (
          <Link
            key={locale}
            href={switchLocalePathname(pathname, locale)}
            onClick={() => handleSelect(locale)}
            aria-current={isActive ? "page" : undefined}
            role="menuitem"
            className={
              isEditorial
                ? isActive
                  ? "active"
                  : undefined
                : `rounded px-1.5 py-0.5 text-xs no-underline transition-colors ${
                    isActive
                      ? "font-bold text-[var(--global-masthead-link-color)]"
                      : "text-[var(--global-masthead-link-color)] hover:text-[var(--global-masthead-link-color-hover)]"
                  }`
            }
          >
            {locale === "en" ? "English" : localeLabels[locale]}
          </Link>
        );
      })}
        </div>
      )}
    </div>
  );
}
