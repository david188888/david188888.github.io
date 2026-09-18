import "@/components/home/editorial.css";
import { EditorialMasthead } from "@/components/home/EditorialMasthead";
import { editorialThemeScript } from "@/components/home/editorialTheme";
import { authorConfig } from "@/config/author";
import { defaultLocale, type Locale } from "@/i18n/locales";
import { AlignedSections, type AlignedPageSection } from "./AlignedSections";

interface AlignedPageShellProps {
  locale?: Locale;
  sections: readonly AlignedPageSection[];
  /** 页面级修饰符，用来覆盖栅格变量（例如某一页需要更宽/更窄的左栏）。 */
  className?: string;
}

const footerNote: Record<Locale, string> = {
  en: "Research and personal notes · © 2026",
  zh: "研究与个人笔记 · © 2026",
};

export function AlignedPageShell({
  locale = defaultLocale,
  sections,
  className,
}: AlignedPageShellProps) {
  return (
    <div className="ed-root">
      <script dangerouslySetInnerHTML={{ __html: editorialThemeScript }} />
      <div className="ed-site">
        <EditorialMasthead locale={locale} variant="page" />
        <main
          className={`home-motion-shell aligned-page-shell ${
            className ?? ""
          }`.trim()}
          data-locale={locale}
        >
          <div className="aligned-page-container relative z-10 mx-auto w-[min(1280px,calc(100vw-2rem))]">
            <AlignedSections sections={sections} />
          </div>
        </main>
        <footer className="foot">
          <div>
            <strong>{authorConfig.name}</strong>
          </div>
          <p className="foot-note">{footerNote[locale]}</p>
        </footer>
      </div>
    </div>
  );
}

export type { AlignedPageSection } from "./AlignedSections";
