"use client";

import { inView, scroll } from "motion";
import { usePathname } from "next/navigation";
import { useLayoutEffect } from "react";

/*
 * Motion as the page scrolls, on every page of the site, made with Motion (motion.dev):
 *
 * - A block marked bd-reveal rises and fades in the first time it comes into view. A grid marked
 *   data-reveal-stagger brings its cards in one after another, as many as come into view at once,
 *   and a card that joins later (a filter, a search) rises in where it lands. Where the grid's
 *   items are Motion's own (they move when the grid reflows), data-reveal-stagger="inner" moves
 *   the card inside each item instead, and leaves a card that joins to the item's own entrance.
 * - data-scroll="recede" (a page's hero card) sinks back and dims as the page scrolls over it.
 * - data-scroll="settle" (a big lit panel) grows the last few percent to its full size and comes
 *   up to full strength as it scrolls in, tied to the scroll rather than to a clock.
 *
 * What's on screen when a page opens is already there and stays put: the page itself fades in
 * (see shell.tsx). What streams in later while in view rises in as it lands. All of it holds still
 * for anyone who asks for less motion.
 *
 * Motion watches the scroll and what comes into view; the looks themselves are the browser's own
 * animations (element.animate), which never write to an element's style. So the page React finds
 * is always the page the server sent, however late a part of it hydrates or however often React
 * starts hydrating it over, and there's nothing to clean off an element once it's at rest.
 */

const ONE = ".bd-reveal, [data-reveal]";
const GROUP = "[data-reveal-stagger]";
const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

const onScreen = (el: Element) => {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.bottom > 0 && r.top < innerHeight;
};

export function ScrollMotion() {
  const path = usePathname();
  useLayoutEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const seen = new WeakSet<Element>();
    // Whether a block can rise: one that's pinned, sticky or already moved by a transform only fades.
    const rises = new WeakMap<Element, boolean>();
    // What's held out of sight until it comes into view, by the animation holding it there.
    const holds = new Map<Element, Animation>();
    const stops: Array<() => void> = [];

    const start = (el: Element, rise: number): Keyframe => (rises.get(el) ? { opacity: 0, transform: `translateY(${rise}px)` } : { opacity: 0 });
    const hide = (el: HTMLElement, rise: number) => {
      const cs = getComputedStyle(el);
      rises.set(el, cs.position !== "fixed" && cs.position !== "sticky" && cs.transform === "none");
      // Held on its first frame by an animation that never ends, rather than by a style on it.
      holds.set(el, el.animate([start(el, rise), start(el, rise)], { duration: 1, fill: "forwards" }));
    };
    const show = (el: HTMLElement, rise: number, delay = 0) => {
      const end: Keyframe = rises.get(el) ? { opacity: 1, transform: "translateY(0)" } : { opacity: 1 };
      // The entrance holds its first frame through its delay, so the hold can go in the same moment.
      el.animate([start(el, rise), end], { duration: 800, easing: EASE, delay: delay * 1000, fill: "backwards" });
      holds.get(el)?.cancel();
      holds.delete(el);
    };
    // Revealed when it first comes into view, a little way up from the bottom edge.
    const later = (el: HTMLElement, rise: number, go: () => void) => {
      hide(el, rise);
      const stop = inView(
        el,
        () => {
          go();
          stop();
        },
        { margin: "0px 0px -10% 0px" },
      );
      stops.push(stop);
    };

    const one = (el: HTMLElement, fresh: boolean) => {
      if (seen.has(el)) return;
      seen.add(el);
      // Inside a block that reveals, it comes in with that block.
      if (el.parentElement?.closest(`${ONE}, ${GROUP}`)) return;
      if (onScreen(el)) {
        if (fresh) {
          hide(el, 28);
          show(el, 28);
        }
        return;
      }
      later(el, 28, () => show(el, 28));
    };

    // The cards of a grid that come into view together go in turn, 60ms apart.
    let turn = 0;
    let reset = 0;
    const next = () => {
      window.clearTimeout(reset);
      reset = window.setTimeout(() => (turn = 0), 140);
      return Math.min(turn++, 8) * 0.06;
    };
    const card = (item: HTMLElement, fresh: boolean) => {
      const inner = item.parentElement?.dataset.revealStagger === "inner";
      const el = inner ? item.firstElementChild : item;
      if (!(el instanceof HTMLElement) || seen.has(el)) return;
      seen.add(el);
      if (onScreen(el)) {
        if (fresh && !inner) {
          hide(el, 18);
          show(el, 18, next());
        }
        return;
      }
      later(el, 18, () => show(el, 18, next()));
    };
    const group = (g: HTMLElement, fresh: boolean) => {
      if (seen.has(g)) return;
      seen.add(g);
      // Inside a block that reveals, its cards come in with that block.
      if (g.parentElement?.closest(ONE)) return;
      for (const c of g.children) if (c instanceof HTMLElement) card(c, fresh);
    };

    // Tied to the scroll: a paused animation whose place Motion sets from how far the block has scrolled.
    const tied = (el: HTMLElement) => {
      if (seen.has(el)) return;
      seen.add(el);
      const recede = el.dataset.scroll === "recede";
      if (!recede && el.dataset.scroll !== "settle") return;
      const look = recede
        ? [
            { transformOrigin: "50% 0%", transform: "scale(1)", opacity: 1 },
            { transformOrigin: "50% 0%", transform: "scale(0.94)", opacity: 0.35 },
          ]
        : [
            { transformOrigin: "50% 100%", transform: "scale(0.95)", opacity: 0.5 },
            { transformOrigin: "50% 100%", transform: "scale(1)", opacity: 1 },
          ];
      const a = el.animate(look, { duration: 1000, easing: "linear", fill: "both" });
      a.pause();
      const stop = scroll(
        (progress: number) => {
          a.currentTime = progress * 1000;
        },
        { target: el, offset: recede ? ["start start", "end start"] : ["start end", "start 70%"] },
      );
      stops.push(() => {
        stop();
        a.cancel();
      });
    };

    const scan = (root: ParentNode, fresh: boolean) => {
      root.querySelectorAll<HTMLElement>("[data-scroll]").forEach(tied);
      root.querySelectorAll<HTMLElement>(GROUP).forEach((g) => group(g, fresh));
      root.querySelectorAll<HTMLElement>(ONE).forEach((el) => one(el, fresh));
    };
    scan(document, false);

    // What arrives after: a page's streamed part, a grid's new cards. Caught before it paints.
    const watch = new MutationObserver((records) => {
      for (const r of records)
        for (const n of r.addedNodes) {
          if (!(n instanceof HTMLElement)) continue;
          const holder = n.parentElement;
          if (holder?.matches(GROUP) && seen.has(holder)) card(n, true);
          if (n.matches("[data-scroll]")) tied(n);
          if (n.matches(GROUP)) group(n, true);
          if (n.matches(ONE)) one(n, true);
          scan(n, true);
        }
    });
    watch.observe(document.body, { childList: true, subtree: true });

    return () => {
      watch.disconnect();
      window.clearTimeout(reset);
      stops.forEach((s) => s());
      // Whatever was still waiting to come into view shows again; the next page looks at it afresh.
      holds.forEach((a) => a.cancel());
    };
  }, [path]);
  return null;
}
