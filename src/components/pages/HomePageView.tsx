import Link from "next/link";
import { FluidBackground } from "@/components/home/FluidBackground";
import { HeroSection } from "@/components/home/HeroSection";
import { PaperCard } from "@/components/home/PaperCard";
import { PointerGlow } from "@/components/home/PointerGlow";
import { Reveal } from "@/components/home/Reveal";
import { TimelineCard } from "@/components/home/TimelineCard";
import { HomeNav } from "@/components/navigation/HomeNav";
import { featuredInsight, insightEntries } from "@/config/insights";
import { defaultLocale, type Locale } from "@/i18n/locales";
import { localizedHref } from "@/i18n/links";
import { getMessages } from "@/i18n/messages";

interface HomePageViewProps {
  locale?: Locale;
}

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
    title: "Insta360 · Speech Algorithm Intern",
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

export function HomePageView({ locale = defaultLocale }: HomePageViewProps) {
  const { home } = getMessages(locale).pages;
  const insightsHref = localizedHref("/insights/", locale);

  return (
    <>
      <HomeNav locale={locale} />
      <PointerGlow>
        <main className="hero-intro relative min-h-screen pt-[calc(3.2rem+clamp(0.55rem,2vw,1.4rem))] pb-[clamp(2rem,5vw,3.4rem)] bg-gradient-to-br from-[#06080d] via-[#0a0f17] to-[#0f1620] text-[#e7edf8]">
          <FluidBackground />
          <div className="home-shell relative z-10 mx-auto w-[min(1280px,calc(100vw-1rem))] px-[clamp(0.3rem,1.2vw,0.8rem)] text-[#e7edf8] font-sans">
            <Reveal>
              <HeroSection />
            </Reveal>

            {/* Insights */}
            <Reveal>
              <section id="insights" className="relative z-10 mt-6 py-[clamp(0.8rem,1.8vw,2.1rem)]">
                <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                  <div>
                    <h2 className="font-serif text-[clamp(1.45rem,3.8vw,2.1rem)] text-[#edf3ff] mt-0.5 mb-0 p-0 border-0">
                      {home.insightsTitle}
                    </h2>
                    <p className="mt-2 max-w-2xl text-[0.92rem] text-[rgba(198,208,224,0.82)]">
                      {featuredInsight.description}
                    </p>
                  </div>
                  <Link
                    href={insightsHref}
                    className="text-[0.86rem] font-medium text-[rgba(222,232,247,0.92)] underline underline-offset-4 hover:text-[#f3f7ff]"
                  >
                    {home.insightsCta}
                  </Link>
                </div>
                <div className="grid gap-0 overflow-hidden rounded-[0.85rem] border border-[rgba(166,182,206,0.08)] bg-[rgba(10,15,24,0.32)] backdrop-blur-[8px]">
                  {insightEntries.map((entry) => (
                    <Link
                      key={entry.title}
                      href={insightsHref}
                      className="group grid gap-2 border-b border-[rgba(166,182,206,0.08)] px-4 py-3 text-inherit no-underline transition-colors duration-200 last:border-b-0 hover:bg-[rgba(220,231,246,0.04)] md:grid-cols-[minmax(8rem,0.7fr)_minmax(0,1.8fr)]"
                    >
                      <div>
                        <p className="m-0 text-[0.72rem] uppercase tracking-[0.08em] text-[rgba(167,180,201,0.88)]">
                          {entry.category}
                        </p>
                        <p className="mt-1 mb-0 text-[0.82rem] text-[rgba(162,173,191,0.82)]">
                          {entry.cadence}
                        </p>
                      </div>
                      <div>
                        <h3 className="mt-0 mb-1 text-base leading-snug text-[#e8edf5] transition-colors group-hover:text-[#f3f7ff]">
                          {entry.title}
                        </h3>
                        <p className="m-0 text-[0.9rem] text-[rgba(198,208,224,0.86)]">
                          {entry.description}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            </Reveal>

            {/* Education */}
            <Reveal>
              <section id="education" className="relative z-10 mt-6 py-[clamp(0.8rem,1.8vw,1.2rem)]">
                <div className="mb-4">
                  <h2 className="font-serif text-[clamp(1.45rem,3.8vw,2.1rem)] text-[#edf3ff] mt-0.5 mb-0 p-0 border-0">
                    {home.educationTitle}
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
                    {home.internshipTitle}
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
                    {home.researchTitle}
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
