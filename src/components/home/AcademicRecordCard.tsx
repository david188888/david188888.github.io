"use client";

import Link from "next/link";
import { type PointerEvent } from "react";

export interface AcademicRecordCardProps {
  category: string;
  meta: string;
  title: string;
  description: string;
  details?: readonly string[];
  href?: string;
  linkLabel?: string;
  external?: boolean;
  emphasis?: "default" | "research";
}

export function AcademicRecordCard({
  category,
  meta,
  title,
  description,
  details = [],
  href,
  linkLabel,
  external = false,
  emphasis = "default",
}: AcademicRecordCardProps) {
  function resetTilt(event: PointerEvent<HTMLElement>) {
    const target = event.currentTarget;
    target.classList.remove("is-hover", "is-tilting");
    target.style.setProperty("--tilt-rx", "0deg");
    target.style.setProperty("--tilt-ry", "0deg");
  }

  function trackTilt(event: PointerEvent<HTMLElement>) {
    if (event.pointerType !== "mouse") return;

    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    const pointerX = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const pointerY = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    const maxTilt = 9;

    target.classList.add("is-hover", "is-tilting");
    target.style.setProperty("--tilt-ry", `${((pointerX - 0.5) * maxTilt).toFixed(2)}deg`);
    target.style.setProperty("--tilt-rx", `${((0.5 - pointerY) * maxTilt).toFixed(2)}deg`);
    target.style.setProperty("--tilt-gx", `${(pointerX * 100).toFixed(1)}%`);
    target.style.setProperty("--tilt-gy", `${(pointerY * 100).toFixed(1)}%`);
  }

  return (
    <div
      className="home-card-tilt"
      onPointerMove={trackTilt}
      onPointerLeave={resetTilt}
      onPointerUp={resetTilt}
      onPointerCancel={resetTilt}
    >
      <article className={`academic-card academic-card--${emphasis}`}>
        <div className="academic-card-meta">
          <span>{category}</span>
          <time>{meta}</time>
        </div>
        <div className="academic-card-copy">
          <h3>{title}</h3>
          <p>{description}</p>
          {details.length > 0 || (href && linkLabel) ? (
            <div className="academic-card-details">
              {href && linkLabel ? (
                external ? (
                  <a
                    className="academic-card-link"
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {linkLabel}
                  </a>
                ) : (
                  <Link className="academic-card-link" href={href}>
                    {linkLabel}
                  </Link>
                )
              ) : null}
              {details.map((detail) => (
                <span key={detail}>{detail}</span>
              ))}
            </div>
          ) : null}
        </div>
        <div className="home-card-tilt-glare" aria-hidden="true" />
      </article>
    </div>
  );
}
