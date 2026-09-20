import Link from "next/link";
import { LanguageSwitcher } from "@/components/navigation/LanguageSwitcher";
import { localizedHref } from "@/i18n/links";
import { defaultLocale, type Locale } from "@/i18n/locales";
import { EditorialThemeToggle } from "./EditorialThemeToggle";

const sectionLinks = [
  { id: "insights", href: "/insights/", label: { en: "Insights", zh: "洞察" } },
  { id: "education", href: "#education", label: { en: "Education", zh: "教育" } },
  { id: "experience", href: "#experience", label: { en: "Experience", zh: "实习" } },
  { id: "research", href: "#research", label: { en: "Research", zh: "研究" } },
  { id: "projects", href: "#projects", label: { en: "Projects", zh: "项目与开源" } },
  { id: "contact", href: "#contact", label: { en: "Contact", zh: "联系" } },
];

/**
 * `home` anchors to the section on the current page, `page` points the same
 * links back at the homepage sections, and `project` swaps them for a single
 * return link.
 */
export type EditorialMastheadVariant = "home" | "page" | "project";

interface EditorialMastheadProps {
  locale?: Locale;
  variant?: EditorialMastheadVariant;
}

function sectionHref(href: string, variant: EditorialMastheadVariant, locale: Locale) {
  if (variant === "home" || !href.startsWith("#")) return localizedHref(href, locale);
  return localizedHref(`/${href}`, locale);
}

export function EditorialMasthead({ locale = defaultLocale, variant = "home" }: EditorialMastheadProps) {
  const navLabel = locale === "zh" ? "页面导航" : "Page navigation";

  return (
    <header className="masthead">
      <Link className="wordmark" href={localizedHref("/", locale)}>
        HongYu Liu<span>.</span>
      </Link>
      {variant === "project" ? (
        <nav className="masthead-nav" aria-label={navLabel}>
          <Link href={localizedHref("/#projects", locale)}>
            {locale === "zh" ? "← 返回项目与开源" : "← Back to projects"}
          </Link>
        </nav>
      ) : (
        <nav className="masthead-nav" aria-label={navLabel}>
          {sectionLinks.map((item) => (
            <a key={item.id} href={sectionHref(item.href, variant, locale)}>
              {item.label[locale]}
            </a>
          ))}
        </nav>
      )}
      <div className="masthead-tools">
        <LanguageSwitcher variant="editorial" />
        <span className="masthead-divider" aria-hidden="true" />
        <EditorialThemeToggle locale={locale} />
      </div>
    </header>
  );
}
