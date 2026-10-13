"use client";

import { DownloadSimpleIcon, ExportIcon, FileCodeIcon, FileZipIcon, GithubLogoIcon, LockSimpleIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { templateOf } from "@/site/live";
import { openPro } from "@/site/pro-modal";
import { cn, EASE_OUT } from "@/lib/utils";
import { CodeBlock } from "@/site/code";
import { DialogClose } from "@/site/dialog";
import { DitherSky, IconTile, Note } from "@/site/plan-parts";
import { btnSm } from "@/site/sheet";
import { toast } from "@/site/toast";
import { previewHeaders } from "@/site/plan";
import { GitHubPanel } from "./github";
import { colorsCss, editList, EDITS_SCRIPT, pageCode, pageFile, projectFiles } from "./project-files";
import { COLORS } from "@/site/theme";
import type { Project } from "./state";
import { track } from "@/site/analytics";
import { FRAMEWORK_LABEL, FrameworkSwitch, useFramework, type Framework } from "@/site/framework";
import { zipBytes } from "@/lib/zip";

function download(name: string, text: string | Blob, type: string) {
  const url = URL.createObjectURL(typeof text === "string" ? new Blob([text], { type }) : text);
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
  download(name, await r.blob(), "application/zip");
}

export function ExportDialog({ open, onClose, project, pageId, pro, proUsed, initialTab = "react", initialView = "files" }: { open: boolean; onClose: () => void; project: Project; pageId: string | null; pro: boolean; proUsed: boolean; initialTab?: "react" | "json" | "edits" | "colors"; initialView?: "files" | "github" }) {
  const [tab, setTab] = useState<"react" | "json" | "edits" | "colors">(initialTab);
  const [view, setView] = useState<"files" | "github">(initialView);
  const [packing, setPacking] = useState(false);
  const [which, setWhich] = useState(pageId ?? project.pages[0].id);
  const page = project.pages.find((p) => p.id === which) ?? project.pages[0];
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
  // A page's Astro files are made by the server, from the whole site, so they're exactly what the download has.
  const [astro, setAstro] = useState<{ key: string; files: Record<string, string> } | null>(null);
  const astroKey = `${page.id}|${JSON.stringify(project)}`;
  useEffect(() => {
    if (!open || framework !== "astro" || tab !== "react" || !pro || astro?.key === astroKey) return;
    let gone = false;
    fetch(`/api/export?framework=astro&page=${encodeURIComponent(page.id)}`, { method: "POST", headers: { "Content-Type": "application/json", ...previewHeaders() }, body: JSON.stringify(project) })
      .then((r) => (r.ok ? (r.json() as Promise<{ files: Record<string, string> }>) : Promise.reject(new Error())))
      .then((r) => !gone && setAstro({ key: astroKey, files: r.files }))
      .catch(() => !gone && setAstro({ key: astroKey, files: { "": "// The Astro files didn't load. Close this and open it again." } }));
    return () => {
      gone = true;
    };
  }, [open, framework, tab, pro, astroKey, astro?.key, page.id, project]);
  const astroFiles = framework === "astro" && astro?.key === astroKey ? astro.files : null;
  const code = framework === "astro" ? (astroFiles ? Object.entries(astroFiles).map(([f, c]) => (f ? `// ${f}\n${c}` : c)).join("\n\n") : "// Making the Astro files…") : pageCode(page);
  const edits = editList(project.edits);
  const json = projectFiles(project)["basedraft/project.json"];
  const t = templateOf(page.template)!;
  const locked = tab !== "json" && !pro;
  const colors = colorsCss(project);
  const shown = tab === "react" ? code : tab === "colors" ? colors : tab === "edits" ? `// basedraft/edits.json\n${JSON.stringify(edits, null, 2)}\n\n// basedraft/apply-edits.mjs\n${EDITS_SCRIPT}` : json;

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
            className="relative isolate w-full max-w-[760px] overflow-hidden rounded-[var(--bd-r-sheet)] bg-surface shadow-[0_24px_80px_rgb(var(--bd-shade)/0.25),0_0_0_1px_rgb(var(--bd-ink)/0.06)]"
          >
            <DitherSky className="-z-10" />
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
            <div className="flex flex-wrap items-center gap-2 px-6 pt-4">
              <div role="tablist" aria-label="Format" className="inline-flex rounded-control bg-fg/[0.06] p-0.5">
                {[
                  { k: "react" as const, l: "Pages" },
                  { k: "edits" as const, l: `Text edits${edits.length ? ` ${edits.length}` : ""}` },
                  ...(colors ? [{ k: "colors" as const, l: "Colors" }] : []),
                  { k: "json" as const, l: "JSON" },
                ].map((t) => (
                  <button key={t.k} role="tab" aria-selected={tab === t.k} onClick={() => setTab(t.k)} className={cn("h-7 rounded-[8px] px-2.5 text-meta font-medium transition-colors", tab === t.k ? "bg-raised text-fg shadow-[0_1px_2px_rgb(var(--bd-shade)/0.12)]" : "text-muted hover:text-fg")}>
                    {t.l}
                  </button>
                ))}
              </div>
              {/* Which page's file to show, when there's more than one. */}
              {tab === "react" && project.pages.length > 1 && (
                <div role="tablist" aria-label="Page" className="inline-flex max-w-full flex-wrap gap-1">
                  {project.pages.map((p) => (
                    <button key={p.id} role="tab" aria-selected={p.id === page.id} onClick={() => setWhich(p.id)} className={cn("h-7 rounded-[8px] px-2.5 text-meta font-medium transition-colors", p.id === page.id ? "bg-fg/[0.08] text-fg" : "text-muted hover:bg-fg/[0.04] hover:text-fg")}>
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
              {/* The same site, in Next.js or as its Astro version: for the code here, the download and GitHub. */}
              <FrameworkSwitch value={framework} onChange={setFramework} className="ml-auto" />
            </div>
            {tab === "react" && <p className="px-6 pt-2 font-mono text-[12px] text-subtle">{framework === "astro" ? (astroFiles ? Object.keys(astroFiles).join(", ") : "src/pages, src/islands, src/routes") : pageFile(page)}</p>}
            {tab === "colors" && <p className="px-6 pt-2 text-[12px] text-subtle">Add to the end of <span className="font-mono">{COLORS[project.template].globals}</span>. Downloads and GitHub do this for you.</p>}
            <div className="relative bg-surface-2 p-3 mt-3">
              <CodeBlock code={tab === "edits" && !edits.length ? "// No text edits yet. Double-click any text on the canvas to change it." : shown} maxHeight={400} className={cn(locked && "pointer-events-none select-none blur-[6px]")} />
              {locked && (
                <div className="absolute inset-0 grid place-items-center">
                  <div className="max-w-[320px] rounded-card bg-surface p-5 text-center shadow-[0_8px_30px_rgb(var(--bd-shade)/0.12),0_0_0_1px_rgb(var(--bd-ink)/0.06)]">
                    <LockSimpleIcon size={22} weight="duotone" className="mx-auto text-accent" />
                    <p className="mt-2 text-heading">Code export is in Pro</p>
                    <p className="mt-1 text-ui text-muted">The JSON config is free and loads back into Studio any time.</p>
                    <button type="button" onClick={() => openPro("react")} className="btn-ink mt-4 inline-flex h-9 items-center rounded-control px-3.5 text-ui font-medium">
                      See Pro
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line px-4 py-3">
              <Note icon={proUsed && !pro ? LockSimpleIcon : FileCodeIcon} className="text-meta text-muted">
                {proUsed && !pro ? `This project uses ${t.name}'s sections. They preview free; exporting them needs Pro or the template.` : `${project.pages.length} ${project.pages.length === 1 ? "page" : "pages"}${edits.length ? `, ${edits.length} text ${edits.length === 1 ? "edit" : "edits"}` : ""}, in ${t.name}'s ${FRAMEWORK_LABEL[framework]} code.`}
              </Note>
              <div className="flex items-center gap-2">
                <button
                  disabled={locked}
                  onClick={() =>
                    tab === "json"
                      ? download("project.json", json, "application/json")
                      : tab === "colors"
                        ? download("colors.css", colors, "text/css")
                        : framework === "astro" && astroFiles
                          ? download(`${page.path === "/" ? "home" : page.path.slice(1).replace(/\//g, "-")}-astro.zip`, new Blob([zipBytes(astroFiles) as BlobPart], { type: "application/zip" }), "application/zip")
                          : download("page.tsx", code, "text/plain")
                  }
                  className={cn(btnSm.quiet, "disabled:opacity-30")}
                >
                  <DownloadSimpleIcon size={15} weight="duotone" /> {tab === "json" ? "project.json" : tab === "colors" ? "colors.css" : "This page"}
                </button>
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
