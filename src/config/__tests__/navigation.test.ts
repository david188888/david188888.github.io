import { describe, expect, it } from "vitest";
import { mainNavigation } from "../navigation";

describe("main navigation", () => {
  it("links internships to the homepage experience section", () => {
    expect(mainNavigation.find(({ title }) => title === "Internships")?.url).toBe("/#experience");
  });
});
