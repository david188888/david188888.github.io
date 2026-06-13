import type { Locale } from "./locales";
import { addLocalePrefix } from "./routing";

export function localizedHref(href: string, locale: Locale): string {
  if (
    href.startsWith("http") ||
    href.startsWith("mailto:") ||
    href.startsWith("/files/") ||
    href.startsWith("#")
  ) {
    return href;
  }

  return addLocalePrefix(href, locale);
}
