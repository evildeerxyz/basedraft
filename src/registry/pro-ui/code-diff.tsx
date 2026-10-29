"use client";

import { ArrowsOutLineVerticalIcon, CaretDownIcon, FileCodeIcon, FileCssIcon, FileJsIcon, FileTsIcon, FileTsxIcon, TerminalWindowIcon, type Icon } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useId, useMemo, useState, type KeyboardEvent } from "react";

/*
 * Two versions of a file, one under the other or side by side, the way a review shows them. Lines
 * taken out are red and lines put in are green, and inside a line that changed, the words that
 * changed are marked stronger, so a renamed variable doesn't make you read the line twice. The code
 * keeps its colors. Long stretches that didn't change fold to a row that opens, and the header counts
 * the change in a bar of five cells whose green and red mix through an ordered dither where they meet.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

export type DiffLanguage = "tsx" | "ts" | "jsx" | "js" | "css" | "json" | "bash";
type Kind = "comment" | "string" | "keyword" | "number" | "type" | "attr" | "call" | "plain";
type Piece = { kind: Kind; text: string; mark?: boolean };
type Range = [number, number];

/* ---------- Colors for the code ---------- */

const KEYWORDS = "import|export|from|const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|await|async|default|as|of|in|typeof|instanceof|class|extends|implements|interface|type|enum|readonly|static|void|null|undefined|true|false|this|super|try|catch|finally|throw|yield|delete";
const STRING = String.raw`"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|` + "`(?:\\\\[\\s\\S]|[^`\\\\])*`";
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
const familyOf = (l: DiffLanguage) => (l === "css" ? "css" : l === "json" ? "json" : l === "bash" ? "bash" : "script");

/** The code as lines of colored pieces: one pass over the whole of it, so comments and strings can span lines. */
function highlight(code: string, language: DiffLanguage) {
  const rules = RULES[familyOf(language)];
  const re = new RegExp(rules.map(([, s]) => `(${s})`).join("|"), "gm");
  const pieces: Piece[] = [];
  let at = 0;
  for (const m of code.matchAll(re)) {
    if (!m[0]) continue;
    if (m.index! > at) pieces.push({ kind: "plain", text: code.slice(at, m.index) });
    const g = m.slice(1).findIndex((v) => v !== undefined);
    pieces.push({ kind: rules[g][0], text: m[0] });
    at = m.index! + m[0].length;
  }
  if (at < code.length) pieces.push({ kind: "plain", text: code.slice(at) });
  const lines: Piece[][] = [[]];
  for (const p of pieces) {
    p.text.split("\n").forEach((part, i) => {
      if (i > 0) lines.push([]);
      if (part) lines.at(-1)!.push({ kind: p.kind, text: part });
    });
  }
  return lines;
}

/* The theme's data hues, drawn toward the text color so they read on light and dark alike. */
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

const ICONS: Record<DiffLanguage, Icon> = { tsx: FileTsxIcon, ts: FileTsIcon, jsx: FileJsIcon, js: FileJsIcon, css: FileCssIcon, json: FileCodeIcon, bash: TerminalWindowIcon };
const languageOf = (filename?: string): DiffLanguage => {
  const ext = filename?.split(".").pop()?.toLowerCase();
  return ext === "ts" || ext === "jsx" || ext === "js" || ext === "css" || ext === "json" ? ext : ext === "mjs" || ext === "cjs" ? "js" : ext === "sh" ? "bash" : "tsx";
};

/* ---------- The diff ---------- */

type Op = { t: "same" | "del" | "add"; /** Its line in the old file, or -1. */ a: number; /** Its line in the new file, or -1. */ b: number; marks?: Range[] };

/** Which lines stayed, went and came: the longest run they share, after setting aside the start and end they share. */
function diffLines(A: string[], B: string[]): Op[] {
  let s = 0;
  while (s < A.length && s < B.length && A[s] === B[s]) s++;
  let ea = A.length;
  let eb = B.length;
  while (ea > s && eb > s && A[ea - 1] === B[eb - 1]) {
    ea--;
    eb--;
  }
  const ops: Op[] = [];
  for (let k = 0; k < s; k++) ops.push({ t: "same", a: k, b: k });
  const n = ea - s;
  const m = eb - s;
  if (n * m > 4_000_000) {
    // Too big to match line by line: all of the middle went, and all of it came.
    for (let k = s; k < ea; k++) ops.push({ t: "del", a: k, b: -1 });
    for (let k = s; k < eb; k++) ops.push({ t: "add", a: -1, b: k });
  } else {
    const w = m + 1;
    const L = new Uint32Array((n + 1) * w);
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i * w + j] = A[s + i] === B[s + j] ? L[(i + 1) * w + j + 1] + 1 : Math.max(L[(i + 1) * w + j], L[i * w + j + 1]);
    let i = 0;
    let j = 0;
    while (i < n || j < m) {
      if (i < n && j < m && A[s + i] === B[s + j]) ops.push({ t: "same", a: s + i++, b: s + j++ });
      else if (i < n && (j === m || L[(i + 1) * w + j] >= L[i * w + j + 1])) ops.push({ t: "del", a: s + i++, b: -1 });
      else ops.push({ t: "add", a: -1, b: s + j++ });
    }
  }
  for (let k = 0; k < A.length - ea; k++) ops.push({ t: "same", a: ea + k, b: eb + k });
  return ops;
}

const TOKEN = /\w+|\s+|[^\w\s]/g;

/** The words that changed between two versions of a line, or null when so much did that marking them wouldn't help. */
function wordMarks(a: string, b: string): [Range[], Range[]] | null {
  const ta = a.match(TOKEN) ?? [];
  const tb = b.match(TOKEN) ?? [];
  const n = ta.length;
  const m = tb.length;
  if (!n || !m || n * m > 60_000) return null;
  const w = m + 1;
  const L = new Uint16Array((n + 1) * w);
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i * w + j] = ta[i] === tb[j] ? L[(i + 1) * w + j + 1] + 1 : Math.max(L[(i + 1) * w + j], L[i * w + j + 1]);
  const ra: Range[] = [];
  const rb: Range[] = [];
  const add = (r: Range[], from: number, to: number) => {
    const last = r.at(-1);
    if (last && last[1] === from) last[1] = to;
    else r.push([from, to]);
  };
  let i = 0;
  let j = 0;
  let pa = 0;
  let pb = 0;
  let kept = 0;
  while (i < n || j < m) {
    if (i < n && j < m && ta[i] === tb[j]) {
      if (/\S/.test(ta[i])) kept += ta[i].length;
      pa += ta[i++].length;
      pb += tb[j++].length;
    } else if (i < n && (j === m || L[(i + 1) * w + j] >= L[i * w + j + 1])) {
      add(ra, pa, pa + ta[i].length);
      pa += ta[i++].length;
    } else {
      add(rb, pb, pb + tb[j].length);
      pb += tb[j++].length;
    }
  }
  const solid = Math.max(a.replace(/\s/g, "").length, b.replace(/\s/g, "").length);
  return solid && kept / solid >= 0.4 ? [ra, rb] : null;
}

/** A line's colored pieces, split where the changed words start and end. */
function paint(pieces: Piece[], marks?: Range[]): Piece[] {
  if (!marks?.length) return pieces;
  const out: Piece[] = [];
  let at = 0;
  for (const p of pieces) {
    let s = 0;
    while (s < p.text.length) {
      const pos = at + s;
      let next = p.text.length;
      for (const [x, y] of marks) {
        if (x > pos && x - at < next) next = x - at;
        if (y > pos && y - at < next) next = y - at;
      }
      out.push({ kind: p.kind, text: p.text.slice(s, next), mark: marks.some(([x, y]) => pos >= x && pos < y) });
      s = next;
    }
    at += p.text.length;
  }
  return out;
}

/** Splits text into lines, without the empty one after a last newline. */
const linesOf = (t: string) => {
  const l = t.split("\n");
  if (l.length > 1 && l.at(-1) === "") l.pop();
  return l;
};

/* ---------- The stat bar ---------- */

/* A 4 by 4 ordered-dither matrix: the order the red dots of a shared cell light in. */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const tile = (lit: number) => {
  let rects = "";
  BAYER.forEach((v, i) => {
    if (v < lit) rects += `<rect x='${(i % 4) * 2}' y='${Math.floor(i / 4) * 2}' width='2' height='2'/>`;
  });
  return `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='8' height='8'>${rects}</svg>`)}")`;
};

/** Five cells, green for what came and red for what went; a cell that holds both mixes them in dots. */
function Stat({ adds, dels, dither }: { adds: number; dels: number; dither: boolean }) {
  const total = adds + dels;
  const green = total ? (adds / total) * 5 : 0;
  const CELL = "relative size-2 overflow-hidden rounded-[2px]";
  return (
    <span aria-hidden className="flex gap-[2px]">
      {Array.from({ length: 5 }, (_, i) => {
        if (!total) return <span key={i} className={cx(CELL, "bg-[var(--bd-ui-track)]")} />;
        const share = Math.min(1, Math.max(0, green - i));
        if (share === 1 || (!dither && share >= 0.5)) return <span key={i} className={cx(CELL, "bg-[var(--bd-ui-ok)]")} />;
        if (share === 0 || !dither) return <span key={i} className={cx(CELL, "bg-[var(--bd-ui-stop)]")} />;
        const mask = tile(Math.round((1 - share) * 16));
        return (
          <span key={i} className={cx(CELL, "bg-[var(--bd-ui-ok)]")}>
            <span className="absolute inset-0 bg-[var(--bd-ui-stop)]" style={{ maskImage: mask, WebkitMaskImage: mask, maskSize: "8px 8px", WebkitMaskSize: "8px 8px" }} />
          </span>
        );
      })}
    </span>
  );
}

/* ---------- The rows ---------- */

const TONE = {
  add: { row: "bg-[color-mix(in_oklab,var(--bd-ui-ok)_10%,transparent)]", num: "bg-[color-mix(in_oklab,var(--bd-ui-ok)_16%,transparent)]", mark: "bg-[color-mix(in_oklab,var(--bd-ui-ok)_30%,transparent)]", sign: "text-[var(--bd-ui-ok)]", say: "Added: " },
  del: { row: "bg-[color-mix(in_oklab,var(--bd-ui-stop)_9%,transparent)]", num: "bg-[color-mix(in_oklab,var(--bd-ui-stop)_15%,transparent)]", mark: "bg-[color-mix(in_oklab,var(--bd-ui-stop)_28%,transparent)]", sign: "text-[var(--bd-ui-stop)]", say: "Removed: " },
  same: { row: "", num: "", mark: "", sign: "", say: "" },
};
const NUM = "shrink-0 select-none pl-2 pr-2.5 text-right tabular-nums text-[var(--bd-subtle)]";

function Code({ pieces, tone }: { pieces: Piece[]; tone: Op["t"] }) {
  return (
    <code className="min-w-0 flex-1 whitespace-pre-wrap pr-4 [overflow-wrap:anywhere]">
      {TONE[tone].say && <span className="sr-only">{TONE[tone].say}</span>}
      {pieces.map((p, k) => (
        <span key={k} className={cx(p.mark && cx("rounded-[3px] [box-decoration-break:clone]", TONE[tone].mark))} style={{ color: INK[p.kind] }}>
          {p.text}
        </span>
      ))}
    </code>
  );
}

export type CodeDiffProps = {
  /** The file as it was. */
  before: string;
  /** The file as it is now. */
  after: string;
  /** Its name, over the code; the colors follow its extension. */
  filename?: string;
  /** Its old name, when it was renamed: old → new. */
  oldFilename?: string;
  /** How to color it, when the name doesn't say. */
  language?: DiffLanguage;
  /** One column, or old and new side by side. */
  view?: "unified" | "split";
  defaultView?: "unified" | "split";
  onViewChange?: (view: "unified" | "split") => void;
  /** How many unchanged lines stay around each change; the rest fold. */
  context?: number;
  /** A button in the header that folds the whole file. */
  collapsible?: boolean;
  /** The stat bar's shared cell mixes green and red in dots; false gives it to whichever is more. */
  dither?: boolean;
  className?: string;
};

type Block = { fold: false; ops: Op[] } | { fold: true; id: number; ops: Op[] };

export function CodeDiff({ before, after, filename, oldFilename, language, view: viewProp, defaultView = "unified", onViewChange, context = 3, collapsible = false, dither = true, className }: CodeDiffProps) {
  const [ownView, setOwnView] = useState(defaultView);
  const view = viewProp ?? ownView;
  const setView = (v: "unified" | "split") => {
    if (viewProp === undefined) setOwnView(v);
    onViewChange?.(v);
  };
  const [opened, setOpened] = useState<Set<number>>(() => new Set());
  const [open, setOpen] = useState(true);
  const still = useReducedMotion();
  const id = useId();
  const lang = language ?? languageOf(filename);
  const FileIcon = ICONS[lang];

  const { ops, A, B, adds, dels, digits } = useMemo(() => {
    const A = linesOf(before);
    const B = linesOf(after);
    const ops = diffLines(A, B);
    // Pair the lines of each change, went with came, and mark the words that differ.
    for (let k = 0; k < ops.length; ) {
      if (ops[k].t === "same") {
        k++;
        continue;
      }
      let d = k;
      while (d < ops.length && ops[d].t === "del") d++;
      let e = d;
      while (e < ops.length && ops[e].t === "add") e++;
      for (let x = 0; x < Math.min(d - k, e - d); x++) {
        const m = wordMarks(A[ops[k + x].a], B[ops[d + x].b]);
        if (m) [ops[k + x].marks, ops[d + x].marks] = m;
      }
      k = Math.max(e, k + 1);
    }
    return { ops, A: highlight(A.join("\n"), lang), B: highlight(B.join("\n"), lang), adds: ops.filter((o) => o.t === "add").length, dels: ops.filter((o) => o.t === "del").length, digits: String(Math.max(A.length, B.length)).length };
  }, [before, after, lang]);

  // Runs of unchanged lines far from any change fold; a run of one or two isn't worth a fold.
  const blocks = useMemo(() => {
    const near = ops.map(() => false);
    ops.forEach((o, k) => {
      if (o.t !== "same") for (let x = Math.max(0, k - context); x <= Math.min(ops.length - 1, k + context); x++) near[x] = true;
    });
    const out: Block[] = [];
    let k = 0;
    while (k < ops.length) {
      let e = k;
      if (near[k]) {
        while (e < ops.length && near[e]) e++;
        out.push({ fold: false, ops: ops.slice(k, e) });
      } else {
        while (e < ops.length && !near[e]) e++;
        out.push(e - k > 2 ? { fold: true, id: k, ops: ops.slice(k, e) } : { fold: false, ops: ops.slice(k, e) });
      }
      k = e;
    }
    return out;
  }, [ops, context]);

  const numW = { width: `calc(${digits}ch + 20px)` };
  const piecesOf = (o: Op) => paint((o.t === "del" ? A[o.a] : B[o.b]) ?? [], o.marks);

  const unified = (list: Op[]) =>
    list.map((o, k) => (
      <div key={k} className={cx("flex min-h-5", TONE[o.t].row)}>
        <span className={cx(NUM, TONE[o.t].num)} style={numW}>
          {o.a >= 0 ? o.a + 1 : ""}
        </span>
        <span className={cx(NUM, TONE[o.t].num)} style={numW}>
          {o.b >= 0 ? o.b + 1 : ""}
        </span>
        <span aria-hidden className={cx("w-6 shrink-0 select-none text-center", TONE[o.t].sign)}>
          {o.t === "add" ? "+" : o.t === "del" ? "−" : ""}
        </span>
        <Code pieces={piecesOf(o)} tone={o.t} />
      </div>
    ));

  const half = (o: Op | undefined, side: "a" | "b", k: number) =>
    o ? (
      <div key={k} className={cx("flex min-w-0", TONE[o.t].row, side === "b" && "shadow-[inset_1px_0_0_var(--bd-line-subtle)]")}>
        <span className={cx(NUM, TONE[o.t].num)} style={numW}>
          {(side === "a" ? o.a : o.b) + 1}
        </span>
        <span aria-hidden className={cx("w-5 shrink-0 select-none text-center", TONE[o.t].sign)}>
          {o.t === "add" ? "+" : o.t === "del" ? "−" : ""}
        </span>
        <Code pieces={piecesOf(o)} tone={o.t} />
      </div>
    ) : (
      // Nothing on this side: a field of faint dots.
      <div key={k} aria-hidden className={cx("bg-[radial-gradient(rgb(var(--bd-ink)/0.1)_1px,transparent_1.2px)] [background-size:6px_6px]", side === "b" && "shadow-[inset_1px_0_0_var(--bd-line-subtle)]")} />
    );

  const split = (list: Op[]) => {
    const rows: Array<[Op | undefined, Op | undefined]> = [];
    for (let k = 0; k < list.length; ) {
      if (list[k].t === "same") {
        rows.push([list[k], list[k]]);
        k++;
        continue;
      }
      const went: Op[] = [];
      const came: Op[] = [];
      while (k < list.length && list[k].t !== "same") (list[k].t === "del" ? went : came).push(list[k++]);
      for (let x = 0; x < Math.max(went.length, came.length); x++) rows.push([went[x], came[x]]);
    }
    return rows.map(([l, r], k) => (
      <div key={k} className="grid min-h-5 grid-cols-2">
        {half(l, "a", 0)}
        {half(r, "b", 1)}
      </div>
    ));
  };

  const draw = view === "split" ? split : unified;
  const radios = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const next = view === "unified" ? "split" : "unified";
    setView(next);
    e.currentTarget.querySelector<HTMLButtonElement>(`[data-view="${next}"]`)?.focus();
  };

  return (
    <section aria-label={filename ? `Changes to ${filename}` : "Changes"} className={cx("overflow-hidden rounded-[18px] bg-[var(--bd-surface)] text-[var(--bd-fg)] shadow-[inset_0_0_0_1px_var(--bd-line),var(--bd-shadow-resting)]", className)}>
      <header className={cx("flex min-h-12 flex-wrap items-center gap-x-2.5 gap-y-2 py-2 pl-3 pr-2.5", open && "shadow-[inset_0_-1px_0_var(--bd-line-subtle)]")}>
        {collapsible && (
          <button
            type="button"
            aria-expanded={open}
            aria-label={open ? "Fold the file" : "Open the file"}
            onClick={() => setOpen((o) => !o)}
            className="-mr-1 grid size-7 place-items-center rounded-full text-[var(--bd-muted)] outline-none transition-colors hover:bg-[rgb(var(--bd-ink)/0.06)] hover:text-[var(--bd-fg)] focus-visible:outline-2 focus-visible:outline-[color:var(--bd-ui-focus)]"
          >
            <CaretDownIcon weight="bold" className={cx("size-3.5 transition-transform duration-300 ease-[var(--bd-ease)]", !open && "-rotate-90")} />
          </button>
        )}
        <FileIcon weight="duotone" className="size-[18px] shrink-0 text-[var(--bd-muted)]" />
        <span className="min-w-0 truncate font-mono text-[13px]">
          {oldFilename && oldFilename !== filename && (
            <>
              <span className="text-[var(--bd-subtle)] line-through decoration-[rgb(var(--bd-ink)/0.3)]">{oldFilename}</span>
              <span className="px-1.5 text-[var(--bd-subtle)]">→</span>
            </>
          )}
          {filename}
        </span>
        <span className="flex items-center gap-2 text-[12px] font-medium tabular-nums">
          <span className="text-[var(--bd-ui-ok)]">+{adds}</span>
          <span className="text-[var(--bd-ui-stop)]">−{dels}</span>
          <Stat adds={adds} dels={dels} dither={dither} />
          <span className="sr-only">
            {adds} {adds === 1 ? "line" : "lines"} added, {dels} removed
          </span>
        </span>
        <div role="radiogroup" aria-label="View" onKeyDown={radios} className="ml-auto flex rounded-full bg-[var(--bd-ui-track)] p-0.5 shadow-[var(--bd-ui-well)]">
          {(["unified", "split"] as const).map((v) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={view === v}
              tabIndex={view === v ? 0 : -1}
              data-view={v}
              onClick={() => setView(v)}
              className={cx("relative h-7 rounded-full px-3 text-[12px] font-medium outline-none transition-colors focus-visible:outline-2 focus-visible:outline-[color:var(--bd-ui-focus)]", view === v ? "text-[var(--bd-fg)]" : "text-[var(--bd-muted)] hover:text-[var(--bd-fg)]")}
            >
              {view === v && <motion.span layoutId={`${id}-view`} transition={still ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 40 }} className="absolute inset-0 rounded-full [background:var(--bd-ui-raised)] shadow-[var(--bd-ui-lift)]" />}
              <span className="relative">{v === "unified" ? "Unified" : "Split"}</span>
            </button>
          ))}
        </div>
      </header>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={still ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 40 }} className="overflow-hidden">
            <div className="py-1 font-mono text-[12.5px] leading-5">
              {!adds && !dels && <p className="px-4 py-3 font-sans text-[13px] text-[var(--bd-subtle)]">No changes.</p>}
              {blocks.map((b, k) =>
                !b.fold ? (
                  <div key={k}>{draw(b.ops)}</div>
                ) : opened.has(b.id) ? (
                  <motion.div key={`open-${b.id}`} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} transition={still ? { duration: 0 } : { height: { type: "spring", stiffness: 340, damping: 38 }, opacity: { duration: 0.25 } }} className="overflow-hidden">
                    {draw(b.ops)}
                  </motion.div>
                ) : (
                  <button
                    key={`fold-${b.id}`}
                    type="button"
                    onClick={() => setOpened((s) => new Set(s).add(b.id))}
                    className="group/fold my-px flex h-8 w-full items-center gap-2 bg-[rgb(var(--bd-ink)/0.035)] px-3 font-sans text-[12px] text-[var(--bd-subtle)] outline-none transition-colors hover:bg-[rgb(var(--bd-ink)/0.06)] hover:text-[var(--bd-fg)] focus-visible:bg-[rgb(var(--bd-ink)/0.06)] focus-visible:text-[var(--bd-fg)]"
                  >
                    <ArrowsOutLineVerticalIcon weight="bold" className="size-3.5 transition-transform duration-300 ease-[var(--bd-ease)] group-hover/fold:scale-y-110" />
                    {b.ops.length} unchanged lines
                    <span className="ml-auto font-mono text-[11.5px] opacity-70">
                      {b.ops[0].b + 1}–{b.ops.at(-1)!.b + 1}
                    </span>
                  </button>
                ),
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
