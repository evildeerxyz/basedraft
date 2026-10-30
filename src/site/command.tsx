"use client";

import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { COMPONENTS, installCommand } from "@/registry";
import { SCREENS } from "@/screens";
import { DIALOG_CARD } from "./dialog";
import { ICON, SECTION_ICON, type IconType } from "./icons";
import { Keys } from "./keys";
import { isFree, kindOf, KINDS, SECTIONS, sectionShot, sectionsOfKind, TEMPLATES, templateLogo, templateOf, templateShot } from "./live";
import { Glow } from "./plan-parts";
import { ShellLine } from "./shell-line";

/*
 * Search, from anywhere on the site with Cmd K or /: every page, template, component, kind of
 * section and section, in one list you type to narrow, with a look at the one you're on beside
 * it. Tab moves between scopes, the arrows through the list, and Enter goes there.
 */

type Scope = "all" | "pages" | "templates" | "components" | "blocks";
const SCOPES: Array<{ id: Scope; label: string }> = [
  { id: "all", label: "All" },
  { id: "pages", label: "Pages" },
  { id: "templates", label: "Templates" },
  { id: "components", label: "Components" },
  { id: "blocks", label: "Blocks" },
];

interface Entry {
  scope: Exclude<Scope, "all">;
  group: string;
  label: string;
  hint?: string;
  href: string;
  icon?: IconType;
  /** A template's logo, on templates and their sections. */
  logo?: string;
  /** What the look beside the list shows: a screenshot, a line on it, a few facts, a command. */
  shot?: string;
  blurb?: string;
  facts?: string[];
  command?: string;
  words: string;
}

const PAGES: Array<Pick<Entry, "label" | "href" | "icon" | "blurb">> = [
  { label: "Overview", href: "/", icon: ICON.overview, blurb: "Every template running, and what Studio and Pro do." },
  { label: "Templates", href: "/templates", icon: ICON.templates, blurb: "Every template, live, with its pages and price." },
  { label: "Components", href: "/components", icon: ICON.components, blurb: "basedraft's own React components, free, one file each." },
  { label: "Screens", href: "/screens", icon: ICON.layout, blurb: "Whole app screens, dashboards and settings, made of basedraft UI." },
  { label: "Blocks", href: "/blocks", icon: ICON.layout, blurb: "Every section from the templates, sorted by what it does." },
  { label: "What's new", href: "/whats-new", icon: ICON.preview, blurb: "What changed lately, newest first." },
  { label: "Studio", href: "/studio", icon: ICON.studio, blurb: "Open a template and make it yours, right on the page." },
  { label: "Pro and pricing", href: "/pro", icon: ICON.pro, blurb: "One payment for every template, section and update." },
  { label: "Purchases", href: "/purchases", icon: ICON.templates, blurb: "What you've bought, with its downloads and updates." },
  { label: "Team", href: "/team", icon: ICON.pro, blurb: "Your team's seats, and who has them." },
];

const ENTRIES: Entry[] = [
  ...PAGES.map((e): Entry => ({ ...e, scope: "pages", group: "Pages", words: `${e.label} ${e.blurb}`.toLowerCase() })),
  ...TEMPLATES.map(
    (t): Entry => ({
      scope: "templates",
      group: "Templates",
      label: t.name,
      hint: t.category,
      href: `/templates/${t.slug}`,
      logo: templateLogo(t.slug),
      shot: templateShot(t.slug),
      blurb: t.tagline,
      facts: [`${t.pages.length} pages`, `${t.sections.length} sections`, t.price === "free" ? "Free" : `$${t.price}`],
      words: `${t.name} ${t.category} ${t.tagline}`.toLowerCase(),
    }),
  ),
  ...COMPONENTS.map(
    (c): Entry => ({ scope: "components", group: "Components", label: c.title, hint: c.pro ? `${c.group}, Pro` : c.group, href: `/components/${c.name}`, icon: ICON.components, blurb: c.description, facts: [c.group, c.pro ? "Pro" : "Free"], command: c.pro ? undefined : installCommand(), words: `${c.title} ${c.group} ${c.description}`.toLowerCase() }),
  ),
  ...SCREENS.map((sc): Entry => ({ scope: "components", group: "Screens", label: sc.title, hint: sc.pro ? `${sc.kind}, Pro` : sc.kind, href: `/screens/${sc.slug}`, icon: ICON.layout, blurb: sc.description, facts: [sc.kind, `${sc.uses.length} components`, sc.pro ? "Pro" : "Free"], words: `${sc.title} ${sc.kind} screen dashboard ${sc.description}`.toLowerCase() })),
  ...KINDS.filter((k) => sectionsOfKind(k.id).length).map((k): Entry => {
    const list = sectionsOfKind(k.id);
    return { scope: "blocks", group: "Kinds of section", label: k.label, hint: `${list.length}`, href: `/blocks/${k.id}`, icon: SECTION_ICON[k.id], shot: sectionShot(list[0]), blurb: k.blurb, facts: [`${list.length} ${list.length === 1 ? "section" : "sections"}`], words: `${k.label} ${k.blurb}`.toLowerCase() };
  }),
  ...SECTIONS.map((s): Entry => {
    const t = templateOf(s.template)!;
    const k = kindOf(s.kind);
    return { scope: "blocks", group: "Sections", label: `${t.name} ${s.name.toLowerCase()}`, hint: k.label, href: `/blocks/${s.kind}#${s.template}-${s.id}`, logo: templateLogo(t.slug), shot: sectionShot(s), blurb: k.blurb, facts: [t.name, k.label, isFree(s) ? "Free" : "Pro"], words: `${t.name} ${s.name} ${s.kind} ${k.label}`.toLowerCase() };
  }),
];

/* Things worth trying when nothing matches. */
const TRY = ["pricing", "hero", "button", "zuno"];

const matches = (e: Entry, words: string[]) => words.every((w) => e.words.includes(w) || e.label.toLowerCase().includes(w));

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

const SLIDE = { type: "spring", stiffness: 520, damping: 42 } as const;

/** What leads a row: the template's logo, or the idea's icon on a small tile. */
function Lead({ e, size = 24 }: { e: Entry; size?: number }) {
  if (e.logo) return <Image src={e.logo} alt="" width={size} height={size} unoptimized className="shrink-0 rounded-[7px]" style={{ width: size, height: size }} />;
  const I = e.icon ?? ICON.overview;
  return (
    <span className="grid shrink-0 place-items-center rounded-[7px] bg-fg/[0.05] text-muted" style={{ width: size, height: size }}>
      <I size={Math.round(size * 0.58)} weight="duotone" />
    </span>
  );
}

/** A look at the result you're on: its screenshot or icon on the hero's light, then what it is. */
function Preview({ e }: { e: Entry }) {
  const I = e.icon ?? ICON.overview;
  return (
    <motion.div key={e.href} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.16 }} className="flex h-full flex-col">
      <div className="bd-paper glow-b relative aspect-[16/10] shrink-0 overflow-hidden rounded-[14px] shadow-[inset_0_0_0_1px_var(--bd-line-subtle)]">
        {e.shot ? (
          <Image src={e.shot} alt="" fill sizes="272px" className={e.scope === "templates" ? "object-cover object-top" : "object-contain p-2.5"} />
        ) : (
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid size-12 place-items-center rounded-[14px] bg-surface text-fg shadow-[var(--bd-shadow-raised)]">
              <I size={24} weight="duotone" />
            </span>
          </span>
        )}
      </div>
      <div className="mt-4 flex items-center gap-2">
        <Lead e={e} size={20} />
        <p className="min-w-0 truncate text-ui font-medium">{e.label}</p>
      </div>
      {e.blurb && <p className="mt-1.5 line-clamp-3 text-meta text-muted">{e.blurb}</p>}
      {e.facts && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {e.facts.map((f) => (
            <span key={f} className="rounded-full bg-fg/[0.05] px-2 py-0.5 text-[11px] text-muted">
              {f}
            </span>
          ))}
        </div>
      )}
      {e.command && (
        <div className="mt-3 rounded-[10px] bg-fg/[0.04] px-2.5 py-2">
          <ShellLine command={e.command} className="block truncate text-[11px]" />
        </div>
      )}
      <p className="mt-auto flex items-center gap-1.5 pt-3 text-meta text-subtle">
        <Keys combo="Enter" /> to open
      </p>
    </motion.div>
  );
}

export function CommandMenu() {
  const shown = useSyncExternalStore(subscribe, () => open, () => false);
  const router = useRouter();
  const id = useId();
  const [q, setQ] = useState("");
  const [scope, setScope] = useState<Scope>("all");
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

  const words = useMemo(() => q.trim().toLowerCase().split(/\s+/).filter(Boolean), [q]);
  // How many results each scope holds for what's typed, shown on its tab.
  const counts = useMemo(() => {
    const hit = words.length ? ENTRIES.filter((e) => matches(e, words)) : ENTRIES;
    return Object.fromEntries(SCOPES.map((s) => [s.id, s.id === "all" ? hit.length : hit.filter((e) => e.scope === s.id).length])) as Record<Scope, number>;
  }, [words]);
  const results = useMemo(() => {
    const pool = scope === "all" ? ENTRIES : ENTRIES.filter((e) => e.scope === scope);
    // With nothing typed, All starts on the pages and templates; a scope shows what it holds.
    if (!words.length) return scope === "all" ? pool.filter((e) => e.scope === "pages" || e.scope === "templates") : pool.slice(0, 60);
    return pool.filter((e) => matches(e, words)).slice(0, 40);
  }, [scope, words]);
  const active = results[at];

  const close = () => {
    set(false);
    setQ("");
    setScope("all");
    setAt(0);
  };
  const go = (e: Entry) => {
    close();
    router.push(e.href);
  };
  const move = (next: number) => {
    setAt(next);
    list.current?.querySelector(`[data-i="${next}"]`)?.scrollIntoView({ block: "nearest" });
  };
  const turn = (by: number) => {
    const i = SCOPES.findIndex((s) => s.id === scope);
    setScope(SCOPES[(i + by + SCOPES.length) % SCOPES.length].id);
    setAt(0);
    list.current?.scrollTo({ top: 0 });
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "Tab") {
      e.preventDefault();
      turn(e.shiftKey ? -1 : 1);
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      move(Math.max(0, Math.min(results.length - 1, at + (e.key === "ArrowDown" ? 1 : -1))));
    } else if (e.key === "Enter" && active) {
      e.preventDefault();
      go(active);
    }
  };

  return (
    <AnimatePresence>
      {shown && (
        <motion.div key="cmd" className="fixed inset-0 z-[160] flex items-start justify-center px-4 pt-[10vh]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.12 } }}>
          <div aria-hidden className="fixed inset-0 bg-black/35 backdrop-blur-[3px] dark:bg-black/60" onClick={close} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Search basedraft"
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 480, damping: 38 }}
            className={cn(DIALOG_CARD, "max-w-[780px]")}
          >
            <Glow className="-z-10" />
            <div className="flex items-center gap-3 px-5 pt-2">
              <MagnifyingGlassIcon weight="duotone" size={20} className="shrink-0 text-muted" />
              <input
                autoFocus
                role="combobox"
                aria-expanded="true"
                aria-controls={id}
                aria-activedescendant={active ? `${id}-${at}` : undefined}
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setAt(0);
                }}
                onKeyDown={onKey}
                placeholder="Search templates, components, blocks and pages"
                className="h-14 min-w-0 flex-1 bg-transparent text-[17px] outline-none placeholder:text-subtle"
              />
              <Keys combo="Esc" />
            </div>
            <LayoutGroup id={id}>
              <div role="tablist" aria-label="Search in" className="no-scrollbar flex gap-1 overflow-x-auto px-4 pb-3">
                {SCOPES.map((s) => {
                  const on = s.id === scope;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      role="tab"
                      tabIndex={-1}
                      aria-selected={on}
                      onClick={() => {
                        setScope(s.id);
                        setAt(0);
                      }}
                      className={cn("relative flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-meta font-medium transition-colors", on ? "text-fg" : "text-muted hover:text-fg")}
                    >
                      {on && <motion.span layoutId="scope" className="absolute inset-0 rounded-full bg-surface shadow-[var(--bd-shadow-resting),inset_0_0_0_1px_var(--bd-line)]" transition={SLIDE} />}
                      <span className="relative">{s.label}</span>
                      {words.length > 0 && <span className="relative tabular-nums text-subtle">{counts[s.id]}</span>}
                    </button>
                  );
                })}
              </div>
            </LayoutGroup>
            <div className="grid h-[min(420px,56vh)] border-t border-line sm:grid-cols-[minmax(0,1fr)_288px]">
              <div ref={list} id={id} role="listbox" aria-label="Results" className="overflow-y-auto p-2">
                {!results.length && (
                  <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
                    <p className="text-ui text-muted">Nothing matches &ldquo;{q.trim()}&rdquo;{scope !== "all" && ` in ${SCOPES.find((s) => s.id === scope)!.label}`}.</p>
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {/* Point to the scopes that do hold it, or else to a few things worth trying. */}
                      {counts.all > 0
                        ? SCOPES.filter((s) => s.id !== "all" && counts[s.id]).map((s) => (
                            <button key={s.id} type="button" onClick={() => setScope(s.id)} className="h-7 rounded-full bg-fg/[0.05] px-3 text-meta text-muted transition-colors hover:bg-fg/[0.08] hover:text-fg">
                              {counts[s.id]} in {s.label}
                            </button>
                          ))
                        : TRY.map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => {
                                setQ(t);
                                setScope("all");
                                setAt(0);
                              }}
                              className="h-7 rounded-full bg-fg/[0.05] px-3 text-meta text-muted transition-colors hover:bg-fg/[0.08] hover:text-fg"
                            >
                              {t}
                            </button>
                          ))}
                    </div>
                  </div>
                )}
                {results.map((e, i) => {
                  const head = results[i - 1]?.group !== e.group;
                  const on = i === at;
                  return (
                    <div key={`${e.group}-${e.href}`}>
                      {head && <p className={cn("px-2.5 pb-1.5 text-meta font-medium text-subtle", i ? "pt-3" : "pt-1")}>{e.group}</p>}
                      <div
                        id={`${id}-${i}`}
                        data-i={i}
                        role="option"
                        aria-selected={on}
                        onMouseMove={() => at !== i && setAt(i)}
                        onClick={() => go(e)}
                        className={cn("flex h-11 cursor-pointer items-center gap-3 rounded-[12px] px-2.5 text-ui transition-colors duration-100", on ? "bg-fg/[0.055] text-fg" : "text-fg/85")}
                      >
                        <Lead e={e} />
                        <span className="min-w-0 flex-1 truncate">{e.label}</span>
                        {e.hint && <span className="shrink-0 text-meta text-subtle">{e.hint}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
              <aside aria-hidden className="hidden border-l border-line-subtle p-3 sm:block">
                <AnimatePresence mode="wait">{active && <Preview key={active.href} e={active} />}</AnimatePresence>
              </aside>
            </div>
            <div className="flex items-center gap-4 border-t border-line px-4 py-2.5 text-meta text-subtle">
              {/* Keys mean nothing on a phone, so there it's just the count. */}
              <span className="hidden items-center gap-1.5 sm:flex">
                <Keys combo="Up Down" /> Move
              </span>
              <span className="hidden items-center gap-1.5 sm:flex">
                <Keys combo="Enter" /> Open
              </span>
              <span className="hidden items-center gap-1.5 sm:flex">
                <Keys combo="Tab" /> Next scope
              </span>
              <span className="ml-auto tabular-nums">
                {results.length} {results.length === 1 ? "result" : "results"}
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
