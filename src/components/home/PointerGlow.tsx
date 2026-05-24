"use client";

import { usePointerGlow } from "@/hooks/usePointerGlow";
import { type ReactNode } from "react";

interface PointerGlowProps {
  children: ReactNode;
}

export function PointerGlow({ children }: PointerGlowProps) {
  const ref = usePointerGlow();

  return (
    <div ref={ref} className="home-shell-wrapper">
      {children}
    </div>
  );
}
