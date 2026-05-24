"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { FiSun, FiMoon } from "react-icons/fi";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="w-5 h-5" />;

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-1 text-[var(--global-masthead-link-color)] hover:text-[var(--global-masthead-link-color-hover)] transition-colors"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? <FiSun size={18} /> : <FiMoon size={18} />}
    </button>
  );
}
