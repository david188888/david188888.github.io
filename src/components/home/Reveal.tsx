"use client";

import { useReveal } from "@/hooks/useReveal";
import { type ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
}

export function Reveal({ children }: RevealProps) {
  const { ref, isVisible } = useReveal();

  return (
    <div
      ref={ref}
      className={`transition-all duration-[460ms] ease-in-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-[18px]"
      }`}
    >
      {children}
    </div>
  );
}
