import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  educationRecords,
  internshipRecords,
  publicationRecords,
} from "@/config/profile";
import { competitionRecords, openSourceProjects } from "@/config/projects";
import { getPublishedPosts } from "@/lib/content/posts";

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
    expect(html.indexOf('aria-roledescription="carousel"')).toBeLessThan(html.indexOf('class="lens-bridge"'));
    expect(html.indexOf('class="lens-bridge"')).toBeLessThan(html.indexOf('id="education"'));
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
    expect(html).not.toContain("已合并");
    competitionRecords.forEach((record) => expect(html).toContain(record.award.zh));
  });

  it("does not show the future sample Insight", () => {
    const html = renderToStaticMarkup(<HomePageView locale="en" />);

    expect(html).not.toContain("future-post");
  });

  it("represents the newest published insights in an accessible auto-advancing carousel", () => {
    const posts = getPublishedPosts("en").slice(0, 5);
    const html = renderToStaticMarkup(<HomePageView locale="en" />);

    expect(html).toContain('aria-roledescription="carousel"');
    expect(html).toContain("Previous article");
    expect(html).toContain("Next article");
    expect(html).toContain(`1 / ${posts.length}`);
    expect(html).not.toContain("latest-insight-dots");
    expect(html).not.toContain("latest-insight-toggle");
    expect(html).not.toContain("Pause automatic rotation");

    const postLinks = posts.map((post) => `/en/insights/${post.slug}/`);
    expect((html.match(/class="latest-insight-slide"/g) ?? [])).toHaveLength(posts.length);
    postLinks.forEach((href, index) => {
      expect(html).toContain(`href="${href}"`);
      if (index > 0) expect(html.indexOf(postLinks[index - 1])).toBeLessThan(html.indexOf(href));
    });
    // The slide title is the article link; only the active slide is focusable.
    expect(html).toContain(`href="${postLinks[0]}" class="slide-link" tabindex="0"`);
    postLinks.slice(1).forEach((href) => {
      expect(html).toContain(`href="${href}" class="slide-link" tabindex="-1"`);
    });
    expect(html).not.toContain("Read the full article");
    expect(html).not.toContain('class="read"');
  });

  it.each(["en", "zh"] as const)("leads with the confirmed profile positioning for %s", (locale) => {
    const html = renderToStaticMarkup(<HomePageView locale={locale} />);

    const summary =
      locale === "zh"
        ? "软件工程与数据科学教育背景。关注技术如何走向产品与商业化，以及变化如何沿产业链重新分配价值。"
        : "Background in software engineering and data science. I focus on how technology moves toward products and commercialization, and how those shifts redistribute value across the industry chain.";
    expect(html).toContain(summary);
    expect(html).not.toContain("语音语言模型 · 安全与隐私");
    expect(html).not.toContain("AI 产业链研究");
    expect(html).not.toContain("Speech-language models");
    expect(html).not.toContain("AI supply-chain research");
  });

  it("bridges the hero and the record with the three-step investment lens", () => {
    const html = renderToStaticMarkup(<HomePageView locale="zh" />);

    expect(html).toContain("Investment Lens");
    expect(html).toContain("技术变化");
    expect(html).toContain("产品与商业化");
    expect(html).toContain("价值重新分配");
    expect(html.indexOf('class="home-hero-frame"')).toBeLessThan(html.indexOf('class="lens-bridge"'));
    expect(html.indexOf('class="lens-bridge"')).toBeLessThan(html.indexOf('id="education"'));
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

  it("renders course scores as separate accessible badges", () => {
    const html = renderToStaticMarkup(<HomePageView locale="zh" />);

    expect(html).toContain('<span>Python程序设计基础</span>');
    expect(html).toContain('<span class="course-score" aria-label="99 points">99</span>');
    expect(html).not.toContain("Python程序设计基础（99分）");
  });
});

describe("TradingAgentsPageView", () => {
  it.each(["en", "zh"] as const)("credits upstream and links both repositories for %s", (locale) => {
    const html = renderToStaticMarkup(<TradingAgentsPageView locale={locale} />);

    expect(html).toContain("https://github.com/david188888/TradingAgents");
    expect(html).toContain("https://github.com/TauricResearch/TradingAgents");
    expect(html).toContain('poster="/images/tradingagents-demo-poster.jpg"');
    expect(html).toContain('src="/videos/tradingagents-demo.mp4"');
    expect(html).toContain(locale === "zh" ? "上游与个人扩展" : "Upstream and personal extension");
    expect(html).toContain(locale === "zh" ? "不构成投资建议" : "not investment advice");
    expect(html).toContain(locale === "zh" ? "一条已完成的 002335.SZ 研究样例" : "A completed 002335.SZ research-only sample");
  });
});
