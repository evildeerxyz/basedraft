"use client";

import { CaretUpDownIcon, CheckIcon, DotsThreeIcon } from "@phosphor-icons/react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore, type ElementType, type KeyboardEvent, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";

/*
 * Where a page sits, as the path to it: each level a link, the page itself in ink, and a soft pill
 * that glides from crumb to crumb under the pointer. A long path folds its middle into one "…" that
 * opens the levels it hides, and a level can carry a caret that opens its siblings, to jump across
 * without going up first. Pass your router's link as `link` and it's used for every crumb.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

/* True once it's running in the browser: the server and the first render agree on false, so the portal never trips hydration. */
const noop = () => () => {};
const useMounted = () => useSyncExternalStore(noop, () => true, () => false);

export type Crumb = {
  label: string;
  /** Where it goes. The last crumb, the page you're on, usually has none. */
  href?: string;
  icon?: ReactNode;
  /** Its siblings, opened from a caret beside it, to jump across: another site, another branch. */
  siblings?: Array<{ label: string; href: string; icon?: ReactNode }>;
};

export type BreadcrumbProps = {
  items: Crumb[];
  /** How many crumbs show before the middle ones fold into "…". At least 3. */
  max?: number;
  /** Your router's link, like Next.js's Link. A plain <a> by default. */
  link?: ElementType;
  /** What the nav is called, for a screen reader. */
  label?: string;
  className?: string;
};

type Scope = { "data-theme"?: string; className?: string };
/* The light or dark the trigger sits in, so a menu in a portal on body matches it. */
function scopeOf(el: Element | null): Scope {
  if (!el) return {};
  const byAttr = el.closest("[data-theme]");
  const byClass = el.closest(".dark, .light, .bd-light");
  const near = byAttr && byClass ? (byAttr.contains(byClass) ? byClass : byAttr) : (byAttr ?? byClass);
  if (!near) return {};
  if (near === byAttr) return { "data-theme": near.getAttribute("data-theme") ?? undefined };
  return { className: ["dark", "bd-light", "light"].find((c) => near.classList.contains(c)) };
}

const FOCUS = "outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[color:var(--bd-ui-focus)]";

type Entry = { label: string; href: string; icon?: ReactNode; current?: boolean };

/** A short list of links in a card, beside the button that opened it. Arrows move, a letter jumps, Escape closes. */
function LevelMenu({ id, anchor, entries, link: Link, onClose }: { id: string; anchor: RefObject<HTMLButtonElement | null>; entries: Entry[]; link: ElementType; onClose: (refocus: boolean) => void }) {
  const list = useRef<HTMLDivElement>(null);
  const still = useReducedMotion();
  const [pos, setPos] = useState<{ top: number; left: number; below: boolean } | null>(null);
  const [scope] = useState(() => scopeOf(anchor.current));
  const typed = useRef({ text: "", at: 0 });

  useEffect(() => {
    const update = () => {
      const t = anchor.current?.getBoundingClientRect();
      const c = list.current;
      if (!t || !c) return;
      const pad = 8;
      const below = t.bottom + 6 + c.offsetHeight < innerHeight - pad || t.top - 6 - c.offsetHeight < pad;
      setPos({ top: below ? t.bottom + 6 : t.top - 6 - c.offsetHeight, left: Math.min(Math.max(pad, t.left - 6), innerWidth - pad - c.offsetWidth), below });
    };
    const frame = requestAnimationFrame(() => {
      update();
      const all = [...(list.current?.querySelectorAll<HTMLElement>("[role=menuitem]") ?? [])];
      (all.find((el) => el.getAttribute("aria-current")) ?? all[0])?.focus({ preventScroll: true });
    });
    const away = (e: PointerEvent) => {
      const n = e.target as Node;
      if (!list.current?.contains(n) && !anchor.current?.contains(n)) onClose(false);
    };
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    document.addEventListener("pointerdown", away);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
      document.removeEventListener("pointerdown", away);
    };
  }, [anchor, onClose]);

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const all = [...(list.current?.querySelectorAll<HTMLElement>("[role=menuitem]") ?? [])];
    const at = all.indexOf(document.activeElement as HTMLElement);
    const go = (i: number) => all[(i + all.length) % all.length]?.focus();
    if (e.key === "ArrowDown") go(at + 1);
    else if (e.key === "ArrowUp") go(at < 0 ? all.length - 1 : at - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(all.length - 1);
    else if (e.key === "Escape") onClose(true);
    else if (e.key === "Tab") return onClose(false);
    else if (e.key.length === 1 && /\S/.test(e.key) && !e.metaKey && !e.ctrlKey) {
      const now = Date.now();
      typed.current = { text: now - typed.current.at < 600 ? typed.current.text + e.key.toLowerCase() : e.key.toLowerCase(), at: now };
      const from = [...all.slice(at + 1), ...all.slice(0, at + 1)];
      from.find((el) => (el.textContent ?? "").trim().toLowerCase().startsWith(typed.current.text))?.focus();
    } else return;
    e.preventDefault();
  };

  return createPortal(
    <div {...scope} style={{ display: "contents" }}>
      <motion.div
        ref={list}
        id={id}
        role="menu"
        aria-orientation="vertical"
        onKeyDown={onKey}
        initial={still ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -4 }}
        animate={{ opacity: pos ? 1 : 0, scale: 1, y: 0 }}
        exit={still ? { opacity: 0 } : { opacity: 0, scale: 0.97, transition: { duration: 0.1 } }}
        transition={{ type: "spring", stiffness: 600, damping: 38 }}
        style={{ position: "fixed", top: pos?.top ?? 0, left: pos?.left ?? 0, transformOrigin: pos?.below === false ? "left bottom" : "left top" }}
        className="z-[90] min-w-[200px] max-w-[calc(100vw-16px)] rounded-[16px] bg-[var(--bd-surface)] p-1.5 text-[var(--bd-fg)] shadow-[var(--bd-shadow-float),0_0_0_1px_rgb(var(--bd-ink)/0.08)]"
      >
        {entries.map((it) => (
          <Link
            key={it.href + it.label}
            href={it.href}
            role="menuitem"
            tabIndex={-1}
            aria-current={it.current ? "page" : undefined}
            onClick={() => onClose(false)}
            onPointerMove={(e: { currentTarget: HTMLElement }) => document.activeElement !== e.currentTarget && e.currentTarget.focus({ preventScroll: true })}
            className="flex h-9 items-center gap-2.5 rounded-[10px] px-2.5 text-[13.5px] text-[var(--bd-fg)] outline-none transition-colors duration-100 focus:bg-[rgb(var(--bd-ink)/0.06)] [&_svg]:size-4 [&_svg]:shrink-0"
          >
            {it.icon && <span className="grid place-items-center text-[var(--bd-muted)]">{it.icon}</span>}
            <span className="min-w-0 flex-1 truncate">{it.label}</span>
            {it.current && <CheckIcon weight="bold" className="!size-3.5 text-[var(--bd-muted)]" />}
          </Link>
        ))}
      </motion.div>
    </div>,
    document.body,
  );
}

/** A button that opens a LevelMenu: the "…" for folded levels, or the caret for a level's siblings. */
function LevelButton({ entries, label, link, className, onHover, children }: { entries: Entry[]; label: string; link: ElementType; className?: string; onHover?: () => void; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const id = useId();
  const mounted = useMounted();
  const close = useCallback((refocus: boolean) => {
    setOpen(false);
    if (refocus) button.current?.focus();
  }, []);
  return (
    <>
      <button
        ref={button}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onPointerEnter={onHover}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key !== "ArrowDown") return;
          e.preventDefault();
          setOpen(true);
        }}
        className={cx("relative grid place-items-center rounded-full text-[var(--bd-muted)] transition-colors hover:text-[var(--bd-fg)]", open && "text-[var(--bd-fg)]", FOCUS, className)}
      >
        {children}
      </button>
      {mounted && <AnimatePresence>{open && <LevelMenu id={id} anchor={button} entries={entries} link={link} onClose={close} />}</AnimatePresence>}
    </>
  );
}

export function Breadcrumb({ items, max = 4, link: Link = "a", label = "Breadcrumb", className }: BreadcrumbProps) {
  const [hover, setHover] = useState<string | null>(null);
  const still = useReducedMotion();
  const group = useId();
  const keep = Math.max(3, max);
  // Past `max`, the first crumb and the last few stay, and the ones between fold into "…".
  const folded = items.length > keep ? items.slice(1, items.length - (keep - 2)) : [];
  const shown: Array<Crumb | "fold"> = folded.length ? [items[0], "fold", ...items.slice(items.length - (keep - 2))] : items;
  const pill = (key: string) =>
    hover === key && <motion.span layoutId="crumb" aria-hidden className="absolute inset-0 -z-10 rounded-full bg-[rgb(var(--bd-ink)/0.055)]" transition={still ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 42 }} />;

  return (
    <nav aria-label={label} className={cx("min-w-0", className)}>
      <LayoutGroup id={group}>
        <ol className="isolate flex min-w-0 items-center text-sm" onPointerLeave={() => setHover(null)}>
          {shown.map((item, i) => {
            const last = i === shown.length - 1;
            const sep = i > 0 && (
              <span aria-hidden className="mx-0.5 select-none text-[15px] font-light text-[var(--bd-subtle)] opacity-60">
                /
              </span>
            );
            if (item === "fold") {
              return (
                <li key="fold" className="flex shrink-0 items-center">
                  {sep}
                  <span className="relative isolate">
                    {pill("fold")}
                    <LevelButton entries={folded.filter((c) => c.href).map((c) => ({ label: c.label, href: c.href!, icon: c.icon }))} label={`Show ${folded.length} more ${folded.length === 1 ? "level" : "levels"}`} link={Link} onHover={() => setHover("fold")} className="size-8 [&_svg]:size-4">
                      <DotsThreeIcon weight="bold" />
                    </LevelButton>
                  </span>
                </li>
              );
            }
            const key = `${i}-${item.label}`;
            const inner = (
              <>
                {item.icon && <span className="grid shrink-0 place-items-center [&_svg]:size-4">{item.icon}</span>}
                <span className="truncate">{item.label}</span>
              </>
            );
            const crumb = "relative inline-flex h-8 min-w-0 max-w-[min(200px,32vw)] items-center gap-1.5 rounded-full px-2.5";
            return (
              <li key={key} className={cx("flex min-w-0 items-center", last ? "shrink" : "shrink-[2]")}>
                {sep}
                <span className="relative isolate flex min-w-0 items-center">
                  {item.href && !last ? (
                    <Link href={item.href} onPointerEnter={() => setHover(key)} className={cx(crumb, "text-[var(--bd-muted)] transition-colors hover:text-[var(--bd-fg)]", FOCUS)}>
                      {pill(key)}
                      {inner}
                    </Link>
                  ) : item.href ? (
                    <Link href={item.href} aria-current="page" onPointerEnter={() => setHover(key)} className={cx(crumb, "font-medium text-[var(--bd-fg)]", FOCUS)}>
                      {pill(key)}
                      {inner}
                    </Link>
                  ) : (
                    <span aria-current="page" className={cx(crumb, "font-medium text-[var(--bd-fg)]")}>
                      {inner}
                    </span>
                  )}
                  {item.siblings && item.siblings.length > 0 && (
                    <span className="relative isolate -ml-1.5 shrink-0">
                      {pill(`${key}-siblings`)}
                      <LevelButton
                        entries={item.siblings.map((s) => ({ ...s, current: s.label === item.label }))}
                        label={`Switch from ${item.label}`}
                        link={Link}
                        onHover={() => setHover(`${key}-siblings`)}
                        className="h-8 w-6 [&_svg]:size-3.5"
                      >
                        <CaretUpDownIcon weight="regular" />
                      </LevelButton>
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ol>
      </LayoutGroup>
    </nav>
  );
}
