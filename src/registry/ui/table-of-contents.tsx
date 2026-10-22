"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type MouseEvent, type RefObject } from "react";

/*
 * "On this page": a long page's sections, with an ink bar beside the list that slides to the one
 * you're reading as you scroll. The sections you've passed stay a shade darker than the ones
 * ahead, so the list also says how far you are. A click glides to the section and puts its link
 * in the address bar, without a jump. It follows the window, or any box that scrolls.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

export type TocItem = {
  /** The id of the section's heading on the page. */
  id: string;
  label: string;
  /** 1 for a section, 2 and 3 for the ones inside it, set in a step each. */
  level?: 1 | 2 | 3;
};

export type TableOfContentsProps = {
  items: TocItem[];
  /** Over the list, and its name for screen readers. */
  title?: string;
  /** How far from the top a section's heading counts as reached, in pixels: below a sticky header. */
  offset?: number;
  /** The box that scrolls, when it isn't the window. */
  scrollRoot?: RefObject<HTMLElement | null>;
  /** Puts a clicked section's link in the address bar. */
  updateHash?: boolean;
  className?: string;
};

export function TableOfContents({ items, title = "On this page", offset = 96, scrollRoot, updateHash = true, className }: TableOfContentsProps) {
  const [active, setActive] = useState(0);
  const [bar, setBar] = useState<{ top: number; height: number } | null>(null);
  const list = useRef<HTMLOListElement>(null);
  const still = useReducedMotion();

  // The section being read: the last whose heading has come up past the offset.
  useEffect(() => {
    const root = scrollRoot?.current ?? null;
    const target: HTMLElement | Window = root ?? window;
    let frame = 0;
    const measure = () => {
      const top = root ? root.getBoundingClientRect().top : 0;
      let at = 0;
      items.forEach((it, i) => {
        const el = document.getElementById(it.id);
        if (el && el.getBoundingClientRect().top - top <= offset + 1) at = i;
      });
      // At the very bottom, the last section is the one being read, however short it is.
      const end = root ? root.scrollTop + root.clientHeight >= root.scrollHeight - 2 : innerHeight + scrollY >= document.documentElement.scrollHeight - 2;
      setActive(end ? items.length - 1 : at);
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    measure();
    target.addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      target.removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
    };
  }, [items, offset, scrollRoot]);

  // The bar sits beside the active link: measured, so a link over two lines gets a taller bar.
  useEffect(() => {
    const li = list.current?.children[active] as HTMLElement | undefined;
    if (li) setBar({ top: li.offsetTop, height: li.offsetHeight });
  }, [active, items]);

  const go = (e: MouseEvent<HTMLAnchorElement>, id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    const root = scrollRoot?.current;
    const behavior = still ? "auto" : "smooth";
    if (root) root.scrollTo({ top: el.getBoundingClientRect().top - root.getBoundingClientRect().top + root.scrollTop - offset + 8, behavior });
    else scrollTo({ top: el.getBoundingClientRect().top + scrollY - offset + 8, behavior });
    if (updateHash) history.replaceState(null, "", `#${id}`);
  };

  return (
    <nav aria-label={title} className={cx("text-[13px]", className)}>
      {title && <p className="mb-3 text-xs font-medium text-[var(--bd-fg)]">{title}</p>}
      <div className="relative">
        {/* The track, and the ink bar that slides along it to the section being read. */}
        <span aria-hidden className="absolute inset-y-0 left-0 w-px bg-[var(--bd-line)]" />
        {bar && <motion.span aria-hidden className="absolute left-[-0.5px] w-[2px] rounded-full bg-[var(--bd-fg)]" initial={false} animate={{ top: bar.top, height: bar.height }} transition={still ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 38 }} />}
        <ol ref={list} className="grid">
          {items.map((it, i) => (
            <li key={it.id}>
              <a
                href={`#${it.id}`}
                onClick={(e) => go(e, it.id)}
                aria-current={i === active ? "location" : undefined}
                className={cx(
                  "block py-1.5 pr-2 leading-[1.4] outline-none transition-colors duration-200 hover:text-[var(--bd-fg)] focus-visible:rounded-[6px] focus-visible:outline-2 focus-visible:outline-[color:var(--bd-ui-focus)]",
                  it.level === 3 ? "pl-9" : it.level === 2 ? "pl-6" : "pl-3.5",
                  i === active ? "font-medium text-[var(--bd-fg)]" : i < active ? "text-[var(--bd-muted)]" : "text-[var(--bd-subtle)]",
                )}
              >
                {it.label}
              </a>
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}
