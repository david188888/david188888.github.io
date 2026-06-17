"use client";

import { useEffect, useRef } from "react";

export function usePointerGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function setLocalPointer(target: Element, e: MouseEvent) {
      if (!(target instanceof HTMLElement)) return;
      const rect = target.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      target.style.setProperty("--local-x", `${x}%`);
      target.style.setProperty("--local-y", `${y}%`);
    }

    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      el.style.setProperty("--pointer-x", `${x}%`);
      el.style.setProperty("--pointer-y", `${y}%`);

      const localTarget = e.target instanceof Element ? e.target.closest("[data-hover-reactive]") : null;
      if (localTarget) {
        setLocalPointer(localTarget, e);
      }
    };

    el.addEventListener("mousemove", handleMove);
    return () => el.removeEventListener("mousemove", handleMove);
  }, []);

  return ref;
}
