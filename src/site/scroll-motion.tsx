"use client";

import { animate, inView, scroll } from "motion";
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
 * Nothing is touched before React has taken it over: a part of the page still waiting to hydrate
 * would find styles on it the server never sent. Such a part is looked at again in a moment, and
 * if it's on screen by then, it stays as it is.
 */

const ONE = ".bd-reveal, [data-reveal]";
const GROUP = "[data-reveal-stagger]";
const EASE = [0.16, 1, 0.3, 1] as const;

/** Whether React has hydrated an element (or made it): it keeps its own handle on the element then. */
const ready = (el: Element) => Object.keys(el).some((k) => k.startsWith("__reactFiber$"));

const onScreen = (el: Element) => {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.bottom > 0 && r.top < innerHeight;
};

export function ScrollMotion() {
  const path = usePathname();
  useLayoutEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const seen = new WeakSet<Element>();
    // Found before React had them: tried again until it has, for a while.
    let waiting: Array<{ el: Element; go: () => void }> = [];
    const poll = window.setInterval(() => {
      waiting = waiting.filter((w) => !(ready(w.el) && (w.go(), true)));
    }, 120);
    const quit = window.setTimeout(() => window.clearInterval(poll), 20_000);
    const when = (el: Element, fresh: boolean, go: (fresh: boolean) => void) => {
      if (ready(el)) go(fresh);
      else waiting.push({ el, go: () => go(false) });
    };
    // Whether a block can rise: one that's pinned, sticky or already moved by a transform only fades.
    const rises = new WeakMap<Element, boolean>();
    const stops: Array<() => void> = [];

    const hide = (el: HTMLElement, rise: number) => {
      const cs = getComputedStyle(el);
      const can = cs.position !== "fixed" && cs.position !== "sticky" && cs.transform === "none";
      rises.set(el, can);
      el.style.opacity = "0";
      if (can) el.style.transform = `translateY(${rise}px)`;
    };
    const show = (el: HTMLElement, rise: number, delay = 0) => {
      const can = rises.get(el);
      const a = animate(el, can ? { opacity: [0, 1], y: [rise, 0] } : { opacity: [0, 1] }, { duration: 0.8, ease: EASE, delay });
      // At rest it wears nothing of ours, so its own styles hold again.
      void a.then(() => {
        el.style.removeProperty("opacity");
        if (can) el.style.removeProperty("transform");
      });
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

    const one = (el: HTMLElement, fresh: boolean) => when(el, fresh, (fresh) => {
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
    });

    // The cards of a grid that come into view together go in turn, 60ms apart.
    let turn = 0;
    let reset = 0;
    const next = () => {
      window.clearTimeout(reset);
      reset = window.setTimeout(() => (turn = 0), 140);
      return Math.min(turn++, 8) * 0.06;
    };
    const card = (item: HTMLElement, fresh: boolean) => when(item, fresh, (fresh) => {
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
    });
    const group = (g: HTMLElement, fresh: boolean) => {
      if (seen.has(g)) return;
      seen.add(g);
      // Inside a block that reveals, its cards come in with that block.
      if (g.parentElement?.closest(ONE)) return;
      for (const c of g.children) if (c instanceof HTMLElement) card(c, fresh);
    };

    const tied = (el: HTMLElement) => when(el, false, () => {
      if (seen.has(el)) return;
      seen.add(el);
      if (el.dataset.scroll === "recede") {
        el.style.transformOrigin = "50% 0%";
        stops.push(scroll(animate(el, { scale: [1, 0.94], opacity: [1, 0.35] }, { ease: "linear" }), { target: el, offset: ["start start", "end start"] }));
      } else if (el.dataset.scroll === "settle") {
        el.style.transformOrigin = "50% 100%";
        stops.push(scroll(animate(el, { scale: [0.95, 1], opacity: [0.5, 1] }, { ease: "linear" }), { target: el, offset: ["start end", "start 70%"] }));
      }
    });

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
      window.clearInterval(poll);
      window.clearTimeout(quit);
      window.clearTimeout(reset);
      stops.forEach((s) => s());
    };
  }, [path]);
  return null;
}
