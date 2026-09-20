"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/locales";
import {
  EDITORIAL_THEME_KEY,
  isEditorialThemePreference,
  type EditorialThemePreference,
} from "./editorialTheme";

const options: readonly { preference: EditorialThemePreference; label: Record<Locale, string> }[] = [
  { preference: "light", label: { en: "Light", zh: "浅色" } },
  { preference: "dark", label: { en: "Dark", zh: "深色" } },
];

function apply(preference: EditorialThemePreference) {
  document.documentElement.setAttribute("data-ed-theme", preference);
}

export function EditorialThemeToggle({ locale }: { locale: Locale }) {
  const [preference, setPreference] = useState<EditorialThemePreference>("light");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(EDITORIAL_THEME_KEY) ?? "light";
      if (isEditorialThemePreference(stored)) setPreference(stored);
    } catch {
      // Storage unavailable: the pre-paint script already selected light.
    }
  }, []);

  function choose(next: EditorialThemePreference) {
    setPreference(next);
    apply(next);
    try {
      // A legacy "system" value is replaced the next time the visitor chooses a mode.
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
