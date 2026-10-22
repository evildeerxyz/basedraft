"use client";

import { CheckCircleIcon } from "@phosphor-icons/react";
import { useEffect, useState, type ComponentType } from "react";
import { Spinner } from "../../ui/spinner";

/*
 * A deploy, counting its pages, then live for a moment, then off again: the spinner while it's
 * working, and its words beside it saying what.
 */

const PAGES = 25;

export function Demo() {
  const [n, setN] = useState(0);
  const done = n >= PAGES;
  useEffect(() => {
    const t = setTimeout(() => setN((x) => (x >= PAGES ? 0 : x + 1)), n >= PAGES ? 2600 : n === 0 ? 900 : 150);
    return () => clearTimeout(t);
  }, [n]);
  return (
    <div className="w-full max-w-[340px] rounded-[18px] bg-[var(--bd-surface)] p-4 shadow-[0_1px_2px_rgb(var(--bd-shade)/0.06),inset_0_0_0_1px_rgb(var(--bd-ink)/0.07)]">
      <div className="flex items-center gap-3">
        <span className="grid size-6 place-items-center text-[var(--bd-fg)]">{done ? <CheckCircleIcon weight="duotone" className="size-6 text-[var(--bd-ui-ok)]" /> : <Spinner label="Deploying zuno-site" />}</span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[var(--bd-fg)]">{done ? "zuno-site is live" : "Deploying zuno-site"}</p>
          <p className="text-xs tabular-nums text-[var(--bd-muted)]">{done ? "25 pages, on zuno.site" : `Building pages, ${n} of ${PAGES}`}</p>
        </div>
      </div>
    </div>
  );
}

export const examples: Record<string, ComponentType> = {
  sizes: () => (
    <div className="flex items-center gap-8">
      <Spinner size="sm" />
      <Spinner />
      <Spinner size="lg" />
    </div>
  ),
  inline: () => (
    <p className="flex items-center gap-2.5 text-sm text-[var(--bd-muted)]">
      <Spinner size="sm" label="Checking your license" />
      Checking your license
    </p>
  ),
  "on-ink": () => (
    <div className="flex items-center gap-2.5 rounded-full px-4 py-2.5 text-sm font-medium text-[var(--bd-ui-ink-text)] [background:var(--bd-ui-ink)]">
      <Spinner size="sm" label="Sending to GitHub" />
      Sending to GitHub
    </div>
  ),
  panel: () => (
    <div className="grid h-44 w-full place-items-center rounded-[18px] bg-[var(--bd-ui-field)] shadow-[var(--bd-ui-well)]">
      <div className="grid justify-items-center gap-3 text-sm text-[var(--bd-muted)]">
        <Spinner size="lg" label="Loading your purchases" />
        Loading your purchases
      </div>
    </div>
  ),
};
