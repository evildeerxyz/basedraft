"use client";

import { ArrowClockwiseIcon, ArrowDownIcon, ArrowUpIcon, CaretDownIcon, CheckIcon, CopyIcon, FileIcon, FileCodeIcon, ImageIcon, PaperclipIcon, StopIcon, WarningIcon, WrenchIcon, XIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { memo, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type DragEvent, type ReactNode } from "react";

/*
 * A conversation with an assistant. What it writes arrives word by word, each word rising into
 * place, with a soft cursor at the end while it's still writing; before the first word it thinks,
 * drawn as a field of dithered dots. The tools it runs show as small cards you can open, each with
 * its state. Your messages sit in a quiet pill; its own have no bubble at all. Under each reply,
 * copy and retry. The composer grows with what's typed and takes files; Enter sends, Shift and
 * Enter makes a new line, and while it writes, send becomes stop. The thread follows the newest
 * words until you scroll up to read, then offers a way back down.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

const SNAPPY = { type: "spring", stiffness: 520, damping: 42 } as const;
const SOFT = { type: "spring", stiffness: 300, damping: 30 } as const;

/* Each new word rises a few pixels as it fades in; the cursor breathes. Hoisted once by React, whoever renders first. */
const STYLE = `@keyframes bd-ui-chat-word{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}@keyframes bd-ui-chat-caret{0%,100%{opacity:.9}50%{opacity:.2}}.bd-ui-chat-word{display:inline-block;animation:bd-ui-chat-word .45s cubic-bezier(.16,1,.3,1) both}.bd-ui-chat-caret{animation:bd-ui-chat-caret 1s ease-in-out infinite}@media (prefers-reduced-motion:reduce){.bd-ui-chat-word{animation:none}.bd-ui-chat-caret{animation:none}}`;

export type ChatAttachment = { id: string; name: string; kind?: "image" | "code" | "file"; size?: number };

export type ChatToolCall = {
  id: string;
  /** The tool's name: "publish_to_github". */
  name: string;
  /** What it's doing, in words: "Publish to GitHub". The name by default. */
  title?: string;
  status: "running" | "done" | "error";
  /** What it was given, shown in mono when the card is opened. */
  input?: string;
  /** What came back. */
  output?: ReactNode;
};

/** A reply in the order it was written: text, then a tool, then more text. */
export type ChatPart = { type: "text"; text: string } | { type: "tool"; tool: ChatToolCall };

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  /** The text, for a message that's only text. */
  content?: string;
  /** Text and tool calls in order, for a reply that runs tools along the way. */
  parts?: ChatPart[];
  /** thinking before the first word, streaming while words arrive, done, or error. */
  status?: "thinking" | "streaming" | "done" | "error";
  attachments?: ChatAttachment[];
};

const partsOf = (m: ChatMessage): ChatPart[] => m.parts ?? (m.content ? [{ type: "text", text: m.content }] : []);
const textOf = (m: ChatMessage) =>
  partsOf(m)
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("\n\n");

/* ---------- the words ---------- */

type Inline = { kind: "text" | "code" | "strong"; text: string };
type Block = { kind: "p" | "li"; inlines: Inline[] };

/* Paragraphs, "- " list lines, `code` and **bold**: enough to read well, without a Markdown parser. */
function blocksOf(text: string): Block[] {
  const out: Block[] = [];
  for (const para of text.split(/\n{2,}/)) {
    const lines = para.split("\n");
    const listy = lines.every((l) => /^\s*[-*] /.test(l) || !l.trim());
    for (const line of listy ? lines.filter((l) => l.trim()) : [para]) {
      const raw = listy ? line.replace(/^\s*[-*] /, "") : line;
      const inlines: Inline[] = [];
      const re = /(`[^`]+`|\*\*[^*]+\*\*)/g;
      let at = 0;
      for (const m of raw.matchAll(re)) {
        if (m.index! > at) inlines.push({ kind: "text", text: raw.slice(at, m.index) });
        inlines.push(m[0].startsWith("`") ? { kind: "code", text: m[0].slice(1, -1) } : { kind: "strong", text: m[0].slice(2, -2) });
        at = m.index! + m[0].length;
      }
      if (at < raw.length) inlines.push({ kind: "text", text: raw.slice(at) });
      out.push({ kind: listy ? "li" : "p", inlines });
    }
  }
  return out;
}

/* How many pieces Prose reveals one by one: words, and each `code` span as one. */
const unitsOf = (text: string) => blocksOf(text).reduce((n, b) => n + b.inlines.reduce((m, s) => m + (s.kind === "code" ? 1 : s.text.split(/\s+/).filter(Boolean).length), 0), 0);

/**
 * Text that arrives in pieces: each word that wasn't there when this mounted fades and rises in
 * once. Words already there at mount (an old message) just sit still.
 */
function Prose({ text, streaming, caret }: { text: string; streaming: boolean; caret: boolean }) {
  const [born] = useState(() => (streaming ? unitsOf(text) : Infinity));
  let n = 0;
  const words = (s: string, wrap?: (w: string, i: number) => ReactNode) =>
    s.split(/(\s+)/).map((w, i) => {
      if (!w) return null;
      if (/^\s+$/.test(w)) return w;
      const idx = n++;
      const inner = wrap ? wrap(w, i) : w;
      return idx >= born ? (
        <span key={`w${idx}`} className="bd-ui-chat-word">
          {inner}
        </span>
      ) : (
        <span key={`w${idx}`}>{inner}</span>
      );
    });
  const blocks = blocksOf(text);
  const render = (b: Block) =>
    b.inlines.map((s, i) =>
      s.kind === "code" ? (
        <code key={i} className={cx("rounded-[6px] bg-[var(--bd-ui-track)] px-1.5 py-px font-mono text-[0.86em]", n++ >= born && "bd-ui-chat-word")}>
          {s.text}
        </code>
      ) : s.kind === "strong" ? (
        <strong key={i} className="font-semibold">
          {words(s.text)}
        </strong>
      ) : (
        <span key={i}>{words(s.text)}</span>
      ),
    );
  const cursor = caret ? <span aria-hidden className="bd-ui-chat-caret ml-0.5 inline-block h-[1.05em] w-[0.42em] translate-y-[0.18em] rounded-[3px] bg-[var(--bd-fg)]" /> : null;
  const items: ReactNode[] = [];
  let list: ReactNode[] = [];
  blocks.forEach((b, i) => {
    const last = i === blocks.length - 1;
    if (b.kind === "li") {
      list.push(
        <li key={i} className="relative pl-4 before:absolute before:left-1 before:top-[0.7em] before:size-1 before:rounded-full before:bg-[var(--bd-subtle)]">
          {render(b)}
          {last && cursor}
        </li>,
      );
      if (last || blocks[i + 1]?.kind !== "li") {
        items.push(
          <ul key={`l${i}`} className="grid gap-1">
            {list}
          </ul>,
        );
        list = [];
      }
    } else
      items.push(
        <p key={i}>
          {render(b)}
          {last && cursor}
        </p>,
      );
  });
  if (!blocks.length && cursor) items.push(<p key="c">{cursor}</p>);
  return <div className="grid gap-3 text-[14.5px] leading-[1.65] text-[var(--bd-fg)]">{items}</div>;
}

/* ---------- thinking, tools, actions ---------- */

/* A 4 by 4 ordered-dither matrix: each dot's turn in the shimmer. */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

/** The assistant before its first word: a small field of dots shimmering through an ordered dither. */
export function Thinking({ label = "Thinking" }: { label?: string }) {
  return (
    <span role="status" className="inline-flex items-center gap-2.5 text-[13px] text-[var(--bd-subtle)]">
      <span aria-hidden className="grid grid-cols-6 gap-[2.5px]">
        {Array.from({ length: 18 }, (_, i) => {
          const c = i % 6;
          const r = Math.floor(i / 6);
          return <span key={i} className="size-[3px] rounded-full bg-[var(--bd-fg)] opacity-20 animate-[bd-ui-dither_1.1s_ease-in-out_infinite] motion-reduce:animate-none" style={{ animationDelay: `${((c / 6) * 0.7 + (BAYER[(r % 4) * 4 + (c % 4)] / 16) * 0.4).toFixed(3)}s` }} />;
        })}
      </span>
      {label}
    </span>
  );
}

const STATUS = {
  running: { text: "Running", tone: "text-[var(--bd-subtle)]" },
  done: { text: "Done", tone: "text-[var(--bd-ui-ok)]" },
  error: { text: "Failed", tone: "text-[var(--bd-ui-stop)]" },
} as const;

/** A tool the assistant ran, as a small card: its name and state, opening to what it was given and what came back. */
function ToolCard({ tool }: { tool: ChatToolCall }) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const id = useId();
  const s = STATUS[tool.status];
  const body = tool.input !== undefined || tool.output !== undefined;
  return (
    <div className="overflow-hidden rounded-[14px] bg-[var(--bd-surface)] shadow-[0_0_0_1px_rgb(var(--bd-ink)/0.09),var(--bd-shadow-resting)]">
      <button type="button" disabled={!body} onClick={() => setOpen((o) => !o)} aria-expanded={body ? open : undefined} aria-controls={body ? id : undefined} className="flex h-11 w-full items-center gap-2.5 px-3 text-left outline-none transition-colors hover:bg-[rgb(var(--bd-ink)/0.03)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[color:var(--bd-ui-focus)] disabled:hover:bg-transparent">
        <span className="grid size-6 shrink-0 place-items-center rounded-[8px] bg-[var(--bd-ui-track)] text-[var(--bd-muted)]">
          <WrenchIcon weight="duotone" className="size-3.5" />
        </span>
        <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{tool.title ?? tool.name}</span>
        <span className={cx("flex shrink-0 items-center gap-1.5 text-[12px] font-medium", s.tone)}>
          {tool.status === "running" ? (
            <span aria-hidden className="flex gap-[3px]">
              {[0, 1, 2].map((i) => (
                <span key={i} className="size-[3px] rounded-full bg-current animate-[bd-ui-dither_1s_ease-in-out_infinite] motion-reduce:animate-none" style={{ animationDelay: `${i * 0.18}s` }} />
              ))}
            </span>
          ) : tool.status === "done" ? (
            <CheckIcon weight="bold" className="size-3" />
          ) : (
            <WarningIcon weight="duotone" className="size-3.5" />
          )}
          {s.text}
        </span>
        {body && <CaretDownIcon weight="regular" className={cx("size-3.5 shrink-0 text-[var(--bd-subtle)] transition-transform duration-300 ease-[var(--bd-ease)]", open && "rotate-180")} />}
      </button>
      <AnimatePresence initial={false}>
        {open && body && (
          <motion.div id={id} initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }} animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }} exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }} transition={SOFT} className="overflow-hidden">
            <div className="grid gap-2 border-t border-[rgb(var(--bd-ink)/0.07)] p-3 text-[12.5px]">
              {tool.input !== undefined && <pre className="overflow-x-auto whitespace-pre-wrap rounded-[10px] bg-[var(--bd-ui-field)] px-3 py-2 font-mono text-[12px] leading-relaxed text-[var(--bd-muted)] shadow-[var(--bd-ui-well)]">{tool.input}</pre>}
              {tool.output !== undefined && <div className="leading-relaxed text-[var(--bd-fg)]">{tool.output}</div>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Copy, with its icon turning into a check for a moment. */
function CopyAction({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setDone(false), 1400);
    return () => clearTimeout(t);
  }, [done]);
  return (
    <button type="button" onClick={() => navigator.clipboard?.writeText(text).then(() => setDone(true))} aria-label={done ? "Copied" : "Copy"} title={done ? "Copied" : "Copy"} className="grid size-7 place-items-center rounded-full text-[var(--bd-subtle)] outline-none transition-[color,background-color,scale] duration-150 hover:bg-[rgb(var(--bd-ink)/0.06)] hover:text-[var(--bd-fg)] focus-visible:outline-2 focus-visible:outline-[color:var(--bd-ui-focus)] active:scale-[0.92]">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={done ? "y" : "n"} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={SNAPPY} className="grid place-items-center">
          {done ? <CheckIcon weight="bold" className="size-3.5 text-[var(--bd-fg)]" /> : <CopyIcon weight="duotone" className="size-3.5" />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

const KIND_ICON = { image: ImageIcon, code: FileCodeIcon, file: FileIcon } as const;

function AttachmentChip({ a, onRemove }: { a: ChatAttachment; onRemove?: () => void }) {
  const I = KIND_ICON[a.kind ?? "file"];
  return (
    <span className="inline-flex h-8 max-w-[220px] items-center gap-1.5 rounded-full bg-[var(--bd-surface)] pl-2.5 pr-1.5 text-[12.5px] text-[var(--bd-fg)] shadow-[0_0_0_1px_rgb(var(--bd-ink)/0.1)]">
      <I weight="duotone" className="size-3.5 shrink-0 text-[var(--bd-muted)]" />
      <span className="truncate">{a.name}</span>
      {onRemove ? (
        <button type="button" onClick={onRemove} aria-label={`Remove ${a.name}`} className="grid size-5 shrink-0 place-items-center rounded-full text-[var(--bd-subtle)] outline-none hover:bg-[rgb(var(--bd-ink)/0.07)] hover:text-[var(--bd-fg)] focus-visible:outline-2 focus-visible:outline-[color:var(--bd-ui-focus)]">
          <XIcon weight="regular" className="size-3" />
        </button>
      ) : (
        <span className="w-1" />
      )}
    </span>
  );
}

/* ---------- a message ---------- */

const Message = memo(function Message({ m, onRetry }: { m: ChatMessage; onRetry?: (id: string) => void }) {
  if (m.role === "user")
    return (
      <div className="flex flex-col items-end gap-2">
        {m.attachments && m.attachments.length > 0 && (
          <div className="flex max-w-[85%] flex-wrap justify-end gap-1.5">
            {m.attachments.map((a) => (
              <AttachmentChip key={a.id} a={a} />
            ))}
          </div>
        )}
        {m.content && <div className="max-w-[85%] whitespace-pre-wrap rounded-[20px] bg-[var(--bd-ui-track)] px-4 py-2.5 text-[14.5px] leading-[1.55] text-[var(--bd-fg)]">{m.content}</div>}
      </div>
    );
  const parts = partsOf(m);
  const streaming = m.status === "streaming";
  const lastText = parts.findLastIndex((p) => p.type === "text");
  const done = !m.status || m.status === "done" || m.status === "error";
  return (
    <div className="group/msg grid gap-3">
      {parts.map((p, i) => (p.type === "text" ? <Prose key={i} text={p.text} streaming={streaming || m.status === "thinking"} caret={streaming && i === lastText && i === parts.length - 1} /> : <ToolCard key={p.tool.id} tool={p.tool} />))}
      {m.status === "thinking" && <Thinking />}
      {streaming && parts.at(-1)?.type === "tool" && <Thinking label="Working" />}
      {m.status === "error" && (
        <p className="flex items-center gap-2 text-[13px] text-[var(--bd-ui-stop)]">
          <WarningIcon weight="duotone" className="size-4" /> That didn&apos;t finish.
          {onRetry && (
            <button type="button" onClick={() => onRetry(m.id)} className="font-medium underline-offset-4 outline-none hover:underline focus-visible:underline">
              Try again
            </button>
          )}
        </p>
      )}
      {done && parts.length > 0 && (
        <div className="-ml-1.5 flex gap-0.5 opacity-0 transition-opacity duration-200 group-hover/msg:opacity-100 group-focus-within/msg:opacity-100 [@media(hover:none)]:opacity-100">
          <CopyAction text={textOf(m)} />
          {onRetry && (
            <button type="button" onClick={() => onRetry(m.id)} aria-label="Retry" title="Retry" className="grid size-7 place-items-center rounded-full text-[var(--bd-subtle)] outline-none transition-[color,background-color,scale] duration-150 hover:bg-[rgb(var(--bd-ink)/0.06)] hover:text-[var(--bd-fg)] focus-visible:outline-2 focus-visible:outline-[color:var(--bd-ui-focus)] active:scale-[0.92]">
              <ArrowClockwiseIcon weight="regular" className="size-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
});

/* ---------- the thread ---------- */

export type ChatThreadProps = {
  messages: ChatMessage[];
  /** Shows Retry under replies, and Try again on one that failed. */
  onRetry?: (messageId: string) => void;
  /** What shows before the first message. */
  empty?: ReactNode;
  /** What the thread is, for screen readers. */
  label?: string;
  className?: string;
};

/**
 * The messages, scrolling. It keeps the newest words in view while you're at the bottom; scroll up
 * and it stays where you are, with a pill to jump back down.
 */
export function ChatThread({ messages, onRetry, empty, label = "Conversation", className }: ChatThreadProps) {
  const scroller = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const quiet = useRef(0);
  const top = useRef(0);
  const [behind, setBehind] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    const s = scroller.current;
    const el = inner.current;
    if (!s || !el) return;
    const ro = new ResizeObserver(() => {
      if (stick.current) s.scrollTop = s.scrollHeight;
      else if (s.scrollHeight - s.scrollTop - s.clientHeight > 80) setBehind(true);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Any scroll up lets go, even a small one; reaching the bottom again takes hold.
  const onScroll = () => {
    const s = scroller.current;
    if (!s) return;
    const gap = s.scrollHeight - s.scrollTop - s.clientHeight;
    const up = s.scrollTop < top.current - 1;
    top.current = s.scrollTop;
    if (Date.now() < quiet.current) return;
    if (up && gap > 2) {
      stick.current = false;
      if (gap > 80) setBehind(true);
    } else if (gap < 24) {
      stick.current = true;
      setBehind(false);
    }
  };

  const jump = () => {
    const s = scroller.current;
    if (!s) return;
    stick.current = true;
    setBehind(false);
    quiet.current = Date.now() + 600;
    s.scrollTo({ top: s.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  };

  // What a screen reader hears: each reply once it's finished, not every word on the way.
  const finished = [...messages].reverse().find((m) => m.role === "assistant" && (!m.status || m.status === "done"));

  return (
    <div className={cx("relative flex h-full min-h-0 flex-col", className)}>
      {/* It fills the height it's given and scrolls inside it, alone or in AiChat. */}
      <div ref={scroller} onScroll={onScroll} role="log" aria-label={label} aria-live="off" tabIndex={0} className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[color:var(--bd-ui-focus)]">
        <div ref={inner} className="grid gap-7 px-5 py-6">
          {messages.length === 0 && empty}
          {messages.map((m) => (
            <Message key={m.id} m={m} onRetry={onRetry} />
          ))}
        </div>
      </div>
      <p aria-live="polite" className="sr-only">
        {finished ? textOf(finished) : ""}
      </p>
      <AnimatePresence>
        {behind && (
          <motion.button
            type="button"
            onClick={jump}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.96 }}
            transition={SNAPPY}
            className="absolute bottom-3 left-1/2 flex h-8 -translate-x-1/2 items-center gap-1.5 rounded-full bg-[color-mix(in_oklab,var(--bd-surface)_88%,transparent)] px-3.5 text-[12.5px] font-medium text-[var(--bd-fg)] shadow-[var(--bd-shadow-raised),0_0_0_1px_rgb(var(--bd-ink)/0.1)] outline-none backdrop-blur-xl focus-visible:outline-2 focus-visible:outline-[color:var(--bd-ui-focus)] active:scale-[0.97]"
          >
            <ArrowDownIcon weight="regular" className="size-3.5" /> Jump to latest
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- the composer ---------- */

export type ChatComposerProps = {
  /** Called with the text (trimmed) and the attached files' chips. */
  onSend: (text: string, attachments: ChatAttachment[]) => void;
  /** While true, send turns into stop. */
  streaming?: boolean;
  /** What stop does. Without it, stop isn't shown. */
  onStop?: () => void;
  /** Lets files be attached, by the clip or by dropping them; gets the files themselves. */
  onAttach?: (files: File[]) => void;
  /** Which files the clip takes, as an input's accept. */
  accept?: string;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
};

const SEND =
  "grid size-9 shrink-0 place-items-center rounded-full text-[var(--bd-ui-ink-text)] outline-none transition-opacity duration-200 [background:var(--bd-ui-ink)] shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_1px_2px_rgb(var(--bd-shade)/0.25)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--bd-ui-focus)] active:scale-[0.94] disabled:opacity-30";

const kindOf = (f: File): ChatAttachment["kind"] => (f.type.startsWith("image/") ? "image" : /\.(tsx?|jsx?|css|json|md|html?)$/i.test(f.name) ? "code" : "file");

/** Where you write: a field that grows with what's typed, the files attached above it, and send (or stop) at its corner. */
export function ChatComposer({ onSend, streaming = false, onStop, onAttach, accept, placeholder = "Ask for a change", disabled = false, autoFocus, className }: ChatComposerProps) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<ChatAttachment[]>([]);
  const [over, setOver] = useState(false);
  const picker = useRef<HTMLInputElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const reduce = useReducedMotion();
  const empty = !text.trim() && files.length === 0;

  // Grows with what's typed, up to its max height, then scrolls.
  useLayoutEffect(() => {
    const el = field.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [text]);

  const take = (list: FileList | File[]) => {
    const all = [...list];
    if (!all.length) return;
    onAttach?.(all);
    setFiles((f) => [...f, ...all.map((x, i) => ({ id: `${Date.now()}-${i}-${x.name}`, name: x.name, kind: kindOf(x), size: x.size }))]);
  };
  const send = () => {
    if (empty || streaming || disabled) return;
    onSend(text.trim(), files);
    setText("");
    setFiles([]);
    field.current?.focus();
  };
  const drop = (e: DragEvent) => {
    if (!onAttach) return;
    e.preventDefault();
    setOver(false);
    take(e.dataTransfer.files);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        send();
      }}
      onDragOver={(e) => {
        if (!onAttach || !e.dataTransfer.types.includes("Files")) return;
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOver(false);
      }}
      onDrop={drop}
      className={cx(
        "relative grid gap-2 rounded-[22px] bg-[var(--bd-ui-field)] p-2 text-[var(--bd-fg)] shadow-[var(--bd-ui-well)] transition-shadow duration-200",
        "focus-within:shadow-[inset_0_0_0_1px_rgb(var(--bd-ink)/0.4),0_0_0_4px_rgb(var(--bd-ink)/0.06)]",
        over && "shadow-[inset_0_0_0_1.5px_rgb(var(--bd-ink)/0.45),0_0_0_4px_rgb(var(--bd-ink)/0.08)]",
        disabled && "opacity-50",
        className,
      )}
    >
      <AnimatePresence initial={false}>
        {files.length > 0 && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={SOFT} className="overflow-hidden">
            <div className="flex flex-wrap gap-1.5 px-1 pt-1">
              {files.map((a) => (
                <AttachmentChip key={a.id} a={a} onRemove={() => setFiles((f) => f.filter((x) => x.id !== a.id))} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <textarea
        ref={field}
        rows={1}
        value={text}
        disabled={disabled}
        autoFocus={autoFocus}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            send();
          }
        }}
        placeholder={placeholder}
        aria-label={placeholder}
        className="max-h-[200px] min-h-[44px] w-full resize-none overflow-y-auto bg-transparent px-3 pt-2.5 text-[14.5px] leading-[1.55] outline-none placeholder:text-[var(--bd-subtle)]"
      />
      <div className="flex items-center gap-1">
        {onAttach && (
          <>
            <input ref={picker} type="file" multiple accept={accept} hidden onChange={(e) => (e.target.files && take(e.target.files), (e.target.value = ""))} />
            <button type="button" onClick={() => picker.current?.click()} aria-label="Attach files" title="Attach files" className="grid size-9 place-items-center rounded-full text-[var(--bd-muted)] outline-none transition-[color,background-color,scale] duration-150 hover:bg-[rgb(var(--bd-ink)/0.06)] hover:text-[var(--bd-fg)] focus-visible:outline-2 focus-visible:outline-[color:var(--bd-ui-focus)] active:scale-[0.94]">
              <PaperclipIcon weight="duotone" className="size-[18px]" />
            </button>
          </>
        )}
        <span className="ml-auto pr-1 text-[11.5px] text-[var(--bd-subtle)] max-sm:hidden">{streaming ? "Writing" : "Shift + Enter for a new line"}</span>
        <AnimatePresence mode="popLayout" initial={false}>
          {streaming && onStop ? (
            <motion.button key="stop" type="button" onClick={onStop} initial={reduce ? { opacity: 0 } : { scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={reduce ? { opacity: 0 } : { scale: 0.7, opacity: 0 }} transition={SNAPPY} aria-label="Stop" title="Stop" className={SEND}>
              <StopIcon weight="fill" className="size-3.5" />
            </motion.button>
          ) : (
            <motion.button key="send" type="submit" disabled={empty || disabled} initial={reduce ? { opacity: 0 } : { scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={reduce ? { opacity: 0 } : { scale: 0.7, opacity: 0 }} transition={SNAPPY} aria-label="Send" title="Send" className={SEND}>
              <ArrowUpIcon weight="regular" className="size-4" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </form>
  );
}

/* ---------- the whole thing ---------- */

export type AiChatProps = {
  messages: ChatMessage[];
  onSend: (text: string, attachments: ChatAttachment[]) => void;
  /** Stops the reply being written. */
  onStop?: () => void;
  /** Writes a reply again. */
  onRetry?: (messageId: string) => void;
  /** Whether a reply is being written. Read from the last message by default. */
  streaming?: boolean;
  /** Things to ask, offered before the first message. Choosing one sends it. */
  suggestions?: string[];
  /** Short follow-ups offered over the composer once a reply is done. */
  followUps?: string[];
  onAttach?: (files: File[]) => void;
  accept?: string;
  placeholder?: string;
  /** The title and line before the first message. */
  emptyTitle?: string;
  emptyNote?: string;
  label?: string;
  className?: string;
  style?: CSSProperties;
};

function Chips({ items, onPick }: { items: string[]; onPick: (s: string) => void }) {
  return (
    <div className="flex flex-wrap justify-center gap-1.5">
      {items.map((s) => (
        <button key={s} type="button" onClick={() => onPick(s)} className="h-8 max-w-full truncate rounded-full bg-[var(--bd-surface)] px-3.5 text-[12.5px] text-[var(--bd-muted)] shadow-[0_0_0_1px_rgb(var(--bd-ink)/0.1)] outline-none transition-[color,box-shadow,scale] duration-150 hover:text-[var(--bd-fg)] hover:shadow-[0_0_0_1px_rgb(var(--bd-ink)/0.2),var(--bd-shadow-resting)] focus-visible:outline-2 focus-visible:outline-[color:var(--bd-ui-focus)] active:scale-[0.97]">
          {s}
        </button>
      ))}
    </div>
  );
}

/** The thread and the composer together, on one card, filling the height it's given. */
export function AiChat({ messages, onSend, onStop, onRetry, streaming, suggestions, followUps, onAttach, accept, placeholder, emptyTitle = "What should we change?", emptyNote = "Ask for an edit, a rewrite or a new section.", label = "Assistant", className, style }: AiChatProps) {
  const last = messages.at(-1);
  const busy = streaming ?? (last?.role === "assistant" && (last.status === "thinking" || last.status === "streaming"));
  const pick = (s: string) => onSend(s, []);
  return (
    <section aria-label={label} className={cx("flex h-full min-h-0 flex-col overflow-hidden rounded-[22px] bg-[var(--bd-surface)] text-[var(--bd-fg)] shadow-[0_0_0_1px_rgb(var(--bd-ink)/0.07),var(--bd-shadow-resting)]", className)} style={style}>
      <style href="bd-ui-ai-chat" precedence="medium">
        {STYLE}
      </style>
      <ChatThread
        messages={messages}
        onRetry={onRetry}
        className="flex-1"
        empty={
          <div className="grid justify-items-center gap-4 py-8 text-center">
            <div className="grid gap-1">
              <p className="text-[17px] font-medium tracking-[-0.01em]">{emptyTitle}</p>
              <p className="text-[13.5px] text-[var(--bd-muted)]">{emptyNote}</p>
            </div>
            {suggestions && suggestions.length > 0 && <Chips items={suggestions} onPick={pick} />}
          </div>
        }
      />
      <div className="grid gap-2.5 px-3 pb-3">
        <AnimatePresence initial={false}>
          {!busy && messages.length > 0 && followUps && followUps.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={SOFT}>
              <Chips items={followUps} onPick={pick} />
            </motion.div>
          )}
        </AnimatePresence>
        <ChatComposer onSend={onSend} streaming={busy} onStop={onStop} onAttach={onAttach} accept={accept} placeholder={placeholder} />
      </div>
    </section>
  );
}
