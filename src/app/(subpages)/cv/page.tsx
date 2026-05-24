import Link from "next/link";
import { ArchiveItem } from "@/components/cards/ArchiveItem";

const cvPublications = [
  {
    title: "VoxSafeBench: Not Just What Is Said, but Who, How, and Where",
    permalink: "https://arxiv.org/abs/2604.14548",
    venue: "NeurIPS 2026 · Under Review",
    date: "2026-04-01",
    excerpt: "Second author.",
    paperUrl: "https://arxiv.org/abs/2604.14548",
  },
  {
    title: "VoxPrivacy: A Benchmark for Evaluating Interactional Privacy of Speech Language Models",
    permalink: "https://arxiv.org/abs/2601.19956",
    venue: "ICLR 2026 · Poster",
    date: "2026-01-01",
    excerpt: "Second author.",
    paperUrl: "https://arxiv.org/abs/2601.19956",
  },
  {
    title: "DialogGraph-LLM: Graph-Informed LLMs for End-to-End Audio Dialogue Intent Recognition",
    permalink: "https://arxiv.org/abs/2511.11000",
    venue: "ECAI 2025 · Oral",
    date: "2025-06-01",
    excerpt: "First author.",
    paperUrl: "https://arxiv.org/abs/2511.11000",
  },
  {
    title: "Multi-segment Multitask Fusion Network for Marketing Audio Classification",
    permalink: "https://arxiv.org/abs/2511.11006",
    venue: "ADMA 2025 · Poster",
    date: "2025-01-01",
    excerpt: "First author.",
    paperUrl: "https://arxiv.org/abs/2511.11006",
  },
];

export default function CVPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 text-[var(--global-text-color)]">
        Curriculum Vitae
      </h1>

      <p className="mb-4 text-[var(--global-text-color-light)]">
        <Link
          href="/files/Resume_en.pdf"
          target="_blank"
          className="text-[var(--global-link-color)] underline font-medium"
        >
          Download PDF
        </Link>
      </p>

      <section className="mb-8">
        <h2 className="text-lg font-bold border-b border-[var(--global-border-color)] pb-2 mb-4 text-[var(--global-text-color)]">
          Education
        </h2>
        <div className="mb-4">
          <h3 className="font-bold text-[var(--global-text-color)]">
            South China Normal University
          </h3>
          <p className="text-sm text-[var(--global-text-color-light)]">
            B.Eng. in Software Engineering · GPA: 4.06
          </p>
        </div>
        <div className="mb-4">
          <h3 className="font-bold text-[var(--global-text-color)]">
            The Chinese University of Hong Kong, Shenzhen
          </h3>
          <p className="text-sm text-[var(--global-text-color-light)]">
            M.Sc. in Data Science · Matriculation: Sep 2026
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-bold border-b border-[var(--global-border-color)] pb-2 mb-4 text-[var(--global-text-color)]">
          Publications
        </h2>
        {cvPublications.map((pub) => (
          <ArchiveItem key={pub.title} {...pub} />
        ))}
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-bold border-b border-[var(--global-border-color)] pb-2 mb-4 text-[var(--global-text-color)]">
          Internship
        </h2>
        <div className="mb-4">
          <h3 className="font-bold text-[var(--global-text-color)]">
            Insta360 · Speech Algorithm Intern
          </h3>
          <p className="text-sm text-[var(--global-text-color-light)]">
            Shenzhen, China · Feb 2026 - Jun 2026
          </p>
        </div>
        <div className="mb-4">
          <h3 className="font-bold text-[var(--global-text-color)]">
            Amphion Technology · R&D Intern
          </h3>
          <p className="text-sm text-[var(--global-text-color-light)]">
            Shenzhen, China · Jun 2025 - Sep 2025
          </p>
        </div>
      </section>
    </div>
  );
}
