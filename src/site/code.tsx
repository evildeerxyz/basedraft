"use client";

import { CheckIcon, CopyIcon, FileCodeIcon } from "@phosphor-icons/react";
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

/* A word as a pattern that matches only itself. */
const escapeRe = (w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** Whether a line of code uses any of these words, whole. */
export const usesWord = (line: string, words: string[]) => words.some((w) => new RegExp(`\\b${escapeRe(w)}\\b`).test(line));

const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function highlight(code: string) {
  let out = "";
  let at = 0;
  for (const m of code.matchAll(TOKEN)) {
    const g = m.slice(1).findIndex((v) => v !== undefined);
    out += esc(code.slice(at, m.index)) + `<span style="${INK[KINDS[g]]}">${esc(m[0])}</span>`;
    at = m.index + m[0].length;
  }
  return out + esc(code.slice(at));
}

/**
 * Code in a card, the way a docs page shows it: a head with the file's name and a pill to copy it,
 * then the lines, numbered.
 */
export function CodeBlock({ code, className, maxHeight = 420, file = "page.tsx", bare, mark }: { code: string; className?: string; maxHeight?: number; file?: string; /** No card of its own, for code set inside another card. */ bare?: boolean; /** Words whose lines light up while the rest dim, as when a prop is pointed at. */ mark?: string[] | null }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  // Colored a line at a time, so each line stands on its own with its number.
  const lines = code.split("\n");
  const hit = (line: string) => !!mark && usesWord(line, mark);
  // Only a mark the code uses dims the rest; one it doesn't leaves the code as it is.
  const marking = lines.some(hit);
  return (
    <div className={cn("overflow-hidden bg-surface", !bare && "rounded-[var(--bd-r-sheet)] border border-line shadow-[var(--bd-shadow-raised)]", className)}>
      <div className="flex h-12 items-center justify-between gap-3 border-b border-line-subtle pl-4 pr-2">
        <span className="flex min-w-0 items-center gap-2 text-meta text-muted">
          <FileCodeIcon weight="duotone" size={14} className="shrink-0" />
          <span className="truncate">{file}</span>
        </span>
        <button type="button" onClick={copy} className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-surface-2 px-3 text-meta font-medium text-muted transition-colors hover:text-fg" aria-label="Copy code">
          {copied ? <CheckIcon size={13} weight="duotone" /> : <CopyIcon weight="duotone" size={13} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      {/* Long lines wrap rather than scroll sideways, each one carried on under its own indent. */}
      <pre className="overflow-y-auto overflow-x-hidden py-4 font-mono text-[12.5px] leading-[1.75] text-[var(--code-text)]" style={{ maxHeight }}>
        <code className="block">
          {lines.map((line, i) => {
            const hang = `${(line.match(/^\s*/)?.[0].length ?? 0) + 2}ch`;
            return (
              <span key={i} className={cn("flex pr-5 transition-[opacity,background-color,box-shadow] duration-200", marking && (hit(line) ? "bg-fg/[0.05] shadow-[inset_2px_0_0_var(--bd-fg)]" : "opacity-40"))}>
                <span aria-hidden className="w-12 shrink-0 select-none pr-4 text-right text-subtle">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 whitespace-pre-wrap [overflow-wrap:anywhere]" style={{ paddingLeft: hang, textIndent: `-${hang}` }} dangerouslySetInnerHTML={{ __html: highlight(line) || " " }} />
              </span>
            );
          })}
        </code>
      </pre>
    </div>
  );
}
