"use client";

import { CaretDownIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Children, isValidElement, useEffect, useId, useLayoutEffect, useRef, useState, type ElementType, type KeyboardEvent, type ReactElement, type ReactNode } from "react";

/*
 * A site's top navigation, with one panel that travels between its menus. Point at Product and a
 * card opens under it; slide over to Templates and the same card glides across, growing or
 * shrinking to fit what Templates holds while the old content slips out the way you came and the
 * new slips in, a caret on top following along. It waits a beat before opening and before closing,
 * so passing over the bar doesn't flicker. The keyboard opens a menu with Enter or the down arrow,
 * moves between menus with the side arrows, and Escape brings you back.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export type NavigationMenuItemProps = {
  /** The menu's name, on the bar. */
  label: string;
  /** What its panel holds: cards, links, anything. */
  children: ReactNode;
  /** Sets the panel's width and layout, like grid grid-cols-2 w-[520px]. */
  className?: string;
};

/** A menu on the bar. Its children are what its panel holds. */
export function NavigationMenuItem(props: NavigationMenuItemProps): ReactNode {
  void props;
  return null;
}

export type NavigationMenuLinkProps = { href: string; children: ReactNode };

/** A plain link on the bar, with no panel. */
export function NavigationMenuLink(props: NavigationMenuLinkProps): ReactNode {
  void props;
  return null;
}

export type NavigationMenuCardProps = {
  href: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  /** Your router's link. A plain <a> by default. */
  link?: ElementType;
  className?: string;
};

/** A link in a panel: an icon on a soft tile, a title and a line on where it goes. */
export function NavigationMenuCard({ href, title, description, icon, link: Link = "a", className }: NavigationMenuCardProps) {
  return (
    <Link href={href} className={cx("group/card flex gap-3 rounded-[14px] p-3 outline-none transition-colors hover:bg-[rgb(var(--bd-ink)/0.04)] focus-visible:bg-[rgb(var(--bd-ink)/0.04)] focus-visible:outline-2 focus-visible:outline-[color:var(--bd-ui-focus)]", description ? "items-start" : "items-center", className)}>
      {icon && <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-[var(--bd-ui-track)] text-[var(--bd-muted)] transition-colors group-hover/card:text-[var(--bd-fg)] [&_svg]:size-[18px]">{icon}</span>}
      {/* With a line under it, the title sits level with the tile's top; alone, with its middle. */}
      <span className={cx("min-w-0", description && "pt-px")}>
        <span className="block text-[13.5px] font-medium leading-5 text-[var(--bd-fg)]">{title}</span>
        {description && <span className="mt-0.5 block text-[12.5px] leading-[1.45] text-[var(--bd-muted)]">{description}</span>}
      </span>
    </Link>
  );
}

export type NavigationMenuProps = {
  children: ReactNode;
  /** What the nav is called, for a screen reader. */
  label?: string;
  /** Your router's link, for the plain links on the bar. */
  link?: ElementType;
  className?: string;
};

type Item = { kind: "menu"; label: string; content: ReactNode; className?: string } | { kind: "link"; href: string; label: ReactNode };

/* How long the pointer has to rest before a menu opens, and stay away before it closes. */
const OPEN_AFTER = 70;
const CLOSE_AFTER = 220;

export function NavigationMenu({ children, label = "Main", link: Link = "a", className }: NavigationMenuProps) {
  const items: Item[] = Children.toArray(children)
    .filter(isValidElement)
    .map((el) => {
      const e = el as ReactElement<NavigationMenuItemProps & NavigationMenuLinkProps>;
      return e.type === NavigationMenuLink ? { kind: "link" as const, href: e.props.href, label: e.props.children } : { kind: "menu" as const, label: e.props.label, content: e.props.children, className: e.props.className };
    });
  const [active, setActive] = useState<number | null>(null);
  const [dir, setDir] = useState(1);
  const nav = useRef<HTMLElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const triggers = useRef<Array<HTMLButtonElement | HTMLAnchorElement | null>>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [box, setBox] = useState<{ left: number; width: number; height: number; caret: number } | null>(null);
  const [landed, setLanded] = useState(false);
  const still = useReducedMotion();
  const id = useId();

  const later = (fn: () => void, ms: number) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(fn, ms);
  };
  const show = (i: number | null) => {
    if (timer.current) clearTimeout(timer.current);
    setActive((was) => {
      if (was != null && i != null) setDir(i > was ? 1 : -1);
      if (was == null || i == null) setLanded(false);
      return i;
    });
  };
  // Once the card has been placed where it opened, later moves glide.
  useEffect(() => {
    if (!box || landed || active == null) return;
    const t = requestAnimationFrame(() => setLanded(true));
    return () => cancelAnimationFrame(t);
  }, [box, landed, active]);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  // Where the card goes: centered under its menu's name, as big as what it holds, and kept inside the
  // window and inside the nearest box around the menu that clips what spills out of it.
  useLayoutEffect(() => {
    if (active == null) return;
    const measure = () => {
      const t = triggers.current[active];
      const n = nav.current;
      const p = panel.current;
      if (!t || !n || !p) return;
      const nb = n.getBoundingClientRect();
      const tb = t.getBoundingClientRect();
      const width = p.offsetWidth;
      const height = p.offsetHeight;
      const center = tb.left + tb.width / 2;
      let [lo, hi] = [8, innerWidth - 8];
      for (let el = n.parentElement; el; el = el.parentElement) {
        if (getComputedStyle(el).overflowX === "visible") continue;
        const r = el.getBoundingClientRect();
        [lo, hi] = [Math.max(lo, r.left + 8), Math.min(hi, r.right - 8)];
        break;
      }
      const left = Math.min(Math.max(center - width / 2, lo), Math.max(lo, hi - width));
      setBox({ left: left - nb.left, width, height, caret: center - left });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (panel.current) ro.observe(panel.current);
    addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      removeEventListener("resize", measure);
    };
  }, [active]);

  // Closing on a click anywhere else, or when focus leaves the nav.
  useEffect(() => {
    if (active == null) return;
    const away = (e: PointerEvent) => !nav.current?.contains(e.target as Node) && show(null);
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [active]);

  const enterPanel = () => requestAnimationFrame(() => panel.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus());
  const onTriggerKey = (e: KeyboardEvent<HTMLElement>, i: number) => {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (step) {
      e.preventDefault();
      const next = (i + step + items.length) % items.length;
      triggers.current[next]?.focus();
      if (active != null && items[next].kind === "menu") show(next);
      return;
    }
    if (items[i].kind !== "menu") return;
    if (e.key === "ArrowDown" || ((e.key === "Enter" || e.key === " ") && active !== i)) {
      e.preventDefault();
      show(i);
      enterPanel();
    } else if (e.key === "Escape") show(null);
  };
  const onPanelKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (active == null) return;
    if (e.key === "Escape") {
      e.preventDefault();
      triggers.current[active]?.focus();
      show(null);
      return;
    }
    if (e.key !== "Tab") return;
    // Past either end of the panel, focus goes back to the bar: its own menu going back, the next one going on.
    const all = [...(panel.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])];
    const at = all.indexOf(document.activeElement as HTMLElement);
    if (!e.shiftKey && at === all.length - 1) {
      e.preventDefault();
      triggers.current[(active + 1) % items.length]?.focus();
      show(null);
    } else if (e.shiftKey && at === 0) {
      e.preventDefault();
      triggers.current[active]?.focus();
    }
  };

  const current = active != null && items[active]?.kind === "menu" ? (items[active] as Extract<Item, { kind: "menu" }>) : null;
  const spring = still ? { duration: 0 } : { type: "spring" as const, stiffness: 380, damping: 34 };
  const glide = landed ? spring : { duration: 0 };

  return (
    <nav ref={nav} aria-label={label} className={cx("relative", className)} onPointerLeave={() => later(() => show(null), CLOSE_AFTER)} onPointerEnter={() => timer.current && clearTimeout(timer.current)}>
      <ul className="flex items-center gap-0.5">
        {items.map((it, i) =>
          it.kind === "link" ? (
            <li key={i}>
              <Link
                ref={(el: HTMLAnchorElement | null) => void (triggers.current[i] = el)}
                href={it.href}
                onKeyDown={(e: KeyboardEvent<HTMLElement>) => onTriggerKey(e, i)}
                onPointerEnter={() => active != null && later(() => show(null), CLOSE_AFTER)}
                className="flex h-9 items-center rounded-full px-2.5 text-sm text-[var(--bd-muted)] sm:px-3.5 outline-none transition-colors hover:text-[var(--bd-fg)] focus-visible:outline-2 focus-visible:outline-[color:var(--bd-ui-focus)]"
              >
                {it.label}
              </Link>
            </li>
          ) : (
            <li key={i}>
              <button
                ref={(el) => void (triggers.current[i] = el)}
                type="button"
                aria-expanded={active === i}
                aria-controls={active === i ? `${id}-panel` : undefined}
                onPointerEnter={() => (active == null ? later(() => show(i), OPEN_AFTER) : show(i))}
                onClick={() => show(active === i ? null : i)}
                onKeyDown={(e) => onTriggerKey(e, i)}
                className={cx("flex h-9 items-center gap-1 rounded-full px-2.5 text-sm outline-none sm:px-3.5 transition-colors focus-visible:outline-2 focus-visible:outline-[color:var(--bd-ui-focus)]", active === i ? "bg-[rgb(var(--bd-ink)/0.05)] text-[var(--bd-fg)]" : "text-[var(--bd-muted)] hover:text-[var(--bd-fg)]")}
              >
                {it.label}
                <motion.span animate={{ rotate: active === i ? 180 : 0 }} transition={spring} className="grid place-items-center">
                  <CaretDownIcon weight="bold" className="size-3 opacity-60" />
                </motion.span>
              </button>
            </li>
          ),
        )}
      </ul>
      <AnimatePresence>
        {current && (
          <motion.div
            key="viewport"
            id={`${id}-panel`}
            onKeyDown={onPanelKey}
            initial={still ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={still ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.14 } }}
            transition={spring}
            className={cx("absolute left-0 top-full z-50 pt-2.5", !box && "invisible")}
            style={{ transformOrigin: box ? `${box.left + box.caret}px 0px` : "center top" }}
          >
            <motion.div initial={false} animate={{ x: box?.left ?? 0, width: box?.width ?? 0, height: box?.height ?? 0 }} transition={glide} className="relative rounded-[20px] bg-[var(--bd-surface)] text-[var(--bd-fg)] shadow-[var(--bd-shadow-float),0_0_0_1px_rgb(var(--bd-ink)/0.08)]">
              {/* The caret, over the menu that opened it. */}
              {/* Turned by motion, not a class: a CSS rotate would turn its slide sideways into a slide down the diagonal. */}
              <motion.span aria-hidden initial={false} animate={{ x: (box?.caret ?? 0) - 6, rotate: 45 }} transition={glide} className="absolute -top-[5px] left-0 size-3 rounded-[2px] bg-[var(--bd-surface)] shadow-[-1px_-1px_0_rgb(var(--bd-ink)/0.08)]" />
              <div className="relative overflow-hidden rounded-[20px]" style={{ width: box?.width, height: box?.height }}>
                <AnimatePresence initial={false} custom={dir} mode="popLayout">
                  <motion.div
                    key={active}
                    // The panel coming in takes the ref; the one leaving lets go later, so it never clears it.
                    ref={(el: HTMLDivElement | null) => void (el && (panel.current = el))}
                    custom={dir}
                    variants={{ in: (d: number) => ({ opacity: 0, x: still ? 0 : d * 28 }), at: { opacity: 1, x: 0 }, out: (d: number) => ({ opacity: 0, x: still ? 0 : d * -28 }) }}
                    initial="in"
                    animate="at"
                    exit="out"
                    transition={{ x: spring, opacity: { duration: 0.18 } }}
                    className="absolute left-0 top-0 w-max max-w-[calc(100vw-32px)]"
                  >
                    <div className={cx("p-2", current.className)}>{current.content}</div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
