"use client";

import { animate, AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from "motion/react";
import { createContext, use, useEffect, useRef, useState, type ElementType, type KeyboardEvent, type ReactNode } from "react";

/*
 * A dock of brushed-metal keys on a frosted bar. Keys swell as the pointer nears them, each on its
 * own spring, so the row breathes under your hand; a name rises over the one you're on, the open
 * ones carry a dot, and a pressed key hops. The arrow keys walk along it, and focus swells too.
 * Given less room than it needs, every key shrinks alike, swell and all, so the dock still fits.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

type Ctx = { mouseX: MotionValue<number>; base: number; max: number; reach: number; still: boolean; design: number };
const DockContext = createContext<Ctx | null>(null);

export type DockProps = {
  children: ReactNode;
  /** A key's size at rest, in px. */
  size?: number;
  /** Its size right under the pointer. */
  magnify?: number;
  /** How far, in px, the swell reaches either side of the pointer. */
  reach?: number;
  /** What the dock is, for screen readers. */
  label?: string;
  className?: string;
};

export function Dock({ children, size = 44, magnify = 66, reach = 140, label = "Dock", className }: DockProps) {
  const mouseX = useMotionValue(Infinity);
  const still = !!useReducedMotion();
  const list = useRef<HTMLUListElement>(null);
  const [fit, setFit] = useState(size);
  // Where its container is narrower than the dock at rest, the keys shrink to fit, keeping room
  // for the swell (about 2.7 keys' worth). A container that wraps the dock tightly only echoes
  // the dock's own width back, so that's left alone.
  useEffect(() => {
    const ul = list.current;
    const room = ul?.parentElement?.parentElement;
    if (!ul || !room) return;
    const ro = new ResizeObserver(() => {
      const cs = getComputedStyle(room);
      const width = room.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const n = ul.querySelectorAll("[data-dock-key]").length;
      // The bar's padding, the dividers and the gaps; then n keys.
      const fixed = 24 + (ul.children.length - n) * 5 + (ul.children.length - 1) * 10;
      const rest = (b: number) => fixed + n * b;
      setFit((f) => {
        if (!n || width >= rest(size)) return size;
        if (Math.abs(width - rest(f)) < 2) return f;
        const swell = still ? 0 : 2.7 * (magnify / size - 1);
        return Math.max(24, Math.min(size, Math.floor((width - fixed) / (n + swell))));
      });
    });
    ro.observe(room);
    return () => ro.disconnect();
  }, [size, magnify, still]);
  // The arrow keys walk the keys.
  const keys = (e: KeyboardEvent) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "Home" && e.key !== "End") return;
    const all = [...(list.current?.querySelectorAll<HTMLElement>("[data-dock-key]") ?? [])];
    const at = all.indexOf(document.activeElement as HTMLElement);
    const next = e.key === "Home" ? 0 : e.key === "End" ? all.length - 1 : (at + (e.key === "ArrowRight" ? 1 : -1) + all.length) % all.length;
    e.preventDefault();
    all[next]?.focus();
  };
  return (
    <DockContext value={{ mouseX, base: fit, max: still ? fit : (magnify * fit) / size, reach, still, design: size }}>
      <nav aria-label={label} className={cx("flex justify-center", className)}>
        <ul
          ref={list}
          onPointerMove={(e) => mouseX.set(e.clientX)}
          onPointerLeave={() => mouseX.set(Infinity)}
          onKeyDown={keys}
          className="flex items-end gap-2.5 rounded-[24px] bg-[color-mix(in_oklab,var(--bd-surface)_72%,transparent)] px-3 pb-3 pt-3 shadow-[inset_0_1px_0_rgb(255_255_255/0.5),0_0_0_1px_var(--bd-line),var(--bd-shadow-raised)] backdrop-blur-xl"
          style={{ minHeight: fit + 24 }}
        >
          {children}
        </ul>
      </nav>
    </DockContext>
  );
}

export type DockItemProps = {
  /** Its name, shown over it and read to screen readers. */
  label: string;
  icon: ReactNode;
  /** Opens or does something. */
  onClick?: () => void;
  /** Goes somewhere; it's a link then. */
  href?: string;
  /** Your router's link, like Next.js's Link. */
  link?: ElementType;
  /** Open: a dot under it. */
  active?: boolean;
  /** A count or mark on its corner: unread, new. */
  badge?: ReactNode;
};

export function DockItem({ label, icon, onClick, href, link: Link = "a", active, badge }: DockItemProps) {
  const ctx = use(DockContext)!;
  const { mouseX, base, max, reach, still, design } = ctx;
  const self = useRef<HTMLLIElement>(null);
  const [hot, setHot] = useState(false);
  const hop = useMotionValue(0);
  // How far the pointer is from this key's middle, and the size that gives it.
  const dist = useTransform(mouseX, (x) => {
    const r = self.current?.getBoundingClientRect();
    return r && Number.isFinite(x) ? x - (r.left + r.width / 2) : Infinity;
  });
  const swell = useTransform(dist, [-reach, 0, reach], [base, max, base]);
  const sizeMv = useSpring(swell, { stiffness: 340, damping: 26, mass: 0.25 });
  // The icon is drawn for the dock's own size, and scales with the key.
  const icoScale = useTransform(sizeMv, (s) => s / design);

  const press = () => {
    if (!still) animate(hop, [0, -18, 0, -6, 0], { duration: 0.65, times: [0, 0.3, 0.6, 0.8, 1], ease: "easeOut" });
    onClick?.();
  };
  const focus = (on: boolean, el: HTMLElement) => {
    setHot(on);
    const r = el.getBoundingClientRect();
    mouseX.set(on ? r.left + r.width / 2 : Infinity);
  };
  const KEY = "group/key relative grid size-full place-items-center rounded-[28%] border-[1.5px] border-transparent text-white outline-none [background:var(--bd-ui-metal-fill)_padding-box,var(--bd-ui-metal-edge)_border-box] shadow-[inset_0_1px_0_rgb(255_255_255/0.16),0_1px_2px_rgb(0_0_0/0.2),0_8px_18px_-10px_rgb(0_0_0/0.6)] focus-visible:shadow-[inset_0_1px_0_rgb(255_255_255/0.16),0_0_0_3px_var(--bd-ui-focus)]";
  const inner = (
    <>
      <motion.span aria-hidden style={{ scale: icoScale }} className="grid place-items-center [&_svg]:size-[22px]">
        {icon}
      </motion.span>
      {badge != null && (
        <span className="absolute -right-1.5 -top-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full px-1 text-[10.5px] font-semibold tabular-nums text-[oklch(0.2_0_0)] shadow-[0_1px_3px_rgb(0_0_0/0.3),0_0_0_1px_rgb(0_0_0/0.08)] [background:var(--bd-ui-bead)]">
          {badge}
        </span>
      )}
    </>
  );
  const shared = {
    "data-dock-key": "",
    "aria-label": `${label}${active ? ", open" : ""}${badge != null ? `, ${badge}` : ""}`,
    onPointerEnter: () => setHot(true),
    onPointerLeave: () => setHot(false),
    onFocus: (e: { currentTarget: HTMLElement }) => focus(true, e.currentTarget),
    onBlur: (e: { currentTarget: HTMLElement }) => focus(false, e.currentTarget),
    className: KEY,
  };

  return (
    <motion.li ref={self} style={{ width: sizeMv, height: sizeMv, y: hop }} className="relative shrink-0">
      <AnimatePresence>
        {hot && (
          <motion.span
            aria-hidden
            initial={{ opacity: 0, y: 4, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 2, transition: { duration: 0.1 } }}
            transition={{ type: "spring", stiffness: 600, damping: 32 }}
            className="pointer-events-none absolute bottom-[calc(100%+10px)] left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-medium text-[var(--bd-ui-ink-text)] shadow-[0_4px_12px_rgb(0_0_0/0.2)] [background:var(--bd-ui-ink)]"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
      {href ? (
        <Link href={href} {...shared} onClick={press}>
          {inner}
        </Link>
      ) : (
        <button type="button" {...shared} onClick={press}>
          {inner}
        </button>
      )}
      {active && <span aria-hidden className="absolute -bottom-2 left-1/2 size-1 -translate-x-1/2 rounded-full bg-[var(--bd-fg)]" />}
    </motion.li>
  );
}

/** A thin line between groups of keys. */
export function DockDivider() {
  return <li aria-hidden className="mx-0.5 h-9 w-px self-center bg-[var(--bd-line-strong)]" />;
}
