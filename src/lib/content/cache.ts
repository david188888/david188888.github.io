import { createHash } from "node:crypto";
import type { Locale } from "@/i18n/locales";

export interface TranslationCacheSummary {
  sourceHash?: string;
  targetLanguage?: Locale;
  body?: string;
}

export interface TranslationCacheExpectation {
  sourceHash: string;
  targetLanguage: Locale;
}

export function createSourceHash(source: string): string {
  return createHash("sha256").update(source).digest("hex");
}

export function isTranslationCacheFresh(
  cache: TranslationCacheSummary | null | undefined,
  expected: TranslationCacheExpectation
): boolean {
  return Boolean(
    cache?.sourceHash === expected.sourceHash &&
      cache.targetLanguage === expected.targetLanguage &&
      cache.body
  );
}
