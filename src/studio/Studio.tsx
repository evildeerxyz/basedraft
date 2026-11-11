"use client";

import { ArrowClockwiseIcon, ArrowCounterClockwiseIcon, ArrowDownIcon, ArrowUpIcon, ArrowUpRightIcon, CaretDownIcon, CaretRightIcon, CloudArrowUpIcon, CloudCheckIcon, CloudSlashIcon, CopyIcon, DesktopIcon, DeviceMobileIcon, DeviceTabletIcon, EyeIcon, FigmaLogoIcon, FileIcon, FilesIcon, HouseIcon, LockSimpleIcon, MagnifyingGlassPlusIcon, PlayIcon, PlusIcon, SidebarSimpleIcon, SignOutIcon, SquaresFourIcon, SwapIcon, TrashIcon, XIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import { cn, EASE_OUT } from "@/lib/utils";
import { AccountHeader, Avatar, displayName, openAuth, signedIn, signOut, useAuth } from "@/site/auth";
import { copyToDesign, prepareCopy, type CopyTarget } from "@/site/design-copy";
import { SectionGlyph } from "@/site/icons";
import { swapsOf } from "@/site/images";
import { Tip, WithKeys } from "@/site/keys";
import { composeUrl, liveUrl, sectionOf, sectionShot, sectionUrl, templateOf, type LiveSection, type TemplateSlug } from "@/site/live";
import { BaseDraftMark } from "@/site/logo";
import { Menu } from "@/site/menu";
import { Note } from "@/site/plan-parts";
import { btn, btnSm } from "@/site/sheet";
import { withEdit, type TextEdit } from "@/site/text-edits";
import { keepMode, modeIn, themeCss, type Mode, type Theme } from "@/site/theme";
import { toast } from "@/site/toast";
import { Canvas, CANVAS_WIDTH, DEVICE_LABEL, type Block, type CanvasDevice, type CanvasHandle, type Zoom } from "./canvas";
import { useCloud } from "./cloud";
import { ColorsGroup } from "./colors";
import { ExportDialog } from "./export";
import { ExportMenu } from "./export-menu";
import { BlockPanel, PagePanel, RoutePanel, SectionPanel } from "./inspector";
import { Preloader } from "./preloader";
import { PreviewView, type Viewport } from "./preview";
import { BlockLayers, InsertGrid, Layers, PagesPanel, StartFrom } from "./sidebar";
import { blankPage, copyPage, idOf, initialState, instance, newProject, pageOf, pathFor, reducer, save, withPage, type Project, type SitePage, type View } from "./state";
import { Tool } from "./ui";
import { DraftsDialog } from "./workspace";

/*
 * Studio: a template's site, one page at a time, at one breakpoint at a time. Pick a template, lay
 * out your pages from its sections, click any text to rewrite it, then take it to Figma or
 * download the code. Signed in, the draft is kept in your account as you go.
 */

const NO_KEYS: string[] = [];
const ZOOMS: Array<{ value: Zoom; label: string; keys?: string }> = [
  { value: "fit", label: "Zoom to fit", keys: "⇧1" },
  { value: 0.25, label: "25%" },
  { value: 0.5, label: "50%" },
  { value: 0.75, label: "75%" },
  { value: 1, label: "100%", keys: "⇧0" },
];

const DEVICES: Array<{ id: CanvasDevice; icon: typeof DesktopIcon }> = [
  { id: "desktop", icon: DesktopIcon },
  { id: "tablet", icon: DeviceTabletIcon },
  { id: "phone", icon: DeviceMobileIcon },
];

const isTyping = (t: EventTarget | null) => t instanceof HTMLElement && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName) || t.getAttribute("role") === "combobox");

/* ---------- motion ---------- */

/** One feel for everything that moves in Studio: quick, settled, no bounce. */
const SPRING = { type: "spring", stiffness: 520, damping: 42, mass: 0.8 } as const;
const PRESS = { scale: 0.93 };

/* ---------- floating chrome ---------- */

/** Figma's floating panels: white, rounded, lifted just off the canvas. */
const PANEL = "rounded-[16px] bg-surface shadow-[0_0_0_0.5px_rgb(var(--bd-ink)/0.12),0_1px_3px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.08)]";
const ICON_BTN = "grid size-8 shrink-0 place-items-center rounded-[11px] text-fg/80 transition-colors hover:bg-fg/[0.06] hover:text-fg disabled:pointer-events-none disabled:opacity-30";

/** A toolbar button that opens its panel above the toolbar. One open at a time. */
function ToolPop({ id, open, setOpen, label, button, children, width }: { id: string; open: string | null; setOpen: (v: string | null) => void; label: string; button: ReactNode; children: ReactNode; width: number }) {
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
    <div ref={root} className="relative">
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

const BAR = "relative flex h-[36px] shrink-0 items-center gap-0.5 rounded-[14px] bg-surface p-[3px] shadow-[0_6px_20px_-4px_rgb(var(--bd-shade)/0.18),0_0_0_1px_rgb(var(--bd-ink)/0.08)]";
const BAR_TOOL = "grid size-[30px] place-items-center rounded-[10px] text-fg/75 transition-colors hover:bg-fg/[0.07] hover:text-fg disabled:opacity-30";
// Copy carries a label, so it gets its own width rather than the icon buttons' square.
const BAR_WIDE = "flex h-[30px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[10px] px-2 text-[12.5px] font-medium text-fg/75 transition-colors hover:bg-fg/[0.07] hover:text-fg";
const CHIP = "flex h-[26px] min-w-0 items-center gap-1.5 rounded-[9px] bg-select px-2 text-[12px] font-medium text-white shadow-[0_2px_8px_rgba(151,71,255,0.35)]";

/** Copy for Figma. */
function CopyButton({ tight, onCopy, onPrepare }: { tight: boolean; onCopy: () => void; onPrepare: () => void }) {
  return (
    <Tip label="Copy for Figma">
      <button type="button" className={BAR_WIDE} onPointerEnter={onPrepare} onFocus={onPrepare} onClick={onCopy} aria-label="Copy for Figma">
        <FigmaLogoIcon size={14} /> {!tight && "Copy"}
      </button>
    </Tip>
  );
}

/*
 * Sits just above the selected section, outside it, so it never covers what you're looking at:
 * the name in selection purple, then swapping, arranging, and taking the section to Figma.
 */
function SelectionBar({ section, index, count, width, kin, onSwap, onMove, onDuplicate, onRemove, onCopy, onPrepare }: { section: LiveSection; index: number; count: number; width: number; kin: LiveSection[]; onSwap: (id: string) => void; onMove: (d: 1 | -1) => void; onDuplicate: () => void; onRemove: () => void; onCopy: () => void; onPrepare: () => void }) {
  const [swap, setSwap] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!swap) return;
    const close = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setSwap(false);
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [swap]);
  return (
    <>
      <span className={CHIP}>
        <SectionGlyph kind={section.kind} size={13} />
        <span className="truncate">{section.name}</span>
      </span>
      <div ref={root} role="toolbar" aria-label={`${section.name} tools`} className={BAR}>
        {kin.length > 1 && (
          <>
            <Tip label={`Swap for another ${section.kind === "faq" ? "FAQ" : "one of its kind"}`}>
              <button type="button" className={cn(BAR_TOOL, swap && "bg-fg/[0.08] text-fg")} onClick={() => setSwap((s) => !s)} aria-label="Swap section" aria-expanded={swap}>
                <SwapIcon size={15} />
              </button>
            </Tip>
            <span aria-hidden className="mx-0.5 h-4 w-px bg-line" />
          </>
        )}
        <Tip label="Move up" keys="Alt ArrowUp">
          <button type="button" className={BAR_TOOL} onClick={() => onMove(-1)} disabled={index === 0} aria-label="Move up">
            <ArrowUpIcon size={15} />
          </button>
        </Tip>
        <Tip label="Move down" keys="Alt ArrowDown">
          <button type="button" className={BAR_TOOL} onClick={() => onMove(1)} disabled={index === count - 1} aria-label="Move down">
            <ArrowDownIcon size={15} />
          </button>
        </Tip>
        <Tip label="Duplicate" keys="Cmd D">
          <button type="button" className={BAR_TOOL} onClick={onDuplicate} aria-label="Duplicate">
            <CopyIcon size={15} />
          </button>
        </Tip>
        <Tip label="Delete" keys="Del">
          <button type="button" className={cn(BAR_TOOL, "hover:bg-[#d92d20]/10 hover:text-[#d92d20]")} onClick={onRemove} aria-label="Delete">
            <TrashIcon size={15} />
          </button>
        </Tip>
        <span aria-hidden className="mx-0.5 h-4 w-px bg-line" />
        <CopyButton tight={width < 480} onCopy={onCopy} onPrepare={onPrepare} />

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
                    </span>
                    <span className="mt-1 block truncate px-0.5 text-[12px]">{s.name}</span>
                  </button>
                ))}
              </div>
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
      <Tip label={`${owner ? `${owner}'s project. ` : ""}You can look; your changes aren't saved to it.`} side="bottom">
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
          ? [CloudCheckIcon, owner ? `Saved. ${owner}'s project.` : "Saved to your account"]
          : [CloudArrowUpIcon, "Connecting to your account"];
  return (
    <Tip label={label} side="bottom">
      <button type="button" aria-label={label} onClick={() => status === "local" && openAuth("sign-up", { reason: "save" })} className={cn("grid size-6 shrink-0 place-items-center rounded-[6px] transition-colors", status === "local" ? "text-muted hover:bg-fg/[0.06] hover:text-fg" : "cursor-default text-subtle")}>
        <Icon size={15} weight={status === "saving" ? "regular" : "duotone"} className={cn(status === "saving" && "animate-pulse")} />
      </button>
    </Tip>
  );
}

/*
 * The same toolbar for a block of one of the template's own pages. Those pages are the template's
 * code as written, so their blocks keep their order; what you can do is take one to Figma.
 */
function BlockBar({ name, width, onCopy, onPrepare }: { name: string; width: number; onCopy: () => void; onPrepare: () => void }) {
  return (
    <>
      <span className={CHIP}>
        <span className="truncate">{name}</span>
      </span>
      <div role="toolbar" aria-label={`${name} tools`} className={BAR}>
        <Tip label="This page is the template's own: its blocks keep their order. Arrange sections on your pages.">
          <span className={cn(BAR_TOOL, "cursor-default")} aria-label="Why this block can't move">
            <LockSimpleIcon size={14} />
          </span>
        </Tip>
        <span aria-hidden className="mx-0.5 h-4 w-px bg-line" />
        <CopyButton tight={width < 360} onCopy={onCopy} onPrepare={onPrepare} />
      </div>
    </>
  );
}

/* ---------- the app ---------- */

type LeftTab = "pages" | "layers" | "sections";

export default function Studio() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const { project, view, selected } = state;
  const page = pageOf(project, view);
  const t = templateOf(project.template)!;
  const route = view.kind === "route" ? (t.pages.find((p) => p.path === view.path) ?? { label: view.path, path: view.path }) : null;
  const canvas = useRef<CanvasHandle>(null);
  const [device, setDevice] = useState<CanvasDevice>("desktop");
  const [zoomMode, setZoomMode] = useState<Zoom>("fit");
  const [zoom, setZoom] = useState(1);
  const [tab, setTab] = useState<LeftTab>("layers");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [pop, setPop] = useState<string | null>(null);
  const [panels, setPanels] = useState({ left: true, right: true });
  // Back from connecting GitHub, the export dialog opens where you left it.
  const [exporting, setExporting] = useState<"files" | "github" | null>(() => (new URLSearchParams(window.location.search).get("export") === "github" ? "github" : null));
  const { user, loading } = useAuth();
  // Arriving from a template's page starts a new draft with it.
  const [fresh] = useState(() => new URLSearchParams(window.location.search).has("template"));
  const cloud = useCloud({ user, loading, project, dispatch, fresh });
  // The site's account menu links here as /studio#library.
  const [drafts, setDrafts] = useState(() => window.location.hash === "#library");
  // A link that opened a template here has done its job; the address goes back to plain /studio.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("github") === "error") toast("GitHub didn't connect", { tone: "error", detail: q.get("why") ?? undefined });
    if (q.get("github") === "connected") toast("GitHub is connected");
    if (q.has("template") || q.has("section") || q.has("export") || q.has("github")) {
      for (const k of ["template", "section", "export", "github", "why"]) q.delete(k);
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
  useEffect(() => {
    if (window.location.hash !== "#library") return;
    window.history.replaceState(null, "", "/studio");
    void signedIn().then((yes) => !yes && openAuth("sign-in", { reason: "library", then: () => setDrafts(true) }));
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
  // Images a draft put in place of the template's (Studio once let you swap them): still drawn and exported.
  const swaps = useMemo(() => swapsOf(project.images), [project.images]);
  /** One edit, or several as one change (a headline rewritten word by word is one undo). */
  const edit = useCallback(
    (e: TextEdit | TextEdit[]) => {
      // An edit takes its decorative copies along (a marquee's repeated cards), so they still match.
      const all = [e].flat().flatMap((x) => [x, ...(canvas.current?.clonesOf(x) ?? [])]);
      change({ ...project, edits: all.reduce(withEdit, project.edits) });
    },
    [change, project],
  );
  const restyle = (theme: Theme | undefined) => {
    const next = { ...project, theme };
    if (!theme) delete next.theme;
    change(next);
  };

  // A template with a dark mode is drawn in the one its own switch last kept here (or the system's);
  // the colors' mode switch changes it, everywhere it's open in this browser.
  const [modes, setModes] = useState<Partial<Record<TemplateSlug, Mode>>>({});
  const mode = modes[project.template] ?? modeIn(project.template);
  const switchMode = (m: Mode) => {
    keepMode(project.template, m, canvas.current?.docs());
    setModes((x) => ({ ...x, [project.template]: m }));
    canvas.current?.redraw();
  };

  const keysOf = page?.keys ?? NO_KEYS;
  const index = selected && page ? page.keys.indexOf(selected) : -1;
  const section = selected && page ? (sectionOf(project.template, idOf(selected)) ?? null) : null;
  const block = view.kind === "route" && selected ? blocks.find((b) => b.key === selected) : undefined;

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
    toast(`Added ${s.name}`);
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
    // Signed in, a template starts a new draft and the last one stays in your drafts.
    if (user)
      return void cloud.startNew(newProject(slug)).then(
        () => toast(`Started a new draft from ${templateOf(slug)?.name}`, { detail: "Your last one is in your drafts." }),
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
  const openDraft = (id: string) => {
    setDrafts(false);
    cloud.open(id);
  };

  const names = Object.fromEntries(t.sections.map((s) => [s.id, `${t.name} / ${s.name}`]));
  // The project's colors as CSS, laid over the template's in the canvas and in every copy.
  const colors = themeCss(project.template, project.theme);
  // Copies draw their own frames of the template at each width (see live-export), so they never read the canvas.
  const sectionTarget = (key: string): CopyTarget => {
    const s = sectionOf(project.template, idOf(key))!;
    return { name: `${t.name} ${s.name}`, get: () => null, live: { url: sectionUrl(s), names, edits: project.edits.filter((e) => e.scope === key), remap: { [key]: s.id }, theme: colors, images: swaps } };
  };
  /** One block of the template's own page, read on its own from the page. */
  const blockTarget = (key: string, name: string): CopyTarget => ({
    name: `${t.name} ${route?.label ?? ""} / ${name}`,
    get: () => null,
    live: { url: liveUrl(project.template, view.kind === "route" ? view.path : "/"), names: {}, edits: project.edits, theme: colors, images: swaps, block: Number(key.split(":")[1]) },
  });
  const pageTarget: CopyTarget = page
    ? { name: `${project.name} / ${page.name}`, get: () => null, live: { url: composeUrl(project.template, page.keys), names, edits: project.edits, theme: colors, images: swaps } }
    : { name: `${project.name} / ${route?.label}`, get: () => null, live: { url: liveUrl(project.template, view.kind === "route" ? view.path : "/"), names, edits: project.edits, theme: colors, images: swaps } };
  const togglePanels = () => setPanels((p) => (p.left || p.right ? { left: false, right: false } : { left: true, right: true }));
  // Preview mode: the page as it ships, over Studio, at the breakpoint on the canvas. Esc comes back.
  const [previewing, setPreviewing] = useState<{ view: View; viewport: Viewport } | null>(null);
  // Back from the preview, the canvas's page is measured and painted again.
  const [resync, setResync] = useState(0);
  const closePreview = () => {
    setPreviewing(null);
    setResync((n) => n + 1);
  };
  const openPreview = () => setPreviewing({ view, viewport: device });

  const zoomRef = useRef(zoom);
  const viewRef = useRef(view);
  const deviceRef = useRef(device);
  useEffect(() => {
    zoomRef.current = zoom;
    viewRef.current = view;
    deviceRef.current = device;
  });
  // Mid pinch the canvas reports its zoom straight into the readout, so Studio doesn't render every frame.
  const zoomText = useRef<HTMLSpanElement>(null);
  const liveZoom = useCallback((z: number) => {
    const t = zoomText.current?.firstChild;
    if (t) t.nodeValue = `${Math.round(z * 100)}%`;
  }, []);
  // Shortcuts, heard in Studio and inside the canvas alike. Ignored while typing.
  const keys = useRef({ selected, remove, duplicate, move, togglePanels, previewing });
  useEffect(() => {
    keys.current = { selected, remove, duplicate, move, togglePanels, previewing };
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
      if (e.shiftKey && e.key.toLowerCase() === "p") return setPreviewing({ view: viewRef.current, viewport: deviceRef.current });
      if (e.shiftKey && e.key === "!") return setZoomMode("fit");
      if (e.shiftKey && e.key === ")") return setZoomMode(1);
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
    [select, setZoomMode, setPreviewing],
  );
  useEffect(() => {
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onKey]);
  const onBlocks = useCallback((b: Block[]) => setBlocks((now) => (JSON.stringify(now) === JSON.stringify(b) ? now : b)), [setBlocks]);
  const onReady = useCallback(() => setDrawnOnce(true), [setDrawnOnce]);

  // Who's signed in, with your drafts and Pro; or a way to sign in.
  const account = user ? (
    <Menu
      label="Account"
      align="left"
      buttonClassName="grid size-8 shrink-0 place-items-center rounded-full transition-shadow hover:shadow-[0_0_0_3px_rgb(var(--bd-ink)/0.08)] aria-expanded:shadow-[0_0_0_3px_rgb(var(--bd-ink)/0.12)]"
      button={<Avatar name={displayName(user)} size={26} />}
      header={<AccountHeader user={user} />}
      items={[
        { label: "Your drafts", icon: FilesIcon, onSelect: () => setDrafts(true) },
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
  const insertTitle = section ? `Add below ${section.name}` : page ? `Add to ${page.name}` : "Sections";
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
          <Link href="/blocks" className={cn(btn.ink, "mt-6")}>
            Browse components
          </Link>
        </div>
      </div>

      <div ref={root} className="relative hidden h-dvh overflow-hidden overscroll-none bg-well text-fg lg:block">
        {/* Its own layer, so nothing on the canvas (the selection toolbar included) rises over Studio's panels and menus. */}
        <main id="main" className="absolute inset-0 isolate">
          <Canvas
            key={`${project.template}|${view.kind === "page" ? view.id : view.path}|${device}`}
            ref={canvas}
            template={project.template}
            view={view}
            keys={keysOf}
            device={device}
            edits={project.edits}
            theme={colors}
            images={swaps}
            selected={selected}
            zoom={zoomMode}
            insets={{ left: panels.left ? 284 : 32, right: panels.right ? 336 : 32 }}
            onSelect={select}
            onZoom={setZoom}
            onZoomTo={setZoomMode}
            onLiveZoom={liveZoom}
            onEdit={edit}
            onBlocks={onBlocks}
            onKey={onKey}
            onReady={onReady}
            paused={previewing !== null}
            resync={resync}
            bar={(key, width) => {
              if (!page) {
                const b = blocks.find((x) => x.key === key);
                if (!b) return null;
                const target = blockTarget(key, b.name);
                return <BlockBar name={b.name} width={width} onCopy={() => void copyToDesign("figma", target)} onPrepare={() => prepareCopy(target)} />;
              }
              const s = sectionOf(project.template, idOf(key));
              if (!s) return null;
              return (
                <SelectionBar
                  section={s}
                  index={page.keys.indexOf(key)}
                  count={page.keys.length}
                  width={width}
                  kin={t.sections.filter((x) => x.kind === s.kind)}
                  onSwap={(id) => swap(key, id)}
                  onMove={(d) => move(key, d)}
                  onDuplicate={() => duplicate(key)}
                  onRemove={() => remove(key)}
                  onCopy={() => void copyToDesign("figma", sectionTarget(key))}
                  // The copy is read as the pointer reaches Copy, so it's usually ready by the click.
                  onPrepare={() => prepareCopy(sectionTarget(key))}
                />
              );
            }}
          />
        </main>

        {/* Left: the project, then its pages, layers and sections, as in Framer. */}
        <section aria-label="Project" className={cn(PANEL, "absolute left-3 top-3 z-30 flex w-[260px] flex-col")} style={{ maxHeight: "calc(100% - 24px)" }}>
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
            <Tip label={panels.left ? "Hide panel" : "Show panel"} keys="Cmd \\" side="bottom">
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
                        <InsertGrid template={project.template} onInsert={insert} cols={2} />
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
            <Tip label={panels.right ? "Hide inspector" : "Show inspector"} keys="Cmd \\" side="bottom">
              <motion.button whileTap={PRESS} type="button" onClick={() => setPanels((p) => ({ ...p, right: !p.right }))} aria-label={panels.right ? "Hide inspector" : "Show inspector"} aria-expanded={panels.right} className={cn(ICON_BTN, "-scale-x-100")}>
                <SidebarSimpleIcon size={16} />
              </motion.button>
            </Tip>
            <span className="flex-1" />
            <ExportMenu page={pageTarget} section={selected && page ? sectionTarget(selected) : null} onCode={setExporting} />
          </div>
          <AnimatePresence initial={false}>
            {panels.right && (
              <motion.div key="inspector-body" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={SPRING} className="overflow-hidden rounded-b-[16px]">
                {/* The open panel runs to the bottom of the window: header and margins aside. */}
                <div className="flex flex-col" style={{ height: "calc(100dvh - 72px)" }}>
                  {/* No tabs: a selection shows itself, nothing selected shows the page. */}
                  <div className="flex h-10 shrink-0 items-center gap-1.5 border-t border-line pl-4 pr-2 text-[13px]">
                    {selected && (section || block) ? (
                      <>
                        <Tip label="Page" keys="Esc" side="bottom">
                          <button type="button" onClick={() => select(null)} className="shrink-0 truncate text-muted transition-colors hover:text-fg">
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
                          <SectionPanel section={section} onSwap={(id) => swap(selected, id)} />
                        ) : block ? (
                          <BlockPanel name={block.name} />
                        ) : (
                          <>
                            <ColorsGroup template={project.template} theme={project.theme} mode={mode} onMode={switchMode} onChange={restyle} />
                            {route ? (
                              <RoutePanel template={project.template} label={route.label} path={route.path} edits={project.edits.filter((e) => e.scope === `route:${route.path}`).length} />
                            ) : (
                              <PagePanel template={project.template} count={keysOf.length} onReset={() => dispatch({ type: "replace", project: { ...newProject(project.template), name: project.name, ...(project.theme ? { theme: project.theme } : {}) } })} />
                            )}
                          </>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </aside>

        {/* Top center: you and your drafts. Signed out, a way in. */}
        <motion.div
          role="toolbar"
          aria-label="Account"
          initial={{ opacity: 0, y: -16, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          transition={{ ...SPRING, delay: 0.1 }}
          className={cn(PANEL, "absolute left-1/2 top-3 z-40 flex items-center gap-0.5 p-1.5")}
        >
          {account}
          {user && (
            <>
              <span aria-hidden className="mx-1 h-5 w-px bg-line" />
              <Tool label="Your drafts" active={drafts} onClick={() => setDrafts(true)}>
                <FilesIcon size={16} />
              </Tool>
            </>
          )}
        </motion.div>

        {/* Bottom center: the tools. Each opens its own panel above it. */}
        <motion.div role="toolbar" aria-label="Studio tools" initial={{ opacity: 0, y: 16, x: "-50%" }} animate={{ opacity: 1, y: 0, x: "-50%" }} transition={{ ...SPRING, delay: 0.1 }} className={cn(PANEL, "absolute bottom-4 left-1/2 z-40 flex items-center gap-0.5 p-1.5")}>
          {page && (
            <ToolPop id="insert" open={pop} setOpen={setPop} label={insertTitle} width={600} button={<PlusIcon size={17} weight="bold" />}>
              <div className="flex h-11 shrink-0 items-center border-b border-line px-4 text-[13px] font-semibold">{insertTitle}</div>
              <div className="min-h-0 overflow-y-auto p-4">
                <InsertGrid template={project.template} onInsert={insert} cols={3} />
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
          {/* One breakpoint on the canvas at a time: a click moves to another. */}
          <div role="radiogroup" aria-label="Breakpoint" className="flex items-center gap-0.5">
            {DEVICES.map(({ id, icon: Icon }) => {
              const on = device === id;
              return (
                <Tip key={id} label={`${DEVICE_LABEL[id]}, ${CANVAS_WIDTH[id]}`}>
                  <motion.button whileTap={PRESS} type="button" role="radio" aria-checked={on} aria-label={DEVICE_LABEL[id]} onClick={() => setDevice(id)} className={cn(ICON_BTN, on && "bg-fg/[0.08] text-fg")}>
                    <Icon size={16} weight={on ? "fill" : "regular"} />
                  </motion.button>
                </Tip>
              );
            })}
          </div>
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
          <span aria-hidden className="mx-1 h-5 w-px bg-line" />
          <Tip label="Preview" keys="Shift P">
            <motion.button whileTap={PRESS} type="button" onClick={openPreview} aria-label="Preview" className={ICON_BTN}>
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
        </motion.div>

        <AnimatePresence>
          {previewing && (
            <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18, ease: EASE_OUT }} className="fixed inset-0 z-[250]">
              <PreviewView project={project} view={previewing.view} viewport={previewing.viewport} onClose={closePreview} />
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {!booted && (
            <motion.div key="preloader" initial={false} exit={{ opacity: 0, scale: 1.01, transition: { duration: 0.32, ease: EASE_OUT } }} className="fixed inset-0 z-[300]">
              <Preloader
                title={project.name}
                stage={cloud.status === "loading" ? "Opening your draft" : drawnOnce ? "Ready" : `Drawing ${DEVICE_LABEL[device].toLowerCase()} at ${CANVAS_WIDTH[device]}`}
                progress={cloud.status === "loading" ? 0.4 : drawnOnce ? 1 : 0.68}
              />
            </motion.div>
          )}
        </AnimatePresence>
        <DraftsDialog
          open={drafts && user !== null}
          onClose={() => setDrafts(false)}
          template={project.template}
          currentId={cloud.id}
          onOpen={openDraft}
          onNewDraft={() => {
            setDrafts(false);
            start(project.template);
          }}
        />
        {cloud.status === "denied" && (
          <div role="alertdialog" aria-labelledby="denied-title" className="absolute inset-0 z-[45] grid place-items-center bg-well/70 backdrop-blur-[2px]">
            <div className={cn(PANEL, "w-[400px] p-6")}>
              <LockSimpleIcon size={22} weight="duotone" className="text-muted" />
              <h2 id="denied-title" className="mt-3 text-[17px] font-semibold">
                {cloud.deniedSignedIn ? "This project isn't yours to open" : "Sign in to open this project"}
              </h2>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{cloud.deniedSignedIn ? `It belongs to another account than ${user?.email ?? "yours"}. Open one of your own drafts instead.` : "It's saved to an account. Sign in with the email it belongs to."}</p>
              <div className="mt-5 flex gap-2">
                {cloud.deniedSignedIn ? (
                  <button type="button" onClick={cloud.leave} className={btnSm.ink}>
                    Go to your drafts
                  </button>
                ) : (
                  <button type="button" onClick={() => openAuth("sign-in")} className={btnSm.ink}>
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
        <ExportDialog key={exporting ?? "closed"} open={exporting !== null} initialView={exporting === "github" ? "github" : "files"} onClose={() => setExporting(null)} project={project} />
      </div>
    </>
  );
}
