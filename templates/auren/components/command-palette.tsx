"use client";

import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useLenis } from "lenis/react";
import {
  ArrowElbowDownLeftIcon,
  ArrowUpIcon,
  BookOpenIcon,
  BriefcaseIcon,
  CubeIcon,
  DownloadSimpleIcon,
  HouseIcon,
  InfoIcon,
  MagnifyingGlassIcon,
  NewspaperIcon,
  NotebookIcon,
  PaletteIcon,
  PulseIcon,
  ShieldCheckIcon,
  SwatchesIcon,
  TagIcon,
  TerminalWindowIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { IconProps } from "@phosphor-icons/react";
import { INSTALL_COMMAND, PALETTE_EVENT, THEMES, cn, copyText, setTheme, toast } from "@/lib/site";
import { Kbd } from "./ui/primitives";

type Command = {
  id: string;
  group: "Pages" | "Actions" | "Theme";
  label: string;
  hint?: string;
  icon: ComponentType<IconProps>;
  run: () => void;
};

const PAGES: Array<[string, string, ComponentType<IconProps>, string?]> = [
  ["/", "Home", HouseIcon],
  ["/#product", "Product tour", CubeIcon, "How Auren works"],
  ["/docs", "Docs", BookOpenIcon, "Install, agents, Tab, rules"],
  ["/pricing", "Pricing", TagIcon, "Plans and comparison"],
  ["/download", "Download", DownloadSimpleIcon, "macOS, Linux, Windows"],
  ["/changelog", "Changelog", NotebookIcon],
  ["/blog", "Blog", NewspaperIcon],
  ["/security", "Security", ShieldCheckIcon, "Where your code goes"],
  ["/status", "Status", PulseIcon],
  ["/about", "About", InfoIcon],
  ["/careers", "Careers", BriefcaseIcon],
  ["/brand", "Brand", SwatchesIcon, "Logo, colours, type"],
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const lenis = useLenis();
  const router = useRouter();
  const pathname = usePathname();

  const commands = useMemo<Command[]>(() => {
    const go = (href: string) => () => {
      const [path, hash] = href.split("#");
      const el = hash ? document.getElementById(hash) : null;
      if (el && (path === "" || path === pathname)) {
        if (lenis) lenis.scrollTo(el, { duration: 1.4 });
        else el.scrollIntoView({ behavior: "smooth" });
      } else router.push(href);
    };
    return [
      ...PAGES.map(([href, label, icon, hint]) => ({
        id: `page-${href}`,
        group: "Pages" as const,
        label,
        hint,
        icon,
        run: go(href),
      })),
      {
        id: "copy",
        group: "Actions",
        label: "Copy install command",
        hint: INSTALL_COMMAND,
        icon: TerminalWindowIcon,
        run: async () => {
          if (await copyText(INSTALL_COMMAND)) toast("Install command copied");
        },
      },
      {
        id: "top",
        group: "Actions",
        label: "Back to top",
        icon: ArrowUpIcon,
        run: () => (lenis ? lenis.scrollTo(0, { duration: 1.2 }) : window.scrollTo({ top: 0, behavior: "smooth" })),
      },
      ...THEMES.map((t) => ({
        id: `theme-${t.id}`,
        group: "Theme" as const,
        label: `Accent: ${t.label}`,
        icon: PaletteIcon,
        run: () => {
          setTheme(t.id);
          toast(`Accent set to ${t.label}`);
        },
      })),
    ];
  }, [lenis, pathname, router]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => `${c.group} ${c.label} ${c.hint ?? ""}`.toLowerCase().includes(q));
  }, [commands, query]);

  const show = (next: boolean) => {
    if (next) {
      restoreRef.current = document.activeElement as HTMLElement | null;
      setQuery("");
      setIndex(0);
    }
    setOpen(next);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => {
          if (!o) {
            restoreRef.current = document.activeElement as HTMLElement | null;
            setQuery("");
            setIndex(0);
          }
          return !o;
        });
      }
    };
    const onOpen = () => show(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(PALETTE_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(PALETTE_EVENT, onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) {
      lenis?.stop();
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      lenis?.start();
      restoreRef.current?.focus?.();
    }
  }, [open, lenis]);

  const execute = (cmd: Command | undefined) => {
    if (!cmd) return;
    setOpen(false);
    // let the palette close (and Lenis restart) before scrolling
    window.setTimeout(cmd.run, 60);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndex((i) => (i + 1) % Math.max(1, results.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndex((i) => (i - 1 + results.length) % Math.max(1, results.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      execute(results[index]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "Tab") {
      e.preventDefault();
    }
  };

  let lastGroup = "";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[14vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <div className="absolute inset-0 bg-ink/70" onClick={() => setOpen(false)} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command menu"
            initial={{ opacity: 0, y: -8, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.99 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-[560px] overflow-hidden rounded-[10px] border border-paper/12 bg-ink-2 text-paper shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)]"
            onKeyDown={onKeyDown}
          >
            <div className="flex items-center gap-3 border-b border-paper/10 px-4">
              <MagnifyingGlassIcon size={16} className="text-paper/50" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setIndex(0);
                }}
                placeholder="Jump to a section or run a command…"
                role="combobox"
                aria-expanded="true"
                aria-controls="palette-list"
                aria-activedescendant={results[index] ? `cmd-${results[index].id}` : undefined}
                className="h-13 flex-1 bg-transparent text-[15px] outline-none placeholder:text-paper/35"
              />
              <Kbd>esc</Kbd>
            </div>
            <ul id="palette-list" role="listbox" data-lenis-prevent className="no-scrollbar max-h-[min(380px,52vh)] overflow-y-auto p-2">
              {results.length === 0 && <li className="px-3 py-8 text-center text-sm text-paper/45">No commands match “{query}”.</li>}
              {results.map((cmd, i) => {
                const header = cmd.group !== lastGroup ? cmd.group : null;
                lastGroup = cmd.group;
                const Icon = cmd.icon;
                return (
                  <li key={cmd.id} role="presentation">
                    {header && <div className="type-label px-3 pb-1.5 pt-3 text-paper/35">{header}</div>}
                    <button
                      id={`cmd-${cmd.id}`}
                      role="option"
                      aria-selected={i === index}
                      tabIndex={-1}
                      onMouseMove={() => setIndex(i)}
                      onClick={() => execute(cmd)}
                      className={cn(
                        "flex h-10 w-full items-center gap-3 rounded-[6px] px-3 text-left text-[14px] transition-colors",
                        i === index ? "bg-paper/[0.07] text-paper" : "text-paper/70",
                      )}
                    >
                      <Icon size={16} className={i === index ? "text-accent" : "text-paper/45"} />
                      <span>{cmd.label}</span>
                      {cmd.hint && <span className="truncate font-mono text-[11.5px] text-paper/35">{cmd.hint}</span>}
                      {i === index && <ArrowElbowDownLeftIcon size={14} className="ml-auto shrink-0 text-paper/45" />}
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="flex items-center gap-4 border-t border-paper/10 px-4 py-2.5 font-mono text-[11px] text-paper/40">
              <span className="flex items-center gap-1.5">
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd> navigate
              </span>
              <span className="flex items-center gap-1.5">
                <Kbd>↵</Kbd> select
              </span>
              <span className="ml-auto">Auren command menu</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
