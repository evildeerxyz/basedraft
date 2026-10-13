"use client";

import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

/*
 * What a site comes as: every template is its own Next.js code, and its Astro version, the same
 * components, pages and content. One choice, kept in this browser, for downloads, GitHub and the
 * code Studio shows.
 */

export type Framework = "next" | "astro";
export const FRAMEWORK_LABEL: Record<Framework, string> = { next: "Next.js", astro: "Astro" };
/** The versions each comes in, for copy. */
export const FRAMEWORK_STACK: Record<Framework, string> = { next: "Next.js 16", astro: "Astro 7" };

const KEY = "bd-framework";
const listeners = new Set<() => void>();
const read = (): Framework => {
  try {
    return localStorage.getItem(KEY) === "astro" ? "astro" : "next";
  } catch {
    return "next";
  }
};

export function useFramework(): [Framework, (f: Framework) => void] {
  const value = useSyncExternalStore(
    (change) => {
      listeners.add(change);
      return () => listeners.delete(change);
    },
    read,
    () => "next" as Framework,
  );
  const set = (f: Framework) => {
    try {
      localStorage.setItem(KEY, f);
    } catch {
      /* storage blocked: the choice lasts as long as the page */
    }
    listeners.forEach((l) => l());
  };
  return [value, set];
}

/** Next.js or Astro, as a pair of tabs. */
export function FrameworkSwitch({ value, onChange, className, label = "Framework" }: { value: Framework; onChange: (f: Framework) => void; className?: string; label?: string }) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("inline-flex rounded-control bg-fg/[0.06] p-0.5", className)}>
      {(["next", "astro"] as const).map((f) => (
        <button
          key={f}
          type="button"
          role="radio"
          aria-checked={value === f}
          onClick={() => onChange(f)}
          className={cn("h-7 rounded-[8px] px-2.5 text-meta font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-fg/20", value === f ? "bg-raised text-fg shadow-[0_1px_2px_rgb(var(--bd-shade)/0.12)]" : "text-muted hover:text-fg")}
        >
          {FRAMEWORK_LABEL[f]}
        </button>
      ))}
    </div>
  );
}
