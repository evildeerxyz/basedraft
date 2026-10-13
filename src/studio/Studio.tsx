"use client";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { ArrowClockwiseIcon, ArrowCounterClockwiseIcon, ArrowDownIcon, ArrowUpIcon, ArrowUpRightIcon, BookmarkSimpleIcon, BooksIcon, CaretDownIcon, CaretRightIcon, ChatCircleIcon, CheckIcon, ClockCounterClockwiseIcon, CloudArrowUpIcon, CloudCheckIcon, CloudSlashIcon, CodeIcon, CopyIcon, CursorIcon, DevicesIcon, DiamondIcon, DotsThreeIcon, DownloadSimpleIcon, EyeIcon, FigmaLogoIcon, FileHtmlIcon, FileIcon, FilesIcon, HandIcon, HouseIcon, LockSimpleIcon, MagnifyingGlassPlusIcon, PlayIcon, PlusIcon, QuestionIcon, SidebarSimpleIcon, SignOutIcon, SquaresFourIcon, SwapIcon, TrashIcon, UserCircleIcon, UsersThreeIcon, XIcon } from "@phosphor-icons/react";
import { useMutation } from "convex/react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useReducer, useRef, useState, type ReactNode } from "react";
import { cn, EASE_OUT } from "@/lib/utils";
import { AccountHeader, Avatar, displayName, openAuth, openProfile, signedIn, signOut, useAuth } from "@/site/auth";
import { ColorModeSwitch } from "@/site/color-mode";
import { copyToDesign, type CopyKind, type CopyTarget } from "@/site/design-copy";
import { SectionGlyph } from "@/site/icons";
import { Tip, WithKeys } from "@/site/keys";
import { composeUrl, isFree, liveUrl, sectionOf, sectionShot, sectionUrl, templateOf, type LiveSection, type TemplateSlug } from "@/site/live";
import { BaseDraftMark } from "@/site/logo";
import { Menu } from "@/site/menu";
import { Note } from "@/site/plan-parts";
import { useOwnsCode, usePlan } from "@/site/plan";
import { openPro } from "@/site/pro-modal";
import { btn, btnSm } from "@/site/sheet";
import { withEdit, type TextEdit } from "@/site/text-edits";
import { toast } from "@/site/toast";
import { Canvas, CANVAS_WIDTH, DEVICE_LABEL, type Block, type CanvasDevice, type CanvasHandle, type PageText, type Spot, type Zoom } from "./canvas";
import { useCloud } from "./cloud";
import { CommentLayer, CommentsPanel, Cursors, Face, spotOf, useComments, usePresence, viewKey, viewOf, type Comment } from "./collab";
import { ExportDialog } from "./export";
import { ExportMenu } from "./export-menu";
import { BlockPanel, PagePanel, RoutePanel, SectionPanel } from "./inspector";
import { BlockLayers, InsertGrid, Layers, PagesPanel, StartFrom } from "./sidebar";
import { SiteExportDialog } from "./site-export";
import { HelpPanel, HintLine, Tour, useGuide, type TourStep } from "./guide";
import { blankPage, copyPage, idOf, initialState, instance, newProject, pageOf, pathFor, reducer, save, withPage, type Project, type SitePage, type View } from "./state";
import { Tool } from "./ui";
import { describeProject, HistoryPanel, LibraryDialog, ShareDialog, type LibraryTab } from "./workspace";
import { track } from "@/site/analytics";
import { themeCss, type Theme } from "@/site/theme";
import { ColorsGroup } from "./colors";
import { Preloader } from "./preloader";
import { PreviewView, type Viewport } from "./preview";

const NO_KEYS: string[] = [];
const ZOOMS: Array<{ value: Zoom; label: string; keys?: string }> = [
  { value: "fit", label: "Zoom to fit", keys: "⇧1" },
  { value: "all", label: "Fit all breakpoints" },
  { value: 0.25, label: "25%" },
  { value: 0.5, label: "50%" },
  { value: 0.75, label: "75%" },
  { value: 1, label: "100%", keys: "⇧0" },
];

const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName) || t.getAttribute("role") === "slider" || t.getAttribute("role") === "combobox");

/* ---------- motion ---------- */

/** One feel for everything that moves in Studio: quick, settled, no bounce. */
const SPRING = { type: "spring", stiffness: 520, damping: 42, mass: 0.8 } as const;
const PRESS = { scale: 0.93 };

/* ---------- floating chrome ---------- */

/** Figma's floating panels: white, rounded, lifted just off the canvas. */
const PANEL = "rounded-[16px] bg-surface shadow-[0_0_0_0.5px_rgb(var(--bd-ink)/0.12),0_1px_3px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.08)]";
const ICON_BTN = "grid size-8 shrink-0 place-items-center rounded-[11px] text-fg/80 transition-colors hover:bg-fg/[0.06] hover:text-fg disabled:pointer-events-none disabled:opacity-30";

/** A toolbar button that opens its panel above the toolbar. One open at a time. */
function ToolPop({ id, open, setOpen, label, button, children, width, tour }: { id: string; open: string | null; setOpen: (v: string | null) => void; label: string; button: ReactNode; children: ReactNode; width: number; tour?: string }) {
  const on = open === id;
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!on) return;
    const close = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(null);
    const esc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      setOpen(null);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [on, setOpen]);
  return (
    <div ref={root} className="relative" data-tour={tour}>
      <Tip label={label}>
        <motion.button whileTap={PRESS} type="button" aria-expanded={on} aria-haspopup="dialog" aria-label={label} onClick={() => setOpen(on ? null : id)} className={cn("flex h-8 min-w-8 shrink-0 items-center justify-center gap-1 rounded-[11px] px-2 text-fg/80 transition-colors hover:bg-fg/[0.06] hover:text-fg", on && "bg-fg/[0.08] text-fg")}>
          {button}
        </motion.button>
      </Tip>
      <AnimatePresence>
        {on && (
          <motion.div
            role="dialog"
            aria-label={label}
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98, transition: { duration: 0.14 } }}
            transition={SPRING}
            className={cn(PANEL, "absolute bottom-full left-1/2 mb-3 flex max-h-[min(640px,70dvh)] -translate-x-1/2 origin-bottom flex-col overflow-hidden")}
            style={{ width }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- the selection's toolbar ---------- */

const MORE: Array<{ kind: CopyKind | "react" | "save"; label: string; icon: typeof FigmaLogoIcon }> = [
  { kind: "save", label: "Save to Library", icon: BookmarkSimpleIcon },
  { kind: "paper", label: "Copy for Paper", icon: FileHtmlIcon },
  { kind: "svg", label: "Download SVG", icon: DownloadSimpleIcon },
  { kind: "react", label: "React code", icon: CodeIcon },
];

/*
 * Sits just above the selected section, outside it, so it never covers what you're looking at:
 * the name in selection purple, then swapping, arranging, and taking the section elsewhere.
 */
function SelectionBar({ section, index, count, pro, width, kin, onSwap, onMove, onDuplicate, onRemove, onInsert, onCopy, onSave }: { section: LiveSection; index: number; count: number; pro: boolean; width: number; kin: LiveSection[]; onSwap: (id: string) => void; onMove: (d: 1 | -1) => void; onDuplicate: () => void; onRemove: () => void; onInsert: () => void; onCopy: (k: CopyKind | "react") => void; onSave: () => void }) {
  const [swap, setSwap] = useState(false);
  const [more, setMore] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!swap && !more) return;
    const close = (e: PointerEvent) => {
      if (root.current?.contains(e.target as Node)) return;
      setSwap(false);
      setMore(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [swap, more]);
  const tight = width < 560;
  const tool = "grid size-[30px] place-items-center rounded-[10px] text-fg/75 transition-colors hover:bg-fg/[0.07] hover:text-fg disabled:opacity-30";
  // Copy carries a label, so it gets its own width rather than the icon buttons' square.
  const wide = "flex h-[30px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[10px] px-2 text-[12.5px] font-medium text-fg/75 transition-colors hover:bg-fg/[0.07] hover:text-fg";
  return (
    <>
      <span className="flex h-[26px] min-w-0 items-center gap-1.5 rounded-[9px] bg-select px-2 text-[12px] font-medium text-white shadow-[0_2px_8px_rgba(151,71,255,0.35)]">
        <SectionGlyph kind={section.kind} size={13} />
        <span className="truncate">{section.name}</span>
      </span>
      <div ref={root} role="toolbar" aria-label={`${section.name} tools`} className="relative flex h-[36px] shrink-0 items-center gap-0.5 rounded-[14px] bg-surface p-[3px] shadow-[0_6px_20px_-4px_rgb(var(--bd-shade)/0.18),0_0_0_1px_rgb(var(--bd-ink)/0.08)]">
        {kin.length > 1 && (
          <>
            <Tip label={`Swap for another ${section.kind === "faq" ? "FAQ" : "one of its kind"}`}>
              <button type="button" className={cn(tool, swap && "bg-fg/[0.08] text-fg")} onClick={() => setSwap((s) => !s)} aria-label="Swap section" aria-expanded={swap}>
                <SwapIcon size={15} />
              </button>
            </Tip>
            <span aria-hidden className="mx-0.5 h-4 w-px bg-line" />
          </>
        )}
        {!tight && (
          <>
            <Tip label="Insert below">
              <button type="button" className={tool} onClick={onInsert} aria-label="Insert below">
                <PlusIcon size={15} weight="bold" />
              </button>
            </Tip>
            <Tip label="Move up" keys="Alt ArrowUp">
              <button type="button" className={tool} onClick={() => onMove(-1)} disabled={index === 0} aria-label="Move up">
                <ArrowUpIcon size={15} />
              </button>
            </Tip>
            <Tip label="Move down" keys="Alt ArrowDown">
              <button type="button" className={tool} onClick={() => onMove(1)} disabled={index === count - 1} aria-label="Move down">
                <ArrowDownIcon size={15} />
              </button>
            </Tip>
            <Tip label="Duplicate" keys="Cmd D">
              <button type="button" className={tool} onClick={onDuplicate} aria-label="Duplicate">
                <CopyIcon size={15} />
              </button>
            </Tip>
            <Tip label="Delete" keys="Del">
              <button type="button" className={cn(tool, "hover:bg-[#d92d20]/10 hover:text-[#d92d20]")} onClick={onRemove} aria-label="Delete">
                <TrashIcon size={15} />
              </button>
            </Tip>
            <span aria-hidden className="mx-0.5 h-4 w-px bg-line" />
          </>
        )}
        {pro ? (
          <Tip label="Copy for Figma">
            <button type="button" className={wide} onClick={() => onCopy("figma")} aria-label="Copy for Figma">
              <FigmaLogoIcon size={14} /> {!tight && "Copy"}
            </button>
          </Tip>
        ) : (
          <Tip label="Copy for Figma is in Pro">
            <button type="button" onClick={() => openPro("figma")} className={wide} aria-label="Copy for Figma, a Pro feature">
              <FigmaLogoIcon size={14} /> {!tight && "Copy"}
              <span className="rounded-[6px] bg-fg/[0.07] px-1 py-px text-[10.5px] font-semibold text-muted">Pro</span>
            </button>
          </Tip>
        )}
        <Tip label="More">
          <button type="button" className={cn(tool, more && "bg-fg/[0.08] text-fg")} onClick={() => setMore((m) => !m)} aria-label="More actions" aria-haspopup="menu" aria-expanded={more}>
            <DotsThreeIcon size={16} weight="bold" />
          </button>
        </Tip>

        <AnimatePresence>
          {swap && (
            <motion.div role="dialog" aria-label="Swap section" initial={{ opacity: 0, y: -4, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.98 }} transition={{ duration: 0.16, ease: EASE_OUT }} className="absolute right-0 top-full z-20 mt-1.5 w-[360px] origin-top-right rounded-[16px] bg-surface p-3 shadow-[0_16px_48px_rgb(var(--bd-shade)/0.18),0_0_0_1px_rgb(var(--bd-ink)/0.06)]">
              <div className="grid grid-cols-2 gap-2">
                {kin.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSwap(false);
                      onSwap(s.id);
                    }}
                    className="group text-left"
                  >
                    <span className={cn("relative block aspect-[16/10] overflow-hidden rounded-[8px] bg-surface-2 transition-shadow", s.id === section.id ? "shadow-[0_0_0_2px_var(--bd-fg)]" : "shadow-[0_0_0_1px_rgb(var(--bd-ink)/0.1)] group-hover:shadow-[0_0_0_1px_rgb(var(--bd-ink)/0.3)]")}>
                      <Image src={sectionShot(s)} alt="" fill sizes="170px" className="object-cover" />
                      {!pro && !isFree(s) && (
                        <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-[5px] bg-fg/85 text-canvas">
                          <LockSimpleIcon size={9} weight="bold" />
                        </span>
                      )}
                    </span>
                    <span className="mt-1 block truncate px-0.5 text-[12px]">{s.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
          {more && (
            <motion.div role="menu" aria-label="More actions" initial={{ opacity: 0, y: -4, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.98 }} transition={{ duration: 0.16, ease: EASE_OUT }} className="absolute right-0 top-full z-20 mt-1.5 w-[220px] origin-top-right rounded-[16px] bg-surface p-1.5 shadow-[0_16px_48px_rgb(var(--bd-shade)/0.18),0_0_0_1px_rgb(var(--bd-ink)/0.06)]">
              {tight && (
                <>
                  {[
                    { label: "Insert below", icon: PlusIcon, run: onInsert },
                    { label: "Move up", icon: ArrowUpIcon, run: () => onMove(-1) },
                    { label: "Move down", icon: ArrowDownIcon, run: () => onMove(1) },
                    { label: "Duplicate", icon: CopyIcon, run: onDuplicate },
                    { label: "Delete", icon: TrashIcon, run: onRemove },
                  ].map((m) => (
                    <button
                      key={m.label}
                      role="menuitem"
                      type="button"
                      onClick={() => {
                        setMore(false);
                        m.run();
                      }}
                      className="flex h-9 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-left text-[13px] hover:bg-fg/[0.05]"
                    >
                      <m.icon size={15} className="text-muted" /> {m.label}
                    </button>
                  ))}
                  <div className="mx-1 my-1 h-px bg-line" />
                </>
              )}
              {MORE.map((m) => (
                <button
                  key={m.kind}
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    setMore(false);
                    if (m.kind === "save") onSave();
                    else onCopy(m.kind);
                  }}
                  className="flex h-9 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-left text-[13px] hover:bg-fg/[0.05]"
                >
                  <m.icon size={15} className="text-muted" />
                  <span className="flex-1">{m.label}</span>
                  {!pro && m.kind !== "save" && <span className="rounded-[6px] bg-fg/[0.07] px-1.5 py-px text-[11px] font-semibold text-muted">Pro</span>}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

/** Where the project is kept, in a glance: this browser, your account, or someone else's to look at. */
function SaveState({ status, access, owner }: { status: string; access: string | null; owner: string | null }) {
  if (access === "view")
    return (
      <Tip label={`${owner ? `${owner}'s project. ` : ""}You can look and comment; your changes aren't saved to it.`} side="bottom">
        <span className="flex h-6 shrink-0 items-center gap-1 rounded-[6px] bg-fg/[0.06] px-1.5 text-[11.5px] font-semibold text-muted">
          <EyeIcon size={12} weight="bold" /> View only
        </span>
      </Tip>
    );
  const [Icon, label] =
    status === "local"
      ? [CloudSlashIcon, "Saved in this browser only. Sign in to keep it in your account."]
      : status === "saving"
        ? [CloudArrowUpIcon, "Saving to your account"]
        : status === "saved"
          ? [CloudCheckIcon, owner ? `Saved. ${owner}'s project, shared with you.` : "Saved to your account"]
          : [CloudArrowUpIcon, "Connecting to your account"];
  return (
    <Tip label={label} side="bottom">
      <button type="button" aria-label={label} onClick={() => status === "local" && openAuth("sign-up", { reason: "save" })} className={cn("grid size-6 shrink-0 place-items-center rounded-[6px] transition-colors", status === "local" ? "text-muted hover:bg-fg/[0.06] hover:text-fg" : "cursor-default text-subtle")}>
        <Icon size={15} weight={status === "saving" ? "regular" : "duotone"} className={cn(status === "saving" && "animate-pulse")} />
      </button>
    </Tip>
  );
}

/* ---------- the app ---------- */

const DEVICES: CanvasDevice[] = ["desktop", "tablet", "phone"];
type LeftTab = "pages" | "layers" | "sections";

export default function Studio() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const { project, view, selected } = state;
  const page = pageOf(project, view);
  const t = templateOf(project.template)!;
  const route = view.kind === "route" ? (t.pages.find((p) => p.path === view.path) ?? { label: view.path, path: view.path }) : null;
  const canvas = useRef<CanvasHandle>(null);
  const [devices, setDevices] = useState<CanvasDevice[]>(DEVICES);
  const [zoomMode, setZoomMode] = useState<Zoom>("fit");
  const [zoom, setZoom] = useState(1);
  const [hand, setHand] = useState(false);
  const [tab, setTab] = useState<LeftTab>("layers");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [texts, setTexts] = useState<PageText[]>([]);
  const [pop, setPop] = useState<string | null>(null);
  const [panels, setPanels] = useState({ left: true, right: true });
  // Back from connecting GitHub, the export dialog opens where you left it.
  const [exporting, setExporting] = useState<"react" | "json" | "github" | null>(() => (new URLSearchParams(window.location.search).get("export") === "github" ? "github" : null));
  const [site, setSite] = useState(false);
  const [guide, setGuide] = useGuide();
  const [touring, setTouring] = useState(false);
  const [plan, { preview }] = usePlan();
  const pro = plan === "pro";
  // Code (export, download, GitHub) is Pro's, or comes with buying this template.
  const code = useOwnsCode(project.template);
  const { user, loading } = useAuth();
  // Arriving from a template's page starts a new draft with it.
  const [fresh] = useState(() => new URLSearchParams(window.location.search).has("template"));
  const cloud = useCloud({ user, loading, project, dispatch, fresh });
  const here = viewKey(view);
  const presence = usePresence(cloud.id, here, selected);
  const comments = useComments(cloud.id);
  const keepSection = useMutation(api.saved.add);
  // Comment mode: clicks on the page place a comment; the inspector lists every thread.
  const [commenting, setCommenting] = useState(false);
  const [thread, setThread] = useState<Id<"comments"> | null>(null);
  const [draft, setDraft] = useState<Spot | null>(null);
  const [showResolved, setShowResolved] = useState(false);
  // Version history takes over the inspector, as in Figma.
  const [inspect, setInspect] = useState<"inspect" | "history">("inspect");
  const [sharing, setSharing] = useState(false);
  // The site's account menu links here as /studio#library.
  const [library, setLibrary] = useState<LibraryTab | null>(() => (window.location.hash === "#library" ? "drafts" : null));
  // A link that opened a template here has done its job; the address goes back to plain /studio.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("github") === "error") toast("GitHub didn't connect", { tone: "error", detail: q.get("why") ?? undefined });
    if (q.get("github") === "connected") toast("GitHub is connected");
    if (q.has("template") || q.has("export") || q.has("github")) {
      for (const k of ["template", "export", "github", "why"]) q.delete(k);
      window.history.replaceState(null, "", `/studio${q.size ? `?${q}` : ""}`);
    }
  }, []);
  // A two-finger swipe sideways pans the canvas; it never takes the browser back a page. The page
  // itself never overscrolls (that's what starts the gesture), and a sideways wheel anywhere in
  // Studio is Studio's, unless what's under the pointer scrolls sideways itself.
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const els = [document.documentElement, document.body];
    const was = els.map((el) => el.style.overscrollBehavior);
    for (const el of els) el.style.overscrollBehavior = "none";
    const el = root.current;
    const wheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      for (let n = e.target as HTMLElement | null; n && n !== el; n = n.parentElement) {
        const ox = getComputedStyle(n).overflowX;
        if ((ox === "auto" || ox === "scroll") && n.scrollWidth > n.clientWidth) return;
      }
      e.preventDefault();
    };
    el?.addEventListener("wheel", wheel, { passive: false });
    return () => {
      els.forEach((x, i) => (x.style.overscrollBehavior = was[i]));
      el?.removeEventListener("wheel", wheel);
    };
  }, []);
  // Open once the first page is drawn (or after a while, whatever happens): until then, the preloader.
  const [booted, setBooted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setBooted(true), 15000);
    return () => clearTimeout(t);
  }, []);
  const [drawnOnce, setDrawnOnce] = useState(false);
  useEffect(() => {
    if (!drawnOnce || booted) return;
    const t = setTimeout(() => setBooted(true), 350);
    return () => clearTimeout(t);
  }, [drawnOnce, booted]);
  // The first time here, a short tour, once Studio is open; it never comes back on its own.
  useEffect(() => {
    if (guide.toured || !booted) return;
    const id = setTimeout(() => setTouring(true), 900);
    return () => clearTimeout(id);
  }, [guide.toured, booted]);
  const endTour = () => {
    setTouring(false);
    setGuide({ toured: true });
  };
  useEffect(() => {
    if (window.location.hash !== "#library") return;
    window.history.replaceState(null, "", "/studio");
    void signedIn().then((yes) => !yes && openAuth("sign-in", { reason: "library", then: () => setLibrary("drafts") }));
  }, []);

  useEffect(() => {
    const id = setTimeout(() => save(project), 300);
    return () => clearTimeout(id);
  }, [project]);

  const change = useCallback((p: Project) => dispatch({ type: "change", project: p }), []);
  const select = useCallback((key: string | null) => dispatch({ type: "select", key }), []);
  const go = useCallback((v: View) => dispatch({ type: "view", view: v }), []);
  /** Changes the page on show, when it's one made of sections. */
  const setPage = (p: SitePage) => change(withPage(project, p));
  const edit = useCallback((e: TextEdit) => change({ ...project, edits: withEdit(project.edits, e) }), [change, project]);
  // A color dragged across the picker is one change, not one per frame: changes within a moment
  // of the last one amend it.
  const colorAt = useRef(0);
  const recolor = (theme: Theme | undefined) => {
    const next = { ...project, theme };
    if (!theme) delete next.theme;
    const now = Date.now();
    dispatch({ type: now - colorAt.current < 800 && state.past.length ? "amend" : "change", project: next });
    colorAt.current = now;
  };

  const keysOf = page?.keys ?? NO_KEYS;
  const index = selected && page ? page.keys.indexOf(selected) : -1;
  const section = selected && page ? (sectionOf(project.template, idOf(selected)) ?? null) : null;
  const block = view.kind === "route" && selected ? blocks.find((b) => b.key === selected) : undefined;

  // The words in what's selected, for the inspector to edit.
  const scope = view.kind === "route" ? `route:${view.path}` : selected;
  useEffect(() => {
    const read = () => setTexts(scope && selected ? (canvas.current?.texts(scope, view.kind === "route" ? selected : undefined) ?? []) : []);
    // Once now, and again once the frame has caught up with an edit or a fresh load.
    const now = setTimeout(read, 0);
    const later = setTimeout(read, 600);
    return () => {
      clearTimeout(now);
      clearTimeout(later);
    };
  }, [scope, selected, view.kind, project.edits]);

  const insert = (id: string) => {
    const s = sectionOf(project.template, id);
    if (!s || !page) return;
    const key = instance(id);
    // Below the selection; with nothing selected, at the end of the page but above its footer.
    const last = page.keys.at(-1);
    const footer = last && sectionOf(project.template, idOf(last))?.kind === "footer";
    const at = index >= 0 ? index + 1 : footer ? page.keys.length - 1 : page.keys.length;
    const keys = [...page.keys];
    keys.splice(at, 0, key);
    setPage({ ...page, keys });
    select(key);
    setPop(null);
    toast(`Added ${s.name}`, { detail: isFree(s) || pro ? undefined : "It previews free; exporting it needs Pro or the template." });
  };
  const remove = (key: string) => {
    if (!page) return;
    const i = page.keys.indexOf(key);
    const keys = page.keys.filter((k) => k !== key);
    setPage({ ...page, keys });
    select(keys[Math.max(0, i - 1)] ?? null);
  };
  const duplicate = (key: string) => {
    if (!page) return;
    const i = page.keys.indexOf(key);
    const copy = instance(idOf(key));
    const keys = [...page.keys];
    keys.splice(i + 1, 0, copy);
    // The copy says what the original says, edits and all.
    const edits = project.edits.filter((e) => e.scope === key).reduce((all, e) => withEdit(all, { ...e, scope: copy }), project.edits);
    change({ ...withPage(project, { ...page, keys }), edits });
    select(copy);
  };
  const move = (key: string, dir: 1 | -1) => {
    if (!page) return;
    const i = page.keys.indexOf(key);
    const j = i + dir;
    if (j < 0 || j >= page.keys.length) return;
    const keys = [...page.keys];
    [keys[i], keys[j]] = [keys[j], keys[i]];
    setPage({ ...page, keys });
  };
  const swap = (key: string, id: string) => {
    if (!page || idOf(key) === id) return;
    const next = instance(id);
    setPage({ ...page, keys: page.keys.map((k) => (k === key ? next : k)) });
    select(next);
    toast(`Swapped in ${sectionOf(project.template, id)?.name}`, { detail: "{Cmd Z} brings the last one back." });
  };
  const start = (slug: TemplateSlug) => {
    setPop(null);
    // Signed in, a template starts a new draft and the last one stays in your Library.
    if (user)
      return void cloud.startNew(newProject(slug)).then(
        () => toast(`Started a new draft from ${templateOf(slug)?.name}`, { detail: "Your last one is in your Library." }),
        () => toast("Couldn't start a new draft", { tone: "error" }),
      );
    dispatch({ type: "replace", project: newProject(slug) });
    toast(`Started from ${templateOf(slug)?.name}`, { detail: "Changed your mind? {Cmd Z} brings your last project back." });
  };
  const addPage = (kind: "blank" | "copy") => {
    if (kind === "copy" && page) {
      const next = copyPage(project, page);
      change(next);
      go({ kind: "page", id: next.pages[next.pages.indexOf(next.pages.find((p) => p.id === page.id)!) + 1].id });
      return;
    }
    const name = `Page ${project.pages.length + 1}`;
    const p = blankPage(project.template, name, pathFor(project, name));
    change({ ...project, pages: [...project.pages, p] });
    go({ kind: "page", id: p.id });
    setTab("sections");
    toast(`Added ${name}`, { detail: "It starts with the nav and footer. Add sections from Sections." });
  };
  const renamePage = (id: string, name: string) => {
    const p = project.pages.find((x) => x.id === id);
    if (p) change(withPage(project, { ...p, name, path: p.path === "/" ? "/" : pathFor(project, name, id) }));
  };
  const removePage = (id: string) => {
    const p = project.pages.find((x) => x.id === id);
    if (!p || p.path === "/") return;
    change({ ...project, pages: project.pages.filter((x) => x.id !== id), edits: project.edits.filter((e) => !p.keys.includes(e.scope)) });
    toast(`Deleted ${p.name}`, { detail: "{Cmd Z} brings it back." });
  };
  const openHistory = () => {
    setPanels((p) => ({ ...p, right: true }));
    setInspect("history");
  };
  const restore = (p: Project) => {
    dispatch({ type: "change", project: structuredClone(p) });
    toast("Restored that version", { detail: "{Cmd Z} takes you back." });
  };
  const restoreSaved = (id: Id<"versions">) =>
    cloud.restoreVersion(id).then(restore, (e) => toast("Couldn't restore that version", { tone: "error", detail: e instanceof Error ? e.message : undefined }));
  const share = () => (user ? setSharing(true) : openAuth("sign-up", { reason: "share", then: () => setSharing(true) }));
  const openDraft = (id: Id<"projects">) => {
    setLibrary(null);
    setThread(null);
    setDraft(null);
    cloud.open(id);
  };
  const saveSection = (key: string) => {
    const s = sectionOf(project.template, idOf(key));
    if (!s) return;
    if (!user) return openAuth("sign-up", { reason: "library" });
    keepSection({ template: project.template, sectionId: s.id }).then(
      () => toast(`Saved ${s.name} to your Library`, { detail: `It's there for any ${t.name} page.` }),
      () => toast("Couldn't save it", { tone: "error" }),
    );
  };

  /* ---------- comments ---------- */

  const comment = (on: boolean) => {
    if (on && !user) return openAuth("sign-up", { reason: "comment", then: () => setCommenting(true) });
    setCommenting(on);
    setThread(null);
    setDraft(null);
    if (on) {
      setHand(false);
      select(null);
      setPanels((p) => ({ ...p, right: true }));
    }
  };
  const place = (s: Spot | null) => {
    // A click away from an open thread closes it; the next click places a comment.
    if (thread || draft) {
      setThread(null);
      setDraft(null);
      return;
    }
    if (s && cloud.id) setDraft(s);
  };
  const post = async (body: string) => {
    if (!draft || !cloud.id) return null;
    const id = await comments.create({ projectId: cloud.id, view: here, device: draft.device, anchor: draft.anchor ?? undefined, x: draft.x, y: draft.y, body });
    if (id) {
      setDraft(null);
      setThread(id);
      track("comment_posted");
    }
    return id;
  };
  const reply = (root: Comment, body: string) => (cloud.id ? comments.create({ projectId: cloud.id, view: root.view, device: root.device ?? undefined, anchor: root.anchor ?? undefined, x: root.x, y: root.y, body, parentId: root.id }) : Promise.resolve(null));
  const removeComment = (c: Comment) => {
    if (!c.parentId) setThread(null);
    void comments.remove(c.id);
  };
  /** Goes to a thread: its page, its breakpoint, and the pin in view. */
  const goToComment = (c: Comment) => {
    const v = viewOf(c.view);
    if (viewKey(v) !== here && (v.kind === "route" || project.pages.some((p) => p.id === v.id))) go(v);
    const d = (c.device ?? "desktop") as CanvasDevice;
    if (!devices.includes(d)) setDevices((now) => DEVICES.filter((x) => now.includes(x) || x === d));
    setDraft(null);
    setThread(c.id);
    setTimeout(() => canvas.current?.revealSpot(spotOf(c)), viewKey(v) === here ? 0 : 900);
  };
  const labelOf = (key: string) => {
    const v = viewOf(key);
    return v.kind === "page" ? (project.pages.find((p) => p.id === v.id)?.name ?? "A deleted page") : (t.pages.find((p) => p.path === v.path)?.label ?? v.path);
  };
  const openThreads = comments.all.filter((c) => !c.parentId && !c.resolved).length;
  const me = user ? displayName(user) : "";
  const others = presence.people;
  const peers = others.filter((p) => p.view === here && p.selected).map((p) => ({ key: p.selected!, color: p.color, name: p.name }));
  const proUsed = !pro && project.pages.some((p) => p.keys.some((k) => !isFree(sectionOf(project.template, idOf(k)) ?? { template: project.template })));
  const names = Object.fromEntries(t.sections.map((s) => [s.id, `${t.name} / ${s.name}`]));
  // The project's colors as CSS, laid over the template's in the canvas and in every copy.
  const colors = themeCss(project.template, project.theme);
  // Copies draw their own frames of the template at each width (see live-export), so they never read the canvas.
  const sectionTarget = (key: string): CopyTarget => {
    const s = sectionOf(project.template, idOf(key))!;
    return { name: `${t.name} ${s.name}`, get: () => null, live: { url: sectionUrl(s), names, edits: project.edits.filter((e) => e.scope === key), remap: { [key]: s.id }, theme: colors } };
  };
  const pageTarget: CopyTarget = page
    ? { name: `${project.name} / ${page.name}`, get: () => null, live: { url: composeUrl(project.template, page.keys), names, edits: project.edits, theme: colors } }
    : { name: `${project.name} / ${route?.label}`, get: () => null, live: { url: liveUrl(project.template, view.kind === "route" ? view.path : "/"), names, edits: project.edits, theme: colors } };
  const togglePanels = () => setPanels((p) => (p.left || p.right ? { left: false, right: false } : { left: true, right: true }));
  // Preview mode: the page as it ships, over Studio, at a viewport's width. Esc comes back.
  const [previewing, setPreviewing] = useState<{ view: View; viewport: Viewport } | null>(null);
  const openPreview = (device: CanvasDevice = devices[0]) => setPreviewing({ view, viewport: device });

  const zoomRef = useRef(zoom);
  const viewRef = useRef(view);
  const devicesRef = useRef(devices);
  useEffect(() => {
    viewRef.current = view;
    devicesRef.current = devices;
  });
  // Mid pinch the canvas reports its zoom straight into the readout, so Studio doesn't render every frame.
  const zoomText = useRef<HTMLSpanElement>(null);
  const liveZoom = useCallback((z: number) => {
    const t = zoomText.current?.firstChild;
    if (t) t.nodeValue = `${Math.round(z * 100)}%`;
  }, []);
  useEffect(() => {
    zoomRef.current = zoom;
  });
  // Shortcuts, heard in Studio and inside the canvas alike. Ignored while typing.
  const keys = useRef({ selected, remove, duplicate, move, togglePanels, comment, commenting, thread, draft, previewing });
  useEffect(() => {
    keys.current = { selected, remove, duplicate, move, togglePanels, comment, commenting, thread, draft, previewing };
  });
  const onKey = useCallback(
    (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      // Preview mode has its own keys.
      if (keys.current.previewing) return;
      if (mod && e.key.toLowerCase() === "z" && !isTyping(e.target)) {
        e.preventDefault();
        dispatch({ type: e.shiftKey ? "redo" : "undo" });
        return;
      }
      if (mod && e.key === "\\") {
        e.preventDefault();
        keys.current.togglePanels();
        return;
      }
      // A menu or dropdown that handled the key (Escape closing it) keeps the selection.
      if (isTyping(e.target) || e.defaultPrevented) return;
      if (mod && (e.key === "=" || e.key === "+" || e.key === "-")) {
        e.preventDefault();
        setZoomMode((z) => {
          const now = typeof z === "number" ? z : zoomRef.current;
          return Math.min(2, Math.max(0.1, Math.round((e.key === "-" ? now / 1.25 : now * 1.25) * 100) / 100));
        });
        return;
      }
      if (e.key === "?") return setPop((p) => (p === "help" ? null : "help"));
      if (e.shiftKey && e.key.toLowerCase() === "p") return setPreviewing({ view: viewRef.current, viewport: devicesRef.current[0] });
      if (e.shiftKey && e.key === "!") return setZoomMode("fit");
      if (e.shiftKey && e.key === ")") return setZoomMode(1);
      if (!mod && e.key.toLowerCase() === "h") {
        keys.current.comment(false);
        return setHand(true);
      }
      if (!mod && e.key.toLowerCase() === "v") {
        keys.current.comment(false);
        return setHand(false);
      }
      if (!mod && !e.altKey && e.key.toLowerCase() === "c") return keys.current.comment(!keys.current.commenting);
      if (e.key === "Escape" && keys.current.commenting) {
        if (keys.current.thread || keys.current.draft) {
          setThread(null);
          setDraft(null);
        } else keys.current.comment(false);
        return;
      }
      const { selected: k, remove: rm, duplicate: dup, move: mv } = keys.current;
      if (!k) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        rm(k);
      } else if (mod && e.key.toLowerCase() === "d") {
        e.preventDefault();
        dup(k);
      } else if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
        e.preventDefault();
        mv(k, e.key === "ArrowUp" ? -1 : 1);
      } else if (e.key === "Escape") select(null);
    },
    [select],
  );
  useEffect(() => {
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onKey]);
  const onBlocks = useCallback((b: Block[]) => setBlocks((now) => (JSON.stringify(now) === JSON.stringify(b) ? now : b)), []);

  const exportMenu = <ExportMenu pro={pro} code={code} page={pageTarget} section={selected && page ? sectionTarget(selected) : null} onCode={setExporting} onSite={() => setSite(true)} pages={project.pages.length} />;
  // Who's signed in, with everything an account adds; or a way to sign in.
  const account = user ? (
    <Menu
      label="Account"
      align="left"
      buttonClassName="grid size-8 shrink-0 place-items-center rounded-full transition-shadow hover:shadow-[0_0_0_3px_rgb(var(--bd-ink)/0.08)] aria-expanded:shadow-[0_0_0_3px_rgb(var(--bd-ink)/0.12)]"
      button={<Avatar name={displayName(user)} size={26} />}
      header={<AccountHeader user={user} plan={plan} />}
      items={[
        { label: "Profile", icon: UserCircleIcon, onSelect: openProfile },
        { label: "Your drafts", icon: FilesIcon, onSelect: () => setLibrary("drafts") },
        { label: "Library", icon: BooksIcon, onSelect: () => setLibrary("saved") },
        { label: "Version history", icon: ClockCounterClockwiseIcon, onSelect: openHistory },
        { label: "Team", icon: UsersThreeIcon, href: "/team" },
        pro ? { label: "Pro is on", icon: DiamondIcon, onSelect: () => openPro("plan") } : { label: "Get Pro", icon: DiamondIcon, hint: "$149 once", onSelect: () => openPro("plan") },
        { label: "Back to basedraft.site", icon: ArrowUpRightIcon, href: "/" },
        "divider",
        { label: "Sign out", icon: SignOutIcon, onSelect: signOut },
      ]}
    />
  ) : (
    <motion.button whileTap={PRESS} type="button" onClick={() => openAuth("sign-in")} className="h-8 shrink-0 rounded-[10px] px-2.5 text-[13px] font-medium text-fg/80 transition-colors hover:bg-fg/[0.06] hover:text-fg">
      Sign in
    </motion.button>
  );
  const zoomLabel = `${Math.round(zoom * 100)}%`;
  // What you can do right now, in a line above the toolbar.
  const hint = commenting
    ? "Click anywhere on the page to leave a comment. {Esc} to stop."
    : hand
    ? "Drag to move around. Pinch or {Cmd} scroll to zoom."
    : !page
      ? selected
        ? "Double-click any text to change it. This page's sections are the template's own."
        : "Click a section to select it. Double-click any text to change it."
      : page.keys.length <= 2
        ? "A blank page. Add sections with {+} below, or from Sections."
        : selected
          ? "Double-click text to edit it. {Alt Up} {Alt Down} moves the section, {Cmd D} duplicates it, {Delete} removes it."
          : "Click a section to select it. Double-click any text to edit it.";
  const tourSteps: TourStep[] = [
    { at: "panel", side: "right", title: "Pages and layers", body: "Every section on the page is a layer. Click one to select it, or drag its handle to reorder. Your pages and the template's own are under Pages." },
    { at: "canvas", side: "center", title: "Edit right on the page", body: "Double-click any text to change it. It changes at every breakpoint at once, and in everything you export." },
    ...(page ? [{ at: "insert", side: "top" as const, title: "Add sections", body: "This template's sections, ready to drop in below whatever you have selected." }] : []),
    { at: "export", side: "bottom-end", title: "Take it anywhere", body: "Copy a section, a page or the whole site into Figma. Download the code, or send it to GitHub." },
  ];
  const insertTitle = section ? `Insert below ${section.name}` : page ? `Insert into ${page.name}` : "Sections";
  const tabs: Array<{ id: LeftTab; label: string }> = [
    { id: "pages", label: "Pages" },
    { id: "layers", label: "Layers" },
    { id: "sections", label: "Sections" },
  ];
  const viewName = page ? page.name : (route?.label ?? "");

  return (
    <>
      <div className="grid h-dvh place-items-center bg-canvas p-8 text-center lg:hidden">
        <div className="max-w-[360px]">
          {/* SVGs are blocks, so text-center alone leaves the mark on the left. */}
          <span className="flex justify-center">
            <BaseDraftMark size={32} />
          </span>
          <h1 className="mt-5 text-title">Studio needs a bigger screen</h1>
          <p className="mt-2 text-body text-muted">Your pages, the canvas and its settings sit side by side. Open Studio on a laptop or desktop.</p>
          <Link href="/components" className={cn(btn.ink, "mt-6")}>
            Browse components
          </Link>
        </div>
      </div>

      <div ref={root} className="relative hidden h-dvh overflow-hidden overscroll-none bg-well text-fg lg:block">
        {/* Its own layer, so nothing on the canvas (the selection toolbar included) rises over Studio's panels and menus. */}
        <main id="main" data-tour="canvas" className="absolute inset-0 isolate">
          <Canvas
            key={`${project.template}|${view.kind === "page" ? view.id : view.path}`}
            ref={canvas}
            template={project.template}
            view={view}
            keys={keysOf}
            devices={devices}
            edits={project.edits}
            theme={colors}
            selected={selected}
            zoom={zoomMode}
            hand={hand}
            insets={{ left: panels.left ? 284 : 32, right: panels.right ? 336 : 32 }}
            onSelect={select}
            onZoom={setZoom}
            onZoomTo={setZoomMode}
            onLiveZoom={liveZoom}
            onEdit={edit}
            onBlocks={onBlocks}
            onKey={onKey}
            commenting={commenting}
            onPointer={cloud.id ? presence.onPointer : undefined}
            onPlace={place}
            peers={peers}
            onReady={(d) => d === devices[0] && setDrawnOnce(true)}
            onPreview={openPreview}
            overlay={(at) => (
              <>
                {commenting && user && (
                  <CommentLayer
                    comments={comments.all}
                    view={here}
                    place={at}
                    open={thread}
                    draft={draft}
                    me={user.id}
                    myName={me}
                    myColor="#141414"
                    isOwner={cloud.access === "owner"}
                    showResolved={showResolved}
                    onOpen={(id) => {
                      setDraft(null);
                      setThread(id);
                    }}
                    onPost={post}
                    onReply={reply}
                    onResolve={(c) => {
                      void comments.resolve(c.id, !c.resolved);
                      if (!c.resolved) setThread(null);
                    }}
                    onRemove={removeComment}
                    onCancel={() => {
                      setThread(null);
                      setDraft(null);
                    }}
                  />
                )}
                <Cursors people={others} view={here} place={at} />
              </>
            )}
            bar={(key, width) => {
              if (!page) {
                const b = blocks.find((x) => x.key === key);
                return b ? <span className="flex h-[26px] min-w-0 items-center gap-1.5 rounded-[9px] bg-select px-2 text-[12px] font-medium text-white shadow-[0_2px_8px_rgba(151,71,255,0.35)]"><span className="truncate">{b.name}</span></span> : null;
              }
              const s = sectionOf(project.template, idOf(key));
              if (!s) return null;
              return (
                <SelectionBar
                  section={s}
                  index={page.keys.indexOf(key)}
                  count={page.keys.length}
                  pro={pro}
                  width={width}
                  kin={t.sections.filter((x) => x.kind === s.kind)}
                  onSwap={(id) => swap(key, id)}
                  onMove={(d) => move(key, d)}
                  onDuplicate={() => duplicate(key)}
                  onRemove={() => remove(key)}
                  onInsert={() => setPop("insert")}
                  onCopy={(kind) => (kind === "react" ? setExporting("react") : pro ? void copyToDesign(kind, sectionTarget(key)) : openPro(kind))}
                  onSave={() => saveSection(key)}
                />
              );
            }}
          />
        </main>

        {/* Left: the project, then its pages, layers and sections, as in Framer. */}
        <section data-tour="panel" aria-label="Project" className={cn(PANEL, "absolute left-3 top-3 z-30 flex w-[260px] flex-col")} style={{ maxHeight: "calc(100% - 24px)" }}>
          <div className="flex h-12 shrink-0 items-center gap-1 pl-2 pr-1.5">
            <Link href="/" aria-label="basedraft home" title="Back to basedraft" className="grid size-8 shrink-0 place-items-center rounded-[11px] hover:bg-fg/[0.06]">
              <BaseDraftMark size={20} />
            </Link>
            <input
              aria-label="Project name"
              value={project.name}
              onChange={(e) => change({ ...project, name: e.target.value })}
              className="h-8 min-w-0 flex-1 rounded-[8px] bg-transparent px-1.5 text-[13px] font-semibold outline-none transition-colors hover:bg-fg/[0.04] focus:bg-fg/[0.05] focus:ring-2 focus:ring-fg/15"
            />
            <SaveState status={cloud.status} access={cloud.access} owner={cloud.owner} />
            <Tip label={pro ? "Pro is on" : "See what Pro adds"} side="bottom">
              <button type="button" onClick={() => openPro("plan")} className={cn("shrink-0 rounded-[7px] px-1.5 py-0.5 text-[12px] font-medium transition-colors", pro ? "bg-fg/[0.07] text-fg" : "text-muted hover:bg-fg/[0.05] hover:text-fg")}>
                {preview ? "Pro preview" : pro ? "Pro" : "Free"}
              </button>
            </Tip>
            <Tip label={panels.left ? "Hide panel" : "Show panel"} side="bottom">
              <button type="button" onClick={() => setPanels((p) => ({ ...p, left: !p.left }))} aria-label={panels.left ? "Hide panel" : "Show panel"} aria-expanded={panels.left} className={ICON_BTN}>
                <SidebarSimpleIcon size={16} />
              </button>
            </Tip>
          </div>
          <AnimatePresence initial={false}>
            {panels.left && (
              <motion.div key="left" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={SPRING} className="flex min-h-0 flex-col overflow-hidden">
                <div role="tablist" aria-label="Panel" className="flex shrink-0 gap-0.5 border-t border-line px-1.5 py-1.5">
                  {tabs.map((x) => (
                    <button key={x.id} role="tab" aria-selected={tab === x.id} type="button" onClick={() => setTab(x.id)} className={cn("h-7 rounded-[8px] px-2.5 text-[13px] font-medium transition-colors", tab === x.id ? "bg-fg/[0.07] text-fg" : "text-muted hover:text-fg")}>
                      {x.label}
                    </button>
                  ))}
                </div>
                {tab === "pages" && <PagesPanel project={project} view={view} onView={go} onAdd={addPage} onRename={renamePage} onDuplicate={(id) => change(copyPage(project, project.pages.find((p) => p.id === id)!))} onRemove={removePage} />}
                {tab === "layers" && (
                  <>
                    <div className="flex h-9 shrink-0 items-center gap-2 border-t border-line pl-3.5 pr-1.5">
                      {page ? <HouseIcon size={13} weight={page.path === "/" ? "fill" : "regular"} className="shrink-0 text-muted" /> : <FileIcon size={13} className="shrink-0 text-muted" />}
                      <h2 className="flex-1 truncate text-[13px] font-semibold">
                        {viewName} <span className="ml-1 font-normal tabular-nums text-subtle">{page ? page.keys.length : blocks.length}</span>
                      </h2>
                      {page && (
                        <Tool label="Add a section" onClick={() => setTab("sections")}>
                          <PlusIcon size={15} weight="bold" />
                        </Tool>
                      )}
                    </div>
                    {page ? <Layers template={project.template} keys={page.keys} selected={selected} onSelect={select} onRemove={remove} onDuplicate={duplicate} onReorder={(keys) => setPage({ ...page, keys })} /> : <BlockLayers blocks={blocks} selected={selected} onSelect={select} />}
                  </>
                )}
                {tab === "sections" && (
                  <div className="min-h-0 flex-1 overflow-y-auto border-t border-line p-3">
                    {page ? (
                      <>
                        <p className="mb-3 text-[12px] leading-snug text-muted">{section ? `Click one to add it below ${section.name}.` : `Click one to add it to ${page.name}.`}</p>
                        <InsertGrid template={project.template} pro={pro} onInsert={insert} cols={2} />
                      </>
                    ) : (
                      <Note icon={FileIcon} className="text-[12px] text-muted">
                        {t.name}&apos;s own pages keep their own sections. Add sections to one of your pages, or make a new one in Pages.
                      </Note>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Right: the inspector. Collapsed, it keeps its full width and folds down to its header, like the left panel. */}
        <aside aria-label="Inspector" className={cn(PANEL, "absolute right-3 top-3 z-30 flex w-[312px] flex-col")}>
          <div className="flex h-12 shrink-0 items-center gap-1 pl-1.5 pr-2">
            <Tip label={panels.right ? "Hide inspector" : "Show inspector"} side="bottom">
              <motion.button whileTap={PRESS} type="button" onClick={() => setPanels((p) => ({ ...p, right: !p.right }))} aria-label={panels.right ? "Hide inspector" : "Show inspector"} aria-expanded={panels.right} className={cn(ICON_BTN, "-scale-x-100")}>
                <SidebarSimpleIcon size={16} />
              </motion.button>
            </Tip>
            <span className="flex-1" />
            <ColorModeSwitch className="mr-1" />
            <div data-tour="export">{exportMenu}</div>
          </div>
          <AnimatePresence initial={false}>
            {panels.right && (
              <motion.div key="inspector-body" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={SPRING} className="overflow-hidden rounded-b-[16px]">
                {/* The open panel runs to the bottom of the window: header and margins aside. */}
                <div className="flex flex-col" style={{ height: "calc(100dvh - 72px)" }}>
                  {commenting ? (
                    <CommentsPanel comments={comments.all} loaded={comments.loaded} labelOf={labelOf} open={thread} showResolved={showResolved} onShowResolved={setShowResolved} onGo={goToComment} onClose={() => comment(false)} signedIn={Boolean(user)} />
                  ) : inspect === "history" && user ? (
                    <HistoryPanel past={state.past} current={project} describe={describeProject} user={user} projectId={cloud.id} canSave={cloud.canEdit} onRestore={restore} onRestoreSaved={(id) => void restoreSaved(id)} onClose={() => setInspect("inspect")} />
                  ) : (
                    <>
                      {/* No tabs: a selection shows itself, nothing selected shows the page. */}
                      <div className="flex h-10 shrink-0 items-center gap-1.5 border-t border-line pl-4 pr-2 text-[13px]">
                        {selected && (section || block) ? (
                          <>
                            <Tip label="Page" keys="Esc" side="bottom">
                              <button type="button" onClick={() => select(null)} className="truncate text-muted transition-colors hover:text-fg">
                                {viewName}
                              </button>
                            </Tip>
                            <CaretRightIcon size={10} weight="bold" className="shrink-0 text-subtle" />
                            {section && <SectionGlyph kind={section.kind} size={14} className="shrink-0 text-muted" />}
                            <span className="truncate font-semibold">{section?.name ?? block?.name}</span>
                            <span className="flex-1" />
                            <Tool label="Deselect" keys="Esc" onClick={() => select(null)}>
                              <XIcon size={13} weight="bold" />
                            </Tool>
                          </>
                        ) : (
                          <>
                            <span className="truncate font-semibold">{viewName}</span>
                            <span className="truncate text-subtle">· {page ? `${page.path}` : t.name}</span>
                          </>
                        )}
                      </div>
                      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden border-t border-line">
                        <AnimatePresence mode="wait" initial={false}>
                          <motion.div key={`${view.kind === "page" ? view.id : view.path}|${selected ?? "page"}`} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.14, ease: EASE_OUT }}>
                            {section && selected ? (
                              <SectionPanel section={section} pro={pro} onSwap={(id) => swap(selected, id)} texts={texts} onEdit={edit} />
                            ) : block ? (
                              <BlockPanel name={block.name} texts={texts} onEdit={edit} />
                            ) : route ? (
                              <>
                                <ColorsGroup template={project.template} theme={project.theme} onChange={recolor} />
                                <RoutePanel template={project.template} label={route.label} path={route.path} edits={project.edits.filter((e) => e.scope === `route:${route.path}`).length} />
                              </>
                            ) : (
                              <>
                                <ColorsGroup template={project.template} theme={project.theme} onChange={recolor} />
                                <PagePanel template={project.template} count={keysOf.length} onReset={() => dispatch({ type: "replace", project: { ...newProject(project.template), name: project.name, ...(project.theme ? { theme: project.theme } : {}) } })} />
                              </>
                            )}
                          </motion.div>
                        </AnimatePresence>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </aside>

        {/* Top center: you and the people you share with. Signed out, a way in. */}
        <motion.div
          role="toolbar"
          aria-label="Account and sharing"
          initial={{ opacity: 0, y: -16, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          transition={{ ...SPRING, delay: 0.1 }}
          className={cn(PANEL, "absolute left-1/2 top-3 z-40 flex items-center gap-0.5 p-1.5")}
        >
          {account}
          {others.length > 0 && (
            <div className="ml-1 flex items-center -space-x-1.5" aria-label={`Also here: ${others.map((p) => p.name).join(", ")}`}>
              {others.slice(0, 4).map((p) => (
                <Tip key={p.userId} label={`${p.name}, on ${labelOf(p.view)}`} side="bottom">
                  <span className="rounded-full ring-2 ring-surface">
                    <Face name={p.name} color={p.color} size={26} />
                  </span>
                </Tip>
              ))}
              {others.length > 4 && <span className="grid size-[26px] place-items-center rounded-full bg-fg/[0.08] text-[11px] font-semibold ring-2 ring-surface">+{others.length - 4}</span>}
            </div>
          )}
          {user && (
            <>
              <span aria-hidden className="mx-1 h-5 w-px bg-line" />
              <Tool label="Version history" active={inspect === "history"} onClick={() => (inspect === "history" ? setInspect("inspect") : openHistory())}>
                <ClockCounterClockwiseIcon size={16} />
              </Tool>
              <Tool label="Library" active={library !== null} onClick={() => setLibrary("drafts")}>
                <BooksIcon size={16} />
              </Tool>
              <span aria-hidden className="mx-1 h-5 w-px bg-line" />
            </>
          )}
          <motion.button whileTap={PRESS} type="button" onClick={share} className={btnSm.quiet}>
            Share
          </motion.button>
        </motion.div>

        {/* Bottom center: the tools. Each opens its own panel above it. */}
        <motion.div role="toolbar" aria-label="Studio tools" initial={{ opacity: 0, y: 16, x: "-50%" }} animate={{ opacity: 1, y: 0, x: "-50%" }} transition={{ ...SPRING, delay: 0.1 }} className={cn(PANEL, "absolute bottom-4 left-1/2 z-40 flex items-center gap-0.5 p-1.5")}>
          <Tip label="Select" keys="V">
            <motion.button
              whileTap={PRESS}
              type="button"
              aria-pressed={!hand && !commenting}
              aria-label="Select"
              onClick={() => {
                comment(false);
                setHand(false);
              }}
              className={cn(ICON_BTN, !hand && !commenting && "bg-fg/[0.08] text-fg")}
            >
              <CursorIcon size={16} weight={hand || commenting ? "regular" : "fill"} />
            </motion.button>
          </Tip>
          <Tip label="Hand, or hold Space" keys="H">
            <motion.button
              whileTap={PRESS}
              type="button"
              aria-pressed={hand}
              aria-label="Hand"
              onClick={() => {
                comment(false);
                setHand(true);
              }}
              className={cn(ICON_BTN, hand && "bg-fg/[0.08] text-fg")}
            >
              <HandIcon size={16} weight={hand ? "fill" : "regular"} />
            </motion.button>
          </Tip>
          <Tip label="Comment" keys="C">
            <motion.button whileTap={PRESS} type="button" aria-pressed={commenting} aria-label={`Comment${openThreads ? `, ${openThreads} open` : ""}`} onClick={() => comment(!commenting)} className={cn(ICON_BTN, "relative", commenting && "bg-fg/[0.08] text-fg")}>
              <ChatCircleIcon size={16} weight={commenting ? "fill" : "regular"} />
              {openThreads > 0 && !commenting && <span className="absolute right-0.5 top-0.5 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-select px-0.5 text-[9.5px] font-bold leading-none text-white">{openThreads > 9 ? "9+" : openThreads}</span>}
            </motion.button>
          </Tip>
          <span aria-hidden className="mx-1 h-5 w-px bg-line" />
          {page && (
            <ToolPop id="insert" tour="insert" open={pop} setOpen={setPop} label={insertTitle} width={600} button={<PlusIcon size={17} weight="bold" />}>
              <div className="flex h-11 shrink-0 items-center border-b border-line px-4 text-[13px] font-semibold">{insertTitle}</div>
              <div className="min-h-0 overflow-y-auto p-4">
                <InsertGrid template={project.template} pro={pro} onInsert={insert} cols={3} />
              </div>
            </ToolPop>
          )}
          <ToolPop id="start" open={pop} setOpen={setPop} label="Start from a template" width={520} button={<SquaresFourIcon size={17} />}>
            <div className="flex h-11 shrink-0 items-center border-b border-line px-4 text-[13px] font-semibold">Start from</div>
            <div className="p-4">
              <StartFrom onStart={start} current={project.template} />
              <Note icon={ArrowCounterClockwiseIcon} className="mt-3 text-[12px] text-muted">
                <WithKeys text="This starts a new project. {Cmd Z} brings this one back." />
              </Note>
            </div>
          </ToolPop>
          <span aria-hidden className="mx-1 h-5 w-px bg-line" />
          <ToolPop
            id="breakpoints"
            open={pop}
            setOpen={setPop}
            label="Breakpoints"
            width={232}
            button={
              <>
                <DevicesIcon size={16} />
                <span className="text-[12px] font-medium tabular-nums">{devices.length}</span>
              </>
            }
          >
            <div className="p-1">
              {DEVICES.map((d) => {
                const on = devices.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    disabled={on && devices.length === 1}
                    onClick={() => setDevices((now) => (on ? now.filter((x) => x !== d) : DEVICES.filter((x) => now.includes(x) || x === d)))}
                    className="flex h-8 w-full items-center justify-between rounded-[9px] px-2.5 text-[13px] hover:bg-fg/[0.05] disabled:opacity-50"
                  >
                    <span className="flex items-center gap-2">
                      <span className={cn("grid size-4 place-items-center rounded-[5px]", on ? "bg-fg text-canvas" : "shadow-[inset_0_0_0_1.5px_rgb(var(--bd-ink)/0.25)]")}>{on && <CheckIcon size={10} weight="bold" />}</span>
                      {DEVICE_LABEL[d]}
                    </span>
                    <span className="tabular-nums text-subtle">{CANVAS_WIDTH[d]}</span>
                  </button>
                );
              })}
            </div>
          </ToolPop>
          <ToolPop
            id="zoom"
            open={pop}
            setOpen={setPop}
            label="Zoom"
            width={200}
            button={
              <>
                <span ref={zoomText} className="min-w-9 text-[12px] font-medium tabular-nums">{zoomLabel}</span>
                <CaretDownIcon size={10} weight="bold" className="text-subtle" />
              </>
            }
          >
            <div className="p-1">
              {ZOOMS.map((z) => (
                <button
                  key={String(z.value)}
                  type="button"
                  onClick={() => {
                    setZoomMode(z.value);
                    setPop(null);
                  }}
                  className={cn("flex h-8 w-full items-center justify-between rounded-[9px] px-2.5 text-[13px] hover:bg-fg/[0.05]", zoomMode === z.value && "font-medium")}
                >
                  <span className="flex items-center gap-2">
                    {z.value === "fit" && <MagnifyingGlassPlusIcon size={14} className="text-muted" />}
                    {z.label}
                  </span>
                  {z.keys ? <span className="text-[12px] text-subtle">{z.keys}</span> : zoomMode === z.value && <span className="size-1.5 rounded-full bg-fg" />}
                </button>
              ))}
            </div>
          </ToolPop>
          <Tip label="Preview" keys="Shift P">
            <motion.button whileTap={PRESS} type="button" onClick={() => openPreview()} aria-label="Preview" className={ICON_BTN}>
              <PlayIcon size={16} />
            </motion.button>
          </Tip>
          <span aria-hidden className="mx-1 h-5 w-px bg-line" />
          <Tip label="Undo" keys="Cmd Z">
            <motion.button whileTap={PRESS} type="button" className={ICON_BTN} onClick={() => dispatch({ type: "undo" })} disabled={!state.past.length} aria-label="Undo">
              <ArrowCounterClockwiseIcon size={16} />
            </motion.button>
          </Tip>
          <Tip label="Redo" keys="Shift Cmd Z">
            <motion.button whileTap={PRESS} type="button" className={ICON_BTN} onClick={() => dispatch({ type: "redo" })} disabled={!state.future.length} aria-label="Redo">
              <ArrowClockwiseIcon size={16} />
            </motion.button>
          </Tip>
          <span aria-hidden className="mx-1 h-5 w-px bg-line" />
          <Tip label={panels.left || panels.right ? "Hide panels" : "Show panels"} keys="Cmd \\">
            <motion.button whileTap={PRESS} type="button" className={cn(ICON_BTN, !(panels.left || panels.right) && "bg-fg/[0.08]")} onClick={togglePanels} aria-pressed={!(panels.left || panels.right)} aria-label="Hide panels">
              <SidebarSimpleIcon size={16} weight={panels.left || panels.right ? "regular" : "fill"} />
            </motion.button>
          </Tip>
          <ToolPop id="help" open={pop} setOpen={setPop} label="Help and shortcuts" width={300} button={<QuestionIcon size={16} />}>
            <HelpPanel
              hints={guide.hints}
              onHints={(hints) => setGuide({ hints })}
              onTour={() => {
                setPop(null);
                setTouring(true);
              }}
            />
          </ToolPop>
        </motion.div>
        <HintLine text={hint} show={guide.hints && !pop && !touring} />
        <Tour key={touring ? "on" : "off"} open={touring} steps={tourSteps} onClose={endTour} />

        <AnimatePresence>
          {previewing && (
            <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18, ease: EASE_OUT }} className="fixed inset-0 z-[250]">
              <PreviewView project={project} view={previewing.view} viewport={previewing.viewport} onClose={() => setPreviewing(null)} />
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {!booted && (
            <motion.div key="preloader" initial={false} exit={{ opacity: 0, scale: 1.01, transition: { duration: 0.32, ease: EASE_OUT } }} className="fixed inset-0 z-[300]">
              <Preloader
                title={project.name}
                stage={cloud.status === "loading" ? "Opening your draft" : drawnOnce ? "Ready" : `Drawing ${DEVICE_LABEL[devices[0]].toLowerCase()} at ${CANVAS_WIDTH[devices[0]]}`}
                progress={cloud.status === "loading" ? 0.4 : drawnOnce ? 1 : 0.68}
              />
            </motion.div>
          )}
        </AnimatePresence>
        <ShareDialog open={sharing && user !== null} onClose={() => setSharing(false)} name={project.name} user={user} projectId={cloud.id} />
        <LibraryDialog
          tab={user ? library : null}
          onTab={setLibrary}
          onClose={() => setLibrary(null)}
          page={page ?? project.pages[0]}
          currentId={cloud.id}
          pro={pro}
          onOpen={openDraft}
          onNewDraft={() => {
            setLibrary(null);
            start(project.template);
          }}
          onInsert={(id) => {
            setLibrary(null);
            insert(id);
          }}
        />
        {cloud.status === "denied" && (
          <div role="alertdialog" aria-labelledby="denied-title" className="absolute inset-0 z-[45] grid place-items-center bg-well/70 backdrop-blur-[2px]">
            <div className={cn(PANEL, "w-[400px] p-6")}>
              <LockSimpleIcon size={22} weight="duotone" className="text-muted" />
              <h2 id="denied-title" className="mt-3 text-[17px] font-semibold">
                {cloud.deniedSignedIn ? "This project isn't shared with you" : "Sign in to open this project"}
              </h2>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{cloud.deniedSignedIn ? `Ask its owner to share it with ${user?.email ?? "you"}, or open one of your own drafts.` : "It's shared with people by email. Sign in with the email it was shared with."}</p>
              <div className="mt-5 flex gap-2">
                {cloud.deniedSignedIn ? (
                  <button type="button" onClick={cloud.leave} className={btnSm.ink}>
                    Go to your drafts
                  </button>
                ) : (
                  <button type="button" onClick={() => openAuth("sign-in", { reason: "share" })} className={btnSm.ink}>
                    Sign in
                  </button>
                )}
                <Link href="/" className={btnSm.quiet}>
                  Back to basedraft
                </Link>
              </div>
            </div>
          </div>
        )}
        <ExportDialog key={exporting ?? "closed"} open={exporting !== null} initialTab={exporting === "json" ? "json" : "react"} initialView={exporting === "github" ? "github" : "files"} onClose={() => setExporting(null)} project={project} pageId={page?.id ?? null} pro={code} proUsed={proUsed} />
        <SiteExportDialog open={site} onClose={() => setSite(false)} project={project} />
      </div>
    </>
  );
}
