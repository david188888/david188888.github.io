import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

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
});
