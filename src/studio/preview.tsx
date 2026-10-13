"use client";

import { ArrowClockwiseIcon, ArrowSquareOutIcon, CaretDownIcon, DesktopIcon, DeviceMobileIcon, DeviceTabletIcon, FileIcon, HouseIcon, LaptopIcon, PencilSimpleIcon, ArrowsOutLineHorizontalIcon, XIcon } from "@phosphor-icons/react";
import { LayoutGroup, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Tip } from "@/site/keys";
import { composeUrl, liveUrl, templateOf } from "@/site/live";
import { Menu, type MenuItem } from "@/site/menu";
import { applyEdits, original, setText, textsIn } from "@/site/text-edits";
import { applyTheme, themeCss } from "@/site/theme";
import { SAVED_KEY, savedProject, type Project, type View } from "./state";

/*
 * Preview: a page as it will ship, the template's own page with your text and colors laid over
 * it, the same way the canvas does. It opens over Studio (the Play buttons; Esc closes it) or in
 * its own tab, where it follows Studio's saves as you edit.
 *
 * Across the top: close, which page, the viewport (four real widths, or the window's), a reload,
 * and a way out to a tab of its own. Links inside the page work, as on the real site.
 */

export type Viewport = "desktop" | "laptop" | "tablet" | "phone" | "fill";
const VIEWPORTS: Array<{ id: Viewport; label: string; width: number | null; height: number | null; icon: typeof DesktopIcon }> = [
  { id: "desktop", label: "Desktop", width: 1440, height: 900, icon: DesktopIcon },
  { id: "laptop", label: "Laptop", width: 1280, height: 800, icon: LaptopIcon },
  { id: "tablet", label: "Tablet", width: 820, height: 1180, icon: DeviceTabletIcon },
  { id: "phone", label: "Phone", width: 390, height: 844, icon: DeviceMobileIcon },
  { id: "fill", label: "Fill the window", width: null, height: null, icon: ArrowsOutLineHorizontalIcon },
];
export const viewportFor = (width?: number | null): Viewport => VIEWPORTS.find((v) => v.width === width)?.id ?? "desktop";

const PANEL = "rounded-[12px] bg-surface shadow-[0_0_0_0.5px_rgb(var(--bd-ink)/0.12),0_1px_3px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.08)]";
const ICON_BTN = "grid size-8 shrink-0 place-items-center rounded-[7px] text-fg/80 transition-colors hover:bg-fg/[0.06] hover:text-fg";

export const previewHref = (v: View, viewport?: Viewport) => {
  const width = VIEWPORTS.find((x) => x.id === viewport)?.width;
  return `/studio/preview?${v.kind === "page" ? `page=${v.id}` : `path=${encodeURIComponent(v.path)}`}${width ? `&w=${width}` : ""}`;
};

/** The template's page that a URL in the frame shows, if it's one of its own. */
const pathIn = (slug: string, pathname: string) => (pathname.startsWith(`/live/${slug}/bd/`) ? null : pathname.replace(new RegExp(`^/live/${slug}`), "") || "/");

export function PreviewView({ project, view: initial, viewport: startAt = "desktop", onClose, onEdit, standalone }: { project: Project; view: View; viewport?: Viewport; onClose: () => void; onEdit?: () => void; standalone?: boolean }) {
  const t = templateOf(project.template)!;
  const [view, setView] = useState<View>(initial);
  const [viewport, setViewport] = useState<Viewport>(startAt);
  const [nonce, setNonce] = useState(0);
  const page = view.kind === "page" ? (project.pages.find((p) => p.id === view.id) ?? null) : null;
  const compose = Boolean(page);
  // The frame's address is set when it's opened; a new list of sections is posted to it.
  const src = page ? composeUrl(project.template, page.keys) : liveUrl(project.template, view.kind === "route" ? view.path : "/");
  const [openSrc, setOpenSrc] = useState(src);
  const frameKey = `${view.kind === "page" ? view.id : view.path}|${nonce}`;
  const [lastKey, setLastKey] = useState(frameKey);
  if (frameKey !== lastKey) {
    setLastKey(frameKey);
    setOpenSrc(src);
  }
  const frame = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const [at, setAt] = useState<string | null>(null);
  const css = themeCss(project.template, project.theme);

  // The room the page has, to scale a viewport wider than the window down to fit.
  const stage = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState({ w: 1200, h: 800 });
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setRoom({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const vp = VIEWPORTS.find((v) => v.id === viewport)!;
  const width = vp.width ?? room.w;
  const scale = vp.width ? Math.min(1, (room.w - 48) / vp.width) : 1;
  const height = vp.width ? Math.max(320, (room.h - 24) / scale) : room.h;

  const latest = useRef({ project, page, css });
  useEffect(() => {
    latest.current = { project, page, css };
  });

  /** Your text and colors over the template's, with anything no longer edited put back. */
  const paint = useCallback(() => {
    const d = frame.current?.contentDocument;
    if (!d?.body) return;
    for (const n of textsIn(d.body)) if ((n as Text & { bdFrom?: string }).bdFrom !== undefined) setText(n, original(n));
    applyEdits(d, latest.current.project.edits);
    applyTheme(d, latest.current.css);
  }, []);

  useEffect(() => {
    const on = (e: MessageEvent) => {
      if (e.origin !== location.origin || e.source !== frame.current?.contentWindow) return;
      if (e.data?.type === "bd:ready") {
        setReady(true);
        const { page: pg, css: c } = latest.current;
        if (pg) frame.current?.contentWindow?.postMessage({ type: "bd:sections", keys: pg.keys }, location.origin);
        if (c) frame.current?.contentWindow?.postMessage({ type: "bd:theme", css: c }, location.origin);
      }
      if (e.data?.type === "bd:rendered") requestAnimationFrame(paint);
    };
    window.addEventListener("message", on);
    return () => window.removeEventListener("message", on);
  }, [paint]);

  // Each change in Studio: the sections, the colors (pages made of sections draw again with them) and the text.
  const sent = useRef(css);
  useEffect(() => {
    const w = frame.current?.contentWindow;
    if (!ready || !w) return;
    if (compose && page) w.postMessage({ type: "bd:sections", keys: page.keys }, location.origin);
    if (compose && css !== sent.current) w.postMessage({ type: "bd:theme", css }, location.origin);
    sent.current = css;
    paint();
  }, [ready, compose, page, css, project.edits, paint]);

  // Links inside the page move it without a load; where it went is checked, and painted again.
  useEffect(() => {
    const id = setInterval(() => {
      try {
        const p = frame.current?.contentWindow?.location.pathname;
        if (!p) return;
        const next = pathIn(project.template, p);
        if (next !== at) {
          setAt(next);
          requestAnimationFrame(paint);
        }
      } catch {
        /* a link that left the site isn't ours to read */
      }
    }, 400);
    return () => clearInterval(id);
  }, [project.template, at, paint]);

  const close = useCallback(() => onClose(), [onClose]);
  const reload = () => {
    setReady(false);
    setAt(null);
    setNonce((n) => n + 1);
  };
  const keys = useCallback(
    (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      const typing = e.target instanceof HTMLElement && (e.target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName));
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      } else if (!typing && /^[1-5]$/.test(e.key)) setViewport(VIEWPORTS[Number(e.key) - 1].id);
      else if (!typing && e.key.toLowerCase() === "r") reload();
    },
    [close],
  );
  // Heard in the page as well as around it: focus is usually inside the frame.
  useEffect(() => {
    window.addEventListener("keydown", keys);
    return () => window.removeEventListener("keydown", keys);
  }, [keys]);
  const listen = () => {
    try {
      frame.current?.contentWindow?.addEventListener("keydown", keys);
    } catch {
      /* not ours */
    }
  };

  const go = (v: View) => {
    setView(v);
    setReady(false);
    setAt(null);
  };
  const pageLabel = page ? page.name : (t.pages.find((p) => p.path === (view.kind === "route" ? view.path : "/"))?.label ?? "Page");
  const elsewhere = at && view.kind === "route" && at !== view.path ? (t.pages.find((p) => p.path === at)?.label ?? at) : at && view.kind === "page" ? (t.pages.find((p) => p.path === at)?.label ?? at) : null;
  const pages: MenuItem[] = [
    ...project.pages.map((p) => ({ label: p.name, icon: p.path === "/" ? HouseIcon : FileIcon, hint: p.path, onSelect: () => go({ kind: "page", id: p.id }) })),
    "divider" as const,
    ...t.pages.filter((p) => p.path !== "/").map((p) => ({ label: p.label, icon: FileIcon, hint: `${t.name}'s`, onSelect: () => go({ kind: "route", path: p.path }) })),
  ];

  return (
    <div className="fixed inset-0 z-[250] flex flex-col bg-well text-fg">
      <div className="relative z-10 flex shrink-0 items-center justify-between gap-3 px-3 pt-3">
        <div className={cn(PANEL, "flex min-w-0 items-center gap-1 p-1.5")}>
          <Tip label={standalone ? "Close preview" : "Back to Studio"} keys="Esc" side="bottom">
            <button type="button" onClick={close} aria-label={standalone ? "Close preview" : "Back to Studio"} className={ICON_BTN}>
              <XIcon size={15} weight="bold" />
            </button>
          </Tip>
          <span aria-hidden className="mx-1 h-5 w-px bg-line" />
          <Menu
            label="Page"
            align="left"
            buttonClassName="flex h-8 min-w-0 max-w-[260px] items-center gap-1.5 rounded-[7px] px-2 text-[13px] font-medium transition-colors hover:bg-fg/[0.06]"
            button={
              <>
                <span className="truncate">
                  {project.name} <span className="text-subtle">/</span> {elsewhere ?? pageLabel}
                </span>
                <CaretDownIcon size={10} weight="bold" className="shrink-0 text-subtle" />
              </>
            }
            items={pages}
          />
        </div>

        <div className={cn(PANEL, "flex items-center gap-1 p-1.5")}>
          <LayoutGroup id="preview-viewports">
            <div role="radiogroup" aria-label="Viewport" className="flex">
              {VIEWPORTS.map((v, i) => {
                const on = v.id === viewport;
                return (
                  <Tip key={v.id} label={`${v.label}${v.width ? `, ${v.width}` : ""}`} keys={String(i + 1)} side="bottom">
                    <button type="button" role="radio" aria-checked={on} aria-label={v.label} onClick={() => setViewport(v.id)} className={cn("relative grid size-8 place-items-center rounded-[7px] transition-colors", on ? "text-fg" : "text-muted hover:text-fg")}>
                      {on && <motion.span layoutId="preview-vp" className="absolute inset-0 rounded-[7px] bg-fg/[0.08]" transition={{ type: "spring", stiffness: 520, damping: 40 }} />}
                      <v.icon size={16} weight={on ? "duotone" : "regular"} className="relative" />
                    </button>
                  </Tip>
                );
              })}
            </div>
          </LayoutGroup>
          <span className="min-w-[96px] px-2 text-center text-[12px] tabular-nums text-muted">
            {Math.round(width)} × {Math.round(vp.height ?? room.h)}
            {scale < 1 && <span className="text-subtle">, {Math.round(scale * 100)}%</span>}
          </span>
        </div>

        <div className={cn(PANEL, "flex items-center gap-0.5 p-1.5")}>
          <Tip label="Reload" keys="R" side="bottom">
            <button type="button" onClick={() => reload()} aria-label="Reload" className={ICON_BTN}>
              <ArrowClockwiseIcon size={15} />
            </button>
          </Tip>
          {!standalone && (
            <Tip label="Open in a new tab" side="bottom">
              <button type="button" onClick={() => window.open(previewHref(view, viewport), "_blank")} aria-label="Open in a new tab" className={ICON_BTN}>
                <ArrowSquareOutIcon size={15} />
              </button>
            </Tip>
          )}
          {onEdit && (
            <button type="button" onClick={onEdit} className="ml-1 flex h-8 items-center gap-1.5 rounded-[7px] bg-fg px-3 text-[13px] font-medium text-canvas transition-opacity hover:opacity-90">
              <PencilSimpleIcon size={14} weight="bold" /> {standalone ? "Edit in Studio" : "Back to editing"}
            </button>
          )}
        </div>
      </div>

      <div ref={stage} className="relative min-h-0 flex-1">
        <div className="absolute inset-0 flex items-start justify-center overflow-hidden pt-3">
          <div
            className={cn("origin-top overflow-hidden bg-white transition-[width,height,transform] duration-300 ease-out", vp.width ? "rounded-[8px] shadow-[0_0_0_1px_rgb(var(--bd-ink)/0.08),0_24px_60px_-24px_rgb(var(--bd-shade)/0.35)]" : "")}
            style={{ width, height, transform: scale < 1 ? `scale(${scale})` : undefined }}
          >
            <iframe
              key={frameKey}
              ref={frame}
              src={openSrc}
              title={`Preview of ${pageLabel}`}
              className="block h-full w-full border-0"
              onLoad={() => {
                listen();
                // A template's own page is ready once it loads; pages made of sections say so themselves.
                if (!compose) {
                  setReady(true);
                  requestAnimationFrame(paint);
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/** The preview in a tab of its own: it reads the draft Studio saved in this browser, and follows it. */
export default function PreviewPage() {
  const router = useRouter();
  const [q] = useState(() => new URLSearchParams(window.location.search));
  const [project, setProject] = useState(savedProject);
  useEffect(() => {
    const on = (e: StorageEvent) => e.key === SAVED_KEY && setProject(savedProject());
    window.addEventListener("storage", on);
    return () => window.removeEventListener("storage", on);
  }, []);
  const pageId = q.get("page");
  const view: View = pageId ? { kind: "page", id: pageId } : { kind: "route", path: q.get("path") ?? "/" };
  useEffect(() => {
    if (project) document.title = `${project.name} | Preview`;
  }, [project]);
  // Opened from Studio, the tab closes; reached some other way, it goes to Studio.
  const leave = () => {
    window.close();
    setTimeout(() => router.push("/studio"), 150);
  };

  if (!project || (pageId && !project.pages.some((p) => p.id === pageId)))
    return (
      <div className="grid h-dvh place-items-center bg-well p-8 text-center">
        <div className="max-w-[360px]">
          <h1 className="text-title">Nothing to preview here</h1>
          <p className="mt-2 text-body text-muted">This page isn&apos;t in the draft open in Studio on this browser any more.</p>
          <a href="/studio" className="mt-6 inline-flex h-9 items-center gap-2 rounded-control bg-fg px-3.5 text-ui font-medium text-canvas">
            Back to Studio
          </a>
        </div>
      </div>
    );
  return <PreviewView project={project} view={view} viewport={viewportFor(Number(q.get("w")) || null)} onClose={leave} onEdit={() => router.push("/studio")} standalone />;
}
