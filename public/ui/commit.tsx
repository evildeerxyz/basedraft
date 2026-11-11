"use client";

import { CheckIcon, GitBranchIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

/*
 * A commit the way people read one: what it says first, then who made it, on which branch, and
 * its short hash, which copies the whole one when pressed. On one line for a list (the message
 * gives way first when room runs short), or stacked for a page about it. Someone without a
 * picture gets the same dithered face here as everywhere else, picked by their name.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

/*
 * A face for someone without a picture, the way Vercel draws them: two colors picked by their name,
 * one dithered into the other through a 4 by 4 ordered matrix, so the same name always gets the
 * same face.
 */
const FACE_BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const FACE_CELLS = 12;
/** The second color's cells, as one path, for each way the gradient can run. */
const FACE_RAMPS = [0, 1, 2, 3].map((dir) => {
  const n = FACE_CELLS - 1;
  let d = "";
  for (let y = 0; y < FACE_CELLS; y++)
    for (let x = 0; x < FACE_CELLS; x++) {
      const t = dir === 0 ? x / n : dir === 1 ? y / n : dir === 2 ? (x + y) / (2 * n) : (x + n - y) / (2 * n);
      if ((FACE_BAYER[(y % 4) * 4 + (x % 4)] + 0.5) / 16 < t * 1.25 - 0.12) d += `M${x} ${y}h1v1h-1z`;
    }
  return d;
});
/** Light and deep, in the muted colors basedraft uses: ocean, pine, moss, ochre, clay, rose, plum, slate. */
const FACE_COLORS: Array<[string, string]> = [
  ["oklch(0.86 0.07 235)", "oklch(0.47 0.13 252)"],
  ["oklch(0.87 0.07 170)", "oklch(0.46 0.09 172)"],
  ["oklch(0.9 0.08 128)", "oklch(0.55 0.12 138)"],
  ["oklch(0.91 0.09 88)", "oklch(0.64 0.14 62)"],
  ["oklch(0.87 0.07 45)", "oklch(0.55 0.14 35)"],
  ["oklch(0.87 0.08 8)", "oklch(0.52 0.16 2)"],
  ["oklch(0.86 0.09 330)", "oklch(0.48 0.15 318)"],
  ["oklch(0.89 0.02 255)", "oklch(0.44 0.04 258)"],
];
const faceSeed = (s: string) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7);

function Face({ name, src, size }: { name: string; src?: string; size: number }) {
  const seed = faceSeed(name);
  const [light, deep] = FACE_COLORS[seed % FACE_COLORS.length];
  return (
    <span className="block shrink-0 overflow-hidden rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.08)]" style={{ width: size, height: size }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        <svg viewBox={`0 0 ${FACE_CELLS} ${FACE_CELLS}`} shapeRendering="crispEdges" aria-hidden className="block size-full">
          <rect width={FACE_CELLS} height={FACE_CELLS} style={{ fill: light }} />
          <path d={FACE_RAMPS[(seed >>> 5) % 4]} style={{ fill: deep }} />
        </svg>
      )}
    </span>
  );
}

export type CommitProps = {
  /** What the commit says: its first line. */
  message: string;
  /** Its hash, whole: the first seven show, and the whole one is copied. */
  sha: string;
  /** The branch it's on. */
  branch?: string;
  /** Who made it. */
  author?: string;
  /** Their picture; without one, a dithered face picked by their name. */
  avatar?: string;
  /** When, as you want it read: "2h ago", "Oct 28". */
  time?: string;
  /** Where the commit lives, to open it: the message becomes a link. */
  href?: string;
  /** On one line, for a list; or stacked, for a page about it. */
  layout?: "line" | "stack";
  /** Stacked, how large its message reads: lg for the head of a page. */
  size?: "md" | "lg";
  className?: string;
};

/** The short hash, which copies the whole one. */
function Sha({ sha }: { sha: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1400);
    return () => window.clearTimeout(t);
  }, [copied]);
  return (
    <button
      type="button"
      onClick={(e) => {
        // In a row that opens on a press, copying the hash doesn't open it too.
        e.stopPropagation();
        void navigator.clipboard?.writeText(sha).then(() => setCopied(true));
      }}
      aria-label={copied ? "Copied" : `Copy commit ${sha.slice(0, 7)}`}
      title="Copy the whole hash"
      className="relative inline-flex h-6 shrink-0 items-center gap-1 rounded-[7px] px-1.5 font-mono text-[11.5px] tabular-nums text-[var(--bd-muted)] outline-none transition-colors hover:bg-[rgb(var(--bd-ink)/0.06)] hover:text-[var(--bd-fg)] focus-visible:shadow-[0_0_0_2px_var(--bd-ui-focus)]"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {copied ? (
          <motion.span key="done" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="inline-flex items-center gap-1 text-[var(--bd-fg)]">
            <CheckIcon weight="bold" className="size-3" />
            copied
          </motion.span>
        ) : (
          <motion.span key="sha" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
            {sha.slice(0, 7)}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

function Branch({ name }: { name: string }) {
  return (
    <span title={name} className="inline-flex h-6 min-w-0 max-w-[180px] shrink items-center gap-1 rounded-[7px] bg-[var(--bd-ui-track)] px-1.5 font-mono text-[11.5px] text-[var(--bd-muted)] shadow-[inset_0_0_0_1px_rgb(var(--bd-ink)/0.05)]">
      <GitBranchIcon weight="regular" className="size-3 shrink-0" />
      <span className="truncate">{name}</span>
    </span>
  );
}

export function Commit({ message, sha, branch, author, avatar, time, href, layout = "line", size = "md", className }: CommitProps) {
  const said = href ? (
    <a href={href} onClick={(e) => e.stopPropagation()} className="outline-none hover:underline hover:decoration-[rgb(var(--bd-ink)/0.3)] hover:underline-offset-4 focus-visible:underline">
      {message}
    </a>
  ) : (
    message
  );

  if (layout === "stack")
    return (
      <div className={cx("grid min-w-0", size === "lg" ? "gap-3" : "gap-2.5", className)}>
        <p className={cx("text-pretty text-[var(--bd-fg)]", size === "lg" ? "text-[20px] font-semibold leading-[1.25] tracking-[-0.018em]" : "text-[15px] font-medium leading-snug")}>{said}</p>
        <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-2">
          {author && (
            <span className="flex min-w-0 items-center gap-2 text-[13px] text-[var(--bd-muted)]">
              <Face name={author} src={avatar} size={20} />
              <span className="truncate">
                <span className="text-[var(--bd-fg)]">{author}</span>
                {time && <> · {time}</>}
              </span>
            </span>
          )}
          <span className="flex min-w-0 items-center gap-1.5">
            {branch && <Branch name={branch} />}
            <Sha sha={sha} />
          </span>
        </div>
      </div>
    );

  return (
    <div className={cx("flex min-w-0 items-center gap-2.5", className)}>
      {author && (
        <span title={author} className="shrink-0">
          <Face name={author} src={avatar} size={20} />
          <span className="sr-only">{author}: </span>
        </span>
      )}
      <span className="min-w-0 flex-1 truncate text-[13.5px] text-[var(--bd-fg)]">{said}</span>
      {branch && <Branch name={branch} />}
      <Sha sha={sha} />
      {time && <span className="shrink-0 text-[12.5px] tabular-nums text-[var(--bd-subtle)]">{time}</span>}
    </div>
  );
}
