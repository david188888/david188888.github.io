import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  educationRecords,
  internshipRecords,
  publicationRecords,
} from "@/config/profile";

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;");
}

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={String(href)} {...props}>{children}</a>
  ),
}));

import { CVPageView, PublicationsPageView } from "../SubpageViews";

describe("profile subpages", () => {
  it.each(["en", "zh"] as const)("renders every CV record for %s", (locale) => {
    const html = renderToStaticMarkup(<CVPageView locale={locale} />);

    educationRecords.forEach((record) => expect(html).toContain(escapeHtml(record.institution[locale])));
    internshipRecords.forEach((record) => expect(html).toContain(escapeHtml(record.role[locale])));
    publicationRecords.forEach((record) => expect(html).toContain(escapeHtml(record.title[locale])));
  });

  it.each(["en", "zh"] as const)("renders every publication record for %s", (locale) => {
    const html = renderToStaticMarkup(<PublicationsPageView locale={locale} />);

    publicationRecords.forEach((record) => expect(html).toContain(escapeHtml(record.title[locale])));
  });
});
