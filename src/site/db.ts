"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { Args, Fn, Result } from "@/lib/api";
import { getSession, SUPABASE_ON, subscribeSession, supabase } from "@/lib/supabase";

/*
 * The database's functions, as the site and Studio call them. `rpc` runs one. `useRpc` shows one's
 * result (undefined while it loads), shared by every component asking the same thing, and
 * fetched again whenever it may have changed: after a change made here (`change` says what it
 * changes), when someone else signs in on this tab, when the tab comes back into view, and when a
 * project's live channel says so (src/studio/channel.ts). `watch` is for code that has to see each
 * result as it lands, not just the latest one drawn.
 */

/** Runs a database function as whoever is signed in. If it fails, the error is in the function's own words. */
export async function rpc<F extends Fn>(fn: F, args: Args<F>): Promise<Result<F>> {
  const { data, error } = await supabase().rpc(fn, args);
  if (error) throw new Error(error.message);
  return data as Result<F>;
}

/** A function that changes something, ready to call: once it's done, the results it changes are fetched again. */
export const change =
  <F extends Fn>(fn: F, ...changes: Fn[]) =>
  async (args: Args<F>) => {
    const r = await rpc(fn, args);
    refresh(...changes);
    return r;
  };

type Entry = { fn: Fn; args: unknown; value: unknown; listeners: Set<() => void>; busy: boolean; again: boolean; at: number; tries: number };
const entries = new Map<string, Entry>();

function entryFor(fn: Fn, json: string) {
  const key = `${fn}:${json}`;
  let e = entries.get(key);
  if (!e) entries.set(key, (e = { fn, args: JSON.parse(json), value: undefined, listeners: new Set(), busy: false, again: false, at: 0, tries: 0 }));
  return e;
}

/** One fetch at a time per result; asked again meanwhile, it fetches once more after. */
async function load(e: Entry) {
  if (e.busy) {
    e.again = true;
    return;
  }
  e.busy = true;
  e.again = false;
  const asked = getSession().user?.id ?? null;
  try {
    const value = await rpc(e.fn, e.args as never);
    e.tries = 0;
    // Asked for someone who has signed out since: theirs isn't shown.
    if ((getSession().user?.id ?? null) === asked) {
      e.value = value;
      e.at = Date.now();
      e.listeners.forEach((l) => l());
    }
  } catch (err) {
    console.warn(`${e.fn}: ${err instanceof Error ? err.message : err}`);
    // A blip, most likely: tried twice more, a little later each time.
    if (e.tries++ < 2) setTimeout(() => e.listeners.size && void load(e), 2000 * e.tries);
  } finally {
    e.busy = false;
    if (e.again && e.listeners.size) void load(e);
  }
}

/** Fetches again what's showing for these functions (all of them, with none named). The rest are fetched when next shown. */
export function refresh(...fns: Fn[]) {
  for (const e of entries.values()) {
    if (fns.length && !fns.includes(e.fn)) continue;
    if (e.listeners.size) void load(e);
  }
}

function subscribe(e: Entry, listener: () => void) {
  e.listeners.add(listener);
  // The first to ask, or the first back after everyone stopped: what's kept is shown, and fetched again.
  if (e.listeners.size === 1) void load(e);
  return () => {
    e.listeners.delete(listener);
  };
}

export function useRpc<F extends Fn>(fn: F, args: Args<F> | "skip"): Result<F> | undefined {
  const json = args === "skip" || !SUPABASE_ON ? null : JSON.stringify(args);
  const sub = useCallback((listener: () => void) => (json === null ? () => {} : subscribe(entryFor(fn, json), listener)), [fn, json]);
  const get = () => (json === null ? undefined : (entries.get(`${fn}:${json}`)?.value as Result<F> | undefined));
  return useSyncExternalStore(sub, get, () => undefined);
}

/** Each result of one function as it lands: what's there now, and a way to hear the next ones. */
export function watch<F extends Fn>(fn: F, args: Args<F>) {
  const e = entryFor(fn, JSON.stringify(args));
  return {
    current: () => e.value as Result<F> | undefined,
    onUpdate: (listener: () => void) => subscribe(e, listener),
    refresh: () => void load(e),
  };
}

if (typeof window !== "undefined" && SUPABASE_ON) {
  // Someone else signed in (or out): nothing of the last person's is shown, and everything is fetched as the new one.
  let who: string | null | undefined;
  subscribeSession(() => {
    const id = getSession().user?.id ?? null;
    if (who !== undefined && id !== who)
      for (const e of entries.values()) {
        e.value = undefined;
        e.listeners.forEach((l) => l());
      }
    const first = who === undefined;
    who = id;
    // The first word on who's signed in changes nothing: everything asked so far was asked as them.
    if (!first) refresh();
  });
  // Back in view after a while: anything that changed meanwhile, without a live channel to say so.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    for (const e of entries.values()) if (e.listeners.size && Date.now() - e.at > 15_000) void load(e);
  });
}
