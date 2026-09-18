import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  educationRecords,
  internshipRecords,
  publicationRecords,
} from "@/config/profile";
import { competitionRecords, openSourceProjects } from "@/config/projects";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={String(href)} {...props}>{children}</a>
  ),
}));

vi.mock("@/components/home/EditorialMasthead", () => ({
  EditorialMasthead: () => <header className="masthead">Masthead</header>,
}));

import { HomePageView } from "../HomePageView";
import { TradingAgentsPageView } from "../TradingAgentsPageView";
import HomePage from "@/app/page";

const sectionOrder = ["education", "experience", "research", "projects", "contact"];

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;");
}

describe("HomePageView", () => {
  it("renders the unprefixed homepage in Chinese", () => {
    const html = renderToStaticMarkup(<HomePage />);

    expect(html).toBe(renderToStaticMarkup(<HomePageView locale="zh" />));
    educationRecords.forEach((record) => expect(html).toContain(record.institution.zh));
    expect(html).not.toContain("South China Normal University");
  });

  it("renders the approved reading order and opens on the latest essay", () => {
    const html = renderToStaticMarkup(<HomePageView locale="en" />);

    expect(html).toContain('id="profile-name"');
    sectionOrder.forEach((id) => expect(html).toContain(`id="${id}"`));
    sectionOrder.slice(1).forEach((id, index) => {
      expect(html.indexOf(`id="${sectionOrder[index]}"`)).toBeLessThan(html.indexOf(`id="${id}"`));
    });
    expect(html.indexOf('class="feature"')).toBeLessThan(html.indexOf('id="education"'));
    expect(html).toContain("HongYu Liu");
    expect(html).toContain("South China Normal University");
    expect(html).toContain("Insta360");
    expect(html).not.toContain("home-section-rail");
  });

  it("shows the coursework recorded for each degree", () => {
    const html = renderToStaticMarkup(<HomePageView locale="en" />);

    expect(html).toContain("Market Microstructure and Algorithmic Trading");
    expect(html).toContain("Data Structures and Algorithms");
    expect(html).not.toContain("Matriculation: Sep 2026");
  });

  it("keeps upstream credit and merged status honest in the projects section", () => {
    const html = renderToStaticMarkup(<HomePageView locale="zh" />);

    expect(html).toContain("TauricResearch/TradingAgents");
    expect(html).toContain("上游项目");
    openSourceProjects.forEach((project) => {
      expect(html).toContain(project.name);
      project.contributions.forEach((contribution) => {
        expect(html).toContain(contribution.pullRequestUrl);
      });
    });
    expect(html.match(/已合并/g)).toHaveLength(2);
    competitionRecords.forEach((record) => expect(html).toContain(record.award.zh));
  });

  it("does not show the future sample Insight", () => {
    const html = renderToStaticMarkup(<HomePageView locale="en" />);

    expect(html).not.toContain("future-post");
  });

  it.each(["en", "zh"] as const)("renders every configured profile record for %s", (locale) => {
    const html = renderToStaticMarkup(<HomePageView locale={locale} />);

    educationRecords.forEach((record) => expect(html).toContain(record.institution[locale]));
    internshipRecords.forEach((record) => {
      expect(html).toContain(escapeHtml(record.company[locale]));
      expect(html).toContain(escapeHtml(record.role[locale]));
    });
    publicationRecords.forEach((record) => expect(html).toContain(escapeHtml(record.title[locale])));
  });
});

describe("TradingAgentsPageView", () => {
  it.each(["en", "zh"] as const)("credits upstream and links both repositories for %s", (locale) => {
    const html = renderToStaticMarkup(<TradingAgentsPageView locale={locale} />);

    expect(html).toContain("https://github.com/david188888/TradingAgents");
    expect(html).toContain("https://github.com/TauricResearch/TradingAgents");
    expect(html).toContain("/images/tradingagents-console.png");
    expect(html).toContain(locale === "zh" ? "上游与个人扩展" : "Upstream and personal extension");
    expect(html).toContain(locale === "zh" ? "不构成投资建议" : "not investment advice");
  });
});
