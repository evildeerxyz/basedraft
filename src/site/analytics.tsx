"use client";

import Script from "next/script";
import posthog from "posthog-js";
import { useEffect, useRef } from "react";
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

/** One of the moments worth counting: an export, a checkout, a comment, an invite. */
export function track(event: string, props?: Props) {
  if (!ON) return;
  try {
    if (posthog.__loaded) posthog.capture(event, props);
    window.gtag?.("event", event, props);
  } catch {
    /* analytics never stops the site */
  }
}

export function Analytics() {
  const { user } = useAuth();
  const known = useRef<string | null>(null);
  useEffect(() => {
    if (!ON || !posthog.__loaded) return;
    if (user && known.current !== user.id) {
      posthog.identify(user.id, { email: user.email, name: displayName(user) });
      known.current = user.id;
    } else if (!user && known.current) {
      posthog.reset();
      known.current = null;
    }
  }, [user]);

  if (!ON || !GA) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA}`} strategy="afterInteractive" />
      <Script id="ga" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${GA}');`}</Script>
    </>
  );
}
