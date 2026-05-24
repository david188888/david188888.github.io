"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UseTypeWriterOptions {
  roles: string[];
  typeSpeed?: number;
  deleteSpeed?: number;
  pauseAfterType?: number;
  pauseBetweenRoles?: number;
}

export function useTypeWriter({
  roles,
  typeSpeed = 58,
  deleteSpeed = 34,
  pauseAfterType = 1200,
  pauseBetweenRoles = 240,
}: UseTypeWriterOptions) {
  const [displayText, setDisplayText] = useState("");
  const [roleIndex, setRoleIndex] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const type = useCallback(() => {
    const currentRole = roles[roleIndex];
    let charIndex = 0;
    let phase: "type" | "pause" | "delete" = "type";

    const tick = () => {
      if (phase === "type") {
        if (charIndex < currentRole.length) {
          charIndex++;
          setDisplayText(currentRole.slice(0, charIndex));
          timeoutRef.current = setTimeout(tick, typeSpeed);
        } else {
          phase = "pause";
          timeoutRef.current = setTimeout(tick, pauseAfterType);
        }
      } else if (phase === "pause") {
        phase = "delete";
        timeoutRef.current = setTimeout(tick, pauseBetweenRoles);
      } else if (phase === "delete") {
        if (charIndex > 0) {
          charIndex--;
          setDisplayText(currentRole.slice(0, charIndex));
          timeoutRef.current = setTimeout(tick, deleteSpeed);
        } else {
          setRoleIndex((prev) => (prev + 1) % roles.length);
        }
      }
    };

    tick();
  }, [roles, roleIndex, typeSpeed, deleteSpeed, pauseAfterType, pauseBetweenRoles]);

  useEffect(() => {
    type();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [type]);

  return displayText;
}
