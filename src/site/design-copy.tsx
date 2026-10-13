"use client";

import { CaretDownIcon, DownloadSimpleIcon, FigmaLogoIcon, FileHtmlIcon, LockSimpleIcon, type Icon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { cn, EASE_OUT } from "@/lib/utils";
import { downloadFile, EXPORT_GUTTER, EXPORT_WIDTH, figmaCopyFor, figmaSvgFor, paperHtmlFor, writeClipboard } from "./design-export";
import { prepareLive, type LiveCopy } from "./live-export";
import { usePlan } from "./plan";
import { openPro } from "./pro-modal";
import { btn, btnSm } from "./sheet";
import { toast } from "./toast";
import { track } from "./analytics";

export interface CopyTarget {
  /** What to copy, e.g. "Hero / Split" or "Zuno home". */
  name: string;
  /** Returns the rendered element at the moment of copying. */
  get: () => HTMLElement | null;
  /** For a real template section or page: where to draw it at each width, since templates lay out by viewport. */
  live?: LiveCopy;
}

/** Starts making a live target's layers, so they're ready by the time the copy is clicked. */
export const prepareCopy = (t: CopyTarget) => void (t.live && prepareLive(t.live, t.name).catch(() => undefined));

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export type CopyKind = "figma" | "paper" | "svg";

/** Copies a section or page for a design tool, with a toast either way. Call it straight from a click. */
export async function copyToDesign(kind: CopyKind, t: CopyTarget) {
  if (t.live) return copyLive(kind, t, t.live);
  const el = t.get();
  if (!el) return toast("Nothing to copy yet", { tone: "error", detail: "Wait for the preview to load, then try again." });
  const frame = `${EXPORT_WIDTH} wide, ${EXPORT_GUTTER}px side margins.`;
  try {
    if (kind === "figma") {
      const copy = figmaCopyFor(el, t.name);
      await writeClipboard({ "text/html": copy.html, "text/plain": copy.svg }, { exact: true });
      toast(`Copied ${t.name} for Figma`, { detail: "Desktop, tablet and phone, as component variants with auto layout. Paste into any Figma file with {Cmd V}." });
      track("copied_design", { kind, name: t.name });
    } else if (kind === "paper") {
      const html = paperHtmlFor(el, t.name);
      await writeClipboard({ "text/html": html, "text/plain": html });
      toast(`Copied ${t.name} for Paper`, { detail: `One responsive frame, ${EXPORT_WIDTH} wide, that reflows as you resize it. Paste onto a Paper artboard with {Cmd V}.` });
      track("copied_design", { kind, name: t.name });
    } else {
      downloadFile(`${slug(t.name)}.svg`, await figmaSvgFor(el, t.name), "image/svg+xml");
      toast(`Downloaded ${slug(t.name)}.svg`, { detail: frame });
      track("copied_design", { kind, name: t.name });
    }
  } catch (e) {
    toast("Couldn't write to the clipboard", { tone: "error", detail: e instanceof Error ? e.message : "Your browser blocked it. Try Download SVG." });
  }
}

/** A real section or page: layers read from the template's own page at each width. */
async function copyLive(kind: CopyKind, t: CopyTarget, live: LiveCopy) {
  const made = prepareLive(live, t.name);
  try {
    if (kind === "figma") {
      const html = Promise.all([made, import("./figma-clipboard")]).then(([r, m]) => m.figmaClipboardHtml(r.views));
      await writeClipboard({ "text/html": html, "text/plain": made.then((r) => r.svg) }, { exact: true });
      toast(`Copied ${t.name} for Figma`, { detail: "Desktop, tablet and phone, each as the template lays it out, as component variants. Paste into any Figma file with {Cmd V}." });
      track("copied_design", { kind, name: t.name });
    } else if (kind === "paper") {
      const html = made.then((r) => r.paper);
      await writeClipboard({ "text/html": html, "text/plain": html });
      toast(`Copied ${t.name} for Paper`, { detail: "The desktop layout as named HTML layers. Paste onto a Paper artboard with {Cmd V}." });
      track("copied_design", { kind, name: t.name });
    } else {
      downloadFile(`${slug(t.name)}.svg`, (await made).svg, "image/svg+xml");
      toast(`Downloaded ${slug(t.name)}.svg`, { detail: "The desktop layout, as one file." });
      track("copied_design", { kind, name: t.name });
    }
  } catch (e) {
    toast("Couldn't copy that", { tone: "error", detail: e instanceof Error ? e.message : "Your browser blocked it. Try Download SVG." });
  }
}

/**
 * "Copy to design" menu: Figma gets its own native layers (auto layout, components),
 * Paper gets HTML with inline styles and named layers. A Pro feature; Free users see what it does.
 */
export function DesignCopyMenu({ targets, size = "sm", align = "right" }: { targets: CopyTarget[]; size?: "sm" | "md"; align?: "left" | "right" }) {
  const [open, setOpen] = useState(false);
  const [plan] = usePlan();
  const pro = plan === "pro";
  const root = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const items = useRef<Array<HTMLElement | null>>([]);
  const id = useId();
  // The menu floats above the page, so a card's rounded edge can't cut it off. It lines up with
  // the button, stays inside the window on phones and opens upward when there's no room below.
  const [pos, setPos] = useState<CSSProperties | null>(null);
  const toggle = () => {
    if (open) return setOpen(false);
    const r = root.current!.getBoundingClientRect();
    const w = Math.min(268, window.innerWidth - 16);
    const left = Math.max(8, Math.min(align === "right" ? r.right - w : r.left, window.innerWidth - w - 8));
    const tall = pro ? targets.length * 172 : 176;
    const up = r.bottom + tall + 14 > window.innerHeight && r.top > tall + 14;
    setPos(up ? { left, width: w, bottom: window.innerHeight - r.top + 6 } : { left, width: w, top: r.bottom + 6 });
    setOpen(true);
    if (pro) targets.forEach(prepareCopy);
  };

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => !root.current?.contains(e.target as Node) && !menu.current?.contains(e.target as Node) && setOpen(false);
    // Left behind by a scroll, it would point at nothing.
    const away = (e: Event) => !menu.current?.contains(e.target as Node) && setOpen(false);
    const resize = () => setOpen(false);
    document.addEventListener("pointerdown", close);
    window.addEventListener("scroll", away, { capture: true, passive: true });
    window.addEventListener("resize", resize);
    requestAnimationFrame(() => items.current[0]?.focus());
    return () => {
      document.removeEventListener("pointerdown", close);
      window.removeEventListener("scroll", away, { capture: true });
      window.removeEventListener("resize", resize);
    };
  }, [open]);

  const run = (kind: CopyKind, t: CopyTarget) => {
    setOpen(false);
    void copyToDesign(kind, t);
  };

  const options: Array<{ kind: CopyKind; label: string; hint: string; icon: Icon }> = [
    { kind: "figma", label: "Copy for Figma", hint: "Every viewport, as component variants", icon: FigmaLogoIcon },
    { kind: "paper", label: "Copy for Paper", hint: "One responsive frame", icon: FileHtmlIcon },
    { kind: "svg", label: "Download SVG", hint: "For any other tool", icon: DownloadSimpleIcon },
  ];

  const onKey = (e: KeyboardEvent) => {
    const list = items.current.filter(Boolean) as HTMLElement[];
    const i = list.indexOf(document.activeElement as HTMLElement);
    if (e.key === "Escape") {
      setOpen(false);
      (root.current?.querySelector("button") as HTMLElement | null)?.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      list[(i + 1) % list.length]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      list[(i - 1 + list.length) % list.length]?.focus();
    }
  };

  return (
    <div ref={root} className="relative" onKeyDown={onKey}>
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={id}
        className={size === "sm" ? btnSm.quiet : btn.quiet}
      >
        <FigmaLogoIcon size={size === "sm" ? 13 : 15} weight="duotone" className="text-accent" />
        Copy to design
        {!pro && <LockSimpleIcon size={11} weight="bold" className="text-subtle" />}
        <CaretDownIcon size={10} weight="bold" className="text-subtle" />
      </button>
      {pos &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                ref={menu}
                id={id}
                role="menu"
                aria-label="Copy to design"
                initial={{ opacity: 0, y: pos.top !== undefined ? -4 : 4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: pos.top !== undefined ? -4 : 4, scale: 0.98 }}
                transition={{ duration: 0.16, ease: EASE_OUT }}
                style={pos}
                className={cn("fixed z-[120] rounded-[10px] bg-surface p-1.5 shadow-[0_16px_48px_rgb(var(--bd-shade)/0.18),0_0_0_1px_rgb(var(--bd-ink)/0.06)]", pos.top !== undefined ? "origin-top" : "origin-bottom")}
              >
                {pro ? (
                  targets.map((t, ti) => (
                    <div key={t.name} className={cn(ti > 0 && "mt-1 border-t border-line pt-1")}>
                      {targets.length > 1 && <div className="px-2.5 pb-1 pt-1.5 text-[12px] font-medium text-subtle">{t.name}</div>}
                      {options.map((o, oi) => {
                        const k = ti * options.length + oi;
                        const I = o.icon;
                        return (
                          <button
                            key={o.kind}
                            ref={(el) => {
                              items.current[k] = el;
                            }}
                            role="menuitem"
                            type="button"
                            onClick={() => run(o.kind, t)}
                            className="flex w-full items-center gap-2.5 rounded-[7px] px-2.5 py-2 text-left outline-none transition-colors hover:bg-fg/[0.05] focus-visible:bg-fg/[0.06]"
                          >
                            <I size={17} weight="duotone" className="shrink-0 text-accent" />
                            <span>
                              <span className="block text-[13px] font-medium">{o.label}</span>
                              <span className="block text-[12px] text-muted">{o.hint}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ))
                ) : null}
                {pro ? null : (
                  <div className="p-3">
                    <div className="flex items-center gap-2 text-ui font-medium">
                      <LockSimpleIcon size={15} weight="duotone" className="text-accent" /> A Pro feature
                    </div>
                    <p className="mt-1 text-meta text-muted">Copy any section, page or whole site into Figma with auto layout and components, or into Paper as named HTML layers.</p>
                    <button
                      ref={(el) => {
                        items.current[0] = el;
                      }}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setOpen(false);
                        openPro("figma");
                      }}
                      className={cn(btnSm.ink, "mt-3 w-full")}
                    >
                      See Pro
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}
