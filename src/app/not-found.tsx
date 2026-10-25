import Link from "next/link";
import type { Locale } from "@/i18n/locales";
import { getMessages } from "@/i18n/messages";
import { addLocalePrefix } from "@/i18n/routing";

// Static export serves this as out/404.html for every unknown URL, so the
// locale cannot be known at build time: show both languages instead of
// guessing and flashing the wrong one after hydration.
const displayOrder: Locale[] = ["zh", "en"];

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-10">
        {displayOrder.map((locale) => {
          const copy = getMessages(locale).pages.notFound;
          return (
            <section key={locale} lang={locale}>
              <h1 className="text-4xl font-bold text-[var(--global-text-color)] mb-4">
                {copy.title}
              </h1>
              <p className="text-[var(--global-text-color-light)] mb-6">
                {copy.description}
              </p>
              <Link
                href={addLocalePrefix("/", locale)}
                className="text-[var(--global-link-color)] underline hover:text-[var(--global-link-color-hover)]"
              >
                {copy.backHome}
              </Link>
            </section>
          );
        })}
      </div>
    </div>
  );
}
