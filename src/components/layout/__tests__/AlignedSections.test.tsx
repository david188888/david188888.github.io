import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AlignedSections, type AlignedPageSection } from "../AlignedSections";

describe("AlignedSections", () => {
  it("renders ordered rail links, matching sections, and mobile quick navigation", () => {
    const sections: AlignedPageSection[] = [
      { id: "profile", label: "Profile", content: <h1>Profile content</h1> },
      {
        id: "research",
        label: "Research",
        railContent: <span>Supplement</span>,
        content: <h2>Research content</h2>,
      },
    ];

    const html = renderToStaticMarkup(<AlignedSections sections={sections} />);

    expect(html).toContain('aria-label="Page sections"');
    expect(html).toContain('href="#profile"');
    expect(html).toContain('href="#research"');
    expect(html).toContain('id="profile"');
    expect(html).toContain('id="research"');
    expect(html).toContain("01");
    expect(html).toContain("02");
    expect(html).toContain("Supplement");
    expect(html.indexOf("Profile")).toBeLessThan(html.indexOf("Research"));
  });
});
