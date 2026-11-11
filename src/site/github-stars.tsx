"use client";

import { GithubLogoIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { REPO } from "@/registry";

/*
 * basedraft on GitHub, as a pill: the mark, "Star", and how many people have starred it. The
 * count comes from GitHub's API in the visitor's own browser (each visitor has their own allowance
 * there, which a shared server address wouldn't), once a visit, kept for an hour. Until it's in, or
 * while it's none, the pill just says Star.
 */

const KEY = "bd-stars";
const HOUR = 60 * 60 * 1000;
const API = REPO.replace("https://github.com/", "https://api.github.com/repos/");

let asked: Promise<number | null> | null = null;
function stars(): Promise<number | null> {
  try {
    const kept = JSON.parse(sessionStorage.getItem(KEY) ?? "null") as { n: number; at: number } | null;
    if (kept && Date.now() - kept.at < HOUR) return Promise.resolve(kept.n);
  } catch {}
  return (asked ??= fetch(API, { headers: { Accept: "application/vnd.github+json" } })
    .then((r) => (r.ok ? (r.json() as Promise<{ stargazers_count?: number }>) : null))
    .then((b) => {
      const n = typeof b?.stargazers_count === "number" ? b.stargazers_count : null;
      if (n !== null)
        try {
          sessionStorage.setItem(KEY, JSON.stringify({ n, at: Date.now() }));
        } catch {}
      return n;
    })
    .catch(() => null));
}

/** 12, 980, 1.2k, 14k. */
const short = (n: number) => (n < 1000 ? String(n) : `${(n / 1000).toFixed(n < 10_000 ? 1 : 0).replace(/\.0$/, "")}k`);

export function GitHubStars({ className, compact }: { className?: string; /** Without the word, where the header is short of room. */ compact?: boolean }) {
  const [n, setN] = useState<number | null>(null);
  useEffect(() => {
    let on = true;
    void stars().then((v) => on && setN(v));
    return () => {
      on = false;
    };
  }, []);
  const count = n ? short(n) : null;
  return (
    <a
      href={REPO}
      target="_blank"
      rel="noreferrer"
      aria-label={count ? `Star basedraft on GitHub, ${n!.toLocaleString("en-US")} stars` : "Star basedraft on GitHub"}
      title={count ? `${n!.toLocaleString("en-US")} stars on GitHub` : "Star basedraft on GitHub"}
      className={cn("inline-flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-full text-ui font-medium text-fg shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--bd-fg)_14%,transparent)] transition-[background-color,scale] duration-200 hover:bg-surface-2 active:scale-[0.98]", compact && !count ? "w-9 justify-center" : "pl-3 pr-3.5", className)}
    >
      <GithubLogoIcon size={16} weight="duotone" className="shrink-0" />
      {!compact && "Star"}
      {count && (
        <>
          {!compact && <span aria-hidden className="h-4 w-px bg-line-strong" />}
          <span className="tabular-nums">{count}</span>
        </>
      )}
    </a>
  );
}
