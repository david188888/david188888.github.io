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
      className="animate-reveal-fallback"
      style={
        isVisible
          ? { opacity: 1, transform: "translateY(0)" }
          : { opacity: 1 }
      }
    >
      {children}
    </div>
  );
}
