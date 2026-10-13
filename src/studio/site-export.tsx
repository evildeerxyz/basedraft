"use client";

import { CheckIcon, CircleNotchIcon, DownloadSimpleIcon, FigmaLogoIcon, FileIcon, HouseIcon, StackIcon } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { zip } from "@/lib/zip";
import { VIEWPORTS, writeClipboard } from "@/site/design-export";
import { Dialog, DialogClose } from "@/site/dialog";
import { composeUrl, liveUrl, templateOf } from "@/site/live";
import { readLive, type LiveView } from "@/site/live-export";
import { IconTile, Note } from "@/site/plan-parts";
import { btnSm } from "@/site/sheet";
import { toast } from "@/site/toast";
import type { Project } from "./state";
import { themeCss } from "@/site/theme";

/*
 * The whole site in one go: every page you built and any of the template's own pages, at every
 * breakpoint, read one after another (each takes a few seconds to load and settle), then copied
 * to Figma in a single paste, a row per page. Copying waits for your click once it's ready, since
 * browsers only let a page write the clipboard straight after one.
 */

interface Item {
  key: string;
  name: string;
  path: string;
  url: string;
  own: boolean;
}

type Made = { name: string; views: LiveView[]; svg: string };

export function SiteExportDialog({ open, onClose, project }: { open: boolean; onClose: () => void; project: Project }) {
  const t = templateOf(project.template)!;
  const items: Item[] = [
    ...project.pages.map((p) => ({ key: p.id, name: p.name, path: p.path, url: composeUrl(p.template, p.keys), own: true })),
    ...t.pages.filter((p) => p.path !== "/").map((p) => ({ key: `route:${p.path}`, name: p.label, path: p.path, url: liveUrl(t.slug, p.path), own: false })),
  ];
  const edited = new Set(project.edits.map((e) => e.scope));
  const [picked, setPicked] = useState<Set<string>>(() => new Set(items.filter((i) => i.own || edited.has(i.key)).map((i) => i.key)));
  const [widths, setWidths] = useState<number[]>(VIEWPORTS.map((_, i) => i));
  const [made, setMade] = useState<Made[] | null>(null);
  // Encoded as soon as the pages are read, so the click only has to write it.
  const [html, setHtml] = useState<string | null>(null);
  const [step, setStep] = useState<{ at: number; of: number; name: string } | null>(null);
  const stop = useRef(false);
  const names = Object.fromEntries(t.sections.map((s) => [s.id, `${t.name} / ${s.name}`]));

  // Changing what's in the export means making it again.
  const reset = () => {
    setMade(null);
    setHtml(null);
  };
  useEffect(() => {
    if (!open) stop.current = true;
  }, [open]);

  const chosen = items.filter((i) => picked.has(i.key));
  const run = async () => {
    stop.current = false;
    setMade(null);
    const out: Made[] = [];
    const total = chosen.length * widths.length;
    try {
      for (const [k, it] of chosen.entries()) {
        if (stop.current) return setStep(null);
        setStep({ at: k * widths.length, of: total, name: it.name });
        const r = await readLive({ url: it.url, names, edits: project.edits, theme: themeCss(project.template, project.theme) }, `${project.name} / ${it.name}`, widths);
        out.push({ name: it.name, views: r.views, svg: r.svg });
      }
      setStep({ at: total - 1, of: total, name: "the Figma layers" });
      const { figmaSiteHtml } = await import("@/site/figma-clipboard");
      setHtml(await figmaSiteHtml(out.map((m) => ({ name: m.name, views: m.views }))));
      setMade(out);
    } catch (e) {
      toast("Couldn't read every page", { tone: "error", detail: e instanceof Error ? e.message : "One of them didn't load. Try again." });
    } finally {
      setStep(null);
    }
  };

  const copy = async () => {
    if (!made || !html) return;
    try {
      await writeClipboard({ "text/html": Promise.resolve(html), "text/plain": Promise.resolve(`${project.name}: ${made.length} pages from basedraft`) }, { exact: true });
      toast(`Copied ${made.length} ${made.length === 1 ? "page" : "pages"} for Figma`, { detail: "A row per page, each breakpoint side by side, with auto layout. Paste into any Figma file with {Cmd V}." });
      onClose();
    } catch (e) {
      toast("Couldn't write to the clipboard", { tone: "error", detail: e instanceof Error ? e.message : "Your browser blocked it. Try once more." });
    }
  };

  const svgs = () => {
    if (!made) return;
    const files = Object.fromEntries(made.map((m, i) => [`${String(i + 1).padStart(2, "0")}-${m.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.svg`, m.svg]));
    const url = URL.createObjectURL(zip(files));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "site"}-svg.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggle = (key: string) => {
    reset();
    setPicked((s) => (s.has(key) ? new Set([...s].filter((k) => k !== key)) : new Set([...s, key])));
  };
  const busy = step !== null;
  const row = "flex h-9 w-full items-center gap-2.5 rounded-control px-2 text-left text-[13px] transition-colors hover:bg-fg/[0.04]";
  const box = (on: boolean) => cn("grid size-4 shrink-0 place-items-center rounded-[5px] transition-colors", on ? "bg-fg text-canvas" : "shadow-[inset_0_0_0_1.5px_rgb(var(--bd-ink)/0.25)]");

  return (
    <Dialog open={open} onClose={onClose} labelledBy="site-export-title" describedBy="site-export-body" className="max-w-[560px]">
      <div className="px-6 pb-2 pt-6">
        <IconTile icon={StackIcon} tone="ink" />
        <h2 id="site-export-title" className="mt-4 text-title">
          Export the whole site
        </h2>
        <p id="site-export-body" className="mt-2 text-body text-muted">
          Every page you pick, at every breakpoint, with your text edits, in one paste into Figma.
        </p>
        <DialogClose onClose={onClose} />
      </div>

      <div className="px-4 pb-2">
        <div className="flex items-center justify-between px-2 pb-1 pt-2 text-[12px] font-medium text-muted">
          Pages
          <button type="button" disabled={busy} onClick={() => {
              reset();
              setPicked(picked.size === items.length ? new Set(project.pages.map((p) => p.id)) : new Set(items.map((i) => i.key)));
            }} className="rounded-[6px] px-1.5 py-0.5 transition-colors hover:bg-fg/[0.05] hover:text-fg">
            {picked.size === items.length ? "Just yours" : "Select all"}
          </button>
        </div>
        <ul className="max-h-[260px] overflow-y-auto">
          {items.map((it) => {
            const on = picked.has(it.key);
            const Icon = it.path === "/" && it.own ? HouseIcon : FileIcon;
            return (
              <li key={it.key}>
                <button type="button" role="checkbox" aria-checked={on} disabled={busy} onClick={() => toggle(it.key)} className={row}>
                  <span className={box(on)}>{on && <CheckIcon size={10} weight="bold" />}</span>
                  <Icon size={14} className="shrink-0 text-muted" />
                  <span className="min-w-0 flex-1 truncate">{it.name}</span>
                  {!it.own && <span className="shrink-0 text-[11.5px] text-subtle">{t.name}</span>}
                  <span className="shrink-0 font-mono text-[11px] text-subtle">{it.path}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="mt-2 flex items-center gap-1 border-t border-line px-2 pt-3 text-[12px]">
          <span className="mr-1 font-medium text-muted">Breakpoints</span>
          {VIEWPORTS.map((v, i) => {
            const on = widths.includes(i);
            return (
              <button key={v.name} type="button" role="checkbox" aria-checked={on} disabled={busy || (on && widths.length === 1)} onClick={() => {
                  reset();
                  setWidths((w) => (on ? w.filter((x) => x !== i) : [...w, i].sort()));
                }} className="flex h-8 items-center gap-1.5 rounded-control px-2 transition-colors hover:bg-fg/[0.04]">
                <span className={box(on)}>{on && <CheckIcon size={10} weight="bold" />}</span>
                {v.name} <span className="tabular-nums text-subtle">{v.width}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4">
        {step ? (
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[13px]">
              <CircleNotchIcon size={14} className="animate-spin text-muted" />
              <span className="truncate">{step.name === "the Figma layers" ? "Making the Figma layers" : `Reading ${step.name}`}</span>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-fg/[0.07]">
              <div className="h-full rounded-full bg-fg transition-[width] duration-500" style={{ width: `${((step.at + 1) / step.of) * 100}%` }} />
            </div>
          </div>
        ) : (
          <Note icon={made ? CheckIcon : FigmaLogoIcon} className="text-meta text-muted">
            {made ? `${made.length} ${made.length === 1 ? "page" : "pages"} ready to copy.` : `${chosen.length} ${chosen.length === 1 ? "page" : "pages"}, about ${Math.max(1, Math.round((chosen.length * widths.length * 4) / 60))} min to read.`}
          </Note>
        )}
        <div className="flex items-center gap-2">
          {busy ? (
            <button type="button" onClick={() => (stop.current = true)} className={btnSm.quiet}>
              Stop
            </button>
          ) : made ? (
            <>
              <button type="button" onClick={svgs} className={btnSm.quiet}>
                <DownloadSimpleIcon size={14} /> SVGs
              </button>
              <button type="button" onClick={copy} className={btnSm.ink}>
                <FigmaLogoIcon size={14} /> Copy for Figma
              </button>
            </>
          ) : (
            <button type="button" disabled={!chosen.length} onClick={run} className={cn(btnSm.ink, "disabled:opacity-30")}>
              Read {chosen.length} {chosen.length === 1 ? "page" : "pages"}
            </button>
          )}
        </div>
      </div>
    </Dialog>
  );
}
