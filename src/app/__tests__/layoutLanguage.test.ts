import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { defaultLocale } from "@/i18n/locales";
import { describe, expect, it } from "vitest";

const layout = readFileSync("src/app/layout.tsx", "utf8");

describe("document language bootstrap", () => {
  it("sets the document language from the locale path before hydration", () => {
    expect(layout).toContain("document.documentElement.lang");
    expect(layout).toContain("<html lang={defaultLocale}");
    expect(layout.indexOf("<head>")).toBeLessThan(layout.indexOf("<body"));
  });

  it.each([
    ["/", "zh"],
    ["/insights/", "zh"],
    ["/zh/cv/", "zh"],
    ["/en/", "en"],
    ["/en/insights/", "en"],
  ])("sets %s to %s", (pathname, expected) => {
    const script = layout.match(/const documentLanguageScript = `([\s\S]*?)`;/)?.[1];
    expect(script).toBeDefined();
    const document = { documentElement: { lang: "" } };
    runInNewContext(script!.replace("${defaultLocale}", defaultLocale), {
      window: { location: { pathname } },
      document,
    });
    expect(document.documentElement.lang).toBe(expected);
  });
});
