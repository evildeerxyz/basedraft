"use client";

import { IconContext, AppWindowIcon, ArrowsInSimpleIcon, ArrowsOutSimpleIcon, CheckIcon, CodeIcon, CopyIcon, DeviceMobileIcon, DeviceTabletIcon, DiamondIcon, DownloadSimpleIcon, EyeIcon, FileTsxIcon, LockSimpleIcon, MonitorIcon, MoonIcon, SquaresFourIcon, StackIcon, SunIcon, ArrowCounterClockwiseIcon, type Icon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type MouseEvent, type ReactNode, type Ref } from "react";
import { createPortal } from "react-dom";
import { createRoot } from "react-dom/client";
import { cn } from "@/lib/utils";
import { componentOf, installCommand, isNew, PACKAGE, SITE, stylesImport, type ComponentMeta } from "@/registry";
import { Toaster } from "@/registry/ui/toast";
import { SCREENS, screenFile, type ScreenMeta } from "@/screens";
import { SCREEN_RENDERS } from "@/screens/renders";
import { CodeBlock } from "./code";
import { useColorMode, type ColorMode } from "./color-mode";
import { DesignCopyMenu } from "./design-copy";
import { Dock, DockPill, PieceMenu, TILE, TileArrow } from "./library";
import { GLASS, LIB_WRAP } from "./library-css";
import { previewHeaders, usePlan } from "./plan";
import { openPro } from "./pro-modal";
import { btn, NewBadge, ProBadge } from "./sheet";
import { ClaudeCodeButton, COMPONENT_ICON, CopyLine, IconSwitch } from "./ui-library";

/*
 * Screens: whole pages of an app, each one file built from basedraft UI. The gallery shows each
 * one live, shrunk into its tile; a screen's page puts it on a stage at a desktop's, a tablet's or
 * a phone's width, in light or dark, with its code, and every component it's made of as a card
 * that goes to that component's page.
 */

/** The width a screen is drawn at before it's shrunk into a tile, in a window of 16 by 10. */
const DRAWN = 1280;

/** A screen, live but still: drawn at a desktop's width and shrunk to fit its box, only once it's near the screen. */
function Miniature({ slug, className }: { slug: string; className?: string }) {
  const Screen = SCREEN_RENDERS[slug];
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const size = new ResizeObserver(([e]) => setScale(e.contentRect.width / DRAWN));
    const seen = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        setNear(true);
        seen.disconnect();
      },
      { rootMargin: "300px" },
    );
    size.observe(el);
    seen.observe(el);
    return () => {
      size.disconnect();
      seen.disconnect();
    };
  }, []);
  return (
    <div ref={box} aria-hidden inert className={cn("relative overflow-hidden bg-[var(--bd-bg)]", className)}>
      {near && scale > 0 && Screen ? (
        // A picture of the screen, so none of its scrolling parts shows a scrollbar.
        <div className="pointer-events-none absolute left-0 top-0 origin-top-left select-none [&_*]:[scrollbar-width:none] [&_*::-webkit-scrollbar]:hidden" style={{ width: DRAWN, height: DRAWN / 1.6, transform: `scale(${scale})` }}>
          <Screen />
        </div>
      ) : (
        <div className="absolute inset-0 animate-pulse bg-fg/[0.03]" />
      )}
    </div>
  );
}

/** "Free", quiet beside a name, where Pro would be. */
function FreeTag() {
  return <span className="inline-flex h-[18px] shrink-0 items-center rounded-full bg-fg/[0.06] px-[7px] text-[11px] font-medium leading-none text-muted">Free</span>;
}

/**
 * A screen as a tile: the screen itself, shrunk, then its name, whether it's free, and what it's
 * made of. The name is the link, stretched over the whole tile, since the screen has links of its own.
 */
export function ScreenTile({ s }: { s: ScreenMeta }) {
  return (
    <motion.li layout="position" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 520, damping: 42 }} className="min-w-0">
      <div className={cn(TILE, "p-2.5 sm:p-3")}>
        <div className="overflow-hidden rounded-[16px] shadow-[0_0_0_1px_var(--bd-line),var(--bd-shadow-raised)]">
          <Miniature slug={s.slug} className="aspect-[16/10]" />
        </div>
        {/* Its name and what it is, with room around them: the screen's picture shouldn't crowd them. */}
        <div className="flex items-center gap-4 px-3 pb-3 pt-5 sm:px-4 sm:pb-4 sm:pt-6">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5">
              <Link href={`/screens/${s.slug}`} className="truncate text-[17px] font-medium tracking-[-0.01em] text-fg after:absolute after:inset-0 after:z-10 after:rounded-[inherit]">
                {s.title}
              </Link>
              {isNew(s) && <NewBadge />}
              {s.pro ? <ProBadge /> : <FreeTag />}
            </div>
            <p className="mt-1.5 truncate text-[14px] text-muted">
              {s.kind}, made of {s.uses.length} components
            </p>
          </div>
          <TileArrow />
        </div>
      </div>
    </motion.li>
  );
}

/** The gallery: a dock to show the free ones or the Pro ones, and the screens two to a row. */
export function ScreensGallery() {
  const [show, setShow] = useState<"all" | "free" | "pro">("all");
  const list = SCREENS.filter((s) => show === "all" || (show === "pro") === !!s.pro);
  // The dock only when there's a choice: free and Pro screens both.
  const both = SCREENS.some((s) => s.pro) && SCREENS.some((s) => !s.pro);
  return (
    <>
      {both && <Dock label="Filter screens">
        <DockPill on={show === "all"} onClick={() => setShow("all")} icon={SquaresFourIcon} count={SCREENS.length}>
          All
        </DockPill>
        <DockPill on={show === "free"} onClick={() => setShow("free")} icon={AppWindowIcon} count={SCREENS.filter((s) => !s.pro).length}>
          Free
        </DockPill>
        <DockPill on={show === "pro"} onClick={() => setShow("pro")} icon={DiamondIcon} count={SCREENS.filter((s) => s.pro).length}>
          Pro
        </DockPill>
      </Dock>}
      <div className={cn(LIB_WRAP, "pt-10")}>
        <ul data-reveal-stagger="inner" className="grid gap-3 sm:gap-4 md:grid-cols-2">
          <AnimatePresence mode="popLayout" initial={false}>
            {list.map((s) => (
              <ScreenTile key={s.slug} s={s} />
            ))}
          </AnimatePresence>
        </ul>
      </div>
    </>
  );
}

/** Other screens, at the foot of a screen's page. */
export function MoreScreens({ slugs }: { slugs: string[] }) {
  return (
    <ul data-reveal-stagger="inner" className="grid gap-3 sm:gap-4 md:grid-cols-2">
      {slugs.map((slug) => {
        const s = SCREENS.find((x) => x.slug === slug);
        return s ? <ScreenTile key={slug} s={s} /> : null;
      })}
    </ul>
  );
}

/** Every screen, as the menu by a screen's name. */
export function ScreenMenu({ slug }: { slug: string }) {
  const s = SCREENS.find((x) => x.slug === slug)!;
  return <PieceMenu label="Screens" current={s.title} icon={AppWindowIcon} items={SCREENS.map((x) => ({ label: x.title, href: `/screens/${x.slug}`, icon: AppWindowIcon, hint: x.pro ? "Pro" : "Free" }))} />;
}

/* ---------- the stage ---------- */

/** How wide the window is at each size: a desktop fills whatever it's in, edge to edge. */
const WIDTHS = { desktop: "100%", tablet: 820, phone: 390 } as const;
type Width = keyof typeof WIDTHS;
const SIZES: Array<{ id: Width; label: string; icon: Icon }> = [
  { id: "desktop", label: "Desktop", icon: MonitorIcon },
  { id: "tablet", label: "Tablet", icon: DeviceTabletIcon },
  { id: "phone", label: "Phone", icon: DeviceMobileIcon },
];
const MODES: Array<{ id: ColorMode; label: string; icon: Icon }> = [
  { id: "light", label: "Light", icon: SunIcon },
  { id: "dark", label: "Dark", icon: MoonIcon },
];
const VIEWS: Array<{ id: "preview" | "code"; label: string; icon: Icon }> = [
  { id: "preview", label: "Preview", icon: EyeIcon },
  { id: "code", label: "Code", icon: CodeIcon },
];

/** A link in a screen goes to a page of its app, which isn't here: in the preview it stays put. */
const stayHere = (e: MouseEvent) => {
  const a = (e.target as Element).closest("a[href]");
  if (a && !a.getAttribute("href")?.startsWith("http")) e.preventDefault();
};

/** A Pro screen's file, from the gated route, for a Pro account. */
function useScreenSource(slug: string, want: boolean) {
  const [got, setGot] = useState<{ slug: string; source: string | null } | null>(null);
  useEffect(() => {
    if (!want) return;
    let gone = false;
    fetch(`/api/screens/${slug}`, { headers: previewHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { source?: string } | null) => !gone && setGot({ slug, source: d?.source ?? null }))
      .catch(() => !gone && setGot({ slug, source: null }));
    return () => {
      gone = true;
    };
  }, [slug, want]);
  const mine = got?.slug === slug ? got : null;
  return { loading: want && !mine, source: mine?.source ?? null };
}

/** What a Pro screen's code looks like before Pro: what it is, and the way to it. */
function ScreenLocked({ title, compact }: { title: string; compact?: boolean }) {
  return (
    <div className={cn("grid place-items-center text-center", compact ? "px-4 py-8" : "px-6 py-12")}>
      <span className="grid size-12 place-items-center rounded-full bg-[var(--bd-ui-track)] text-fg">
        <DiamondIcon size={20} weight="duotone" />
      </span>
      <p className="mt-4 text-[17px] font-medium">{title}&apos;s code comes with Pro</p>
      <p className="mt-1.5 max-w-[440px] text-ui text-muted">Try it here as much as you like. Pro brings this screen&apos;s file and every Pro component in it, with every template and section, for one payment.</p>
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

function ScreenCode({ s, source }: { s: ScreenMeta; source: string | null }) {
  const [plan] = usePlan();
  const fetched = useScreenSource(s.slug, !!s.pro && plan === "pro");
  const code = s.pro ? fetched.source : source;
  const frame = "mx-auto max-w-[960px] rounded-[var(--bd-r-sheet)] bg-surface shadow-[0_0_0_1px_var(--bd-line)]";
  if (s.pro && plan !== "pro") return <div className={frame}><ScreenLocked title={s.title} /></div>;
  if (fetched.loading) return <div className={cn(frame, "h-[320px] animate-pulse")} />;
  if (!code) return <p className="py-16 text-center text-ui text-muted">The code didn&apos;t come through. Reload the page and try again.</p>;
  return <CodeBlock code={code} file={`components/screens/${s.slug}.tsx`} maxHeight={620} className="mx-auto max-w-[960px]" />;
}

/** The prompt that hands a free screen to Claude Code. */
const screenPrompt = (s: ScreenMeta) =>
  `Add basedraft's ${s.title} screen to this project. If the project doesn't have ${PACKAGE} yet, run \`${installCommand()}\` and add \`${stylesImport}\` once to the root layout${s.uses.includes("toast") ? `, with <Toaster /> from ${PACKAGE} beside the page's children` : ""}. Save ${SITE}${screenFile(s.slug)} as components/screens/${s.slug}.tsx, then render <${s.name} /> on the page where it belongs, and change its words and data to this project's. It's made of ${s.uses.map((u) => componentOf(u)?.title ?? u).join(", ")}; each one's props are at ${SITE}/components/<name>.`;

/** Locks the page under the full-screen view, and leaves it with Escape when nothing in the screen is open. */
function useFullScreen(on: boolean, close: () => void) {
  useEffect(() => {
    if (!on) return;
    const root = document.documentElement;
    root.style.overflow = "hidden";
    const key = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      // A menu, a list or a dialog in the screen takes the Escape first.
      if (document.querySelector('[role="menu"], [role="listbox"], [role="dialog"]')) return;
      close();
    };
    window.addEventListener("keydown", key);
    return () => {
      root.style.overflow = "";
      window.removeEventListener("keydown", key);
    };
  }, [on, close]);
}

/** The screen in its window: as wide as the width picked, as tall as the box it's in, scrolling inside. */
function Window({ slug, width, run, className, ref }: { slug: string; width: Width; run: number; className?: string; ref?: Ref<HTMLDivElement> }) {
  const Screen = SCREEN_RENDERS[slug];
  return (
    <div ref={ref} onClickCapture={stayHere} style={{ maxWidth: WIDTHS[width] }} className={cn("mx-auto w-full overflow-hidden transition-[max-width] duration-500 ease-[var(--bd-ease)] [&>*]:h-full", className)}>
      {Screen ? <Screen key={run} /> : null}
    </div>
  );
}

/*
 * The states a screen's copy for Figma brings along beside how it opens, each reached by pressing
 * what's on it, found by its name, its label or its words ("a|b" tries a, then b; "?a" is pressed
 * only where it's there). An overlay state's last press opens something drawn outside the screen
 * (a portal to the page): it's caught and set back over the screen where it opened. A state whose
 * button isn't there at a width is left out there.
 */
type ScreenState = { name: string; press: string[]; overlay?: boolean };
const STATES: Record<string, ScreenState[]> = {
  roadmap: [
    { name: "Timeline", press: [] },
    { name: "Quarter", press: ["Quarter"] },
    { name: "Board", press: ["Board"] },
    { name: "Share", press: ["Share"], overlay: true },
    // Where the sidebar is a drawer, the drawer opens first, and the menu opens from it.
    { name: "Profile menu", press: ["?Open the menu", "Emily Carter"], overlay: true },
    // On a desk the sidebar folds to its rail; where it's a drawer, the drawer opens.
    { name: "Sidebar", press: ["Collapse the sidebar|Open the menu"] },
    { name: "Cursors off", press: ["Show everyone's cursors"] },
  ],
  deployments: [
    { name: "Building", press: [] },
    { name: "Deployment open", press: ["Open Round cart totals once, at checkout"] },
    { name: "Failed build", press: ["Open Cache product pages by region"] },
    { name: "Row menu", press: ["More for Search that forgives typos"], overlay: true },
    { name: "Redeploy options", press: ["More ways to redeploy"], overlay: true },
    { name: "Sidebar", press: ["Collapse the sidebar|Open the menu"] },
  ],
};

/** The control a state presses: by its accessible name, its title or its words, exactly first, then by its words in part. Only one that's showing: a row drawn twice (wide and narrow) has one copy hidden. */
function control(root: HTMLElement, label: string) {
  const all = [...root.querySelectorAll<HTMLElement>("button, [role=radio], [role=tab], [role=switch], a")].filter((b) => b.getClientRects().length > 0);
  for (const one of label.replace(/^\?/, "").split("|")) {
    const hit = all.find((b) => b.getAttribute("aria-label") === one || b.title === one || b.textContent?.trim() === one) ?? all.find((b) => b.textContent?.includes(one));
    if (hit) return hit;
  }
  return null;
}

/* Overlays are caught one drawing at a time, so each drawing claims only what its own press opened. */
let overlayTurn: Promise<unknown> = Promise.resolve();
/* What a press opens into the page stays unseen until it's set into the copy; drawings are never taken for it. */
const UNSEEN = "data-bd-unseen";
const DRAWING = "data-bd-drawing";
function hideCaught() {
  if (document.getElementById("bd-unseen")) return;
  const style = document.createElement("style");
  style.id = "bd-unseen";
  style.textContent = `[${UNSEEN}] { opacity: 0 !important; visibility: hidden !important; pointer-events: none !important; }`;
  document.head.appendChild(style);
}

/**
 * The screen drawn live and out of sight at a width, in the stage's light or dark, for the copy to
 * Figma. A screen lays itself out in script as well as in CSS (the sidebar folds to its rail, the
 * charts and the roadmap measure themselves), so each of Figma's viewports is drawn at its own
 * width and given a moment to settle, rather than copied from the one on screen.
 */
function drawAt(slug: string, width: number, mode: ColorMode, state?: ScreenState): Promise<{ el: HTMLElement; done: () => void; missing?: boolean }> {
  const Screen = SCREEN_RENDERS[slug];
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.setAttribute(DRAWING, "");
  host.inert = true;
  // Inside the window though unseen (clear, behind the page, shrunk to fit), so its charts count as
  // in view and play to their end before the copy.
  const fit = Math.min(innerWidth / width, innerHeight / 3200) * 0.9;
  Object.assign(host.style, { position: "fixed", left: "0px", top: "0px", width: `${width}px`, height: "860px", transform: `scale(${fit})`, transformOrigin: "0 0", opacity: "0", zIndex: "-1", pointerEvents: "none" });
  document.body.appendChild(host);
  const root = createRoot(host);
  // The site's own icon weight, and the stage's light or dark on the part that's copied, so the copy carries it.
  root.render(
    <IconContext.Provider value={{ weight: "duotone" }}>
      <div data-theme={mode === "dark" ? "dark" : undefined} className={cn("relative h-full text-fg [&>*]:h-full", mode === "light" && "bd-light")}>
        {Screen ? <Screen /> : null}
      </div>
    </IconContext.Provider>,
  );
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const done = () => {
    root.unmount();
    host.remove();
  };
  return (async () => {
    await wait(900);
    const el = host.firstElementChild as HTMLElement;
    // A state's buttons pressed in turn, each given a moment to show. An overlay's press waits its turn (below).
    const presses = state?.press ?? [];
    for (const label of state?.overlay ? presses.slice(0, -1) : presses) {
      const c = control(el, label);
      if (!c && label.startsWith("?")) continue;
      if (!c) return { el, done, missing: true };
      host.inert = false;
      c.click();
      host.inert = true;
      await wait(500);
    }
    const opener = state?.overlay ? control(el, presses[presses.length - 1]) : null;
    if (state?.overlay && !opener) return { el, done, missing: true };
    // Drawn first in a window's height, the screen scrolls its page inside it; then it's drawn again
    // exactly as tall as that page, so nothing scrolls and what's pinned to the foot (the sidebar's
    // account) sits at the foot, the way it would in a window that tall.
    const top = el.getBoundingClientRect().top;
    const page = [...el.querySelectorAll<HTMLElement>("*")]
      .filter((x) => /(auto|scroll)/.test(getComputedStyle(x).overflowY) && x.scrollHeight > x.clientHeight + 1)
      .sort((x, y) => y.clientWidth * y.clientHeight - x.clientWidth * x.clientHeight)[0];
    const tall = Math.ceil(Math.max(860, page ? (page.getBoundingClientRect().top - top) / fit + page.scrollHeight : el.scrollHeight));
    host.style.height = `${tall}px`;
    el.style.height = `${tall}px`;
    await wait(500);
    if (state?.overlay) {
      const turn = overlayTurn.then(() => openOverlay(host, el, opener!, wait));
      overlayTurn = turn.catch(() => undefined);
      await turn;
    }
    return { el, done };
  })();
}

/**
 * Presses what opens an overlay and sets the overlay into the screen where it opened. For the press
 * the drawing goes full size, its trigger as far from the window's nearest corner as it is from the
 * screen's, so the overlay picks the side and the edge it would in a window the screen's size.
 * What the press puts into the page is hidden the moment it lands, and focus goes back where it was.
 */
async function openOverlay(host: HTMLElement, el: HTMLElement, trigger: HTMLElement, wait: (ms: number) => Promise<unknown>) {
  hideCaught();
  const was = host.style.transform;
  const at = trigger.getBoundingClientRect();
  const box = el.getBoundingClientRect();
  const scale = box.width / el.offsetWidth;
  const [W, H] = [el.offsetWidth, el.offsetHeight];
  // Where the trigger sits in the drawing at full size, and where in the window it goes.
  const [L, T, w, h] = [(at.left - box.left) / scale, (at.top - box.top) / scale, at.width / scale, at.height / scale];
  const x = Math.min(Math.max(8, L + w / 2 < W / 2 ? L : innerWidth - (W - L)), innerWidth - w - 8);
  const y = Math.min(Math.max(8, T + h / 2 < H / 2 ? T : innerHeight - (H - T)), innerHeight - h - 8);
  host.style.transform = `translate(${Math.round(x - L)}px, ${Math.round(y - T)}px)`;
  const focus = document.activeElement as HTMLElement | null;
  const caught: HTMLElement[] = [];
  const watch = new MutationObserver((records) =>
    records.forEach((r) =>
      r.addedNodes.forEach((n) => {
        if (!(n instanceof HTMLElement) || n.hasAttribute(DRAWING) || n.id === "bd-unseen") return;
        n.setAttribute(UNSEEN, "");
        n.inert = true;
        caught.push(n);
      }),
    ),
  );
  watch.observe(document.body, { childList: true });
  host.inert = false;
  trigger.click();
  await wait(700);
  host.inert = true;
  watch.disconnect();
  focus?.focus?.({ preventScroll: true });
  const frame = el.getBoundingClientRect();
  for (const node of caught) {
    // Only what the press opened (a dialog or a menu); anything else that landed meanwhile is let be.
    const panel = node.matches("[role=dialog], [role=menu], [role=listbox]") ? node : node.querySelector<HTMLElement>("[role=dialog], [role=menu], [role=listbox]");
    const r = panel?.getBoundingClientRect();
    if (!panel || !r?.width || !r.height) {
      node.removeAttribute(UNSEEN);
      node.inert = false;
      continue;
    }
    // Its copy, where it opened beside its trigger, kept inside the screen: no wider than a phone's
    // width leaves it (it measured itself against the window, not the screen), as tall as it holds.
    const copy = panel.cloneNode(true) as HTMLElement;
    const width = Math.min(r.width, el.offsetWidth - 16);
    const left = Math.max(8, Math.min(r.left - frame.left, el.offsetWidth - width - 8));
    const top = Math.max(8, r.top - frame.top);
    // Over the screen at its own height, so over the drawer it may have opened from too.
    const z = Number(getComputedStyle(panel).zIndex) || 60;
    Object.assign(copy.style, { position: "absolute", left: `${Math.round(left)}px`, top: `${Math.round(top)}px`, right: "auto", bottom: "auto", width: `${width}px`, height: "auto", margin: "0", transform: "none", zIndex: String(z), opacity: "1", visibility: "visible" });
    el.appendChild(copy);
  }
  host.style.transform = was;
}

/**
 * A screen's stage: the screen live in a window you can set to a desktop's, a tablet's or a phone's
 * width and to light or dark, whatever the site is in, open full screen, or turn to its code. The
 * screen lays itself out by its window's width, not the browser's, and scrolls inside it, the way
 * an app does, so the page stays put while you try it.
 */
export function ScreenStage({ s, source }: { s: ScreenMeta; source: string | null }) {
  const site = useColorMode();
  const [picked, setPicked] = useState<ColorMode | null>(null);
  const mode = picked ?? site;
  const [width, setWidth] = useState<Width>("desktop");
  const [view, setView] = useState<"preview" | "code">("preview");
  const [run, setRun] = useState(0);
  const [full, setFull] = useState(false);
  const leave = useCallback(() => setFull(false), []);
  // The screen as it's drawn now, for Paper and SVG; for Figma each viewport is drawn at its own width (drawAt).
  const shown = useRef<HTMLDivElement>(null);
  const draw = useCallback((w: number, state?: string) => drawAt(s.slug, w, mode, STATES[s.slug]?.find((x) => x.name === state)), [s.slug, mode]);
  useFullScreen(full, leave);
  const theme = { "data-theme": mode === "dark" ? "dark" : undefined, className: mode === "light" ? "bd-light" : undefined };
  const restart = (
    <button type="button" onClick={() => setRun((r) => r + 1)} aria-label="Start the screen over" title="Start over" className={cn("grid size-9 place-items-center rounded-full text-muted transition-colors hover:text-fg", GLASS)}>
      <ArrowCounterClockwiseIcon weight="regular" size={14} />
    </button>
  );
  return (
    <section id="preview" aria-label="Preview" className="scroll-mt-[calc(var(--bd-header-h,80px)+80px)]">
      <div data-theme={theme["data-theme"]} className={cn("bd-panel relative isolate overflow-hidden rounded-[32px] text-fg", theme.className)}>
        <div className="flex items-center justify-between gap-3 p-3 sm:p-4">
          <span className={cn("inline-flex h-9 min-w-0 items-center gap-2 rounded-full px-3.5 font-mono text-[12px] text-muted", GLASS)}>
            <LockSimpleIcon size={13} weight="duotone" className="shrink-0 text-subtle" />
            <span className="truncate">{s.path}</span>
          </span>
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="max-lg:hidden">
              <DesignCopyMenu
                targets={[
                  {
                    name: s.title,
                    get: () => {
                      const el = shown.current?.firstElementChild as HTMLElement | null;
                      if (el) el.dataset.exportHeight = "auto";
                      return el;
                    },
                    draw,
                    states: STATES[s.slug]?.map((x) => x.name),
                  },
                ]}
              />
            </span>
            <span className="max-md:hidden">
              <IconSwitch label="Width" value={width} options={SIZES} onChange={setWidth} />
            </span>
            <IconSwitch label="Stage" value={mode} options={MODES} onChange={setPicked} />
            {restart}
            <button type="button" onClick={() => setFull(true)} aria-label="Full screen" title="Full screen" className={cn("grid size-9 place-items-center rounded-full text-muted transition-colors hover:text-fg", GLASS)}>
              <ArrowsOutSimpleIcon weight="regular" size={15} />
            </button>
          </div>
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={view} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }} className="px-2 pb-24 sm:px-4">
            {view === "code" ? (
              <ScreenCode s={s} source={source} />
            ) : full ? (
              <div className="grid h-[clamp(520px,calc(100dvh-250px),860px)] place-items-center rounded-[20px] text-ui text-muted shadow-[inset_0_0_0_1px_var(--bd-line)]">It&apos;s full screen now. Escape brings it back.</div>
            ) : (
              <Window ref={shown} slug={s.slug} width={width} run={run} className="h-[clamp(520px,calc(100dvh-250px),860px)] rounded-[20px] shadow-[0_0_0_1px_var(--bd-line),var(--bd-shadow-raised)]" />
            )}
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-x-0 bottom-4 flex justify-center px-3">
          <div className={cn("flex max-w-full items-center gap-1 rounded-full p-1", GLASS)}>
            <IconSwitch label="Show" value={view} options={VIEWS} onChange={setView} />
            {/* A Pro screen's file comes only with Pro, in its card below: no download or prompt here. */}
            {!s.pro && (
              <>
                <span aria-hidden className="mx-1 h-5 w-px shrink-0 bg-line max-sm:hidden" />
                <a href={screenFile(s.slug)} download className="flex h-9 shrink-0 items-center gap-2 rounded-full px-3 font-mono text-[12px] text-muted transition-colors hover:bg-fg/[0.06] hover:text-fg max-sm:hidden">
                  <DownloadSimpleIcon size={14} weight="duotone" />
                  {s.slug}.tsx
                </a>
                <ClaudeCodeButton prompt={screenPrompt(s)} label="Claude Code" small />
              </>
            )}
          </div>
        </div>
      </div>
      {/* Full screen: the screen over the whole window, the same controls floating at its foot. */}
      {full &&
        createPortal(
          <motion.div role="region" aria-label={`${s.title}, full screen`} data-theme={theme["data-theme"]} initial={{ opacity: 0, scale: 0.985 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }} className={cn("fixed inset-0 z-[70] flex flex-col bg-[var(--bd-ui-track)] text-fg", theme.className)}>
            {/* At a desktop's width the screen is the whole window; narrower, it stands in the middle with room at its foot for the controls. */}
            <div className={cn("flex min-h-0 flex-1", width !== "desktop" && "px-3 pb-20 pt-3 sm:px-6 sm:pt-6")}>
              <Window slug={s.slug} width={width} run={run} className={cn("h-full", width !== "desktop" && "rounded-[20px] shadow-[0_0_0_1px_var(--bd-line),var(--bd-shadow-float)]")} />
            </div>
            {/* The controls float over the screen's foot, on glass, so the screen keeps all of the window. */}
            <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-3">
              <div className={cn("pointer-events-auto flex items-center gap-1.5 rounded-full p-1", GLASS, "shadow-[var(--bd-shadow-float),inset_0_0_0_1px_var(--bd-line)]")}>
                <span className="max-md:hidden">
                  <IconSwitch label="Width" value={width} options={SIZES} onChange={setWidth} />
                </span>
                <IconSwitch label="Stage" value={mode} options={MODES} onChange={setPicked} />
                <button type="button" onClick={leave} className="flex h-8 items-center gap-2 rounded-full bg-fg px-3.5 text-[12.5px] font-medium text-canvas transition-opacity hover:opacity-90">
                  <ArrowsInSimpleIcon weight="regular" size={14} /> Exit <kbd className="font-sans text-[11px] text-canvas/60">Esc</kbd>
                </button>
              </div>
            </div>
          </motion.div>,
          document.body,
        )}
      {/* The screens' toasts show here: in an app, <Toaster /> is mounted once in its root layout. */}
      <Toaster />
    </section>
  );
}

/* ---------- what it's made of ---------- */

/** A component a screen is made of, as a card that goes to its page. */
function UsedCard({ c }: { c: ComponentMeta }) {
  const I = COMPONENT_ICON[c.name] ?? StackIcon;
  return (
    <li className="min-w-0">
      <Link href={`/components/${c.name}`} className={cn(TILE, "h-full p-4")}>
        <span className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-surface text-fg shadow-[var(--bd-shadow-resting),inset_0_0_0_1px_var(--bd-line-subtle)]">
            <I size={18} weight="duotone" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="truncate text-[15px] font-medium text-fg">{c.title}</span>
              {isNew(c) && <NewBadge />}
              {c.pro && <ProBadge />}
            </span>
            <span className="block truncate text-[12.5px] text-subtle">{c.group}</span>
          </span>
          <TileArrow />
        </span>
        <span className="mt-3 line-clamp-2 text-[13px] leading-[1.5] text-muted">{c.description}</span>
      </Link>
    </li>
  );
}

/** Every component a screen is made of, each a card to its page. */
export function UsedComponents({ names }: { names: string[] }) {
  const list = names.map((n) => componentOf(n)).filter((c): c is ComponentMeta => !!c);
  return (
    <ul data-reveal-stagger className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
      {list.map((c) => (
        <UsedCard key={c.name} c={c} />
      ))}
    </ul>
  );
}

/* ---------- taking it home ---------- */

function useCopied() {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(t);
  }, [copied]);
  return [copied, (text: string) => navigator.clipboard?.writeText(text).then(() => setCopied(true))] as const;
}

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <li className="grid grid-cols-[28px_minmax(0,1fr)] gap-x-3">
      <span className="grid size-7 place-items-center rounded-full bg-fg/[0.06] text-[12px] font-medium tabular-nums text-fg">{n}</span>
      <div className="min-w-0 pt-[3px]">
        <p className="text-ui font-medium text-fg">{title}</p>
        <div className="mt-3">{children}</div>
      </div>
    </li>
  );
}

/**
 * How a screen gets into a project: the package, the file, and the line that shows it. A Pro
 * screen also needs its Pro components' files; before Pro, the card says what Pro brings.
 */
export function TakeScreen({ s, source }: { s: ScreenMeta; source: string | null }) {
  const [plan] = usePlan();
  const locked = !!s.pro && plan !== "pro";
  const fetched = useScreenSource(s.slug, !!s.pro && plan === "pro");
  const code = s.pro ? fetched.source : source;
  const [copied, copy] = useCopied();
  const pros = s.uses.map((u) => componentOf(u)).filter((c): c is ComponentMeta => !!c?.pro);
  return (
    <section id="take" aria-labelledby="take-title" className="scroll-mt-[calc(var(--bd-header-h,80px)+80px)] pt-16">
      <div data-scroll="settle" className="bd-light bd-paper glow-c relative isolate overflow-hidden rounded-[32px] p-2 sm:p-3">
        <div className="grid gap-2 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
          <div className="flex flex-col p-4 sm:p-6">
            <h2 id="take-title" className="flex flex-wrap items-center gap-2.5 text-balance font-display text-[30px] font-medium leading-[1.08] tracking-[-0.032em]">
              Take it home {s.pro && <ProBadge />}
            </h2>
            <p className="mt-3 text-ui text-paper-muted">One file, made of basedraft UI. It goes into your project as it is, and every word and number in it is yours to change.</p>
            <ul className="mt-6 grid gap-2.5 text-[13px] text-paper-muted max-sm:hidden [&_svg]:shrink-0 [&_svg]:text-paper-ink/60">
              <li className="flex items-center gap-2.5">
                <FileTsxIcon size={16} weight="duotone" />
                <span className="truncate font-mono text-[12px]">components/screens/{s.slug}.tsx</span>
              </li>
              <li className="flex items-center gap-2.5">
                <StackIcon size={16} weight="duotone" />
                {s.uses.length} components, {s.lines} lines
              </li>
            </ul>
          </div>
          <div className="min-w-0 rounded-[24px] bg-surface p-2 shadow-[var(--bd-shadow-raised),inset_0_0_0_1px_var(--bd-line-subtle)]">
            {locked ? (
              <ScreenLocked title={s.title} compact />
            ) : (
              <ol className="grid gap-6 p-2 pt-3 sm:p-3 sm:pt-4">
                <Step n={1} title="Install basedraft UI, and its styles once">
                  <div className="grid gap-2">
                    <CopyLine command={installCommand()} />
                    <CopyLine command={stylesImport} code />
                  </div>
                </Step>
                {pros.length > 0 && (
                  <Step n={2} title="Add the Pro components it uses">
                    <p className="text-meta text-muted">Each one is a file on its page, for components/basedraft/.</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {pros.map((c) => (
                        <Link key={c.name} href={`/components/${c.name}#take`} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-fg/[0.05] px-3 font-mono text-[12px] text-fg transition-colors hover:bg-fg/[0.09]">
                          {c.name}.tsx
                        </Link>
                      ))}
                    </div>
                  </Step>
                )}
                <Step n={pros.length ? 3 : 2} title={`Save the screen as components/screens/${s.slug}.tsx`}>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" disabled={!code} onClick={() => code && copy(code)} className={cn(btn.ink, "disabled:opacity-50")}>
                      {copied ? <CheckIcon size={15} weight="regular" /> : <CopyIcon size={15} weight="duotone" />}
                      {copied ? "Copied" : "Copy the file"}
                    </button>
                    {s.pro ? (
                      <a href={`/api/screens/${s.slug}?download=1`} className={btn.outline}>
                        <DownloadSimpleIcon size={15} weight="duotone" /> Download
                      </a>
                    ) : (
                      <>
                        <a href={screenFile(s.slug)} download className={btn.outline}>
                          <DownloadSimpleIcon size={15} weight="duotone" /> Download
                        </a>
                        <ClaudeCodeButton prompt={screenPrompt(s)} small />
                      </>
                    )}
                  </div>
                </Step>
                <Step n={pros.length ? 4 : 3} title="Show it on a page">
                  <CopyLine command={`import ${s.name} from "@/components/screens/${s.slug}";`} code />
                  <p className="mt-2 text-meta text-muted">It fills the box it&apos;s in and scrolls inside, like an app, so give that box a height: {"<div className=\"h-dvh\">"}.</p>
                  {s.uses.includes("toast") && <p className="mt-2 text-meta text-muted">Its toasts need {"<Toaster />"} from {PACKAGE}, once, in the root layout.</p>}
                </Step>
              </ol>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/** The screens a component is part of, as small cards, on its page. */
export function ScreenLinks({ slugs }: { slugs: string[] }) {
  const list = slugs.map((slug) => SCREENS.find((x) => x.slug === slug)).filter((x): x is ScreenMeta => !!x);
  return (
    <ul data-reveal-stagger className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
      {list.map((x) => (
        <li key={x.slug} className="min-w-0">
          <Link href={`/screens/${x.slug}`} className={cn(TILE, "h-full p-4")}>
            <span className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-surface text-fg shadow-[var(--bd-shadow-resting),inset_0_0_0_1px_var(--bd-line-subtle)]">
                <AppWindowIcon size={18} weight="duotone" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate text-[15px] font-medium text-fg">{x.title}</span>
                  {x.pro ? <ProBadge /> : <FreeTag />}
                </span>
                <span className="block truncate text-[12.5px] text-subtle">
                  {x.kind}, with {x.uses.length - 1} other components
                </span>
              </span>
              <TileArrow />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
