import { describe, expect, it } from "vitest";
import {
  addLocalePrefix,
  getLocaleFromPathname,
  stripLocalePrefix,
  switchLocalePathname,
} from "../routing";

describe("locale routing", () => {
  it("detects locale-prefixed paths", () => {
    expect(getLocaleFromPathname("/")).toBe("zh");
    expect(getLocaleFromPathname("/en/insights/")).toBe("en");
    expect(getLocaleFromPathname("/zh/cv/")).toBe("zh");
    expect(getLocaleFromPathname("/insights/")).toBe("zh");
  });

  it("strips locale prefixes while preserving trailing slashes", () => {
    expect(stripLocalePrefix("/en/insights/")).toBe("/insights/");
    expect(stripLocalePrefix("/zh/insights/post-a/")).toBe("/insights/post-a/");
    expect(stripLocalePrefix("/")).toBe("/");
  });

  it("adds locale prefixes for non-default locale", () => {
    expect(addLocalePrefix("/", "zh")).toBe("/");
    expect(addLocalePrefix("/insights/", "zh")).toBe("/insights/");
    expect(addLocalePrefix("/insights/", "en")).toBe("/en/insights/");
  });

  it("switches between locale-prefixed paths", () => {
    expect(switchLocalePathname("/en/insights/", "zh")).toBe("/insights/");
    expect(switchLocalePathname("/zh/insights/post-a/", "en")).toBe("/en/insights/post-a/");
    expect(switchLocalePathname("/", "en")).toBe("/en/");
    expect(switchLocalePathname("/en/", "zh")).toBe("/");
    expect(switchLocalePathname("/", "zh")).toBe("/");
  });
});
