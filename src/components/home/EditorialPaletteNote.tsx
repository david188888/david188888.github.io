"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Locale } from "@/i18n/locales";

const copy = {
  zh: {
    trigger: "关于配色",
    title: "安静的底色",
    close: "关闭配色说明",
    description: "我希望这个网站给人的第一感受是舒服、沉稳、低调。浅色用接近纸张的暖白，深色用安静的炭黑，再以酒红色点出少量重点。它们有温度，也有分寸。我希望文字与思考被看见，也让人愿意停下来，慢慢读。",
    light: "浅色 · 暖纸与酒红",
    dark: "深色 · 炭黑与玫瑰",
    colors: ["暖纸白", "墨色", "酒红", "炭黑", "暖白", "柔玫瑰"],
  },
  en: {
    trigger: "About the palette",
    title: "A quiet palette",
    close: "Close palette note",
    description: "I want this website to feel comfortable, calm, and understated. The light palette uses a warm, paper-like white; the dark palette uses a quiet charcoal, with burgundy bringing attention to a few details. These colors have warmth and restraint. I hope the writing and ideas come through, and that you feel welcome to pause and read at your own pace.",
    light: "Light · Paper & burgundy",
    dark: "Dark · Charcoal & rose",
    colors: ["Warm paper", "Ink", "Burgundy", "Charcoal", "Warm white", "Soft rose"],
  },
} as const;

const schemes = [
  ["#F6F3EE", "#24211F", "#783D49"],
  ["#17191C", "#ECE7DF", "#D998A1"],
] as const;

export function EditorialPaletteNote({ locale }: { locale: Locale }) {
  const text = copy[locale];
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [open]);

  return (
    <div className="palette-note">
      <button
        type="button"
        className="palette-trigger"
        aria-haspopup="dialog"
        aria-controls={id}
        onClick={() => {
          dialogRef.current?.showModal();
          setOpen(true);
        }}
      >
        <span className="palette-mini" aria-hidden="true"><i /><i /><i /></span>
        <span>{text.trigger}</span>
      </button>
      <dialog
        ref={dialogRef}
        id={id}
        className="palette-dialog"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-description`}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) {
            event.currentTarget.close();
          }
        }}
      >
        <div className="palette-dialog-head">
          <p className="palette-eyebrow">{text.trigger}</p>
          <button type="button" className="palette-close" aria-label={text.close} onClick={() => dialogRef.current?.close()}>
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <h2 id={`${id}-title`}>{text.title}</h2>
        <p id={`${id}-description`} className="palette-description">{text.description}</p>
        <div className="palette-schemes">
          {schemes.map((colors, schemeIndex) => (
            <section className="palette-scheme" key={schemeIndex} aria-labelledby={`${id}-scheme-${schemeIndex}`}>
              <h3 id={`${id}-scheme-${schemeIndex}`}>{schemeIndex === 0 ? text.light : text.dark}</h3>
              <ul className="palette-colors">
                {colors.map((color, colorIndex) => (
                  <li key={color}>
                    <span className="palette-swatch" style={{ backgroundColor: color }} aria-hidden="true" />
                    <span className="palette-color-name">{text.colors[schemeIndex * 3 + colorIndex]}</span>
                    <span className="palette-hex">{color}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </dialog>
    </div>
  );
}
