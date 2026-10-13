"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckIcon, CopyIcon } from "@phosphor-icons/react/dist/ssr";
import { INSTALL_COMMAND, cn, copyText } from "@/lib/site";

export function CopyCommand({
  command = INSTALL_COMMAND,
  tone = "dark",
  className,
}: {
  command?: string;
  tone?: "dark" | "light";
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    if (!(await copyText(command))) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <button
      type="button"
      onClick={onCopy}
      aria-label={`Copy command: ${command}`}
      className={cn(
        "group flex h-12 max-w-full items-center gap-3 rounded-[6px] border pl-4 pr-3 text-left font-mono text-[13px] transition-colors",
        tone === "dark"
          ? "border-paper/15 bg-ink text-fog hover:border-paper/35 hover:text-paper"
          : "border-ink/12 bg-paper-2 text-ink/75 hover:border-ink/30 hover:text-ink",
        className,
      )}
    >
      <span className={tone === "dark" ? "text-accent" : "text-ink/40"}>$</span>
      <span className="truncate">{command}</span>
      <span
        className={cn(
          "relative ml-auto grid size-7 shrink-0 place-items-center rounded-[4px] transition-colors",
          tone === "dark"
            ? "bg-paper/5 text-paper/60 group-hover:bg-paper/10 group-hover:text-paper"
            : "bg-ink/5 text-ink/50 group-hover:bg-ink/10 group-hover:text-ink",
        )}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={copied ? "y" : "n"}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.18 }}
          >
            {copied ? (
              <CheckIcon size={14} weight="bold" className={tone === "dark" ? "text-accent" : "text-ink"} />
            ) : (
              <CopyIcon size={14} />
            )}
          </motion.span>
        </AnimatePresence>
      </span>
    </button>
  );
}
