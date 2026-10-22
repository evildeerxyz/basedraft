"use client";

import { CheckIcon, CopyIcon, FileCodeIcon, FileCssIcon, FileJsIcon, FileTsIcon, FileTsxIcon, TerminalWindowIcon, type Icon } from "@phosphor-icons/react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useMemo, useState, type CSSProperties } from "react";

/*
 * Code on a card the way docs show it: its file's name over it, or tabs for the same thing in a
 * few ways (npm, pnpm, bun), and a button that copies it. It's colored in the theme's own hues,
 * so it reads in light and dark alike. Long lines wrap with a hanging indent instead of scrolling
 * sideways, lines can be marked, and a long file folds to its first lines with a way to see all.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

export type CodeLanguage = "tsx" | "ts" | "jsx" | "js" | "css" | "json" | "bash";
type Kind = "comment" | "string" | "keyword" | "number" | "type" | "attr" | "call" | "plain";

const KEYWORDS = "import|export|from|const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|await|async|default|as|of|in|typeof|instanceof|class|extends|implements|interface|type|enum|readonly|static|void|null|undefined|true|false|this|super|try|catch|finally|throw|yield|delete";
const STRING = String.raw`"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|` + "`(?:\\\\[\\s\\S]|[^`\\\\])*`";

/* Each language's rules, first match wins: what to color, and how to find it. */
const RULES: Record<"script" | "css" | "json" | "bash", Array<[Kind, string]>> = {
  script: [
    ["comment", String.raw`\/\/[^\n]*|\/\*[\s\S]*?\*\/`],
    ["string", STRING],
    ["type", String.raw`(?<=<\/?)[A-Za-z][\w.:-]*`],
    ["attr", String.raw`\b[a-zA-Z_][\w-]*(?==[{"'])`],
    ["keyword", String.raw`\b(?:${KEYWORDS})\b`],
    ["type", String.raw`\b[A-Z][A-Za-z0-9_]*\b`],
    ["call", String.raw`\b[a-zA-Z_$][\w$]*(?=\s*\()`],
    ["number", String.raw`\b\d[\d_]*(?:\.\d+)?\b`],
  ],
  css: [
    ["comment", String.raw`\/\*[\s\S]*?\*\/`],
    ["string", STRING],
    ["keyword", String.raw`@[\w-]+|!important`],
    ["attr", String.raw`(?<=^\s*|[{;]\s*)-{0,2}[a-zA-Z][\w-]*(?=\s*:(?!:))`],
    ["number", String.raw`#[0-9a-fA-F]{3,8}\b|-?\b\d+(?:\.\d+)?(?:px|rem|em|%|ms|s|deg|vh|vw|fr|ch)?\b`],
    ["call", String.raw`[\w-]+(?=\()`],
    ["type", String.raw`[.#][A-Za-z_][\w-]*`],
  ],
  json: [
    ["attr", String.raw`"(?:\\.|[^"\\])*"(?=\s*:)`],
    ["string", STRING],
    ["keyword", String.raw`\b(?:true|false|null)\b`],
    ["number", String.raw`-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b`],
  ],
  bash: [
    ["string", STRING],
    ["comment", String.raw`(?<=^|\s)#[^\n]*`],
    ["keyword", String.raw`^\s*\$(?=\s)`],
    ["call", String.raw`(?<=^\s*(?:\$\s+)?)[\w./@-]+`],
    ["attr", String.raw`(?<=\s)--?[\w-]+`],
    ["type", String.raw`\$\{?\w+\}?`],
  ],
};
const familyOf = (l: CodeLanguage) => (l === "css" ? "css" : l === "json" ? "json" : l === "bash" ? "bash" : "script");

/** The code as lines of colored pieces: one pass over the whole of it, so comments and strings can span lines. */
function highlight(code: string, language: CodeLanguage) {
  const rules = RULES[familyOf(language)];
  const re = new RegExp(rules.map(([, s]) => `(${s})`).join("|"), "gm");
  const pieces: Array<{ kind: Kind; text: string }> = [];
  let at = 0;
  for (const m of code.matchAll(re)) {
    if (!m[0]) continue;
    if (m.index! > at) pieces.push({ kind: "plain", text: code.slice(at, m.index) });
    const g = m.slice(1).findIndex((v) => v !== undefined);
    pieces.push({ kind: rules[g][0], text: m[0] });
    at = m.index! + m[0].length;
  }
  if (at < code.length) pieces.push({ kind: "plain", text: code.slice(at) });
  const lines: Array<Array<{ kind: Kind; text: string }>> = [[]];
  for (const p of pieces) {
    p.text.split("\n").forEach((part, i) => {
      if (i > 0) lines.push([]);
      if (part) lines.at(-1)!.push({ kind: p.kind, text: part });
    });
  }
  return lines;
}

/* The colors: the theme's data hues, drawn toward the text color so they read on light and dark alike. */
const INK: Record<Kind, string | undefined> = {
  comment: "var(--bd-subtle)",
  string: "color-mix(in oklab, var(--bd-ui-viz-2) 70%, var(--bd-fg))",
  keyword: "color-mix(in oklab, var(--bd-ui-viz-5) 82%, var(--bd-fg))",
  number: "color-mix(in oklab, var(--bd-ui-viz-3) 72%, var(--bd-fg))",
  type: "color-mix(in oklab, var(--bd-ui-viz-1) 84%, var(--bd-fg))",
  attr: "color-mix(in oklab, var(--bd-ui-viz-3) 72%, var(--bd-fg))",
  call: "color-mix(in oklab, var(--bd-ui-viz-4) 78%, var(--bd-fg))",
  plain: undefined,
};

const ICONS: Record<CodeLanguage, Icon> = { tsx: FileTsxIcon, ts: FileTsIcon, jsx: FileJsIcon, js: FileJsIcon, css: FileCssIcon, json: FileCodeIcon, bash: TerminalWindowIcon };
const languageOf = (filename?: string): CodeLanguage | undefined => {
  const ext = filename?.split(".").pop()?.toLowerCase();
  return ext === "tsx" || ext === "ts" || ext === "jsx" || ext === "js" || ext === "css" || ext === "json" ? ext : ext === "mjs" || ext === "cjs" ? "js" : ext === "sh" ? "bash" : undefined;
};

export type CodeTab = { label: string; code: string; language?: CodeLanguage; filename?: string };

export type CodeBlockProps = {
  /** The code. Leave it out when there are tabs. */
  code?: string;
  /** How to color it. Read from the file's name when there's one, or TypeScript with JSX. */
  language?: CodeLanguage;
  /** The file's name, over the code. */
  filename?: string;
  /** The same thing a few ways, each a tab: npm, pnpm, bun. */
  tabs?: CodeTab[];
  /** Numbers down the side. On when there's more than one line. */
  lineNumbers?: boolean;
  /** Lines to mark, counting from 1. */
  highlight?: number[];
  /** Long lines wrap with a hanging indent. Off, they scroll sideways. */
  wrap?: boolean;
  /** Folds the code to its first lines, with a way to see all of it. */
  maxLines?: number;
  className?: string;
};

export function CodeBlock({ code, language, filename, tabs, lineNumbers, highlight: marked = [], wrap = true, maxLines, className }: CodeBlockProps) {
  const [tab, setTab] = useState(0);
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const still = useReducedMotion();
  const id = useId();
  const current = tabs?.[tab];
  const text = (current?.code ?? code ?? "").replace(/\n$/, "");
  const lang = current?.language ?? language ?? languageOf(current?.filename ?? filename) ?? "tsx";
  const lines = useMemo(() => highlight(text, lang), [text, lang]);
  const numbers = lineNumbers ?? lines.length > 1;
  const folded = maxLines != null && !open && lines.length > maxLines;
  const shown = folded ? lines.slice(0, maxLines) : lines;
  const name = current?.filename ?? filename;
  const Glyph = ICONS[lang];

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(t);
  }, [copied]);

  return (
    <figure className={cx("w-full overflow-hidden rounded-[18px] bg-[var(--bd-surface)] text-left shadow-[inset_0_0_0_1px_var(--bd-line),var(--bd-shadow-resting)]", className)}>
      <figcaption className="flex h-11 items-center gap-2 border-b border-[var(--bd-line-subtle)] pl-3 pr-1.5">
        {tabs ? (
          <LayoutGroup id={id}>
            <div role="tablist" aria-label="Variants" className="flex min-w-0 items-center gap-0.5">
              {tabs.map((t, i) => (
                <button
                  key={t.label}
                  type="button"
                  role="tab"
                  aria-selected={i === tab}
                  onClick={() => setTab(i)}
                  className={cx("relative h-7 rounded-full px-2.5 font-mono text-[12px] outline-none transition-colors focus-visible:outline-2 focus-visible:outline-[color:var(--bd-ui-focus)]", i === tab ? "text-[var(--bd-fg)]" : "text-[var(--bd-subtle)] hover:text-[var(--bd-fg)]")}
                >
                  {i === tab && <motion.span layoutId="code-tab" className="absolute inset-0 rounded-full bg-[var(--bd-ui-track)]" transition={still ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 42 }} />}
                  <span className="relative">{t.label}</span>
                </button>
              ))}
            </div>
          </LayoutGroup>
        ) : (
          <span className="flex min-w-0 items-center gap-2 text-[12.5px] text-[var(--bd-muted)]">
            <Glyph weight="duotone" className="size-4 shrink-0 text-[var(--bd-subtle)]" />
            <span className="truncate font-mono">{name ?? (lang === "bash" ? "Terminal" : lang.toUpperCase())}</span>
          </span>
        )}
        <button
          type="button"
          aria-label={copied ? "Copied" : "Copy the code"}
          onClick={() => void navigator.clipboard?.writeText(text).then(() => setCopied(true))}
          className="ml-auto grid size-8 shrink-0 place-items-center rounded-full text-[var(--bd-subtle)] outline-none transition-colors hover:bg-[rgb(var(--bd-ink)/0.06)] hover:text-[var(--bd-fg)] focus-visible:outline-2 focus-visible:outline-[color:var(--bd-ui-focus)]"
        >
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span key={copied ? "done" : "copy"} initial={{ scale: 0.4, opacity: 0, rotate: -40 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} exit={{ scale: 0.4, opacity: 0, rotate: 40 }} transition={{ type: "spring", stiffness: 600, damping: 30 }} className="grid place-items-center">
              {copied ? <CheckIcon weight="bold" className="size-3.5 text-[var(--bd-fg)]" /> : <CopyIcon weight="duotone" className="size-3.5" />}
            </motion.span>
          </AnimatePresence>
        </button>
      </figcaption>
      <div className="relative">
        <pre className={cx("bg-[color-mix(in_oklab,var(--bd-surface)_97%,var(--bd-fg))] py-3.5 font-mono text-[12.5px] leading-[1.7] text-[var(--bd-fg)]", !wrap && "overflow-x-auto")}>
          <code className="grid">
            {shown.map((line, i) => {
              const n = i + 1;
              const lit = marked.includes(n);
              // A wrapped line hangs from its own indent, so the code's shape survives the wrap.
              const indent = (line[0]?.text.match(/^\s*/)?.[0].length ?? 0) + 2;
              return (
                <span key={i} className={cx("relative flex pr-4", lit && "bg-[color-mix(in_oklab,var(--bd-ui-viz-1)_10%,transparent)]")}>
                  {lit && <span aria-hidden className="absolute inset-y-0 left-0 w-[2px] bg-[var(--bd-ui-viz-1)]" />}
                  {numbers && (
                    <span aria-hidden className="w-10 shrink-0 select-none pr-3 text-right tabular-nums text-[var(--bd-subtle)] opacity-70">
                      {n}
                    </span>
                  )}
                  <span className={cx("min-w-0", !numbers && "pl-4", wrap ? "whitespace-pre-wrap break-words" : "whitespace-pre")} style={wrap ? ({ paddingLeft: `calc(${numbers ? "0px" : "1rem"} + ${indent}ch)`, textIndent: `-${indent}ch` } as CSSProperties) : undefined}>
                    {line.length ? line.map((p, k) => (INK[p.kind] ? <span key={k} style={{ color: INK[p.kind] }}>{p.text}</span> : p.text)) : " "}
                  </span>
                </span>
              );
            })}
          </code>
        </pre>
        {folded && (
          <div className="absolute inset-x-0 bottom-0 flex h-20 items-end justify-center bg-gradient-to-t from-[var(--bd-surface)] to-transparent pb-3">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="h-8 rounded-full bg-[var(--bd-surface)] px-3.5 text-[12.5px] font-medium text-[var(--bd-fg)] shadow-[inset_0_0_0_1px_var(--bd-line-strong),var(--bd-shadow-resting)] outline-none transition-colors hover:bg-[var(--bd-surface-2)] focus-visible:outline-2 focus-visible:outline-[color:var(--bd-ui-focus)]"
            >
              Show all {lines.length} lines
            </button>
          </div>
        )}
      </div>
    </figure>
  );
}
