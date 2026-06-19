import { PointerGlow } from "@/components/home/PointerGlow";
import { HomeNav } from "@/components/navigation/HomeNav";
import { defaultLocale, type Locale } from "@/i18n/locales";
import { AlignedSections, type AlignedPageSection } from "./AlignedSections";

interface AlignedPageShellProps {
  locale?: Locale;
  sections: readonly AlignedPageSection[];
}

export function AlignedPageShell({
  locale = defaultLocale,
  sections,
}: AlignedPageShellProps) {
  return (
    <>
      <HomeNav locale={locale} />
      <PointerGlow>
        <main
          className="home-motion-shell aligned-page-shell min-h-screen bg-[#050608] text-[#e8edf7]"
          data-locale={locale}
        >
          <div className="aligned-page-container relative z-10 mx-auto w-[min(1280px,calc(100vw-2rem))]">
            <AlignedSections sections={sections} />
          </div>
        </main>
      </PointerGlow>
    </>
  );
}

export type { AlignedPageSection } from "./AlignedSections";
