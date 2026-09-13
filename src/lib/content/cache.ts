import type { Locale } from "@/i18n/locales";
import {
  createSourceHash,
  isTranslationCacheFresh,
  TRANSLATION_CACHE_VERSION,
  TRANSLATION_PIPELINE_VERSION,
} from "./translation-cache.mjs";

/**
 * Shape of the fields the site loader reads out of a translation cache. The
 * script writes more than this (per-unit provenance, model, source language);
 * the loader only needs enough to decide freshness and to render the page.
 */
export interface TranslationCacheSummary {
  sourceHash?: string;
  targetLanguage?: Locale;
  pipeline?: string;
  body?: string;
}

export interface TranslationCacheExpectation {
  sourceHash: string;
  targetLanguage: Locale;
}

export {
  createSourceHash,
  isTranslationCacheFresh,
  TRANSLATION_CACHE_VERSION,
  TRANSLATION_PIPELINE_VERSION,
};
