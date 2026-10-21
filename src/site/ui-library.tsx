"use client";

import {
  ArrowCounterClockwiseIcon,
  AtomIcon,
  CardsIcon,
  ChatTeardropTextIcon,
  CheckIcon,
  CodeIcon,
  CopyIcon,
  CursorClickIcon,
  DownloadSimpleIcon,
  FileCssIcon,
  FileTsxIcon,
  EyeIcon,
  KeyboardIcon,
  ListPlusIcon,
  PackageIcon,
  MagnifyingGlassIcon,
  MoonIcon,
  SlidersHorizontalIcon,
  SquaresFourIcon,
  StackIcon,
  SunIcon,
  TabsIcon,
  TagIcon,
  TerminalWindowIcon,
  TextAlignLeftIcon,
  TextboxIcon,
  ToggleRightIcon,
  UserCircleIcon,
  XIcon,
  type Icon,
} from "@phosphor-icons/react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { COMPONENTS, componentOf, GROUPS, installCommand, themeCommand, type ComponentMeta } from "@/registry";
import { DEMOS } from "@/registry/demos";
import { ClaudeMark, CLAUDE_COLOR } from "./claude-mark";
import { CodeBlock, usesWord } from "./code";
import { useColorMode, type ColorMode } from "./color-mode";
import { Dock, DockPill, PieceMenu, TILE, TileArrow, useBackToTop } from "./library";
import { GLASS, LIB_WRAP } from "./library-css";
import { ShellLine } from "./shell-line";
import { GLOW, glowAt } from "./stage";

/*
 * basedraft UI: our own React components, free, each one file to copy or download into any project.
 * Its front page is a gallery of them, live, in tiles of a few widths; a component's own page
 * puts it on a large stage you can switch between light and dark, with its command, its prompt
 * for Claude Code, and its code a tap away.
 */

/** Each component's icon, for its tile, its page and the menus. Phosphor's duotone, like the rest of the site. */
export const COMPONENT_ICON: Record<string, Icon> = {
  button: CursorClickIcon,
  "copy-button": CopyIcon,
  segmented: SlidersHorizontalIcon,
  input: TextboxIcon,
  textarea: TextAlignLeftIcon,
  switch: ToggleRightIcon,
  tabs: TabsIcon,
  accordion: ListPlusIcon,
  badge: TagIcon,
  card: CardsIcon,
  avatar: UserCircleIcon,
  kbd: KeyboardIcon,
  tooltip: ChatTeardropTextIcon,
  "command-line": TerminalWindowIcon,
};
const GROUP_ICON: Record<string, Icon> = { Actions: CursorClickIcon, Forms: TextboxIcon, Navigation: TabsIcon, Display: CardsIcon };

const SLIDE = { type: "spring", stiffness: 520, damping: 42 } as const;

function useCopied() {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(t);
  }, [copied]);
  return [copied, (text: string) => void navigator.clipboard?.writeText(text).then(() => setCopied(true))] as const;
}

/** A round glass button that copies a piece of text, then shows a check for a moment. */
function CopyCircle({ text, label }: { text: string; label: string }) {
  const [copied, copy] = useCopied();
  return (
    <button type="button" onClick={() => copy(text)} aria-label={copied ? "Copied" : label} title={copied ? "Copied" : label} className={cn("grid size-9 shrink-0 place-items-center rounded-full text-muted transition-colors hover:text-fg", GLASS)}>
      {copied ? <CheckIcon size={14} weight="regular" className="text-fg" /> : <CopyIcon size={14} weight="duotone" />}
    </button>
  );
}

/* ---------- the front page ---------- */

/* The gallery's widths, out of twelve columns. The full gallery has its own order, so its rows come out even. */
const SPAN: Record<number, string> = { 4: "lg:col-span-4", 6: "lg:col-span-6", 8: "lg:col-span-8", 12: "lg:col-span-12" };
const BENTO: Array<[string, number]> = [
  ["button", 8],
  ["hold-button", 4],
  ["command-line", 6],
  ["copy-button", 6],
  ["input", 4],
  ["textarea", 4],
  ["switch", 4],
  ["segmented", 6],
  ["slider", 6],
  ["tabs", 4],
  ["accordion", 8],
  ["card", 4],
  ["avatar", 4],
  ["badge", 4],
  ["kbd", 4],
  ["tooltip", 4],
  ["meter", 4],
];
const CURATED = BENTO.length === COMPONENTS.length && BENTO.every(([n]) => componentOf(n));
/** For a filtered few: rows of three, with the last one or two rows in halves so no tile is left alone. */
const evenSpans = (n: number) => {
  if (n === 1) return [12];
  const r = n % 3;
  const thirds = r === 1 ? n - 4 : r === 2 ? n - 2 : n;
  return Array.from({ length: n }, (_, i) => (i < thirds ? 4 : 6));
};

/**
 * A component as a tile: live on the hero's light, so it can be tried where it sits. Floating at
 * its foot, its name (the way to its page), a button that copies the command that adds it, and an
 * arrow to its page.
 */
function ComponentTile({ c, span, i }: { c: ComponentMeta; span: number; i: number }) {
  const Demo = DEMOS[c.name];
  const I = COMPONENT_ICON[c.name] ?? StackIcon;
  return (
    <motion.li layout="position" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={SLIDE} className={cn("col-span-12 min-w-0 md:col-span-6", SPAN[span])}>
      <div className={cn(TILE, GLOW[glowAt(i)], "h-full min-h-[300px]")}>
        <div className="grid flex-1 place-items-center px-6 pb-[84px] pt-10">{Demo ? <Demo /> : null}</div>
        <div className="absolute inset-x-3 bottom-3 flex items-center gap-2">
          <Link href={`/components/${c.name}`} className={cn("flex h-10 min-w-0 items-center gap-2 rounded-full pl-1.5 pr-4 text-[13px] transition-colors hover:bg-surface", GLASS)}>
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-fg/[0.06] text-fg">
              <I size={14} weight="duotone" />
            </span>
            <span className="truncate font-medium text-fg">{c.title}</span>
            <span className="truncate text-subtle max-sm:hidden">{c.group}</span>
          </Link>
          <span className="ml-auto flex shrink-0 items-center gap-1.5">
            <CopyCircle text={installCommand(c.name)} label={`Copy the download for ${c.title}`} />
            <Link href={`/components/${c.name}`} aria-label={`Open ${c.title}`}>
              <TileArrow />
            </Link>
          </span>
        </div>
      </div>
    </motion.li>
  );
}

/** A search field at the dock's end that narrows the gallery as you type. */
function FilterField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex h-9 shrink-0 items-center gap-2 rounded-full pl-2.5 pr-1 text-[13px] text-fg max-sm:hidden">
      <MagnifyingGlassIcon size={15} weight="duotone" className="shrink-0 text-subtle" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Filter" aria-label="Filter components" className="w-[96px] bg-transparent outline-none transition-[width] duration-300 placeholder:text-subtle focus:w-[150px]" />
      {value ? (
        <button type="button" onClick={() => onChange("")} aria-label="Clear the filter" className="grid size-7 place-items-center rounded-full text-subtle transition-colors hover:bg-fg/[0.06] hover:text-fg">
          <XIcon size={12} weight="regular" />
        </button>
      ) : (
        <span className="size-7" />
      )}
    </label>
  );
}

/** The components' front page under its card: the dock (the groups, and a filter) and the gallery. */
export function ComponentsBrowser() {
  const [group, setGroup] = useState("All");
  const [q, setQ] = useState("");
  const top = useRef<HTMLDivElement>(null);
  useBackToTop(top, group);
  const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const matched = COMPONENTS.filter((c) => words.every((w) => `${c.title} ${c.group} ${c.description}`.toLowerCase().includes(w)));
  const list = matched.filter((c) => group === "All" || c.group === group);
  const spans = evenSpans(list.length);
  const tiles = CURATED && group === "All" && !words.length ? BENTO.map(([n, span]) => ({ c: componentOf(n)!, span })) : list.map((c, i) => ({ c, span: spans[i] }));
  return (
    <>
      <Dock label="Filter components" after={<FilterField value={q} onChange={setQ} />}>
        <DockPill on={group === "All"} onClick={() => setGroup("All")} icon={SquaresFourIcon} count={matched.length}>
          All
        </DockPill>
        {GROUPS.map((g) => (
          <DockPill key={g} on={group === g} onClick={() => setGroup(g)} icon={GROUP_ICON[g] ?? StackIcon} count={matched.filter((c) => c.group === g).length}>
            {g}
          </DockPill>
        ))}
      </Dock>
      <div ref={top} className={cn(LIB_WRAP, "pt-10")}>
        {tiles.length ? (
          <ul className="grid grid-cols-12 gap-3 sm:gap-4">
            <AnimatePresence mode="popLayout" initial={false}>
              {tiles.map(({ c, span }, i) => (
                <ComponentTile key={c.name} c={c} span={span} i={i} />
              ))}
            </AnimatePresence>
          </ul>
        ) : (
          <div className="py-24 text-center">
            <p className="text-ui text-muted">Nothing here matches &ldquo;{q.trim()}&rdquo;{group !== "All" && ` in ${group}`}.</p>
            <button
              type="button"
              onClick={() => {
                setQ("");
                setGroup("All");
              }}
              className="mt-4 h-9 rounded-full bg-fg/[0.05] px-4 text-[13px] font-medium transition-colors hover:bg-fg/[0.09]"
            >
              Show them all
            </button>
          </div>
        )}
      </div>
    </>
  );
}

/* ---------- a component's page ---------- */

/** Every component, as the menu on a component's page. */
export function ComponentMenu({ name }: { name: string }) {
  const c = componentOf(name)!;
  return <PieceMenu label="Components" current={c.title} icon={COMPONENT_ICON[c.name]} items={COMPONENTS.map((x) => ({ label: x.title, href: `/components/${x.name}`, icon: COMPONENT_ICON[x.name] ?? StackIcon, hint: x.group }))} />;
}

/** The icon on a component's page head, on a small tile. */
export function ComponentGlyph({ name }: { name: string }) {
  const I = COMPONENT_ICON[name] ?? StackIcon;
  return (
    <span className="grid size-8 place-items-center rounded-[10px] bg-surface text-fg shadow-[var(--bd-shadow-resting),inset_0_0_0_1px_var(--bd-line-subtle)]">
      <I size={16} weight="duotone" />
    </span>
  );
}

const MODES: Array<{ id: ColorMode; label: string; icon: Icon }> = [
  { id: "light", label: "Light", icon: SunIcon },
  { id: "dark", label: "Dark", icon: MoonIcon },
];
const VIEWS = [
  { id: "preview", label: "Preview", icon: EyeIcon },
  { id: "code", label: "Code", icon: CodeIcon },
] as const;

/** A small switch of round icon buttons, the chosen one inked on a circle that slides. */
function IconSwitch<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: Array<{ id: T; label: string; icon: Icon }>; onChange: (v: T) => void }) {
  const id = useId();
  return (
    <LayoutGroup id={id}>
      <div role="radiogroup" aria-label={label} className={cn("flex rounded-full p-0.5", GLASS)}>
        {options.map(({ id: v, label: l, icon: I }) => {
          const on = v === value;
          return (
            <button key={v} type="button" role="radio" aria-checked={on} aria-label={l} title={l} onClick={() => onChange(v)} className={cn("relative grid size-8 place-items-center rounded-full transition-colors", on ? "text-canvas" : "text-muted hover:text-fg")}>
              {on && <motion.span layoutId="icon-switch" className="absolute inset-0 rounded-full bg-fg" transition={SLIDE} />}
              <I size={14} weight="duotone" className="relative" />
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}

/** Copies a ready prompt for Claude Code, so adding a component is one paste. */
export function ClaudeCodeButton({ prompt, label = "Copy for Claude Code", small }: { prompt: string; label?: string; small?: boolean }) {
  const [copied, copy] = useCopied();
  return (
    <button type="button" onClick={() => copy(prompt)} className={cn("btn-metal inline-flex shrink-0 items-center gap-2 rounded-full font-medium", small ? "h-9 px-3.5 text-[12.5px]" : "h-12 px-6 text-ui")}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={copied ? "done" : "copy"} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} transition={{ type: "spring", stiffness: 600, damping: 30 }} className="grid place-items-center">
          {copied ? <CheckIcon size={15} weight="regular" /> : <ClaudeMark size={15} />}
        </motion.span>
      </AnimatePresence>
      {copied ? "Prompt copied" : label}
    </button>
  );
}

/**
 * A component's stage: the component live and large on a quiet light gray, which you can switch to
 * light or dark whatever the site is in, start over, or turn to its code. Floating at its foot,
 * the switch between preview and code, its file to download, and the prompt for Claude Code.
 */
export function Workbench({ name, source, prompt }: { name: string; source: string; prompt: string }) {
  const site = useColorMode();
  const [picked, setPicked] = useState<ColorMode | null>(null);
  const mode = picked ?? site;
  const [view, setView] = useState<"preview" | "code">("preview");
  // Bumped to start the preview over: a new key mounts the demo fresh.
  const [run, setRun] = useState(0);
  const Demo = DEMOS[name];
  return (
    <section id="preview" aria-label="Preview" className="scroll-mt-[calc(var(--bd-header-h,80px)+24px)]">
      {/* The stage carries its own light or dark, apart from the site's. */}
      <div data-theme={mode === "dark" ? "dark" : undefined} className={cn("bd-panel relative isolate overflow-hidden rounded-[32px] text-fg", mode === "light" && "bd-light")}>
        <div className="flex items-center justify-between gap-3 p-3 sm:p-4">
          <span className={cn("inline-flex h-9 items-center gap-2 rounded-full px-3.5 text-[12.5px] font-medium text-muted", GLASS)}>
            <span aria-hidden className="size-1.5 rounded-full bg-[oklch(0.62_0.17_150)]" />
            Live
          </span>
          <div className="flex items-center gap-1.5">
            <IconSwitch label="Stage" value={mode} options={MODES} onChange={setPicked} />
            <button type="button" onClick={() => setRun((r) => r + 1)} aria-label="Start the preview over" title="Start over" className={cn("grid size-9 place-items-center rounded-full text-muted transition-colors hover:text-fg", GLASS)}>
              <ArrowCounterClockwiseIcon weight="regular" size={14} />
            </button>
          </div>
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={view} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }} className="px-4 pb-24 sm:px-8">
            {view === "preview" ? (
              <div className="grid min-h-[360px] place-items-center py-6 sm:min-h-[400px]">{Demo ? <Demo key={run} /> : null}</div>
            ) : (
              <CodeBlock code={source} file={`components/basedraft/${name}.tsx`} maxHeight={440} className="mx-auto max-w-[900px]" />
            )}
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-x-0 bottom-4 flex justify-center px-3">
          <div className={cn("flex max-w-full items-center gap-1 rounded-full p-1", GLASS)}>
            <IconSwitch label="Show" value={view} options={[...VIEWS]} onChange={setView} />
            <span aria-hidden className="mx-1 h-5 w-px shrink-0 bg-line max-sm:hidden" />
            <a href={`/ui/${name}.tsx`} download className="flex h-9 shrink-0 items-center gap-2 rounded-full px-3 font-mono text-[12px] text-muted transition-colors hover:bg-fg/[0.06] hover:text-fg max-sm:hidden">
              <DownloadSimpleIcon size={14} weight="duotone" />
              {name}.tsx
            </a>
            <ClaudeCodeButton prompt={prompt} label="Claude Code" small />
          </div>
        </div>
      </div>
    </section>
  );
}

const ADD = { npm: "npm install", pnpm: "pnpm add", bun: "bun add", yarn: "yarn add" } as const;
type Runner = keyof typeof ADD;

/** A line to copy on a quiet well, colored, scrolling sideways when it runs long. */
function CopyLine({ command, prompt = true }: { command: string; prompt?: boolean }) {
  const [copied, copy] = useCopied();
  return (
    <div className="flex items-center gap-1 rounded-[12px] bg-fg/[0.04] py-1 pl-3.5 pr-1">
      <div className="no-scrollbar min-w-0 flex-1 overflow-x-auto py-1.5">
        <ShellLine command={command} prompt={prompt} className="whitespace-nowrap text-[12.5px]" />
      </div>
      <button type="button" onClick={() => copy(command)} aria-label={copied ? "Copied" : "Copy"} className="grid size-8 shrink-0 place-items-center rounded-full text-subtle transition-colors hover:bg-fg/[0.06] hover:text-fg">
        {copied ? <CheckIcon size={14} weight="regular" className="text-fg" /> : <CopyIcon size={14} weight="duotone" />}
      </button>
    </div>
  );
}

/**
 * A file to take, as a card: its icon, its name and what it is, a button that downloads it, and
 * one that copies the curl that does the same from a terminal.
 */
function FileCard({ icon: I, file, note, href, command, lead }: { icon: Icon; file: string; note: string; href: string; command: string; lead?: boolean }) {
  const [copied, copy] = useCopied();
  return (
    <div className="flex flex-col rounded-[18px] bg-fg/[0.03] p-4 shadow-[inset_0_0_0_1px_var(--bd-line-subtle)]">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-surface text-fg shadow-[var(--bd-shadow-resting),inset_0_0_0_1px_var(--bd-line-subtle)]">
          <I size={20} weight="duotone" />
        </span>
        <span className="min-w-0">
          <span className="block truncate font-mono text-[13px] text-fg">{file}</span>
          <span className="mt-0.5 block text-meta text-muted">{note}</span>
        </span>
      </div>
      <div className="mt-4 flex items-center gap-1.5">
        <a href={href} download className={cn("inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-full text-[13px] font-medium", lead ? "btn-metal" : "bg-surface text-fg shadow-[inset_0_0_0_1px_var(--bd-line)] transition-colors hover:bg-surface-2")}>
          <DownloadSimpleIcon size={15} weight="duotone" /> Download
        </a>
        <button type="button" onClick={() => copy(command)} aria-label={copied ? "Copied" : `Copy the curl that downloads ${file}`} title="Copy the curl" className="grid size-9 shrink-0 place-items-center rounded-full bg-surface text-subtle shadow-[inset_0_0_0_1px_var(--bd-line)] transition-colors hover:text-fg">
          {copied ? <CheckIcon size={14} weight="regular" className="text-fg" /> : <TerminalWindowIcon size={15} weight="duotone" />}
        </button>
      </div>
    </div>
  );
}

const TAKE = [
  { id: "download", label: "Download", icon: DownloadSimpleIcon },
  { id: "claude", label: "Claude Code", icon: ClaudeMark },
  { id: "code", label: "Copy the code", icon: CodeIcon },
] as const;
type Take = (typeof TAKE)[number]["id"];

/**
 * How a component gets into a project, on one card in the hero's light, the way a template's page
 * shows taking it home: what it is on the left; on the right, three ways in. Download the file and
 * the theme (or curl them), hand Claude Code a prompt, or copy the code.
 */
export function TakeComponent({ name, title, deps, source, prompt }: { name: string; title: string; deps: string[]; source: string; prompt: string }) {
  const [way, setWay] = useState<Take>("download");
  const [runner, setRunner] = useState<Runner>("npm");
  const id = useId();
  return (
    <section id="take" aria-labelledby="take-title" className="scroll-mt-[calc(var(--bd-header-h,80px)+24px)] pt-16">
      <div className="bd-paper glow-c relative isolate overflow-hidden rounded-[32px] p-2 sm:p-3">
        <div className="grid gap-2 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
          <div className="flex flex-col p-4 sm:p-6">
            <h2 id="take-title" className="text-balance font-display text-[30px] font-medium leading-[1.08] tracking-[-0.032em]">
              Take {title} home
            </h2>
            <p className="mt-3 text-ui text-paper-muted">One file, yours to change. It reads basedraft&apos;s theme, so change a token there and it follows.</p>
            <ul className="mt-6 grid gap-2.5 text-[13px] text-paper-muted max-sm:hidden [&_svg]:shrink-0 [&_svg]:text-paper-ink/60">
              <li className="flex items-center gap-2.5">
                <FileTsxIcon size={16} weight="duotone" />
                <span className="truncate font-mono text-[12px]">components/basedraft/{name}.tsx</span>
              </li>
              <li className="flex items-center gap-2.5">
                <PackageIcon size={16} weight="duotone" />
                {deps.length ? `Uses ${deps.join(" and ")}` : "Nothing beyond React"}
              </li>
              <li className="flex items-center gap-2.5">
                <AtomIcon size={16} weight="duotone" />
                React 19 and Tailwind CSS 4
              </li>
            </ul>
          </div>
          <div className="min-w-0 rounded-[24px] bg-surface p-2 shadow-[var(--bd-shadow-raised),inset_0_0_0_1px_var(--bd-line-subtle)]">
            <LayoutGroup id={id}>
              <div role="tablist" aria-label="How to take it" className="grid grid-cols-3 gap-0.5 rounded-full bg-fg/[0.05] p-1">
                {TAKE.map((w) => {
                  const on = w.id === way;
                  return (
                    <button key={w.id} type="button" role="tab" aria-selected={on} aria-controls={`${id}-panel`} onClick={() => setWay(w.id)} className={cn("relative flex h-9 items-center justify-center gap-1.5 rounded-full text-[13px] transition-colors", on ? "text-fg" : "text-muted hover:text-fg")}>
                      {on && <motion.span layoutId="take" className="absolute inset-0 rounded-full bg-raised shadow-[var(--bd-shadow-resting),inset_0_0_0_1px_var(--bd-line-subtle)]" transition={SLIDE} />}
                      <w.icon weight="duotone" size={15} className="relative max-sm:hidden" />
                      <span className="relative font-medium">{w.label}</span>
                    </button>
                  );
                })}
              </div>
            </LayoutGroup>
            <motion.div key={way} id={`${id}-panel`} role="tabpanel" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="p-2 pt-3 sm:p-3 sm:pt-4">
              {way === "download" && (
                <>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <FileCard icon={FileTsxIcon} file={`${name}.tsx`} note={`${title}, the one file`} href={`/ui/${name}.tsx`} command={installCommand(name)} lead />
                    <FileCard icon={FileCssIcon} file="basedraft.css" note="The theme, once per project" href="/ui/basedraft.css" command={themeCommand} />
                  </div>
                  <div className="mt-5 grid gap-4">
                    <div>
                      <p className="mb-2 text-[13px] text-muted">Then import the theme in your global CSS, after Tailwind:</p>
                      <CopyLine command={'@import "./basedraft.css";'} prompt={false} />
                    </div>
                    {deps.length > 0 && (
                      <div>
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <p className="text-[13px] text-muted">And install what it uses:</p>
                          <div role="tablist" aria-label="Package manager" className="flex gap-0.5">
                            {(Object.keys(ADD) as Runner[]).map((r) => (
                              <button key={r} type="button" role="tab" aria-selected={r === runner} onClick={() => setRunner(r)} className={cn("h-7 rounded-full px-2.5 font-mono text-[12px] transition-colors", r === runner ? "bg-fg/[0.06] text-fg" : "text-subtle hover:text-fg")}>
                                {r}
                              </button>
                            ))}
                          </div>
                        </div>
                        <CopyLine command={`${ADD[runner]} ${deps.join(" ")}`} />
                      </div>
                    )}
                  </div>
                </>
              )}
              {way === "claude" && (
                <>
                  <div className="flex gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full" style={{ background: `color-mix(in oklab, ${CLAUDE_COLOR} 14%, transparent)` }}>
                      <ClaudeMark size={18} />
                    </span>
                    <p className="min-w-0 flex-1 rounded-[18px] rounded-tl-[6px] bg-fg/[0.04] px-4 py-3.5 text-[14px] leading-[1.65] text-fg">{prompt}</p>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 sm:pl-12">
                    <p className="max-w-[340px] text-meta text-muted">Paste it into Claude Code: it downloads the file and the theme, installs what they use, and puts {title} where you need it.</p>
                    <ClaudeCodeButton prompt={prompt} label="Copy the prompt" small />
                  </div>
                </>
              )}
              {way === "code" && <CodeBlock code={source} file={`components/basedraft/${name}.tsx`} maxHeight={420} />}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * How to use it, on one card: the example on the left and the props down the right. Point at a
 * prop and the lines that use it light up in the example while the rest step back.
 */
export function UsageCard({ name, usage, props }: { name: string; usage: string; props: Array<{ name: string; type: string; default?: string; note: string }> }) {
  const [mark, setMark] = useState<string[] | null>(null);
  const missing = !!mark && !usage.split("\n").some((l) => usesWord(l, mark));
  return (
    <div className="grid overflow-hidden rounded-[24px] border border-line bg-surface shadow-[var(--bd-shadow-raised)] lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
      <CodeBlock bare code={usage} file={`${name}-example.tsx`} mark={mark} maxHeight={560} className="min-w-0" />
      <aside aria-label="Props" className="min-w-0 border-t border-line-subtle lg:border-l lg:border-t-0">
        <div className="flex h-12 items-center justify-between border-b border-line-subtle px-4 text-meta">
          <span className="font-medium text-fg">Props</span>
          <span className="text-subtle max-sm:hidden">{missing ? "Not in this example" : "Point at one to find it"}</span>
        </div>
        <ul className="max-h-[560px] overflow-y-auto p-1.5">
          {props.map((p) => {
            const words = p.name.split(/\s*\/\s*/);
            const on = !!mark && mark.join() === words.join();
            return (
              <li key={p.name}>
                <button
                  type="button"
                  onMouseEnter={() => setMark(words)}
                  onMouseLeave={() => setMark(null)}
                  onFocus={() => setMark(words)}
                  onBlur={() => setMark(null)}
                  className={cn("w-full rounded-[14px] px-3 py-3 text-left transition-colors", on ? "bg-fg/[0.05]" : "hover:bg-fg/[0.03]")}
                >
                  <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <code className="font-mono text-[12.5px] font-medium text-[var(--code-key)]">{p.name}</code>
                    {p.default && <code className="font-mono text-[11.5px] text-subtle">= {p.default}</code>}
                  </span>
                  <code className="mt-1.5 inline-block rounded-full bg-fg/[0.04] px-2 py-0.5 font-mono text-[11.5px] text-[var(--code-string)]">{p.type}</code>
                  <span className="mt-1.5 block text-meta text-muted">{p.note}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>
    </div>
  );
}

/** Other components as tiles, at the foot of a component's page. */
export function MoreComponents({ names }: { names: string[] }) {
  const list = names.map((n) => componentOf(n)).filter((c): c is ComponentMeta => !!c);
  const spans = evenSpans(list.length);
  return (
    <ul className="grid grid-cols-12 gap-3 sm:gap-4">
      {list.map((c, i) => (
        <ComponentTile key={c.name} c={c} span={spans[i]} i={i + 1} />
      ))}
    </ul>
  );
}
