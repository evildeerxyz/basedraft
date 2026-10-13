import { useSyncExternalStore } from "react";

/*
 * Whether someone has done anything on the page yet: scrolled, pointed, touched or typed. Things
 * that play on their own wait for it, so a page that's only being looked at by a machine (a
 * screenshot, a copy to Figma) is caught at rest, and a person always sees them move.
 */
let engaged = false;
const listeners = new Set<() => void>();
const EVENTS = ["pointermove", "pointerdown", "wheel", "scroll", "keydown", "touchstart"] as const;

function engage() {
  if (engaged) return;
  engaged = true;
  for (const e of EVENTS) window.removeEventListener(e, engage, true);
  for (const l of listeners) l();
}

function subscribe(fn: () => void) {
  if (!engaged && listeners.size === 0) for (const e of EVENTS) window.addEventListener(e, engage, { capture: true, passive: true });
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const useEngaged = () =>
  useSyncExternalStore(
    subscribe,
    () => engaged,
    () => false,
  );
