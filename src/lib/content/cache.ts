import type { Locale } from "@/i18n/locales";
import {
  canonicalGeneration,
  createSourceHash,
  findCacheInconsistencies,
  generationRequiresRetranslation,
  hasGeneration,
  isTranslationCacheFresh,
  TRANSLATION_CACHE_VERSION,
  TRANSLATION_PIPELINE_VERSION,
} from "./translation-cache.mjs";
import { TRANSLATION_GLOSSARY_VERSION } from "./translation-glossary.mjs";

/**
 * Shape of the fields the site loader reads out of a translation cache. The
 * script writes more than this (per-unit provenance, model, generation); the
 * loader needs enough to decide freshness, to check the cache against itself,
 * and to render the page.
 */
export interface TranslationCacheSummary {
  version?: number;
  sourceHash?: string;
  targetLanguage?: Locale;
  pipeline?: string;
  glossary?: string;
  model?: string;
  title?: string;
  excerpt?: string;
  tags?: string[];
  body?: string;
  units?: Record<string, { kind?: string; translation?: string }>;
}

export interface TranslationCacheExpectation {
  sourceHash: string;
  targetLanguage: Locale;
}

export {
  canonicalGeneration,
  createSourceHash,
  findCacheInconsistencies,
  generationRequiresRetranslation,
  hasGeneration,
  isTranslationCacheFresh,
  TRANSLATION_CACHE_VERSION,
  TRANSLATION_GLOSSARY_VERSION,
  TRANSLATION_PIPELINE_VERSION,
};
