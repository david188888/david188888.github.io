import type { Locale } from "@/i18n/locales";

export interface LanguageDetectionResult {
  language: Locale | null;
  confidence: "high" | "ambiguous";
}

export function detectSourceLanguage(text: string): LanguageDetectionResult {
  const chineseCount = (text.match(/[\u3400-\u9fff]/g) ?? []).length;
  const englishCount = (text.match(/[A-Za-z]/g) ?? []).length;
  const totalSignal = chineseCount + englishCount;

  if (chineseCount >= 8 && chineseCount / Math.max(totalSignal, 1) >= 0.35) {
    return { language: "zh", confidence: "high" };
  }

  if (englishCount >= 20 && englishCount / Math.max(totalSignal, 1) >= 0.75) {
    return { language: "en", confidence: "high" };
  }

  return { language: null, confidence: "ambiguous" };
}

export function getTargetLanguage(sourceLanguage: Locale): Locale {
  return sourceLanguage === "zh" ? "en" : "zh";
}
