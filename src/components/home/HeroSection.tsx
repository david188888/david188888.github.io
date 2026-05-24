"use client";

import { useTypeWriter } from "@/hooks/useTypeWriter";
import { authorConfig } from "@/config/author";
import Image from "next/image";

const roles = [
  "SLM Trustworthiness",
  "RL for Proactive Dialogue",
  "Agentic Speech Intelligence",
  "End-to-End Spoken Dialogue Systems",
];

export function HeroSection() {
  const displayText = useTypeWriter({ roles });

  return (
    <section
      className="home-hero grid grid-cols-1 gap-4 items-stretch p-[clamp(1.2rem,2.4vw,2rem)] border border-[rgba(166,182,206,0.08)] rounded-[0.95rem] backdrop-blur-[8px] shadow-[0_10px_26px_rgba(0,0,0,0.2)]"
      style={{
        background:
          "linear-gradient(145deg, rgba(8,13,21,0.42) 0%, rgba(10,16,26,0.32) 58%, rgba(11,18,29,0.24) 100%)",
      }}
    >
      <div className="min-w-0 max-w-[920px]">
        {/* Avatar — pure CSS stagger, no JS needed */}
        <div
          className="inline-block mb-4 animate-reveal-stagger"
          style={{ animationDelay: "0ms" }}
        >
          <div className="relative inline-block">
            <div className="absolute inset-0 rounded-full animate-avatar-glow" />
            <Image
              className="relative block rounded-full object-cover border border-[rgba(180,193,214,0.58)] shadow-[0_14px_28px_rgba(0,0,0,0.34),0_0_24px_rgba(85,101,126,0.14)]"
              src={authorConfig.avatar}
              alt={`Portrait of ${authorConfig.name}`}
              width={138}
              height={138}
              style={{
                width: "clamp(94px, 12vw, 138px)",
                height: "clamp(94px, 12vw, 138px)",
              }}
              priority
              unoptimized
              onError={(e) => {
                const target = e.currentTarget;
                target.src = authorConfig.fallbackAvatar;
              }}
            />
          </div>
        </div>

        {/* Eyebrow */}
        <p
          className="m-0 text-[0.82rem] tracking-[0.08em] uppercase text-[rgba(199,208,223,0.82)] animate-reveal-stagger"
          style={{ animationDelay: "150ms" }}
        >
          {authorConfig.bio}
        </p>

        {/* Name */}
        <h1
          className="font-serif text-[clamp(2.1rem,6.5vw,3.4rem)] font-bold leading-tight text-[#f2f6ff] mt-1.5 mb-0 animate-reveal-stagger"
          style={{ animationDelay: "300ms" }}
        >
          {authorConfig.name}
        </h1>

        {/* Lead */}
        <p
          className="mt-4 max-w-[64ch] text-base text-[rgba(202,212,228,0.88)] animate-reveal-stagger"
          style={{ animationDelay: "450ms" }}
        >
          I build trustworthy speech and language systems, with research spanning proactive interaction, privacy
          evaluation, and end-to-end spoken dialogue intelligence.
        </p>

        {/* Typed */}
        <p
          className="mt-4 text-[0.95rem] text-[rgba(194,206,224,0.9)] animate-reveal-stagger"
          style={{ animationDelay: "600ms" }}
        >
          Current Focus:{" "}
          <span className="font-semibold text-[#cad8ee] border-r-2 border-[rgba(202,216,238,0.72)] pr-1 animate-typed-caret">
            {displayText}
          </span>
        </p>
      </div>
    </section>
  );
}
