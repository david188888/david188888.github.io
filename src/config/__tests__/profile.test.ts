import { describe, expect, it } from "vitest";
import {
  educationRecords,
  getCvEducation,
  getCvInternships,
  getCvPublications,
  getHomeEducation,
  getHomeInternships,
  getHomePublications,
  getIncomingEducation,
  getPublicationArchive,
  internshipRecords,
  publicationCategoryOrder,
  publicationRecords,
} from "../profile";

describe("profile content", () => {
  it("keeps stable unique record ids and supported publication categories", () => {
    const records = [...educationRecords, ...internshipRecords, ...publicationRecords];
    expect(new Set(records.map(({ id }) => id)).size).toBe(records.length);
    expect(publicationCategoryOrder).toEqual(["conferences", "manuscripts", "books"]);
    publicationRecords.forEach(({ category, paperUrl }) => {
      expect(publicationCategoryOrder).toContain(category);
      expect(paperUrl).toMatch(/^https:\/\//);
    });
  });

  it.each(["en", "zh"] as const)("provides every localized field for %s", (locale) => {
    for (const record of educationRecords) {
      expect(record.period[locale]).toBeTruthy();
      expect(record.institution[locale]).toBeTruthy();
      expect(record.degree[locale]).toBeTruthy();
      expect(record.description[locale]).toBeTruthy();
    }
    for (const record of internshipRecords) {
      expect(record.period[locale]).toBeTruthy();
      expect(record.company[locale]).toBeTruthy();
      expect(record.role[locale]).toBeTruthy();
      expect(record.location[locale]).toBeTruthy();
      expect(record.description[locale]).toBeTruthy();
    }
    for (const record of publicationRecords) {
      expect(record.venue[locale]).toBeTruthy();
      expect(record.authorship[locale]).toBeTruthy();
      expect(record.title[locale]).toBeTruthy();
      expect(record.description[locale]).toBeTruthy();
    }
  });

  it("reproduces the current English view compositions", () => {
    expect(getHomeEducation("en")[0]).toEqual({
      id: "scnu-beng",
      time: "Bachelor's Degree",
      title: "South China Normal University",
      meta: "B.Eng. in Software Engineering",
      description: "Overall GPA: 4.06.",
    });
    expect(getCvEducation("en")[0].detail).toBe("B.Eng. in Software Engineering · GPA: 4.06");
    expect(getCvEducation("en")[1].detail).toBe("M.Sc. in Data Science · Matriculation: Sep 2026");
    expect(getIncomingEducation("en")).toEqual({
      label: "Incoming 2026",
      value: "CUHK-Shenzhen · M.Sc. Data Science",
    });
    expect(getHomeInternships("en")[0].title).toBe("Insta360 · Speech Algorithm Intern");
    expect(getCvInternships("en")[0].detail).toBe("Shenzhen, China · Feb 2026 - Jun 2026");
    expect(getHomePublications("en")[0].authorship).toBe("Second author");
    expect(getCvPublications("en")[0].excerpt).toBe("Second author.");
    expect(getPublicationArchive("en")[0].excerpt).toBe(
      "Introduced a benchmark for evaluating social alignment in speech language models across safety, fairness, and privacy dimensions; second author."
    );
  });

  it("uses Chinese punctuation in publication selectors", () => {
    expect(getCvPublications("zh")[0].excerpt).toBe("第二作者。");
    expect(getPublicationArchive("zh")[0].excerpt).toBe(
      "提出用于评估语音语言模型社会对齐能力的基准，覆盖安全、公平与隐私维度；第二作者。"
    );
  });
});
