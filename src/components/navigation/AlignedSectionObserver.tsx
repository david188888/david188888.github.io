"use client";

import { useEffect } from "react";

interface AlignedSectionObserverProps {
  sectionIds: readonly string[];
}

export function AlignedSectionObserver({ sectionIds }: AlignedSectionObserverProps) {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-aligned-sections]");
    if (!root || sectionIds.length === 0) return;

    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => Boolean(section));
    const links = Array.from(
      root.querySelectorAll<HTMLElement>("[data-aligned-section-link]")
    );

    function activate(id: string) {
      links.forEach((link) => {
        const active = link.dataset.alignedSectionLink === id;
        link.dataset.active = String(active);
        if (active) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    }

    function updateActiveSection() {
      const mastheadOffset = 72;
      const active = sections.reduce((current, section) => {
        return section.getBoundingClientRect().top <= mastheadOffset ? section : current;
      }, sections[0]);
      activate(active.id);
    }

    activate(sections[0].id);
    if (!("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(updateActiveSection, {
      rootMargin: "-72px 0px -60% 0px",
      threshold: [0, 0.25, 0.5, 1],
    });
    sections.forEach((section) => observer.observe(section));
    window.addEventListener("hashchange", updateActiveSection);

    return () => {
      observer.disconnect();
      window.removeEventListener("hashchange", updateActiveSection);
    };
  }, [sectionIds]);

  return null;
}
