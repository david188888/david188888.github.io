"use client";

import { useEffect, useRef } from "react";

/** A decorative indicator of how far the reader has scrolled through the page. */
export function ReadingProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const root = document.documentElement;
      const scrollable = root.scrollHeight - root.clientHeight;
      const progress = scrollable > 0 ? root.scrollTop / scrollable : 0;
      if (barRef.current) {
        barRef.current.style.transform = `scaleX(${Math.max(0, Math.min(1, progress))})`;
      }
    };

    const scheduleUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return <div ref={barRef} className="insight-reading-progress" aria-hidden="true" />;
}
