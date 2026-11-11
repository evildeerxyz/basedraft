"use client";

import Script from "next/script";
import type { PostHog } from "posthog-js";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { displayName, useAuth } from "./auth";

/*
 * Analytics: PostHog (started in src/instrumentation-client.ts) and Google Analytics, both in
 * production only. Signed in, PostHog knows who it is, so a person's visits before and after
 * they made an account are one story; signing out starts a new anonymous one.
 */

const GA = process.env.NEXT_PUBLIC_GA_ID;
const ON = process.env.NODE_ENV === "production";

type Props = Record<string, string | number | boolean | null | undefined>;
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/* PostHog arrives a moment after the page (see src/instrumentation-client.ts). */
const loaded = () => (globalThis as { posthog?: PostHog }).posthog?.__loaded ? (globalThis as { posthog?: PostHog }).posthog! : null;
const waiting: Array<[string, Props | undefined]> = [];
const onLoaded = (cb: () => void) => {
  window.addEventListener("bd-analytics", cb);
  return () => window.removeEventListener("bd-analytics", cb);
};
if (typeof window !== "undefined")
  onLoaded(() => {
    const ph = loaded();
    for (const [e, p] of waiting.splice(0)) ph?.capture(e, p);
  });

/** One of the moments worth counting: an export, a sign up, a copy. */
export function track(event: string, props?: Props) {
  if (!ON) return;
  try {
    const ph = loaded();
    if (ph) ph.capture(event, props);
    else waiting.push([event, props]);
    window.gtag?.("event", event, props);
  } catch {
    /* analytics never stops the site */
  }
}

export function Analytics() {
  const { user } = useAuth();
  const known = useRef<string | null>(null);
  const ready = useSyncExternalStore(onLoaded, () => Boolean(loaded()), () => false);
  useEffect(() => {
    const ph = loaded();
    if (!ON || !ph) return;
    if (user && known.current !== user.id) {
      ph.identify(user.id, { email: user.email, name: displayName(user) });
      known.current = user.id;
    } else if (!user && known.current) {
      ph.reset();
      known.current = null;
    }
  }, [user, ready]);

  if (!ON || !GA) return null;
  return (
    <>
      {/* After the page has loaded: Google's tag is the heaviest thing on it. */}
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA}`} strategy="lazyOnload" />
      <Script id="ga" strategy="lazyOnload">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${GA}');`}</Script>
    </>
  );
}
