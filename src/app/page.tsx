import { HomeNav } from "@/components/navigation/HomeNav";
import { FluidBackground } from "@/components/home/FluidBackground";
import { HeroSection } from "@/components/home/HeroSection";
import { TimelineCard } from "@/components/home/TimelineCard";
import { PaperCard } from "@/components/home/PaperCard";
import { Reveal } from "@/components/home/Reveal";
import { PointerGlow } from "@/components/home/PointerGlow";

const educationData = [
  {
    time: "Bachelor's Degree",
    title: "South China Normal University",
    meta: "B.Eng. in Software Engineering",
    description: "Overall GPA: 4.06.",
  },
  {
    time: "Matriculation: Sep 2026",
    title: "The Chinese University of Hong Kong, Shenzhen",
    meta: "Master of Science in Data Science",
    description: "Enrollment scheduled for September 2026.",
  },
];

const internshipData = [
  {
    time: "Feb 2026 - Jun 2026",
    title: "Insta360 (影石) · Speech Algorithm Intern",
    meta: "Shenzhen, China",
    description:
      "Developing production-grade speech algorithms and optimizing low-latency model inference for voice applications.",
  },
  {
    time: "Jun 2025 - Sep 2025",
    title: "Amphion Technology · R&D Intern",
    meta: "Shenzhen, China",
    description:
      "Developed core algorithms for a voice-cloning application and supported backend model integration for video translation.",
  },
];

const papersData = [
  {
    venue: "NeurIPS 2026 · Under Review",
    title: "VoxSafeBench: Not Just What Is Said, but Who, How, and Where",
    description:
      "Introduced a benchmark for evaluating social alignment in speech language models across safety, fairness, and privacy dimensions; second author.",
    paperUrl: "https://arxiv.org/abs/2604.14548",
  },
  {
    venue: "ICLR 2026 · Poster",
    title: "VoxPrivacy: A Benchmark for Evaluating Interactional Privacy of Speech Language Models",
    description:
      "Introduced a multi-user benchmark for measuring interactional privacy risks in speech-language models; second author.",
    paperUrl: "https://arxiv.org/abs/2601.19956",
  },
  {
    venue: "ECAI 2025 · Oral",
    title: "DialogGraph-LLM: Graph-Informed LLMs for End-to-End Audio Dialogue Intent Recognition",
    description:
      "Proposed a graph-informed framework for end-to-end intent recognition in spoken dialogue; first author.",
    paperUrl: "https://arxiv.org/abs/2511.11000",
  },
  {
    venue: "ADMA 2025 · Poster",
    title: "Multi-segment Multitask Fusion Network for Marketing Audio Classification",
    description:
      "Proposed MSMT-FN for marketing-call attitude classification, achieving stronger results than prior baselines; first author.",
    paperUrl: "https://arxiv.org/abs/2511.11006",
  },
];

export default function HomePage() {
  return (
    <>
      <HomeNav />
      <PointerGlow>
        <main className="hero-intro relative min-h-screen pt-[calc(3.2rem+clamp(0.55rem,2vw,1.4rem))] pb-[clamp(2rem,5vw,3.4rem)] bg-gradient-to-br from-[#06080d] via-[#0a0f17] to-[#0f1620] text-[#e7edf8]">
          <FluidBackground />
          <div className="home-shell relative z-10 mx-auto w-[min(1280px,calc(100vw-1rem))] px-[clamp(0.3rem,1.2vw,0.8rem)] text-[#e7edf8] font-sans">
            <Reveal>
              <HeroSection />
            </Reveal>

            {/* Education */}
            <Reveal>
              <section id="education" className="relative z-10 mt-6 py-[clamp(0.8rem,1.8vw,1.2rem)]">
                <div className="mb-4">
                  <h2 className="font-serif text-[clamp(1.45rem,3.8vw,2.1rem)] text-[#edf3ff] mt-0.5 mb-0 p-0 border-0">
                    Education
                  </h2>
                </div>
                <div className="grid gap-3">
                  {educationData.map((item) => (
                    <Reveal key={item.title}>
                      <TimelineCard {...item} />
                    </Reveal>
                  ))}
                </div>
              </section>
            </Reveal>

            {/* Internship */}
            <Reveal>
              <section id="internships" className="relative z-10 mt-6 py-[clamp(0.8rem,1.8vw,1.2rem)]">
                <div className="mb-4">
                  <h2 className="font-serif text-[clamp(1.45rem,3.8vw,2.1rem)] text-[#edf3ff] mt-0.5 mb-0 p-0 border-0">
                    Internship
                  </h2>
                </div>
                <div className="grid gap-3">
                  {internshipData.map((item) => (
                    <Reveal key={item.title}>
                      <TimelineCard {...item} />
                    </Reveal>
                  ))}
                </div>
              </section>
            </Reveal>

            {/* Research */}
            <Reveal>
              <section id="papers" className="relative z-10 mt-6 py-[clamp(0.8rem,1.8vw,2.1rem)]">
                <div className="mb-4">
                  <h2 className="font-serif text-[clamp(1.45rem,3.8vw,2.1rem)] text-[#edf3ff] mt-0.5 mb-0 p-0 border-0">
                    Research
                  </h2>
                </div>
                <div className="grid gap-3">
                  {papersData.map((paper) => (
                    <Reveal key={paper.title}>
                      <PaperCard {...paper} />
                    </Reveal>
                  ))}
                </div>
              </section>
            </Reveal>
          </div>
        </main>
      </PointerGlow>
    </>
  );
}
