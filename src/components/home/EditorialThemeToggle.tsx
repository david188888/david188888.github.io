"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/locales";
import {
  EDITORIAL_THEME_KEY,
  isEditorialThemePreference,
  type EditorialThemePreference,
} from "./editorialTheme";

const options: readonly { preference: EditorialThemePreference; label: Record<Locale, string> }[] = [
  { preference: "system", label: { en: "System", zh: "跟随系统" } },
  { preference: "light", label: { en: "Light", zh: "浅色" } },
  { preference: "dark", label: { en: "Dark", zh: "深色" } },
];

function resolve(preference: EditorialThemePreference) {
  if (preference === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return preference;
}

function apply(preference: EditorialThemePreference) {
  document.documentElement.setAttribute("data-ed-theme", resolve(preference));
}

export function EditorialThemeToggle({ locale }: { locale: Locale }) {
  const [preference, setPreference] = useState<EditorialThemePreference>("system");

  useEffect(() => {
    let stored = "system";
    try {
      stored = window.localStorage.getItem(EDITORIAL_THEME_KEY) ?? "system";
    } catch {
      // Storage unavailable: the pre-paint script already used the system setting.
    }
    if (isEditorialThemePreference(stored)) setPreference(stored);
  }, []);

  function choose(next: EditorialThemePreference) {
    setPreference(next);
    apply(next);
    try {
      window.localStorage.setItem(EDITORIAL_THEME_KEY, next);
    } catch {
      // The preference still applies for this page view.
    }
  }

  return (
    <div className="ed-theme-switch" role="group" aria-label={locale === "zh" ? "显示模式" : "Display mode"}>
      {options.map((option) => (
        <button
          key={option.preference}
          type="button"
          aria-pressed={preference === option.preference}
          onClick={() => choose(option.preference)}
        >
          {option.label[locale]}
        </button>
      ))}
    </div>
  );
}
