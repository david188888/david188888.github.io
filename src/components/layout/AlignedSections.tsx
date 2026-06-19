import type { ReactNode } from "react";
import { AlignedSectionObserver } from "@/components/navigation/AlignedSectionObserver";

export interface AlignedPageSection {
  id: string;
  label: string;
  content: ReactNode;
  railContent?: ReactNode;
  className?: string;
}

interface AlignedSectionsProps {
  sections: readonly AlignedPageSection[];
}

export function AlignedSections({ sections }: AlignedSectionsProps) {
  const sectionIds = sections.map(({ id }) => id);

  return (
    <div data-aligned-sections>
      <AlignedSectionObserver sectionIds={sectionIds} />
      <nav className="aligned-quick-nav" aria-label="Page sections">
        {sections.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            data-aligned-section-link={section.id}
          >
            {section.label}
          </a>
        ))}
      </nav>

      <div className="aligned-section-list">
        {sections.map((section, index) => (
          <section
            key={section.id}
            id={section.id}
            data-aligned-section
            className={`aligned-section-row ${section.className ?? ""}`.trim()}
          >
            <aside className="aligned-section-rail">
              <div className="aligned-section-marker">
                <a
                  href={`#${section.id}`}
                  data-aligned-section-link={section.id}
                  className="aligned-section-link"
                >
                  <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                  <span>{section.label}</span>
                </a>
                {section.railContent ? (
                  <div className="aligned-section-rail-content">{section.railContent}</div>
                ) : null}
              </div>
            </aside>
            <div className="aligned-section-content">{section.content}</div>
          </section>
        ))}
      </div>
    </div>
  );
}
