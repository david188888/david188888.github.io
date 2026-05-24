"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mainNavigation } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { ThemeToggle } from "./ThemeToggle";
import { useState } from "react";

export function Masthead() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="masthead fixed top-0 w-full z-20 bg-[var(--global-bg-color)] border-b border-[var(--global-border-color)]">
      <div className="flex items-center justify-between max-w-[1280px] mx-auto px-4 py-2">
        <nav className="greedy-nav flex items-center min-w-[250px] w-full">
          <button
            className="md:hidden p-1 mr-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span className="block w-7 h-1 bg-[var(--global-text-color)] rounded-sm my-1" />
            <span className="block w-7 h-1 bg-[var(--global-text-color)] rounded-sm my-1" />
            <span className="block w-7 h-1 bg-[var(--global-text-color)] rounded-sm my-1" />
          </button>

          <Link
            href="/"
            className={`font-bold text-[var(--global-masthead-link-color)] no-underline px-2 ${
              pathname === "/" ? "border-b-2 border-[var(--global-base-color)]" : ""
            }`}
          >
            {siteConfig.title}
          </Link>

          <ul
            className={`${
              menuOpen ? "flex" : "hidden"
            } md:flex items-center gap-1 m-0 p-0 list-none absolute md:static top-full left-0 right-0 bg-[var(--global-bg-color)] md:bg-transparent flex-col md:flex-row border-b md:border-b-0 border-[var(--global-border-color)]`}
          >
            {mainNavigation.map((link) => {
              const isActive =
                link.url === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.url.replace(/\/$/, ""));
              return (
                <li key={link.title} className="m-0">
                  <Link
                    href={link.url}
                    className={`block px-4 py-2 md:py-0.5 text-[var(--global-masthead-link-color)] no-underline hover:text-[var(--global-masthead-link-color-hover)] transition-colors ${
                      isActive ? "font-bold" : ""
                    }`}
                  >
                    {link.title}
                  </Link>
                </li>
              );
            })}
            <li className="m-0 px-4 py-2 md:py-0">
              <ThemeToggle />
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
