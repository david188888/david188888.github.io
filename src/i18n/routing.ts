import { defaultLocale, isLocale, type Locale } from "./locales";

function ensureLeadingSlash(pathname: string): string {
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

function ensureTrailingSlash(pathname: string): string {
  if (pathname.includes("#") || pathname.includes("?")) return pathname;
  return pathname.endsWith("/") ? pathname : `${pathname}/`;
}

export function getLocaleFromPathname(pathname: string): Locale {
  const [, maybeLocale] = ensureLeadingSlash(pathname).split("/");
  return maybeLocale && isLocale(maybeLocale) ? maybeLocale : defaultLocale;
}

export function stripLocalePrefix(pathname: string): string {
  const normalized = ensureTrailingSlash(ensureLeadingSlash(pathname));
  const parts = normalized.split("/");
  const maybeLocale = parts[1];
  if (!maybeLocale || !isLocale(maybeLocale)) return normalized;
  const stripped = `/${parts.slice(2).join("/")}`;
  return stripped === "/" ? "/" : ensureTrailingSlash(stripped);
}

export function addLocalePrefix(pathname: string, locale: Locale): string {
  const stripped = stripLocalePrefix(pathname);
  if (locale === defaultLocale) return stripped;
  return stripped === "/" ? `/${locale}/` : `/${locale}${stripped}`;
}

export function switchLocalePathname(pathname: string, nextLocale: Locale): string {
  return addLocalePrefix(stripLocalePrefix(pathname), nextLocale);
}
