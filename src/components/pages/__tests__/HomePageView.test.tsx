import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  educationRecords,
  internshipRecords,
  publicationRecords,
} from "@/config/profile";

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;");
}

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={String(href)} {...props}>{children}</a>
  ),
}));

vi.mock("@/components/navigation/HomeNav", () => ({
  HomeNav: () => <nav>Navigation</nav>,
}));

vi.mock("@/components/home/PointerGlow", () => ({
  PointerGlow: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/home/HomeScrollProgress", () => ({
  HomeScrollProgress: () => <div className="home-reading-progress" />,
}));

vi.mock("@/components/home/HomeSectionRail", () => ({
  HomeSectionRail: () => <nav className="home-section-rail">Section rail</nav>,
}));

import { HomePageView } from "../HomePageView";

describe("HomePageView", () => {
  it("renders the approved identity-first section order without obsolete campaign copy", () => {
    const html = renderToStaticMarkup(<HomePageView locale="en" />);
    const ids = ["profile", "education", "research", "experience", "insights"];

    ids.forEach((id) => expect(html).toContain(`id="${id}"`));
    ids.slice(1).forEach((id, index) => {
      expect(html.indexOf(`id="${ids[index]}"`)).toBeLessThan(html.indexOf(`id="${id}"`));
    });
    expect(html).toContain("HongYu Liu");
    expect(html).toContain("home-section-rail");
    expect(html).toContain("South China Normal University");
    expect(html).toContain("Insta360");
    expect(html).not.toContain("Current Direction");
    expect(html).not.toContain("Trustworthy speech systems, documented in public.");
    expect(html).not.toContain('class="home-profile');
  });

  it("does not show the future sample Insight", () => {
    const html = renderToStaticMarkup(<HomePageView locale="en" />);

    expect(html).not.toContain("future-post");
  });

  it.each(["en", "zh"] as const)("renders every configured profile record for %s", (locale) => {
    const html = renderToStaticMarkup(<HomePageView locale={locale} />);

    educationRecords.forEach((record) => expect(html).toContain(record.institution[locale]));
    internshipRecords.forEach((record) => {
      expect(html).toContain(escapeHtml(record.company[locale]));
      expect(html).toContain(escapeHtml(record.role[locale]));
    });
    publicationRecords.forEach((record) => expect(html).toContain(escapeHtml(record.title[locale])));
  });
});
