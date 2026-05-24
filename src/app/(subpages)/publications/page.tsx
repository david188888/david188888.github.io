import { ArchiveItem } from "@/components/cards/ArchiveItem";
import { authorConfig } from "@/config/author";

// Hard-coded data matching the Velite schema until we can run velite build
const publications = [
  {
    title: "VoxSafeBench: Not Just What Is Said, but Who, How, and Where",
    permalink: "https://arxiv.org/abs/2604.14548",
    venue: "NeurIPS 2026 · Under Review",
    date: "2026-04-01",
    excerpt:
      "Introduced a benchmark for evaluating social alignment in speech language models across safety, fairness, and privacy dimensions; second author.",
    paperUrl: "https://arxiv.org/abs/2604.14548",
    category: "conferences",
  },
  {
    title: "VoxPrivacy: A Benchmark for Evaluating Interactional Privacy of Speech Language Models",
    permalink: "https://arxiv.org/abs/2601.19956",
    venue: "ICLR 2026 · Poster",
    date: "2026-01-01",
    excerpt:
      "Introduced a multi-user benchmark for measuring interactional privacy risks in speech-language models; second author.",
    paperUrl: "https://arxiv.org/abs/2601.19956",
    category: "conferences",
  },
  {
    title: "DialogGraph-LLM: Graph-Informed LLMs for End-to-End Audio Dialogue Intent Recognition",
    permalink: "https://arxiv.org/abs/2511.11000",
    venue: "ECAI 2025 · Oral",
    date: "2025-06-01",
    excerpt:
      "Proposed a graph-informed framework for end-to-end intent recognition in spoken dialogue; first author.",
    paperUrl: "https://arxiv.org/abs/2511.11000",
    category: "conferences",
  },
  {
    title: "Multi-segment Multitask Fusion Network for Marketing Audio Classification",
    permalink: "https://arxiv.org/abs/2511.11006",
    venue: "ADMA 2025 · Poster",
    date: "2025-01-01",
    excerpt:
      "Proposed MSMT-FN for marketing-call attitude classification, achieving stronger results than prior baselines; first author.",
    paperUrl: "https://arxiv.org/abs/2511.11006",
    category: "conferences",
  },
];

const categoryTitles: Record<string, string> = {
  conferences: "Conference Papers",
  manuscripts: "Journal Articles",
  books: "Books",
};

export default function PublicationsPage() {
  const grouped = publications.reduce(
    (acc, pub) => {
      const cat = pub.category || "conferences";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(pub);
      return acc;
    },
    {} as Record<string, typeof publications>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2 text-[var(--global-text-color)]">
        Publications
      </h1>
      {authorConfig.googlescholar && (
        <p className="text-sm text-[var(--global-text-color-light)] mb-4">
          Also available on{" "}
          <a
            href={authorConfig.googlescholar}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--global-link-color)]"
          >
            Google Scholar
          </a>
          .
        </p>
      )}
      {Object.entries(grouped).map(([category, items]) => (
        <section key={category} className="mb-8">
          <h2 className="text-lg font-bold border-b border-[var(--global-border-color)] pb-2 mb-4 text-[var(--global-text-color)]">
            {categoryTitles[category] || category}
          </h2>
          {items.map((pub) => (
            <ArchiveItem key={pub.title} {...pub} />
          ))}
        </section>
      ))}
    </div>
  );
}
