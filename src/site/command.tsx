"use client";

import { ArrowRightIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { ICON, SECTION_ICON, type IconType } from "./icons";
import { Keys } from "./keys";
import { KINDS, SECTIONS, TEMPLATES, templateOf } from "./live";

/*
 * Search, from anywhere on the site with Cmd K: every page, template, kind of section and section,
 * in one list you type to narrow. Enter goes there.
 */

interface Entry {
  group: string;
  label: string;
  hint?: string;
  href: string;
  icon?: IconType;
  dot?: string;
  words: string;
}

const ENTRIES: Entry[] = [
  ...[
    { label: "Overview", href: "/", icon: ICON.overview },
    { label: "Templates", href: "/templates", icon: ICON.templates },
    { label: "Components", href: "/components", icon: ICON.components },
    { label: "Studio", href: "/studio", icon: ICON.studio },
    { label: "Pro and pricing", href: "/pro", icon: ICON.pro },
    { label: "Purchases", href: "/purchases", icon: ICON.templates },
    { label: "Team", href: "/team", icon: ICON.pro },
  ].map((e) => ({ ...e, group: "Pages", words: e.label.toLowerCase() })),
  ...TEMPLATES.map((t) => ({ group: "Templates", label: t.name, hint: t.category, href: `/templates/${t.slug}`, dot: t.accent, words: `${t.name} ${t.category} ${t.tagline}`.toLowerCase() })),
  ...KINDS.filter((k) => SECTIONS.some((s) => s.kind === k.id)).map((k) => ({ group: "Section types", label: k.label, hint: `${SECTIONS.filter((s) => s.kind === k.id).length}`, href: `/components/${k.id}`, icon: SECTION_ICON[k.id], words: `${k.label} ${k.blurb}`.toLowerCase() })),
  ...SECTIONS.map((s) => {
    const t = templateOf(s.template)!;
    return { group: "Sections", label: `${t.name} ${s.name.toLowerCase()}`, hint: KINDS.find((k) => k.id === s.kind)?.label, href: `/components/${s.kind}#${s.template}-${s.id}`, dot: t.accent, words: `${t.name} ${s.name} ${s.kind}`.toLowerCase() };
  }),
];

/* Opened from the top bar's search field or the keyboard. */
let open = false;
const listeners = new Set<() => void>();
const set = (v: boolean) => {
  open = v;
  listeners.forEach((l) => l());
};
export const openCommand = () => set(true);
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export function CommandMenu() {
  const shown = useSyncExternalStore(subscribe, () => open, () => false);
  const router = useRouter();
  const id = useId();
  const [q, setQ] = useState("");
  const [at, setAt] = useState(0);
  const list = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const key = (e: globalThis.KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = t.isContentEditable || ["INPUT", "TEXTAREA"].includes(t.tagName);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        set(!open);
      } else if (e.key === "/" && !typing && !open) {
        e.preventDefault();
        set(true);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);

  const results = useMemo(() => {
    const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return ENTRIES.filter((e) => e.group === "Pages" || e.group === "Templates");
    return ENTRIES.filter((e) => words.every((w) => e.words.includes(w) || e.label.toLowerCase().includes(w))).slice(0, 40);
  }, [q]);

  const close = () => {
    set(false);
    setQ("");
    setAt(0);
  };
  const go = (e: Entry) => {
    close();
    router.push(e.href);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = Math.max(0, Math.min(results.length - 1, at + (e.key === "ArrowDown" ? 1 : -1)));
      setAt(next);
      list.current?.querySelector(`[data-i="${next}"]`)?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter" && results[at]) {
      e.preventDefault();
      go(results[at]);
    }
  };

  return (
    <AnimatePresence>
      {shown && (
        <motion.div key="cmd" className="fixed inset-0 z-[160] flex items-start justify-center px-4 pt-[12vh]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.12 } }}>
          <div aria-hidden className="fixed inset-0 bg-black/30 backdrop-blur-[2px] dark:bg-black/60" onClick={close} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Search basedraft"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 520, damping: 40 }}
            className="relative w-full max-w-[560px] overflow-hidden rounded-[var(--bd-r-sheet)] bg-surface shadow-[0_30px_80px_-20px_rgb(var(--bd-shade)/0.45),0_0_0_1px_rgb(var(--bd-ink)/0.08)]"
          >
            <div className="flex items-center gap-3 border-b border-line px-4">
              <MagnifyingGlassIcon size={17} className="shrink-0 text-muted" />
              <input
                autoFocus
                role="combobox"
                aria-expanded="true"
                aria-controls={id}
                aria-activedescendant={results[at] ? `${id}-${at}` : undefined}
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setAt(0);
                }}
                onKeyDown={onKey}
                placeholder="Search templates, sections and pages"
                className="h-14 min-w-0 flex-1 bg-transparent text-body outline-none placeholder:text-subtle"
              />
              <Keys combo="Esc" />
            </div>
            <div ref={list} id={id} role="listbox" aria-label="Results" className="max-h-[min(420px,60vh)] overflow-y-auto p-2">
              {!results.length && <p className="px-3 py-10 text-center text-ui text-muted">Nothing matches that. Try a template or a kind of section, like &ldquo;pricing&rdquo;.</p>}
              {results.map((e, i) => {
                const head = results[i - 1]?.group !== e.group;
                return (
                  <div key={`${e.group}-${e.href}`}>
                    {head && <p className="px-3 pb-1 pt-2.5 text-meta font-medium text-subtle">{e.group}</p>}
                    <div
                      id={`${id}-${i}`}
                      data-i={i}
                      role="option"
                      aria-selected={i === at}
                      onMouseMove={() => setAt(i)}
                      onClick={() => go(e)}
                      className={cn("flex h-10 cursor-pointer items-center gap-3 rounded-[7px] px-3 text-ui", i === at && "bg-fg/[0.06]")}
                    >
                      {e.icon ? <e.icon size={16} weight="duotone" className="shrink-0 text-muted" /> : <span aria-hidden className="mx-[4px] size-2 shrink-0 rounded-full" style={{ background: e.dot }} />}
                      <span className="min-w-0 flex-1 truncate">{e.label}</span>
                      {e.hint && <span className="shrink-0 text-meta text-subtle">{e.hint}</span>}
                      {i === at && <ArrowRightIcon size={13} weight="bold" className="shrink-0 text-muted" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
