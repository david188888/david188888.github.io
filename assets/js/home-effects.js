(() => {
  const HOME_CLASS = "homepage-active";

  const initCanvas = (canvas) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return null;
    }
    const state = { width: 0, height: 0, dpr: 1 };
    const resize = () => {
      state.dpr = Math.min(window.devicePixelRatio || 1, 2);
      state.width = window.innerWidth;
      state.height = window.innerHeight;
      canvas.width = Math.floor(state.width * state.dpr);
      canvas.height = Math.floor(state.height * state.dpr);
      canvas.style.width = `${state.width}px`;
      canvas.style.height = `${state.height}px`;
      ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);
    return { ctx, state, destroy: () => window.removeEventListener("resize", resize) };
  };

  const initFluidBackground = (canvas, pointer) => {
    const canvasState = initCanvas(canvas);
    if (!canvasState) {
      return () => {};
    }
    const { ctx, state, destroy } = canvasState;
    let rafId = 0;
    const splats = [];

    const blobs = Array.from({ length: 8 }, (_, index) => ({
      x: Math.random() * state.width,
      y: Math.random() * state.height,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      radius: 180 + Math.random() * 220,
      hue: 214 + index * 5
    }));

    const spawnSplat = (x, y, velocity) => {
      splats.push({
        x,
        y,
        radius: 24 + Math.min(velocity * 0.35, 36),
        alpha: 0.28
      });
      if (splats.length > 36) {
        splats.shift();
      }
    };

    const update = () => {
      const { width, height } = state;
      ctx.clearRect(0, 0, width, height);

      ctx.globalCompositeOperation = "lighter";
      blobs.forEach((blob) => {
        blob.x += blob.vx;
        blob.y += blob.vy;
        if (blob.x < -blob.radius * 0.4) blob.x = width + blob.radius * 0.2;
        if (blob.x > width + blob.radius * 0.4) blob.x = -blob.radius * 0.2;
        if (blob.y < -blob.radius * 0.4) blob.y = height + blob.radius * 0.2;
        if (blob.y > height + blob.radius * 0.4) blob.y = -blob.radius * 0.2;

        if (pointer.active) {
          const dx = blob.x - pointer.x;
          const dy = blob.y - pointer.y;
          const distance = Math.hypot(dx, dy) || 1;
          const influence = Math.max(0, 1 - distance / 260);
          blob.vx += (dx / distance) * influence * 0.022;
          blob.vy += (dy / distance) * influence * 0.022;
        }

        blob.vx *= 0.991;
        blob.vy *= 0.991;

        const gradient = ctx.createRadialGradient(blob.x, blob.y, blob.radius * 0.08, blob.x, blob.y, blob.radius);
        gradient.addColorStop(0, `hsla(${blob.hue}, 58%, 62%, 0.15)`);
        gradient.addColorStop(0.5, `hsla(${blob.hue + 8}, 48%, 52%, 0.09)`);
        gradient.addColorStop(1, "hsla(224, 46%, 28%, 0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(blob.x, blob.y, blob.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      for (let i = splats.length - 1; i >= 0; i -= 1) {
        const splat = splats[i];
        splat.radius += 2.4;
        splat.alpha *= 0.95;
        if (splat.alpha < 0.014) {
          splats.splice(i, 1);
          continue;
        }
        const gradient = ctx.createRadialGradient(splat.x, splat.y, splat.radius * 0.12, splat.x, splat.y, splat.radius);
        gradient.addColorStop(0, `rgba(176, 188, 208, ${splat.alpha})`);
        gradient.addColorStop(1, "rgba(98, 112, 138, 0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(splat.x, splat.y, splat.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = "source-over";
      rafId = requestAnimationFrame(update);
    };

    const handlePointer = (event) => {
      const movement = Math.hypot(event.movementX || 0, event.movementY || 0);
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
      if (movement > 1.5) {
        spawnSplat(pointer.x, pointer.y, movement);
      }
    };

    const clearPointer = () => {
      pointer.active = false;
    };

    document.addEventListener("pointermove", handlePointer, { passive: true });
    document.addEventListener("pointerleave", clearPointer);
    rafId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener("pointermove", handlePointer);
      document.removeEventListener("pointerleave", clearPointer);
      destroy();
    };
  };

  const runHomeEffects = () => {
    const homeShell = document.querySelector(".home-shell");
    if (!homeShell) {
      return;
    }
    document.body.classList.add(HOME_CLASS);

    if (!localStorage.getItem("theme")) {
      localStorage.setItem("theme", "dark");
      document.documentElement.setAttribute("data-theme", "dark");
    }

    const typedTarget = document.querySelector(".js-typed-role");
    if (typedTarget) {
      const roles = (typedTarget.dataset.roles || "")
        .split("|")
        .map((item) => item.trim())
        .filter(Boolean);
      if (roles.length > 0) {
        let roleIndex = 0;
        let charIndex = 0;
        let deleting = false;
        const typeLoop = () => {
          const current = roles[roleIndex];
          typedTarget.textContent = current.slice(0, charIndex);
          if (!deleting && charIndex < current.length) {
            charIndex += 1;
            setTimeout(typeLoop, 58);
            return;
          }
          if (!deleting && charIndex === current.length) {
            deleting = true;
            setTimeout(typeLoop, 1200);
            return;
          }
          if (deleting && charIndex > 0) {
            charIndex -= 1;
            setTimeout(typeLoop, 34);
            return;
          }
          deleting = false;
          roleIndex = (roleIndex + 1) % roles.length;
          setTimeout(typeLoop, 240);
        };
        typeLoop();
      }
    }

    const revealItems = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      revealItems.forEach((item) => item.classList.add("is-visible"));
    } else {
      const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.14, rootMargin: "0px 0px -40px 0px" });
      revealItems.forEach((item) => revealObserver.observe(item));
    }

    const runCounter = (element) => {
      const target = Number(element.dataset.target || "0");
      const start = performance.now();
      const duration = 1080;
      const tick = (time) => {
        const progress = Math.min((time - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        element.textContent = String(Math.round(target * eased));
        if (progress < 1) {
          requestAnimationFrame(tick);
        }
      };
      requestAnimationFrame(tick);
    };

    const counters = document.querySelectorAll(".js-counter");
    if (!("IntersectionObserver" in window)) {
      counters.forEach((counter) => runCounter(counter));
    } else {
      const counterObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }
          runCounter(entry.target);
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.6 });
      counters.forEach((counter) => counterObserver.observe(counter));
    }

    const pointer = { x: window.innerWidth * 0.5, y: window.innerHeight * 0.4, active: false };

    document.addEventListener("pointermove", (event) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
      const rect = homeShell.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        return;
      }
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      if (x < 0 || x > 100 || y < 0 || y > 100) {
        return;
      }
      homeShell.style.setProperty("--pointer-x", `${x.toFixed(2)}%`);
      homeShell.style.setProperty("--pointer-y", `${y.toFixed(2)}%`);
    }, { passive: true });
    document.addEventListener("pointerleave", () => {
      pointer.active = false;
    });

    const fluidCanvas = document.querySelector(".js-home-fluid");
    if (fluidCanvas) {
      initFluidBackground(fluidCanvas, pointer);
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runHomeEffects);
  } else {
    runHomeEffects();
  }
})();
