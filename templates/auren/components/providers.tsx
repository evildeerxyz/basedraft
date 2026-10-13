"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { MotionConfig } from "motion/react";
import { ReactLenis, useLenis } from "lenis/react";
import { THEMES, THEME_EVENT, type ThemeId } from "@/lib/site";
import { useMediaQuery } from "@/lib/hooks";
import { CommandPalette } from "./command-palette";
import { Toaster } from "./ui/toaster";

export function Providers({ children }: { children: ReactNode }) {
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem("auren-theme");
    } catch {}
    if (saved && THEMES.some((t) => t.id === saved)) {
      document.documentElement.dataset.theme = saved as ThemeId;
      window.dispatchEvent(new Event(THEME_EVENT));
    }
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <ReactLenis root options={{ lerp: reduced ? 1 : 0.11, smoothWheel: !reduced }}>
        <ScrollReset />
        {children}
        <CommandPalette />
        <Toaster />
      </ReactLenis>
    </MotionConfig>
  );
}

/** Keeps Lenis in step with route changes: new pages start at the top. */
function ScrollReset() {
  const pathname = usePathname();
  const lenis = useLenis();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (window.location.hash) return;
    lenis?.scrollTo(0, { immediate: true, force: true });
  }, [pathname, lenis]);

  return null;
}
