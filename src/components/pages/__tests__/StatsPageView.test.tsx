import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { analyticsConfig } from "@/config/analytics";
import { getMessages } from "@/i18n/messages";
import { StatsPageView } from "../StatsPageView";

describe("stats dashboard entry", () => {
  it.each(["zh", "en"] as const)("opens the correct private property without a site login in %s", (locale) => {
    const html = renderToStaticMarkup(<StatsPageView locale={locale} />);
    const { stats } = getMessages(locale).pages;
    expect(html).toContain(`href="${analyticsConfig.dashboardUrl}"`);
    expect(html).toContain(stats.openDashboard);
    expect(html).toContain(stats.coverageDescription);
    expect(html.indexOf(`href="${analyticsConfig.dashboardUrl}"`)).toBeLessThan(html.indexOf("<details"));
    expect(html).toContain(stats.authorToolsTitle);
    expect(html).toContain('id="stats-username"');
    expect(html).toContain('id="stats-password"');
  });
});
