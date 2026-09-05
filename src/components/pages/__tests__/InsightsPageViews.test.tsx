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

import { buildInsightArticleSections } from "../InsightArticlePageView";
import { buildInsightsSections } from "../InsightsPageView";

const post: LocalizedPost = {
  slug: "note",
  title: "A published note",
  excerpt: "Short summary.",
  date: "2026-06-18",
  tags: ["AI"],
  body: "## Section\n\nBody",
  bodyHtml: "<h2>Section</h2><p>Body</p>",
  locale: "en",
};

describe("Insights section builders", () => {
  it("uses the approved index chapter order", () => {
    expect(buildInsightsSections("en", [post]).map(({ id }) => id)).toEqual([
      "insights",
      "published",
      "streams",
      "notebook",
    ]);
  });

  it("uses the shared article and reading rows", () => {
    const sections = buildInsightArticleSections("en", post);
    expect(sections.map(({ id }) => id)).toEqual(["article", "reading"]);

    const html = renderToStaticMarkup(
      <>{sections.map(({ id, content }) => <React.Fragment key={id}>{content}</React.Fragment>)}</>
    );
    expect(html).toContain("A published note");
    expect(html).toContain("Short summary.");
    expect(html).toContain('class="aligned-article-prose');
    expect(html).toContain("<h2>Section</h2>");
  });

  it("omits notebook items whose title is already published", () => {
    const duplicate = {
      ...post,
      title: "What changes when speech models become social agents?",
    };
    const notebook = buildInsightsSections("en", [duplicate]).find(
      ({ id }) => id === "notebook"
    );
    const html = renderToStaticMarkup(<>{notebook?.content}</>);

    expect(html).not.toContain("What changes when speech models become social agents?");
    expect(html).toContain("How AI product strategy shows up before earnings do");
  });

  it("keeps a localized return link when no article table of contents exists", () => {
    const article = buildInsightArticleSections("zh", { ...post, locale: "zh" });
    const rail = renderToStaticMarkup(<>{article[0].railContent}</>);

    expect(rail).toContain("返回随笔洞察");
    expect(rail).toContain("/zh/insights/");
  });
});
