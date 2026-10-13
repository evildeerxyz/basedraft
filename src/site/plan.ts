"use client";

import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { useSyncExternalStore } from "react";

/*
 * What the signed-in person owns, from their Whop purchases in Convex: signed out is Free. Pro
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

// Without a Convex address there's nothing to ask; the choice is made once, for the whole app.
const useMine = process.env.NEXT_PUBLIC_CONVEX_URL ? () => useQuery(api.purchases.mine) : () => undefined;

/** Purchases and unlocked templates: undefined while loading, null when signed out. */
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
