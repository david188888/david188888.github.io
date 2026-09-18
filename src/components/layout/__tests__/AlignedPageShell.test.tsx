import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AlignedPageShell } from "../AlignedPageShell";

describe("AlignedPageShell", () => {
  it("appends a page modifier to the shell class list", () => {
    const html = renderToStaticMarkup(
      <AlignedPageShell className="aligned-page-shell--insights-list" sections={[]} />
    );

    expect(html).toMatch(
      /class="[^"]*\baligned-page-shell\b[^"]*\baligned-page-shell--insights-list\b[^"]*"/
    );
  });

  it("leaves no stray whitespace when no modifier is given", () => {
    const html = renderToStaticMarkup(<AlignedPageShell sections={[]} />);

    expect(html).toContain('class="home-motion-shell aligned-page-shell"');
    expect(html).not.toMatch(/class="[^"]*\s"/);
  });
});
