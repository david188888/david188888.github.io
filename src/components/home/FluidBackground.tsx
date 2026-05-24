"use client";

import { useEffect, useRef } from "react";

interface Blob {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hue: number;
}

export function FluidBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let blobs: Blob[] = [];
    let splats: Array<{ x: number; y: number; radius: number; alpha: number }> = [];
    let pointerX = -1000;
    let pointerY = -1000;
    let isPointerActive = false;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      canvas!.width = window.innerWidth * dpr;
      canvas!.height = window.innerHeight * dpr;
      canvas!.style.width = `${window.innerWidth}px`;
      canvas!.style.height = `${window.innerHeight}px`;
    }

    function initBlobs() {
      blobs = [];
      for (let i = 0; i < 8; i++) {
        blobs.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          radius: 100 + Math.random() * 180,
          hue: 214 + i * 5,
        });
      }
    }

    function draw() {
      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "lighter";

      // Draw blobs
      for (const blob of blobs) {
        const dx = pointerX - blob.x;
        const dy = pointerY - blob.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const influence = isPointerActive ? Math.max(0, 1 - dist / 260) : 0;
        const multiplier = 0.022;

        blob.vx += (dx * influence * multiplier) + (Math.random() - 0.5) * 0.04;
        blob.vy += (dy * influence * multiplier) + (Math.random() - 0.5) * 0.04;

        // Damping
        blob.vx *= 0.999;
        blob.vy *= 0.999;

        // Speed clamp
        const speed = Math.sqrt(blob.vx * blob.vx + blob.vy * blob.vy);
        if (speed > 1.2) {
          blob.vx = (blob.vx / speed) * 1.2;
          blob.vy = (blob.vy / speed) * 1.2;
        }

        blob.x += blob.vx;
        blob.y += blob.vy;

        // Boundary wrapping
        if (blob.x < -blob.radius) blob.x = window.innerWidth + blob.radius;
        if (blob.x > window.innerWidth + blob.radius) blob.x = -blob.radius;
        if (blob.y < -blob.radius) blob.y = window.innerHeight + blob.radius;
        if (blob.y > window.innerHeight + blob.radius) blob.y = -blob.radius;

        const gradient = ctx.createRadialGradient(
          blob.x * dpr, blob.y * dpr, 0,
          blob.x * dpr, blob.y * dpr, blob.radius * dpr
        );
        gradient.addColorStop(0, `hsla(${blob.hue}, 60%, 50%, 0.15)`);
        gradient.addColorStop(0.5, `hsla(${blob.hue}, 55%, 35%, 0.06)`);
        gradient.addColorStop(1, "transparent");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(blob.x * dpr, blob.y * dpr, blob.radius * dpr, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw splats
      for (let i = splats.length - 1; i >= 0; i--) {
        const s = splats[i];
        s.alpha -= 0.012;
        if (s.alpha <= 0) {
          splats.splice(i, 1);
          continue;
        }

        const gradient = ctx.createRadialGradient(
          s.x * dpr, s.y * dpr, 0,
          s.x * dpr, s.y * dpr, s.radius * dpr
        );
        gradient.addColorStop(0, `rgba(180, 200, 220, ${s.alpha * 0.18})`);
        gradient.addColorStop(1, "transparent");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(s.x * dpr, s.y * dpr, s.radius * dpr, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    }

    function handlePointerMove(e: MouseEvent) {
      pointerX = e.clientX;
      pointerY = e.clientY;
      isPointerActive = true;

      // Add splat
      if (Math.random() < 0.35 && splats.length < 36) {
        splats.push({
          x: e.clientX + (Math.random() - 0.5) * 40,
          y: e.clientY + (Math.random() - 0.5) * 40,
          radius: 18 + Math.random() * 30,
          alpha: 1,
        });
      }
    }

    function handlePointerLeave() {
      isPointerActive = false;
    }

    resize();
    initBlobs();
    draw();

    window.addEventListener("resize", resize);
    canvas.addEventListener("mousemove", handlePointerMove);
    canvas.addEventListener("mouseleave", handlePointerLeave);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", handlePointerMove);
      canvas.removeEventListener("mouseleave", handlePointerLeave);
    };
  }, []);

  return (
    <div className="home-bg-stage fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
      <canvas
        ref={canvasRef}
        className="home-fluid-canvas absolute inset-0 w-full h-full opacity-[0.68]"
      />
    </div>
  );
}
