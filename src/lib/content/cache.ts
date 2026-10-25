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
