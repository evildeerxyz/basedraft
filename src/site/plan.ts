"use client";

import { useMemo, useSyncExternalStore } from "react";
import { unlocked } from "@/lib/products";
import { getSession, SERVER_SESSION, subscribeSession } from "@/lib/supabase";
import { useRpc } from "./db";

/*
 * What the signed-in person owns, from their Whop purchases in Supabase: signed out is Free. Pro
 * (or Team) unlocks every Pro feature and every template; buying one template unlocks its code.
 *
 * In development only, Pro can be previewed on a signed-in account without buying it (the switch
 * is on the Pro page and in the Pro card). Production never reads it.
 */
export type Plan = "free" | "pro";

export const PREVIEW_AVAILABLE = process.env.NODE_ENV !== "production";
const KEY = "bd-preview-pro";
const EVENT = "bd-preview-change";
const subscribe = (cb: () => void) => {
  window.addEventListener("storage", cb);
  window.addEventListener(EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(EVENT, cb);
  };
};
const previewOn = () => PREVIEW_AVAILABLE && localStorage.getItem(KEY) === "1";
export function setPreview(on: boolean) {
  if (!PREVIEW_AVAILABLE) return;
  if (on) localStorage.setItem(KEY, "1");
  else localStorage.removeItem(KEY);
  window.dispatchEvent(new Event(EVENT));
}
/** Sent with downloads and GitHub sends, so the server previews Pro too. Development only. */
export const previewHeaders = (): Record<string, string> => (previewOn() ? { "x-bd-preview": "pro" } : {});

/** Purchases and the templates they unlock: undefined while loading, null when signed out. Signed out, nothing is asked. */
function useMine() {
  const session = useSyncExternalStore(subscribeSession, getSession, () => SERVER_SESSION);
  const mine = useRpc("purchases_mine", session.user ? {} : "skip");
  return useMemo(() => {
    if (!session.ready) return undefined;
    if (!session.user || mine === null) return null;
    if (!mine) return undefined;
    return { ...mine, templates: unlocked(mine.products), pro: mine.products.includes("pro") || mine.products.includes("team") };
  }, [session.ready, session.user, mine]);
}

export function usePurchases() {
  return useMine();
}

export function usePlan() {
  const mine = useMine();
  const flag = useSyncExternalStore(subscribe, previewOn, () => false);
  // A preview needs someone signed in: signed out is always Free.
  const preview = flag && Boolean(mine) && !mine?.pro;
  const plan: Plan = mine?.pro || preview ? "pro" : "free";
  return [plan, { preview, signedIn: Boolean(mine) }] as const;
}

/** Whether a template's code (download, GitHub, code export) is theirs: with Pro, or by buying it. */
export function useOwnsCode(template: string) {
  const mine = useMine();
  const [plan] = usePlan();
  return plan === "pro" || Boolean((mine?.templates as readonly string[] | undefined)?.includes(template));
}
