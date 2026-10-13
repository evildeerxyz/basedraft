"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon } from "@phosphor-icons/react/dist/ssr";
import { copyText } from "@/lib/site";
import { Code } from "../editor/highlight";

export function CodeBlock({ code, title }: { code: string; title?: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    if (!(await copyText(code))) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="overflow-hidden rounded-[8px] border border-ink/10 bg-ink text-paper">
      <div className="flex h-9 items-center gap-3 border-b border-paper/8 pl-4 pr-1.5">
        <span className="font-mono text-[11.5px] text-paper/45">{title ?? "Code"}</span>
        <button
          type="button"
          onClick={onCopy}
          aria-label={copied ? "Copied" : "Copy code"}
          className="ml-auto flex h-7 items-center gap-1.5 rounded-[4px] px-2 font-mono text-[11px] text-paper/50 transition-colors hover:bg-paper/5 hover:text-paper"
        >
          {copied ? <CheckIcon size={13} weight="bold" className="text-accent" /> : <CopyIcon size={13} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="no-scrollbar overflow-x-auto px-4 py-3.5 font-mono text-[13px] leading-[1.7]" data-lenis-prevent-horizontal>
        {code.split("\n").map((line, i) => (
          <div key={i} className="min-h-[1.7em]">
            <Code line={line} />
          </div>
        ))}
      </pre>
    </div>
  );
}
