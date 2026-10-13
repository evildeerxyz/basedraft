"use client";

import { ArrowRightIcon, BracketsCurlyIcon, CaretDownIcon, CodeIcon, DownloadSimpleIcon, FigmaLogoIcon, FileHtmlIcon, GithubLogoIcon, StackIcon, type Icon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { EASE_OUT } from "@/lib/utils";
import { copyToDesign, prepareCopy, type CopyKind, type CopyTarget } from "@/site/design-copy";
import { openPro } from "@/site/pro-modal";
import { btnSm } from "@/site/sheet";
import { Segments } from "./ui";

/**
 * Everything that leaves Studio, in one place: design tools first, code second.
 * When a section is selected you choose whether to take just it or the whole page.
 */
export function ExportMenu({ page, section, pro, code, onCode, onSite, pages }: { page: CopyTarget; section: CopyTarget | null; pro: boolean; code: boolean; onCode: (tab: "react" | "json" | "github") => void; onSite: () => void; pages: number }) {
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<"section" | "page">("page");
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  const target = scope === "section" && section ? section : page;
  const design: Array<{ kind: CopyKind; label: string; hint: string; icon: Icon }> = [
    { kind: "figma", label: "Copy for Figma", hint: "Desktop, tablet and phone, as variants", icon: FigmaLogoIcon },
    { kind: "paper", label: "Copy for Paper", hint: "One responsive frame", icon: FileHtmlIcon },
    { kind: "svg", label: "Download SVG", hint: "Desktop, as one file", icon: DownloadSimpleIcon },
  ];
  const proTag = <span className="rounded-[6px] bg-fg/[0.07] px-1.5 py-px text-[11px] font-semibold text-muted">Pro</span>;

  const onKey = (e: KeyboardEvent) => {
    const list = [...(root.current?.querySelectorAll<HTMLElement>("[role=menuitem]") ?? [])];
    const i = list.indexOf(document.activeElement as HTMLElement);
    if (e.key === "Escape" && open) {
      e.preventDefault();
      setOpen(false);
      root.current?.querySelector<HTMLElement>("button")?.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      list[(i + 1) % list.length]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      list[(i - 1 + list.length) % list.length]?.focus();
    }
  };

  const row = "flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-[13px] outline-none transition-colors hover:bg-fg/[0.05] focus-visible:bg-fg/[0.06]";
  return (
    <div ref={root} className="relative" onKeyDown={onKey}>
      <button
        type="button"
        onClick={() => {
          setScope(section ? "section" : "page");
          setOpen((o) => !o);
          // The layers take a moment to make at every width; start now, so they're ready when you pick.
          if (pro && !open) prepareCopy(section ?? page);
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        className={btnSm.ink}
      >
        Export
        <CaretDownIcon size={11} weight="bold" className="opacity-70" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            aria-label="Export"
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: EASE_OUT }}
            className="absolute right-0 top-full z-50 mt-1.5 w-[288px] origin-top-right rounded-[16px] bg-surface p-1.5 shadow-[0_16px_48px_rgb(var(--bd-shade)/0.18),0_0_0_1px_rgb(var(--bd-ink)/0.06)]"
          >
            {section && (
              <div className="px-1 pb-2 pt-1">
                <Segments
                  full
                  label="What to export"
                  value={scope}
                  onChange={setScope}
                  options={[
                    { value: "section", label: "Selection" },
                    { value: "page", label: "Page" },
                  ]}
                />
              </div>
            )}
            <div className="truncate px-2.5 pb-1 pt-1 text-[12px] text-subtle">{target.name}</div>
            {design.map((d) => {
              const I = d.icon;
              const body = (
                <>
                  <I size={16} weight="duotone" className="mt-0.5 shrink-0 self-start text-accent" />
                  <span className="min-w-0 flex-1">
                    <span className="block">{d.label}</span>
                    <span className="block text-[12px] text-muted">{d.hint}</span>
                  </span>
                  {!pro && proTag}
                </>
              );
              // Free: the same three actions, each one click from seeing what Pro adds.
              return pro ? (
                <button
                  key={d.kind}
                  role="menuitem"
                  type="button"
                  className={row}
                  onClick={() => {
                    setOpen(false);
                    void copyToDesign(d.kind, target);
                  }}
                >
                  {body}
                </button>
              ) : (
                <button
                  key={d.kind}
                  role="menuitem"
                  type="button"
                  className={row}
                  onClick={() => {
                    setOpen(false);
                    openPro(d.kind);
                  }}
                >
                  {body}
                </button>
              );
            })}
            <div className="my-1 h-px bg-line" />
            {/* The whole site at once: every page, every breakpoint, one paste. */}
            <button
              role="menuitem"
              type="button"
              className={row}
              onClick={() => {
                setOpen(false);
                if (pro) onSite();
                else openPro("figma");
              }}
            >
              <StackIcon size={16} weight="duotone" className="mt-0.5 shrink-0 self-start text-accent" />
              <span className="min-w-0 flex-1">
                <span className="block">Whole site to Figma</span>
                <span className="block text-[12px] text-muted">{pages} of your pages and the template&apos;s own</span>
              </span>
              {!pro && proTag}
            </button>
            <div className="my-1 h-px bg-line" />
            <button
              role="menuitem"
              type="button"
              className={row}
              onClick={() => {
                setOpen(false);
                if (code) onCode("react");
                else openPro("react");
              }}
            >
              <CodeIcon size={16} weight="duotone" className="text-muted" />
              <span className="flex-1">Code for every page</span>
              {!code && proTag}
            </button>
            <button
              role="menuitem"
              type="button"
              className={row}
              onClick={() => {
                setOpen(false);
                if (code) onCode("github");
                else openPro("react");
              }}
            >
              <GithubLogoIcon size={16} weight="fill" className="text-muted" />
              <span className="flex-1">Send to GitHub</span>
              {!code && proTag}
            </button>
            <button
              role="menuitem"
              type="button"
              className={row}
              onClick={() => {
                setOpen(false);
                onCode("json");
              }}
            >
              <BracketsCurlyIcon size={16} weight="duotone" className="text-muted" />
              JSON config
            </button>
            {!pro && (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  openPro("plan");
                }}
                className="mt-1 flex w-full items-center justify-between gap-2 rounded-[10px] bg-fg/[0.04] px-2.5 py-2 text-[13px] font-medium transition-colors hover:bg-fg/[0.07]"
              >
                <span>See Pro, $149 once</span>
                <ArrowRightIcon size={13} weight="bold" className="text-muted" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
