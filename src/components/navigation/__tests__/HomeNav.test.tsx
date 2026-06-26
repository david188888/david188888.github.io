import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={String(href)} {...props}>{children}</a>
  ),
}));

vi.mock("../LanguageSwitcher", () => ({
  LanguageSwitcher: () => <div data-testid="language-switcher">Language</div>,
}));

import { HomeNav } from "../HomeNav";

describe("HomeNav", () => {
  it("renders homepage section anchors without the old top sliding indicator", () => {
    const html = renderToStaticMarkup(<HomeNav locale="en" />);

    expect(html).toContain('href="/#profile"');
    expect(html).toContain('href="/#education"');
    expect(html).toContain('href="/#research"');
    expect(html).toContain('href="/#experience"');
    expect(html).toContain('href="/#insights"');
    expect(html).not.toContain("home-section-nav-indicator");
    expect(html).not.toContain('href="/files/Resume_en.pdf"');
    expect(html).not.toContain('href="https://github.com/david188888"');
  });
});
