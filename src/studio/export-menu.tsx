"use client";

import { ArrowRightIcon, CaretDownIcon, CodeIcon, FigmaLogoIcon, GithubLogoIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { EASE_OUT } from "@/lib/utils";
import { copyToDesign, prepareCopy, type CopyTarget } from "@/site/design-copy";
import { openPro } from "@/site/pro-modal";
import { btnSm } from "@/site/sheet";
import { Segments } from "./ui";

/**
 * Everything that leaves Studio, in one place: Figma first, then the code. When a section is
 * selected you choose whether to take just it or the whole page to Figma.
 */
export function ExportMenu({ page, section, pro, code, onCode }: { page: CopyTarget; section: CopyTarget | null; pro: boolean; code: boolean; onCode: (view: "files" | "github") => void }) {
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
                  label="What to copy"
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
            {/* Free: the same action, one click from seeing what Pro adds. */}
            <button
              role="menuitem"
              type="button"
              className={row}
              onClick={() => {
                setOpen(false);
                if (pro) void copyToDesign("figma", target);
                else openPro("figma");
              }}
            >
              <FigmaLogoIcon size={16} weight="duotone" className="mt-0.5 shrink-0 self-start text-accent" />
              <span className="min-w-0 flex-1">
                <span className="block">Copy for Figma</span>
                <span className="block text-[12px] text-muted">Desktop, tablet and phone, as variants</span>
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
                if (code) onCode("files");
                else openPro("react");
              }}
            >
              <CodeIcon size={16} weight="duotone" className="text-muted" />
              <span className="flex-1">Download the code</span>
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
