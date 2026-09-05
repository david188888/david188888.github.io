import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { InsightBody } from "../InsightBody";

describe("InsightBody", () => {
  it("renders embedded HTML blocks while keeping inline HTML inert", () => {
    const html = renderToStaticMarkup(
      <InsightBody
        body={'## Before\n\n<figure class="diagram">\n  <p>Flow</p>\n</figure>\n\nAfter <script>alert(\'x\')</script>'}
      />
    );

    expect(html).toContain("<h2>Before</h2>");
    expect(html).toContain('<figure class="diagram">');
    expect(html).toContain("<p>Flow</p>");
    expect(html).toContain("After &lt;script&gt;alert('x')&lt;/script&gt;");
    expect(html).not.toContain("<script>");
  });

  it("strips script blocks written as standalone HTML blocks", () => {
    const html = renderToStaticMarkup(
      <InsightBody body={"<div>ok</div>\n\n<script>alert('x')</script>\n\nTail"} />
    );

    expect(html).toContain("<div>ok</div>");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("alert");
  });

  it("keeps unknown tokens as text instead of treating them as components", () => {
    const html = renderToStaticMarkup(<InsightBody body="[[unknown-token]]" />);

    expect(html).toContain("[[unknown-token]]");
    expect(html).not.toContain("<figure");
  });
});
