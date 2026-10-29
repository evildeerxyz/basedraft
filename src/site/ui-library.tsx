"use client";

import {
  ArrowCounterClockwiseIcon,
  DiamondIcon,
  SparkleIcon,
  StepsIcon,
  SidebarIcon,
  BellIcon,
  ChatsCircleIcon,
  KanbanIcon,
  ChartDonutIcon,
  ChartBarIcon,
  PresentationChartIcon,
  ChartLineIcon,
  IdentificationCardIcon,
  PencilSimpleLineIcon,
  CircleHalfIcon,
  SelectionIcon,
  ToolboxIcon,
  ChartLineUpIcon,
  SlideshowIcon,
  ColumnsIcon,
  DotsSixVerticalIcon,
  TableIcon,
  UploadSimpleIcon,
  CalendarBlankIcon,
  PlusMinusIcon,
  TagSimpleIcon,
  ListMagnifyingGlassIcon,
  PulseIcon,
  BrowsersIcon,
  GaugeIcon,
  WarningCircleIcon,
  PathIcon,
  CaretDoubleRightIcon,
  TreeStructureIcon,
  ClockCounterClockwiseIcon,
  CheckerboardIcon,
  SpeedometerIcon,
  RankingIcon,
  CalendarDotsIcon,
  HeartbeatIcon,
  ArrowsSplitIcon,
  LockKeyIcon,
  FunnelSimpleIcon,
  ListBulletsIcon,
  SquareSplitHorizontalIcon,
  CodeBlockIcon,
  TrendUpIcon,
  SignpostIcon,
  FunnelIcon,
  MapTrifoldIcon,
  HandPointingIcon,
  TrayIcon,
  ListNumbersIcon,
  FilmStripIcon,
  HashIcon,
  RowsIcon,
  CircleNotchIcon,
  CommandIcon,
  BellSimpleIcon,
  ListDashesIcon,
  ChatCenteredTextIcon,
  SidebarSimpleIcon,
  AppWindowIcon,
  TextAaIcon,
  PasswordIcon,
  ListChecksIcon,
  RadioButtonIcon,
  CheckSquareIcon,
  ArrowRightIcon,
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
  MouseRightClickIcon,
  ClockIcon,
  ScrollIcon,
  MegaphoneSimpleIcon,
  ImagesIcon,
  CookieIcon,
  TimerIcon,
  PaletteIcon,
  CalendarCheckIcon,
  GitDiffIcon,
  SignInIcon,
} from "@phosphor-icons/react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ADD, COMPONENTS, componentOf, GROUPS, importLine, installCommand, isNew, PACKAGE, stylesImport, type ComponentMeta, type Runner } from "@/registry";
import { DEMOS, EXAMPLES } from "@/registry/demos";
import type { Example, Part } from "@/registry/types";
import { ClaudeMark, CLAUDE_COLOR } from "./claude-mark";
import { previewHeaders, usePlan } from "./plan";
import { openPro } from "./pro-modal";
import { btn, NewBadge, ProBadge } from "./sheet";
import { CodeBlock, highlight, usesWord } from "./code";
import { useColorMode, type ColorMode } from "./color-mode";
import { Dock, DockPill, PieceMenu, TILE, TileArrow, useBackToTop } from "./library";
import { GLASS, LIB_WRAP } from "./library-css";
import { ShellLine } from "./shell-line";

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
  checkbox: CheckSquareIcon,
  "radio-group": RadioButtonIcon,
  select: ListChecksIcon,
  "code-input": PasswordIcon,
  field: TextAaIcon,
  dialog: AppWindowIcon,
  sheet: SidebarSimpleIcon,
  popover: ChatCenteredTextIcon,
  menu: ListDashesIcon,
  toast: BellSimpleIcon,
  command: CommandIcon,
  spinner: CircleNotchIcon,
  skeleton: RowsIcon,
  number: HashIcon,
  marquee: FilmStripIcon,
  steps: ListNumbersIcon,
  stepper: ListNumbersIcon,
  combobox: ListMagnifyingGlassIcon,
  "tag-input": TagSimpleIcon,
  "number-field": PlusMinusIcon,
  "date-picker": CalendarBlankIcon,
  "file-drop": UploadSimpleIcon,
  "data-table": TableIcon,
  "sortable-list": DotsSixVerticalIcon,
  resizable: ColumnsIcon,
  carousel: SlideshowIcon,
  stat: ChartLineUpIcon,
  toolbar: ToolboxIcon,
  "action-bar": SelectionIcon,
  "theme-toggle": CircleHalfIcon,
  "inline-edit": PencilSimpleLineIcon,
  "hover-card": IdentificationCardIcon,
  "area-chart": ChartLineIcon,
  "bar-chart": ChartBarIcon,
  "donut-chart": ChartDonutIcon,
  "kanban-board": KanbanIcon,
  "ai-chat": ChatsCircleIcon,
  inbox: BellIcon,
  "pricing-table": TagIcon,
  "app-sidebar": SidebarIcon,
  onboarding: ListChecksIcon,
  wizard: StepsIcon,
  "empty-state": TrayIcon,
  "hold-button": HandPointingIcon,
  slider: SlidersHorizontalIcon,
  meter: GaugeIcon,
  alert: WarningCircleIcon,
  breadcrumb: PathIcon,
  pagination: CaretDoubleRightIcon,
  tree: TreeStructureIcon,
  timeline: ClockCounterClockwiseIcon,
  "dither-image": CheckerboardIcon,
  gauge: SpeedometerIcon,
  "bar-list": RankingIcon,
  heatmap: CalendarDotsIcon,
  uptime: HeartbeatIcon,
  "split-button": ArrowsSplitIcon,
  "password-field": LockKeyIcon,
  chips: FunnelSimpleIcon,
  "table-of-contents": ListBulletsIcon,
  "compare-slider": SquareSplitHorizontalIcon,
  "code-block": CodeBlockIcon,
  sparkline: TrendUpIcon,
  "navigation-menu": SignpostIcon,
  funnel: FunnelIcon,
  tour: MapTrifoldIcon,
  "context-menu": MouseRightClickIcon,
  "time-picker": ClockIcon,
  "scroll-area": ScrollIcon,
  banner: MegaphoneSimpleIcon,
  lightbox: ImagesIcon,
  consent: CookieIcon,
  countdown: TimerIcon,
  "color-picker": PaletteIcon,
  scheduler: CalendarCheckIcon,
  "log-viewer": TerminalWindowIcon,
  "code-diff": GitDiffIcon,
  "sign-in": SignInIcon,
};
const GROUP_ICON: Record<string, Icon> = { Actions: CursorClickIcon, Forms: TextboxIcon, Overlays: BrowsersIcon, Navigation: TabsIcon, Display: CardsIcon, Data: ChartLineIcon, Patterns: PresentationChartIcon, Feedback: PulseIcon };
/* A line on each group, under its name in the gallery. */
const GROUP_LINE: Record<string, string> = {
  Actions: "The things you press to make something happen.",
  Forms: "Fields, switches and choices, for taking input.",
  Overlays: "What opens over the page: dialogs, sheets, menus and toasts.",
  Navigation: "Moving between views, and opening what's folded away.",
  Display: "People, numbers and content, shown with care.",
  Data: "Tables, numbers and charts, for dashboards that read at a glance.",
  Patterns: "Whole pieces of a product, composed and ready: pricing, navigation, onboarding, a board, an assistant.",
  Feedback: "Progress, loading, and what just happened.",
};

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

/* The gallery's widths, out of twelve columns. */
const SPAN: Record<number, string> = { 4: "lg:col-span-4", 6: "lg:col-span-6", 8: "lg:col-span-8", 12: "lg:col-span-12" };
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
function ComponentTile({ c, span }: { c: ComponentMeta; span: number }) {
  const Demo = DEMOS[c.name];
  const I = COMPONENT_ICON[c.name] ?? StackIcon;
  return (
    <motion.li layout="position" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={SLIDE} className={cn("col-span-12 min-w-0 md:col-span-6", SPAN[span])}>
      <div className={cn(TILE, "h-full min-h-[300px]")}>
        <div className="grid flex-1 place-items-center px-6 pb-[84px] pt-10">{Demo ? <Demo /> : null}</div>
        <div className="absolute inset-x-3 bottom-3 flex items-center gap-2">
          <Link href={`/components/${c.name}`} className={cn("flex h-10 min-w-0 items-center gap-2 rounded-full pl-1.5 pr-4 text-[13px] transition-colors hover:bg-surface", GLASS)}>
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-fg/[0.06] text-fg">
              <I size={14} weight="duotone" />
            </span>
            <span className="truncate font-medium text-fg">{c.title}</span>
            {isNew(c) && <NewBadge />}
            {c.pro && <ProBadge />}
            <span className="truncate text-subtle max-sm:hidden">{c.group}</span>
          </Link>
          <span className="ml-auto flex shrink-0 items-center gap-1.5">
            {!c.pro && <CopyCircle text={importLine(c.name)} label={`Copy the import for ${c.title}`} />}
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
  // A section per group, in order: every group when All is on, or just the one picked.
  // Pro picks the Pro components out of every group; any other pill is one group.
  const sections = GROUPS.filter((g) => group === "All" || group === "Pro" || group === "New" || g === group)
    .map((g) => ({ g, list: matched.filter((c) => c.group === g && (group !== "Pro" || c.pro) && (group !== "New" || isNew(c))) }))
    .filter((x) => x.list.length);
  return (
    <>
      <Dock label="Filter components" after={<FilterField value={q} onChange={setQ} />}>
        <DockPill on={group === "All"} onClick={() => setGroup("All")} icon={SquaresFourIcon} count={matched.length}>
          All
        </DockPill>
        {matched.some(isNew) && (
          <DockPill on={group === "New"} onClick={() => setGroup("New")} icon={SparkleIcon} count={matched.filter(isNew).length}>
            New
          </DockPill>
        )}
        {matched.some((c) => c.pro) && (
          <DockPill on={group === "Pro"} onClick={() => setGroup("Pro")} icon={DiamondIcon} count={matched.filter((c) => c.pro).length}>
            Pro
          </DockPill>
        )}
        {GROUPS.map((g) => (
          <DockPill key={g} on={group === g} onClick={() => setGroup(g)} icon={GROUP_ICON[g] ?? StackIcon} count={matched.filter((c) => c.group === g).length}>
            {g}
          </DockPill>
        ))}
      </Dock>
      <div ref={top} className={cn(LIB_WRAP, "pt-4")}>
        {sections.length ? (
          sections.map(({ g, list }) => {
            const spans = evenSpans(list.length);
            const I = GROUP_ICON[g] ?? StackIcon;
            return (
              <section key={g} aria-label={g} className="pt-10">
                <div className="mb-5 flex min-w-0 items-center gap-3.5">
                  <span className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-surface text-fg shadow-[var(--bd-shadow-resting),inset_0_0_0_1px_var(--bd-line-subtle)]">
                    <I size={20} weight="duotone" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="flex items-baseline gap-2 font-display text-[24px] font-medium leading-[1.15] tracking-[-0.028em]">
                      {g}
                      <span className="font-sans text-[13px] font-normal tracking-normal tabular-nums text-subtle">{list.length}</span>
                    </h2>
                    {GROUP_LINE[g] && <p className="mt-0.5 truncate text-ui text-muted">{GROUP_LINE[g]}</p>}
                  </div>
                </div>
                <ul className="grid grid-cols-12 gap-3 sm:gap-4">
                  <AnimatePresence mode="popLayout" initial={false}>
                    {list.map((c, i) => (
                      <ComponentTile key={c.name} c={c} span={spans[i]} />
                    ))}
                  </AnimatePresence>
                </ul>
              </section>
            );
          })
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

/* ---------- Pro components ---------- */

/**
 * A Pro component's source, fetched from the gated route for a Pro account: nothing is asked for
 * otherwise, and the server checks again. Ready holds the source; locked means the account isn't Pro.
 */
function useProSource(name: string, pro: boolean) {
  const [plan] = usePlan();
  const [got, setGot] = useState<{ name: string; source: string | null } | null>(null);
  const want = pro && plan === "pro";
  useEffect(() => {
    if (!want) return;
    let gone = false;
    fetch(`/api/ui/${name}`, { headers: previewHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { source?: string } | null) => !gone && setGot({ name, source: d?.source ?? null }))
      .catch(() => !gone && setGot({ name, source: null }));
    return () => {
      gone = true;
    };
  }, [name, want]);
  const mine = got?.name === name ? got : null;
  return { locked: !want, loading: want && !mine, source: mine?.source ?? null, failed: want && !!mine && !mine.source };
}

/** What a Pro component's code looks like before Pro: what it is, and the way to it. */
function ProLocked({ title, compact }: { title: string; compact?: boolean }) {
  return (
    <div className={cn("grid place-items-center text-center", compact ? "px-4 py-8" : "px-6 py-12")}>
      <span className="grid size-12 place-items-center rounded-full bg-[var(--bd-ui-track)] text-fg">
        <DiamondIcon size={20} weight="duotone" />
      </span>
      <p className="mt-4 text-[17px] font-medium">{title}&apos;s code comes with Pro</p>
      <p className="mt-1.5 max-w-[440px] text-ui text-muted">Try it here as much as you like. Pro brings its code, and every other Pro component&apos;s, with every template and section, for one payment.</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <button type="button" onClick={() => openPro("components")} className={btn.ink}>
          Get Pro
        </button>
        <Link href="/pro" className={btn.outline}>
          What&apos;s in Pro
        </Link>
      </div>
    </div>
  );
}

/** A Pro component's code, for the stage's Code view: the file once it's here, or what Pro brings. */
function ProCode({ name, title }: { name: string; title: string }) {
  const { locked, loading, source, failed } = useProSource(name, true);
  if (locked) return <div className="mx-auto max-w-[900px] rounded-[var(--bd-r-sheet)] bg-surface shadow-[0_0_0_1px_var(--bd-line)]"><ProLocked title={title} /></div>;
  if (loading) return <div className="mx-auto h-[300px] max-w-[900px] animate-pulse rounded-[var(--bd-r-sheet)] bg-surface shadow-[0_0_0_1px_var(--bd-line)]" />;
  if (failed || !source) return <p className="py-16 text-center text-ui text-muted">The code didn&apos;t come through. Reload the page and try again.</p>;
  return <CodeBlock code={source} file={`components/basedraft/${name}.tsx`} maxHeight={440} className="mx-auto max-w-[900px]" />;
}

/**
 * How a Pro component gets into a project: its file, copied in and yours to change, on Tailwind
 * CSS 4 with basedraft's theme. Before Pro, the same card says what Pro brings.
 */
function ProTake({ name, title, deps }: { name: string; title: string; deps: string[] }) {
  const [plan] = usePlan();
  const { source } = useProSource(name, plan === "pro");
  return (
    <section id="take" aria-labelledby="take-title" className="scroll-mt-[calc(var(--bd-header-h,80px)+80px)] pt-16">
      <div className="bd-paper glow-c relative isolate overflow-hidden rounded-[32px] p-2 sm:p-3">
        <div className="grid gap-2 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
          <div className="flex flex-col p-4 sm:p-6">
            <h2 id="take-title" className="flex flex-wrap items-center gap-2.5 text-balance font-display text-[30px] font-medium leading-[1.08] tracking-[-0.032em]">
              Take {title} home <ProBadge />
            </h2>
            <p className="mt-3 text-ui text-paper-muted">A Pro component: its file goes into your project and it&apos;s yours to change. It reads basedraft&apos;s theme, on Tailwind CSS 4.</p>
            <ul className="mt-6 grid gap-2.5 text-[13px] text-paper-muted max-sm:hidden [&_svg]:shrink-0 [&_svg]:text-paper-ink/60">
              <li className="flex items-center gap-2.5">
                <FileTsxIcon size={16} weight="duotone" />
                <span className="truncate font-mono text-[12px]">components/basedraft/{name}.tsx</span>
              </li>
              <li className="flex items-center gap-2.5">
                <StackIcon size={16} weight="duotone" />
                {deps.length ? `Leans on ${deps.join(" and ")}` : "Nothing beyond React"}
              </li>
            </ul>
          </div>
          <div className="min-w-0 rounded-[24px] bg-surface p-2 shadow-[var(--bd-shadow-raised),inset_0_0_0_1px_var(--bd-line-subtle)]">
            {plan !== "pro" ? (
              <ProLocked title={title} compact />
            ) : (
              <ol className="grid gap-5 p-2 pt-3 sm:p-3 sm:pt-4">
                <Step n={1} title={`Copy its file to components/basedraft/${name}.tsx`}>
                  {source ? <CodeBlock code={source} file={`${name}.tsx`} maxHeight={380} /> : <div className="h-[200px] animate-pulse rounded-[var(--bd-r-sheet)] bg-[var(--bd-ui-track)]" />}
                </Step>
                <Step n={2} title="Add basedraft's theme once, in your global CSS">
                  <CopyLine command={`@import "${PACKAGE}/theme.css";`} code />
                  <p className="mt-2 text-meta text-muted">With the package installed: <code className="font-mono text-[12px]">{installCommand()}</code></p>
                </Step>
                <Step n={3} title={`Use ${title}`}>
                  <CopyLine command={importLine(name)} code />
                </Step>
              </ol>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * A component's stage: the component live and large on a quiet light gray, which you can switch to
 * light or dark whatever the site is in, start over, or turn to its code. Floating at its foot,
 * the switch between preview and code, its file to download, and the prompt for Claude Code.
 */
export function Workbench({ name, title, source, prompt, pro }: { name: string; title: string; source: string | null; prompt: string; pro?: boolean }) {
  const site = useColorMode();
  const [picked, setPicked] = useState<ColorMode | null>(null);
  const mode = picked ?? site;
  const [view, setView] = useState<"preview" | "code">("preview");
  // Bumped to start the preview over: a new key mounts the demo fresh.
  const [run, setRun] = useState(0);
  const Demo = DEMOS[name];
  return (
    <section id="preview" aria-label="Preview" className="scroll-mt-[calc(var(--bd-header-h,80px)+80px)]">
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
              <div data-bd-stage="" className="grid min-h-[360px] place-items-center pb-[76px] pt-6 sm:min-h-[400px]">{Demo ? <Demo key={run} /> : null}</div>
            ) : (
              pro || !source ? <ProCode name={name} title={title} /> : <CodeBlock code={source} file={`components/basedraft/${name}.tsx`} maxHeight={440} className="mx-auto max-w-[900px]" />
            )}
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-x-0 bottom-4 flex justify-center px-3">
          <div className={cn("flex max-w-full items-center gap-1 rounded-full p-1", GLASS)}>
            <IconSwitch label="Show" value={view} options={[...VIEWS]} onChange={setView} />
            {/* A Pro component's file comes only with Pro, in its card below: no download or prompt here. */}
            {!pro && (
              <>
                <span aria-hidden className="mx-1 h-5 w-px shrink-0 bg-line max-sm:hidden" />
                <a href={`/ui/${name}.tsx`} download className="flex h-9 shrink-0 items-center gap-2 rounded-full px-3 font-mono text-[12px] text-muted transition-colors hover:bg-fg/[0.06] hover:text-fg max-sm:hidden">
                  <DownloadSimpleIcon size={14} weight="duotone" />
                  {name}.tsx
                </a>
                <ClaudeCodeButton prompt={prompt} label="Claude Code" small />
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/** A line to copy on a quiet well, colored as a terminal or as code, wrapping when it runs long. */
export function CopyLine({ command, code }: { command: string; /** Color it as JavaScript rather than a shell command. */ code?: boolean }) {
  const [copied, copy] = useCopied();
  return (
    <div className="flex items-center gap-1 rounded-[12px] bg-fg/[0.04] py-1 pl-3.5 pr-1">
      <div className="min-w-0 flex-1 py-1.5">
        {code ? <code className="whitespace-pre-wrap font-mono text-[12.5px] text-[var(--code-text)] [overflow-wrap:anywhere]" dangerouslySetInnerHTML={{ __html: highlight(command) }} /> : <ShellLine command={command} className="whitespace-normal text-[12.5px] [overflow-wrap:anywhere]" />}
      </div>
      <button type="button" onClick={() => copy(command)} aria-label={copied ? "Copied" : "Copy"} className="grid size-8 shrink-0 place-items-center rounded-full text-subtle transition-colors hover:bg-fg/[0.06] hover:text-fg">
        {copied ? <CheckIcon size={14} weight="regular" className="text-fg" /> : <CopyIcon size={14} weight="duotone" />}
      </button>
    </div>
  );
}

/** npm, pnpm, bun or yarn, as a row of small mono tabs. */
function RunnerTabs({ value, onChange }: { value: Runner; onChange: (r: Runner) => void }) {
  return (
    <div role="tablist" aria-label="Package manager" className="flex gap-0.5">
      {(Object.keys(ADD) as Runner[]).map((r) => (
        <button key={r} type="button" role="tab" aria-selected={r === value} onClick={() => onChange(r)} className={cn("h-7 rounded-full px-2.5 font-mono text-[12px] transition-colors", r === value ? "bg-fg/[0.06] text-fg" : "text-subtle hover:text-fg")}>
          {r}
        </button>
      ))}
    </div>
  );
}

/** The one install, in the package manager you pick. */
export function InstallLine() {
  const [runner, setRunner] = useState<Runner>("npm");
  return (
    <div>
      <div className="mb-2 flex justify-end">
        <RunnerTabs value={runner} onChange={setRunner} />
      </div>
      <CopyLine command={installCommand(runner)} />
    </div>
  );
}

/** A numbered step: its number, what to do, an optional control on the right, then the line for it. */
function Step({ n, title, aside, children }: { n: number; title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <li className="grid grid-cols-[26px_minmax(0,1fr)] gap-x-3">
      <span className="grid size-[26px] place-items-center rounded-full bg-fg/[0.06] text-[12px] font-medium tabular-nums">{n}</span>
      <div className="min-w-0">
        <div className="mb-2 flex min-h-[26px] flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <p className="text-ui font-medium">{title}</p>
          {aside}
        </div>
        {children}
      </div>
    </li>
  );
}

const TAKE = [
  { id: "npm", label: "npm", icon: PackageIcon },
  { id: "claude", label: "Claude Code", icon: ClaudeMark },
  { id: "code", label: "Copy the code", icon: CodeIcon },
] as const;
type Take = (typeof TAKE)[number]["id"];

/**
 * How a component gets into a project, on one card in the hero's light, the way a template's page
 * shows taking it home: what it is on the left; on the right, three ways in. Install the package
 * (once for every component), hand Claude Code a prompt, or copy this one file and own it.
 */
export function TakeComponent({ name, title, deps, source, prompt, pro }: { name: string; title: string; deps: string[]; source: string | null; prompt: string; pro?: boolean }) {
  if (pro || !source) return <ProTake name={name} title={title} deps={deps} />;
  return <FreeTake name={name} title={title} deps={deps} source={source} prompt={prompt} />;
}

function FreeTake({ name, title, deps, source, prompt }: { name: string; title: string; deps: string[]; source: string; prompt: string }) {
  const [way, setWay] = useState<Take>("npm");
  const [runner, setRunner] = useState<Runner>("npm");
  const id = useId();
  return (
    <section id="take" aria-labelledby="take-title" className="scroll-mt-[calc(var(--bd-header-h,80px)+80px)] pt-16">
      <div className="bd-paper glow-c relative isolate overflow-hidden rounded-[32px] p-2 sm:p-3">
        <div className="grid gap-2 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
          <div className="flex flex-col p-4 sm:p-6">
            <h2 id="take-title" className="text-balance font-display text-[30px] font-medium leading-[1.08] tracking-[-0.032em]">
              Take {title} home
            </h2>
            <p className="mt-3 text-ui text-paper-muted">One package holds every component and their styles, in light and dark. Or copy this one file and make it yours.</p>
            <ul className="mt-6 grid gap-2.5 text-[13px] text-paper-muted max-sm:hidden [&_svg]:shrink-0 [&_svg]:text-paper-ink/60">
              <li className="flex items-center gap-2.5">
                <PackageIcon size={16} weight="duotone" />
                <span className="font-mono text-[12px]">{PACKAGE}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <StackIcon size={16} weight="duotone" />
                {deps.length ? `Leans on ${deps.join(" and ")}` : "Nothing beyond React"}
              </li>
              <li className="flex items-center gap-2.5">
                <AtomIcon size={16} weight="duotone" />
                React 19, with or without Tailwind
              </li>
            </ul>
            <Link href="/components/get-started" className="group mt-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-paper-ink max-lg:hidden">
              The full setup <ArrowRightIcon weight="regular" size={13} className="transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
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
            <motion.div key={way} id={`${id}-panel`} role="tabpanel" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="p-2 pt-4 sm:p-3 sm:pt-5">
              {way === "npm" && (
                <ol className="grid gap-5">
                  <Step n={1} title="Install the package" aside={<RunnerTabs value={runner} onChange={setRunner} />}>
                    <CopyLine command={installCommand(runner)} />
                  </Step>
                  <Step n={2} title="Add its styles once, in your root layout">
                    <CopyLine command={stylesImport} code />
                  </Step>
                  <Step n={3} title={`Use ${title}`}>
                    <CopyLine command={importLine(name)} code />
                  </Step>
                </ol>
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
                    <p className="max-w-[340px] text-meta text-muted">Paste it into Claude Code: it installs the package, adds the styles once and puts {title} where you need it.</p>
                    <ClaudeCodeButton prompt={prompt} label="Copy the prompt" small />
                  </div>
                </>
              )}
              {way === "code" && (
                <>
                  <CodeBlock code={source} file={`${name}.tsx`} maxHeight={380} />
                  <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 px-1 text-meta text-muted">
                    It reads basedraft&apos;s theme, so add that too:
                    <a href={`/ui/${name}.tsx`} download className="inline-flex items-center gap-1.5 font-medium text-fg hover:underline">
                      <FileTsxIcon size={14} weight="duotone" /> {name}.tsx
                    </a>
                    <a href="/ui/basedraft.css" download className="inline-flex items-center gap-1.5 font-medium text-fg hover:underline">
                      <FileCssIcon size={14} weight="duotone" /> basedraft.css
                    </a>
                  </p>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * How to use it, on one card: the example on the left and every part's props down the right. Point
 * at a prop (or a part's name) and the lines that use it light up in the example while the rest
 * step back.
 */
export function UsageCard({ name, usage, parts }: { name: string; usage: string; parts: Part[] }) {
  const [mark, setMark] = useState<string[] | null>(null);
  const missing = !!mark && !usage.split("\n").some((l) => usesWord(l, mark));
  const point = (words: string[]) => ({ onMouseEnter: () => setMark(words), onMouseLeave: () => setMark(null), onFocus: () => setMark(words), onBlur: () => setMark(null) });
  const count = parts.reduce((n, p) => n + p.props.length, 0);
  return (
    <div className="grid overflow-hidden rounded-[24px] border border-line bg-surface shadow-[var(--bd-shadow-raised)] lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
      <CodeBlock bare code={usage} file={`${name}-example.tsx`} mark={mark} maxHeight={620} className="min-w-0" />
      <aside aria-label="Props" className="min-w-0 border-t border-line-subtle lg:border-l lg:border-t-0">
        <div className="flex h-12 items-center justify-between border-b border-line-subtle px-4 text-meta">
          <span className="font-medium text-fg">
            {parts.length > 1 ? `${parts.length} parts` : "Props"} <span className="font-normal tabular-nums text-subtle">{count}</span>
          </span>
          <span className="text-subtle max-sm:hidden">{missing ? "Not in this example" : "Point at one to find it"}</span>
        </div>
        <div className="max-h-[620px] overflow-y-auto p-1.5">
          {parts.map((part) => (
            <section key={part.name} aria-label={part.name} className="pb-1">
              {parts.length > 1 && (
                <button type="button" {...point([part.name])} className="sticky top-0 z-10 flex w-full flex-col items-start rounded-[12px] bg-surface/95 px-3 pb-1.5 pt-3 text-left backdrop-blur">
                  <code className="font-mono text-[12.5px] font-semibold text-[var(--code-type)]">{`<${part.name}>`}</code>
                  {part.note && <span className="mt-0.5 text-meta text-subtle">{part.note}</span>}
                </button>
              )}
              <ul>
                {part.props.map((p) => {
                  const words = p.name.split(/\s*\/\s*/);
                  const on = !!mark && mark.join() === words.join();
                  return (
                    <li key={`${part.name}-${p.name}`}>
                      <button type="button" {...point(words)} className={cn("w-full rounded-[14px] px-3 py-3 text-left transition-colors", on ? "bg-fg/[0.05]" : "hover:bg-fg/[0.03]")}>
                        <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                          <code className="font-mono text-[12.5px] font-medium text-[var(--code-key)]">
                            {p.name}
                            {p.required && <span className="ml-1 font-sans text-[11px] font-normal text-subtle">required</span>}
                          </code>
                          {p.default && <code className="font-mono text-[11.5px] text-subtle">= {p.default}</code>}
                        </span>
                        <code className="mt-1.5 inline-block max-w-full break-words rounded-[8px] bg-fg/[0.04] px-2 py-0.5 font-mono text-[11.5px] text-[var(--code-string)]">{p.type}</code>
                        <span className="mt-1.5 block text-meta text-muted">{p.note}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </aside>
    </div>
  );
}

/** When it's the right component and when another is, side by side, each line with its mark. */
export function GuideCard({ use = [], avoid = [] }: { use?: string[]; avoid?: string[] }) {
  const col = (title: string, lines: string[], yes: boolean) =>
    lines.length > 0 && (
      <div className="rounded-[22px] bg-surface p-5 shadow-[inset_0_0_0_1px_var(--bd-line)] sm:p-6">
        <p className="text-ui font-medium">{title}</p>
        <ul className="mt-4 grid gap-3">
          {lines.map((l) => (
            <li key={l} className="flex gap-3 text-[14px] leading-[1.55] text-muted">
              <span className={cn("mt-[2px] grid size-5 shrink-0 place-items-center rounded-full", yes ? "bg-fg text-canvas" : "bg-fg/[0.07] text-muted")}>{yes ? <CheckIcon size={11} weight="bold" /> : <XIcon size={10} weight="bold" />}</span>
              <span>{l}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {col("Reach for it when", use, true)}
      {col("Reach for something else when", avoid, false)}
    </div>
  );
}

/**
 * The focused examples, each live on a quiet panel with its title and a line on it, and its code a
 * tap away under it.
 */
export function ExampleList({ name, examples }: { name: string; examples: Example[] }) {
  return (
    <div className="grid gap-6">
      {examples.map((ex) => (
        <ExampleBlock key={ex.id} name={name} ex={ex} />
      ))}
    </div>
  );
}

function ExampleBlock({ name, ex }: { name: string; ex: Example }) {
  const [open, setOpen] = useState(false);
  const Demo = EXAMPLES[name]?.[ex.id];
  return (
    <article id={`example-${ex.id}`} className="scroll-mt-[calc(var(--bd-header-h,80px)+88px)]">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
        <div className="min-w-0">
          <h3 className="text-[17px] font-medium">{ex.title}</h3>
          {ex.note && <p className="mt-0.5 max-w-[640px] text-ui text-muted">{ex.note}</p>}
        </div>
        <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-fg/[0.05] px-3 text-[12.5px] font-medium text-fg transition-colors hover:bg-fg/[0.09]">
          <CodeIcon size={13} weight="duotone" /> {open ? "Hide code" : "Show code"}
        </button>
      </div>
      <div className="bd-panel grid min-h-[200px] place-items-center rounded-[22px] p-6 shadow-[inset_0_0_0_1px_var(--bd-line-subtle)] sm:p-10">{Demo ? <Demo /> : null}</div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden">
            <div className="pt-2">
              <CodeBlock code={ex.code} file={`${name}-${ex.id}.tsx`} maxHeight={460} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}

/** A key, or keys pressed together, as small keycaps. */
function KeyCaps({ keys }: { keys: string }) {
  return (
    <span className="flex flex-wrap items-center gap-1">
      {keys.split(/\s*(\+|\/|,)\s*/).map((k, i) =>
        k === "+" || k === "/" || k === "," ? (
          <span key={i} className="text-[11px] text-subtle">
            {k === "+" ? "+" : "or"}
          </span>
        ) : (
          <kbd key={i} className="inline-flex h-6 min-w-6 items-center justify-center rounded-[7px] bg-surface px-1.5 font-sans text-[11.5px] font-medium text-fg shadow-[inset_0_-1px_0_var(--bd-line),0_0_0_1px_var(--bd-line)]">
            {k}
          </kbd>
        ),
      )}
    </span>
  );
}

/** What each key does, and what assistive tech gets, side by side. */
export function AccessCard({ keyboard = [], a11y = [] }: { keyboard?: Array<{ keys: string; does: string }>; a11y?: string[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {keyboard.length > 0 && (
        <div className="rounded-[22px] bg-surface p-5 shadow-[inset_0_0_0_1px_var(--bd-line)] sm:p-6">
          <p className="flex items-center gap-2 text-ui font-medium">
            <KeyboardIcon size={16} weight="duotone" className="text-subtle" /> Keyboard
          </p>
          <ul className="mt-4 divide-y divide-line-subtle">
            {keyboard.map((k) => (
              <li key={k.keys} className="grid grid-cols-[minmax(0,150px)_minmax(0,1fr)] items-start gap-4 py-2.5 first:pt-0 last:pb-0">
                <KeyCaps keys={k.keys} />
                <span className="text-[14px] leading-[1.55] text-muted">{k.does}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {a11y.length > 0 && (
        <div className="rounded-[22px] bg-surface p-5 shadow-[inset_0_0_0_1px_var(--bd-line)] sm:p-6">
          <p className="flex items-center gap-2 text-ui font-medium">
            <UserCircleIcon size={16} weight="duotone" className="text-subtle" /> Accessibility
          </p>
          <ul className="mt-4 grid gap-3">
            {a11y.map((l) => (
              <li key={l} className="flex gap-3 text-[14px] leading-[1.55] text-muted">
                <span aria-hidden className="mt-[9px] size-1 shrink-0 rounded-full bg-fg/40" />
                {l}
              </li>
            ))}
          </ul>
        </div>
      )}
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
        <ComponentTile key={c.name} c={c} span={spans[i]} />
      ))}
    </ul>
  );
}
