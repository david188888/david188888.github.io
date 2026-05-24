"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { homeNavigation } from "@/config/navigation";

export function HomeNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 50);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
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
      <div className="flex items-center justify-between max-w-[1280px] mx-auto h-14 md:h-[3.2rem]">
        <Link
          href="/"
          className="font-serif text-lg font-semibold text-[#eef3fc] no-underline hover:text-[#f2f6ff] tracking-wide"
        >
          HongYu Liu
        </Link>
        <ul className="flex items-center gap-5 md:gap-6 m-0 p-0 list-none">
          {homeNavigation.map((link) => (
            <li key={link.title}>
              <a
                href={link.url}
                target={link.url.startsWith("http") || link.url.startsWith("mailto") ? "_blank" : undefined}
                rel={link.url.startsWith("http") ? "noopener noreferrer" : undefined}
                className="font-sans text-[0.82rem] font-medium text-[rgba(202,212,228,0.88)] no-underline tracking-wider transition-colors duration-200 hover:text-[#eef3fc]"
              >
                {link.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
