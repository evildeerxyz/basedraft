"use client";

import { ExportIcon, FileCodeIcon, FileIcon, FileZipIcon, GithubLogoIcon, HouseIcon, LockSimpleIcon, PaletteIcon, TextTIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { templateOf } from "@/site/live";
import { openPro } from "@/site/pro-modal";
import { cn, EASE_OUT } from "@/lib/utils";
import { DialogClose } from "@/site/dialog";
import { Glow, IconTile, Note } from "@/site/plan-parts";
import { btnSm } from "@/site/sheet";
import { toast } from "@/site/toast";
import { previewHeaders } from "@/site/plan";
import { GitHubPanel } from "./github";
import { editList } from "./project-files";
import type { Project } from "./state";
import { track } from "@/site/analytics";
import { FRAMEWORK_LABEL, FrameworkSwitch, useFramework, type Framework } from "@/site/framework";

function download(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/** The whole site, packed by the server: the template's code with the project's pages and text written in, in Next.js or Astro. */
async function downloadSite(project: Project, framework: Framework) {
  const r = await fetch(`/api/export?framework=${framework}`, { method: "POST", headers: { "Content-Type": "application/json", ...previewHeaders() }, body: JSON.stringify(project) });
  if (!r.ok) throw new Error(((await r.json().catch(() => ({}))) as { error?: string }).error ?? "The download didn't start");
  const name = /filename="([^"]+)"/.exec(r.headers.get("Content-Disposition") ?? "")?.[1] ?? "site.zip";
  download(name, await r.blob());
}

/**
 * The whole site, ready to run, in one zip or one repository: what's in it, which framework, and
 * the two ways to take it. Code is Pro's, or comes with buying the template.
 */
export function ExportDialog({ open, onClose, project, pro, initialView = "files" }: { open: boolean; onClose: () => void; project: Project; pro: boolean; initialView?: "files" | "github" }) {
  const [view, setView] = useState<"files" | "github">(initialView);
  const [packing, setPacking] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(null);
  // Held in a ref, so the key listener below stays put while Studio re-renders around the dialog.
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    opener.current = document.activeElement;
    panel.current?.querySelector<HTMLElement>("button:not([data-dialog-close])")?.focus();
    // On the document, so it runs before Studio's own keys on the window: Escape closes this and
    // nothing else, rather than also clearing the selection behind it.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (e.defaultPrevented) return;
        e.preventDefault();
        close.current();
        return;
      }
      if (e.key !== "Tab" || !panel.current) return;
      const f = [...panel.current.querySelectorAll<HTMLElement>("button, a[href], [tabindex]:not([tabindex='-1'])")];
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      (opener.current as HTMLElement | null)?.focus?.();
    };
  }, [open]);

  const [framework, setFramework] = useFramework();
  const edits = editList(project.edits);
  const t = templateOf(project.template)!;
  const colored = Boolean(project.theme);

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] grid place-items-center bg-black/30 dark:bg-black/60 p-6 backdrop-blur-[2px]" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="export-title"
            aria-describedby="export-body"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
            className="relative isolate w-full max-w-[600px] overflow-hidden rounded-[var(--bd-r-sheet)] bg-surface shadow-[0_24px_80px_rgb(var(--bd-shade)/0.25),0_0_0_1px_rgb(var(--bd-ink)/0.06)]"
          >
            <Glow className="-z-10" />
            {/* The same head as every other dialog: an ink tile, the title, a line on what it's for. */}
            <div className="relative px-6 pb-1 pt-6">
              <IconTile icon={ExportIcon} tone="ink" />
              <h2 id="export-title" className="mt-4 text-title">
                {view === "github" ? `Send ${project.name} to GitHub` : `Export ${project.name}`}
              </h2>
              <p id="export-body" className="mt-2 text-body text-muted">
                {view === "github" ? "Skip the zip: start a new repository with the whole site, or open a pull request on one you have." : `The whole site, ready to run: ${t.name}'s own code, in Next.js or Astro, with the pages you built and the text you changed written in.`}
              </p>
              <DialogClose onClose={onClose} />
            </div>
            {view === "github" ? (
              <GitHubPanel project={project} framework={framework} onBack={() => setView("files")} />
            ) : (
              <>
            {/* What the download holds, and the framework it's written in: for the zip and GitHub alike. */}
            <div className="flex items-center justify-between gap-3 px-6 pt-5">
              <span className="text-[12.5px] font-medium text-muted">In the download</span>
              <FrameworkSwitch value={framework} onChange={setFramework} />
            </div>
            {/* Locked, the list sits blurred under the lock, with room for it however short the list is. */}
            <div className={cn("relative mx-6 mb-5 mt-3", !pro && "min-h-[228px]")}>
              <ul className={cn("divide-y divide-line overflow-hidden rounded-[12px] bg-surface-2 text-[13px]", !pro && "pointer-events-none select-none blur-[5px]")}>
                {project.pages.map((p) => (
                  <li key={p.id} className="flex h-10 items-center gap-2.5 px-3.5">
                    {p.path === "/" ? <HouseIcon size={14} className="shrink-0 text-muted" /> : <FileIcon size={14} className="shrink-0 text-muted" />}
                    <span className="min-w-0 flex-1 truncate">{p.name}</span>
                    <span className="shrink-0 font-mono text-[11.5px] text-subtle">{p.path}</span>
                  </li>
                ))}
                <li className="flex h-10 items-center gap-2.5 px-3.5 text-muted">
                  <FileCodeIcon size={14} className="shrink-0" />
                  <span className="min-w-0 flex-1 truncate">The rest of {t.name}, its own pages included</span>
                  <span className="shrink-0 text-[12px] text-subtle">{t.pages.length} pages</span>
                </li>
                {(edits.length > 0 || colored) && (
                  <li className="flex h-10 items-center gap-2.5 px-3.5 text-muted">
                    {edits.length > 0 ? <TextTIcon size={14} className="shrink-0" /> : <PaletteIcon size={14} className="shrink-0" />}
                    <span className="min-w-0 flex-1 truncate">{[edits.length > 0 && `${edits.length} text ${edits.length === 1 ? "edit" : "edits"}`, colored && "your colors"].filter(Boolean).join(" and ")}, written in</span>
                  </li>
                )}
              </ul>
              {!pro && (
                <div className="absolute inset-0 grid place-items-center">
                  <div className="max-w-[320px] rounded-card bg-surface p-5 text-center shadow-[0_8px_30px_rgb(var(--bd-shade)/0.12),0_0_0_1px_rgb(var(--bd-ink)/0.06)]">
                    <LockSimpleIcon size={22} weight="duotone" className="mx-auto text-accent" />
                    <p className="mt-2 text-heading">Code export is in Pro</p>
                    <p className="mt-1 text-ui text-muted">Or buy {t.name} on its own, and its code is yours.</p>
                    <button type="button" onClick={() => openPro("react")} className="btn-ink mt-4 inline-flex h-9 items-center rounded-control px-3.5 text-ui font-medium">
                      See Pro
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line px-4 py-3">
              <Note icon={FileCodeIcon} className="text-meta text-muted">
                In {FRAMEWORK_LABEL[framework]}, ready to run
              </Note>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => (pro ? setView("github") : openPro("react"))} className={btnSm.quiet}>
                  <GithubLogoIcon size={15} weight="fill" /> Send to GitHub
                </button>
                <button
                  disabled={!pro || packing}
                  onClick={async () => {
                    setPacking(true);
                    try {
                      await downloadSite(project, framework);
                      track("downloaded_site", { template: project.template, pages: project.pages.length, framework });
                    } catch (e) {
                      toast("Couldn't pack the site", { tone: "error", detail: e instanceof Error ? e.message : undefined });
                    } finally {
                      setPacking(false);
                    }
                  }}
                  className="btn-ink inline-flex h-8 items-center gap-1.5 rounded-control px-3 text-[13px] font-medium disabled:opacity-30"
                >
                  <FileZipIcon size={15} weight="duotone" /> {packing ? "Packing…" : "Download project"}
                </button>
              </div>
            </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
