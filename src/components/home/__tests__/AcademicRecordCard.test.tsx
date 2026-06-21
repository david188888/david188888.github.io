import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={String(href)} {...props}>{children}</a>
  ),
}));

import { AcademicRecordCard } from "../AcademicRecordCard";

describe("AcademicRecordCard", () => {
  it("renders semantic metadata and an explicit link without decorative arrows", () => {
    const html = renderToStaticMarkup(
      <AcademicRecordCard
        category="Research"
        meta="ICLR 2026 · Poster"
        title="VoxPrivacy"
        description="Interactional privacy benchmark."
        details={["Second author", "Speech LLM"]}
        href="https://example.com/paper"
        linkLabel="Paper"
        external
        emphasis="research"
      />
    );

    expect(html).toContain("<article");
    expect(html).toContain("VoxPrivacy");
    expect(html).toContain('href="https://example.com/paper"');
    expect(html).toContain("Paper");
    expect(html).not.toContain("academic-card-arrow");
    expect(html).not.toContain("→");
    expect(html).not.toContain("↗");
  });

  it("omits empty optional metadata", () => {
    const html = renderToStaticMarkup(
      <AcademicRecordCard
        category="Education"
        meta="B.Eng."
        title="SCNU"
        description="Software Engineering"
      />
    );

    expect(html).not.toContain("academic-card-details");
    expect(html).not.toContain("academic-card-link");
  });
});
