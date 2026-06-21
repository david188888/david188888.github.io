import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { LocalizedPost } from "@/lib/content/posts";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={String(href)} {...props}>
      {children}
    </a>
  ),
}));

import { buildHomeSections } from "../HomePageView";

const latest: LocalizedPost = {
  slug: "latest-note",
  title: "Latest note",
  excerpt: "One sentence summary.",
  date: "2026-06-18",
  tags: [],
  body: "Body",
  bodyHtml: "<p>Body</p>",
  locale: "en",
};

describe("buildHomeSections", () => {
  it("keeps the approved chapter order", () => {
    expect(buildHomeSections("en", [latest]).map(({ id }) => id)).toEqual([
      "profile",
      "research",
      "experience",
      "education",
      "insights",
    ]);
  });

  it("renders only the latest note preview and the Insights index link", () => {
    const insights = buildHomeSections("en", [latest]).find(({ id }) => id === "insights");
    const html = renderToStaticMarkup(<>{insights?.content}</>);

    expect(html).toContain("Latest note");
    expect(html).toContain("One sentence summary.");
    expect(html).toContain("/insights/latest-note/");
    expect(html).toContain("/insights/");
  });

  it("renders localized fallback copy when there is no published note", () => {
    const insights = buildHomeSections("zh", []).find(({ id }) => id === "insights");
    const html = renderToStaticMarkup(<>{insights?.content}</>);

    expect(html).toContain("这里是我公开整理分析的地方");
    expect(html).toContain("/zh/insights/");
  });
});
