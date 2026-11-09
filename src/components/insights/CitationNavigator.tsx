"use client";

import { useEffect } from "react";

const FLASH_CLASS = "cite-flash";

/**
 * Smooth jumps between body citations and the sources list.
 *
 * The rendered HTML already works without this: `[n]` links to `#ref-n` and
 * `↩` to the first citation of n. This script makes `↩` return to the
 * citation the reader actually clicked, and briefly highlights where the jump
 * landed. It does not touch the URL or history: the App Router owns
 * `history.pushState`, and an in-page hop is not worth a back-button entry.
 */
export function CitationNavigator() {
  useEffect(() => {
    const lastClicked = new Map<string, HTMLElement>();

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!(event.target instanceof Element)) return;

      const link = event.target.closest<HTMLAnchorElement>(
        ".insight-body a[data-cite], .insight-body a[data-cite-back]"
      );
      if (!link) return;

      const citation = link.dataset.cite;
      const back = link.dataset.citeBack;
      let target: HTMLElement | null = null;

      if (citation) {
        lastClicked.set(citation, link);
        target = document.getElementById(`ref-${citation}`);
      } else if (back) {
        const remembered = lastClicked.get(back);
        target = remembered?.isConnected
          ? remembered
          : document.getElementById(`cite-${back}-1`);
      }
      if (!target) return;

      event.preventDefault();
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
      target.focus({ preventScroll: true });

      // Restart the highlight even when the same target is hit twice in a row.
      const flashTarget = citation ? target : (target.closest("sup") ?? target);
      flashTarget.classList.remove(FLASH_CLASS);
      void flashTarget.offsetWidth;
      flashTarget.classList.add(FLASH_CLASS);
      // No animation runs under reduced motion, so `animationend` never fires.
      if (reduceMotion) window.setTimeout(() => flashTarget.classList.remove(FLASH_CLASS), 1600);
    };

    const onAnimationEnd = (event: AnimationEvent) => {
      if (event.target instanceof Element) event.target.classList.remove(FLASH_CLASS);
    };

    document.addEventListener("click", onClick);
    document.addEventListener("animationend", onAnimationEnd);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("animationend", onAnimationEnd);
    };
  }, []);

  return null;
}
