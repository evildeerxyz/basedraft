"use client";

import { CheckIcon, CopyIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { cn } from "@/lib/utils";

/*
 * Syntax colors, as a code editor shows them: GitHub's light and dark themes, set in globals.css
 * so they follow the mode. One pass over the text, so a keyword inside a string stays part of the string.
 */
const INK = {
  comment: "color:var(--code-comment);font-style:italic",
  key: "color:var(--code-key)",
  string: "color:var(--code-string)",
  number: "color:var(--code-number)",
  keyword: "color:var(--code-keyword)",
  literal: "color:var(--code-number)",
  tag: "color:var(--code-tag)",
  type: "color:var(--code-type)",
  attr: "color:var(--code-key)",
  call: "color:var(--code-call)",
} as const;

const KEYWORDS = "import|from|export|default|function|return|const|let|var|type|interface|as|if|else|new|async|await|extends|typeof|in|of";
// Order matters: the first group that matches names the token.
const TOKEN = new RegExp(
  [
    String.raw`(\/\/[^\n]*|\/\*[\s\S]*?\*\/)`, // comment
    String.raw`("(?:[^"\\\n]|\\.)*")(?=\s*:)`, // "key": in JSON
    String.raw`("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|\x60(?:[^\x60\\]|\\.)*\x60)`, // string, in any of the three quotes
    String.raw`\b(\d+(?:\.\d+)?)\b`, // number
    String.raw`\b(${KEYWORDS})\b`, // keyword
    String.raw`\b(true|false|null|undefined)\b`, // literal
    String.raw`(?<=<\/?)([A-Za-z][\w.]*)`, // JSX tag
    String.raw`\b([A-Z][A-Za-z0-9]*)\b`, // component or type
    String.raw`\b([A-Za-z_][\w-]*)(?==(?!=|>))`, // JSX attribute
    String.raw`\b([A-Za-z_$][\w$]*)(?=\s*:(?!:))`, // object key
    String.raw`\b([A-Za-z_$][\w$]*)(?=\()`, // call
  ].join("|"),
  "g",
);
const KINDS = ["comment", "key", "string", "number", "keyword", "literal", "tag", "type", "attr", "key", "call"] as const;

const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function highlight(code: string) {
  let out = "";
  let at = 0;
  for (const m of code.matchAll(TOKEN)) {
    const g = m.slice(1).findIndex((v) => v !== undefined);
    out += esc(code.slice(at, m.index)) + `<span style="${INK[KINDS[g]]}">${esc(m[0])}</span>`;
    at = m.index + m[0].length;
  }
  return out + esc(code.slice(at));
}

export function CodeBlock({ code, className, maxHeight = 420 }: { code: string; className?: string; maxHeight?: number }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className={cn("relative overflow-hidden rounded-[var(--bd-r-inset)] bg-surface shadow-[0_0_0_1px_rgb(var(--bd-ink)/0.08)]", className)}>
      <button onClick={copy} className="absolute right-1.5 top-1.5 z-10 inline-flex h-7 items-center gap-1.5 rounded-[4px] bg-surface-2 px-2.5 text-meta font-medium shadow-[0_0_0_1px_rgb(var(--bd-ink)/0.08)] transition-colors hover:bg-fg/[0.06]" aria-label="Copy code">
        {copied ? <CheckIcon size={13} weight="bold" className="text-accent" /> : <CopyIcon size={13} />}
        {copied ? "Copied" : "Copy"}
      </button>
      <pre className="overflow-auto p-4 pr-24 font-mono text-[13px] leading-[1.65] text-[var(--code-text)]" style={{ maxHeight }}>
        <code dangerouslySetInnerHTML={{ __html: highlight(code) }} />
      </pre>
    </div>
  );
}
