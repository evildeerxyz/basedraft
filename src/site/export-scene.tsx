"use client";

import { LayoutGroup, motion } from "motion/react";
import { useId, useState } from "react";
import { cn } from "@/lib/utils";
import { FigmaLayers, Files, PullRequest } from "./exits";
import { WithKeys } from "./keys";
import { Scene } from "./showcase";

/*
 * The three ways a site leaves basedraft, one at a time on a scene: what you'd see at the other
 * end (the layers in Figma, the files on your machine, the pull request on GitHub), a line on it,
 * and a switch along the foot to try the next.
 */
const EXITS = [
  { id: "figma", label: "Figma", title: "Paste it into Figma", body: "Auto layout, components and named layers, at desktop, tablet and phone. Copy, then {Cmd V}. No plugin.", panel: <FigmaLayers /> },
  { id: "code", label: "Code", title: "Download the code", body: "The template's own code, in Next.js or Astro, with your pages and your words written in.", panel: <Files /> },
  { id: "github", label: "GitHub", title: "Send it to GitHub", body: "A new repository with the whole site, or a pull request on one you already have.", panel: <PullRequest /> },
] as const;

export function ExportScene() {
  const [at, setAt] = useState<(typeof EXITS)[number]["id"]>("figma");
  const id = useId();
  const exit = EXITS.find((e) => e.id === at)!;
  return (
    <Scene glow="c" className="p-4 sm:p-8">
      <div className="rounded-[var(--bd-r-sheet)] border border-line bg-surface px-5 pb-5 pt-5 shadow-[var(--bd-shadow-raised)] sm:px-7 sm:pb-7">
        <motion.div key={at} initial={{ opacity: 0, filter: "blur(6px)" }} animate={{ opacity: 1, filter: "blur(0px)" }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>
          <h3 className="font-display text-[clamp(1.75rem,1.2rem+1.6vw,2.6rem)] leading-[1.1] tracking-[-0.04em]">{exit.title}</h3>
          <p className="mt-3 max-w-[440px] text-ui leading-[1.6] text-muted">
            <WithKeys text={exit.body} />
          </p>
          <div aria-hidden className="mt-6 grid h-[250px] place-items-center rounded-[var(--bd-r-inset)] bg-surface-2 px-4">
            {exit.panel}
          </div>
        </motion.div>
        <LayoutGroup id={id}>
          <div role="tablist" aria-label="Where it goes" className="mt-5 grid grid-cols-3 rounded-full bg-surface-2 p-1">
            {EXITS.map((e) => {
              const on = e.id === at;
              return (
                <button key={e.id} type="button" role="tab" aria-selected={on} onClick={() => setAt(e.id)} className={cn("relative h-9 rounded-full text-ui transition-colors", on ? "text-fg" : "text-muted hover:text-fg")}>
                  {on && <motion.span layoutId="exit" className="absolute inset-0 rounded-full bg-raised shadow-[var(--bd-shadow-resting),inset_0_0_0_1px_var(--bd-line-subtle)]" transition={{ type: "spring", stiffness: 520, damping: 42 }} />}
                  <span className="relative">{e.label}</span>
                </button>
              );
            })}
          </div>
        </LayoutGroup>
      </div>
    </Scene>
  );
}
