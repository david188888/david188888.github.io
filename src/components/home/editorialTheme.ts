/**
 * Editorial pages carry their own light/dark preference so the homepage can open
 * in the warm-paper palette while the rest of the site keeps its own theme.
 * The attribute lives on <html> so `html[data-ed-theme="dark"] .ed-root` can
 * recolour things the wrapper alone cannot reach, and it is applied before paint
 * to avoid a flash of the wrong palette.
 */
export const EDITORIAL_THEME_KEY = "editorial-theme";

export type EditorialThemePreference = "system" | "light" | "dark";

export const editorialThemeScript = `(function(){try{var p=localStorage.getItem("${EDITORIAL_THEME_KEY}")||"system";var d=p==="dark"||(p==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.setAttribute("data-ed-theme",d?"dark":"light")}catch(e){document.documentElement.setAttribute("data-ed-theme","light")}})();`;

export function isEditorialThemePreference(value: string): value is EditorialThemePreference {
  return value === "system" || value === "light" || value === "dark";
}
