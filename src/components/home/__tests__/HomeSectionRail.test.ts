import { describe, expect, it } from "vitest";
import { buildSectionStops, resolveSectionRailProgress } from "../HomeSectionRail";

describe("HomeSectionRail", () => {
  it("spaces rail stops by measured section distance", () => {
    const stops = buildSectionStops([
      { id: "profile", start: 0 },
      { id: "education", start: 500 },
      { id: "research", start: 700 },
      { id: "experience", start: 1900 },
      { id: "insights", start: 2300 },
    ]);

    const educationGap = stops[2].position - stops[1].position;
    const researchGap = stops[3].position - stops[2].position;

    expect(researchGap).toBeGreaterThan(educationGap * 4);
  });

  it("moves through a long section gradually instead of jumping to the next item", () => {
    const stops = buildSectionStops([
      { id: "profile", start: 0 },
      { id: "education", start: 500 },
      { id: "research", start: 700 },
      { id: "experience", start: 1900 },
    ]);

    const nearResearchStart = resolveSectionRailProgress(stops, 800);
    const deeperInResearch = resolveSectionRailProgress(stops, 1500);

    expect(nearResearchStart.activeId).toBe("research");
    expect(deeperInResearch.activeId).toBe("research");
    expect(deeperInResearch.progress).toBeGreaterThan(nearResearchStart.progress);
    expect(deeperInResearch.progress).toBeLessThan(stops[3].position);
  });

  it("makes the final section reachable at the document scroll limit", () => {
    const maxScrollY = 2100;
    const stops = buildSectionStops(
      [
        { id: "profile", start: 0 },
        { id: "education", start: 500 },
        { id: "research", start: 700 },
        { id: "experience", start: 1900 },
        { id: "insights", start: 2300 },
      ],
      maxScrollY,
    );

    const finalStop = stops[stops.length - 1];
    const atDocumentBottom = resolveSectionRailProgress(stops, maxScrollY);

    expect(finalStop.start).toBe(maxScrollY);
    expect(finalStop.position).toBe(1);
    expect(atDocumentBottom.activeId).toBe("insights");
    expect(atDocumentBottom.progress).toBe(1);
  });
});
