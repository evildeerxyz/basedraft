"use client";

import { CheckIcon, CopyIcon } from "@phosphor-icons/react";
import { LayoutGroup, motion } from "motion/react";
import { useEffect, useId, useState } from "react";

/*
 * A shell command on a small ink terminal, dark in light mode and dark, colored the way a
 * terminal colors one: the program bright, its arguments gray, flags and addresses in mint, and &&
 * in amber. Give it several commands, keyed by package manager, and it adds a switch between them.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");
const PROGRAMS = new Set(["npm", "npx", "pnpm", "pnpx", "bun", "bunx", "yarn", "cd", "git", "claude", "curl", "unzip"]);

/** Splits a command into words, each with its color; a program only counts as the first word of its command. */
function tokens(command: string) {
  let first = true;
  return command.split(/(\s+)/).map((p) => {
    if (/^\s+$/.test(p)) return { p, tone: "" };
    let tone = "text-[oklch(78%_0_0)]";
    if (p === "&&" || p === "|" || p === ";") {
      tone = "text-[oklch(80%_0.12_75)]";
      first = true;
    } else if (first && PROGRAMS.has(p)) {
      tone = "font-medium text-white";
      first = false;
    } else if (/^-{1,2}\w/.test(p) || /^https?:\/\//.test(p) || /^["']/.test(p)) tone = "text-[oklch(84%_0.09_165)]";
    else first = false;
    return { p, tone };
  });
}

export function CommandLine({ command, commands, label, className }: { command?: string; commands?: Record<string, string>; /** A word on what it's for, beside the switch. */ label?: string; className?: string }) {
  const keys = commands ? Object.keys(commands) : [];
  const [at, setAt] = useState(keys[0] ?? "");
  const [copied, setCopied] = useState(false);
  const id = useId();
  const text = commands ? commands[at] : (command ?? "");
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(t);
  }, [copied]);
  return (
    <div className={cx("overflow-hidden rounded-[18px] text-sm text-[oklch(92%_0_0)] [background:linear-gradient(180deg,oklch(25%_0.004_265),oklch(17%_0.004_265))] shadow-[inset_0_1px_0_rgb(255_255_255/0.08),inset_0_0_0_1px_rgb(255_255_255/0.06),0_14px_32px_-16px_rgb(var(--bd-shade)/0.6)]", className)}>
      {(keys.length > 1 || label) && (
        <div className="flex items-center gap-2 px-2 pt-2">
          {/* Three quiet dots, so it reads as a terminal at a glance. */}
          <span aria-hidden className="flex gap-1 px-2">
            <span className="size-2 rounded-full bg-white/15" />
            <span className="size-2 rounded-full bg-white/15" />
            <span className="size-2 rounded-full bg-white/15" />
          </span>
          {label && <span className="truncate text-xs text-white/45">{label}</span>}
          {keys.length > 1 && (
            <LayoutGroup id={id}>
              <div role="tablist" aria-label="Package manager" className="ml-auto flex gap-0.5 rounded-full bg-white/[0.05] p-0.5">
                {keys.map((k) => (
                  <button key={k} type="button" role="tab" aria-selected={k === at} onClick={() => setAt(k)} className={cx("relative h-6 rounded-full px-2.5 font-mono text-[11.5px] transition-colors focus-visible:outline-2 focus-visible:outline-white/40", k === at ? "text-white" : "text-white/50 hover:text-white/80")}>
                    {k === at && <motion.span layoutId="manager" className="absolute inset-0 rounded-full bg-white/[0.13] shadow-[inset_0_1px_0_rgb(255_255_255/0.08)]" transition={{ type: "spring", stiffness: 520, damping: 42 }} />}
                    <span className="relative">{k}</span>
                  </button>
                ))}
              </div>
            </LayoutGroup>
          )}
        </div>
      )}
      <div className="flex items-center gap-2 py-2 pl-4 pr-2">
        <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap py-1 font-mono text-[13px] [scrollbar-width:none]">
          <span className="select-none text-white/35">$ </span>
          {tokens(text).map(({ p, tone }, i) =>
            tone ? (
              <span key={i} className={tone}>
                {p}
              </span>
            ) : (
              p
            ),
          )}
        </code>
        <button type="button" aria-label={copied ? "Copied" : "Copy the command"} onClick={() => void navigator.clipboard?.writeText(text).then(() => setCopied(true))} className="grid size-8 shrink-0 place-items-center rounded-full bg-white/[0.06] text-white/70 transition-[background-color,color,scale] hover:bg-white/[0.12] hover:text-white active:scale-[0.94] focus-visible:outline-2 focus-visible:outline-white/40">
          {copied ? <CheckIcon size={14} weight="bold" className="text-[oklch(84%_0.09_165)]" /> : <CopyIcon size={14} weight="duotone" />}
        </button>
      </div>
    </div>
  );
}
