import { describe, expect, it } from "vitest";
import { detectSourceLanguage } from "../language";

describe("detectSourceLanguage", () => {
  it("detects Chinese-majority text", () => {
    expect(detectSourceLanguage("这是一篇关于人工智能产品战略的中文文章。")).toEqual({
      language: "zh",
      confidence: "high",
    });
  });

  it("detects English-majority text", () => {
    expect(detectSourceLanguage("This is a business note about AI product strategy.")).toEqual({
      language: "en",
      confidence: "high",
    });
  });

  it("marks ambiguous short mixed text", () => {
    expect(detectSourceLanguage("AI 市场 strategy")).toEqual({
      language: null,
      confidence: "ambiguous",
    });
  });
});
