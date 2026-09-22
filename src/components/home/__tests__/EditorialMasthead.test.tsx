import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={String(href)} {...props}>{children}</a>
  ),
}));

vi.mock("@/components/navigation/LanguageSwitcher", () => ({
  LanguageSwitcher: () => <div className="masthead-lang">中文 EN</div>,
}));

import { EditorialMasthead } from "../EditorialMasthead";

describe("EditorialMasthead", () => {
  it("keeps branding, navigation, and utilities in dedicated logical groups", () => {
    const html = renderToStaticMarkup(<EditorialMasthead locale="zh" />);

    expect(html).toContain('class="wordmark"');
    expect(html).toContain('class="masthead-nav"');
    expect(html).toContain('class="masthead-tools"');
    expect(html.indexOf('class="wordmark"')).toBeLessThan(html.indexOf('class="masthead-nav"'));
    expect(html.indexOf('class="masthead-nav"')).toBeLessThan(html.indexOf('class="masthead-tools"'));
    expect(html).toContain("行业分析和思考");
    expect(html).toContain("科研");
    expect(html).toContain("项目与竞赛");
    expect(html).toContain("联系");
  });

  it("renders only localized light and dark theme controls", () => {
    const html = renderToStaticMarkup(<EditorialMasthead locale="zh" />);

    expect(html).toContain("浅色");
    expect(html).toContain("深色");
    expect(html).not.toContain("跟随系统");
    expect((html.match(/<button/g) ?? [])).toHaveLength(2);
  });
});
