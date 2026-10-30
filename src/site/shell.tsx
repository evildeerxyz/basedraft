"use client";

import { IconContext } from "@phosphor-icons/react";
import { usePathname } from "next/navigation";
import { useEffect, ViewTransition, type ReactNode } from "react";
import { CommandMenu } from "./command";
import { SiteFooter } from "./footer";
import { isLibrary, SiteHeader } from "./header";
import { ScrollBlur } from "./scroll-blur";
import { ScrollMotion } from "./scroll-motion";
import { toast } from "./toast";

/* basedraft's icons are Phosphor's duotone: here by default, as well as where each one says so. */
const DUOTONE = { weight: "duotone" } as const;

/** Back from a checkout that couldn't open (Whop isn't connected yet): say so, once. */
function CheckoutNotice() {
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("checkout") !== "unavailable") return;
    toast("Checkout isn't open yet", { tone: "error", detail: q.get("why") || "Payments are being connected. Try again soon, or write to hello@basedraft.site." });
    q.delete("checkout");
    q.delete("why");
    window.history.replaceState(null, "", `${window.location.pathname}${q.size ? `?${q}` : ""}${window.location.hash}`);
  }, []);
  return null;
}

/** Back from a sign in that didn't happen (see signInFailed in src/server/google.ts): say so, once. */
function SignInNotice() {
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const why = q.get("signin");
    if (!why) return;
    if (why === "google-off") toast("Google sign in isn't set up here", { tone: "error", detail: "Use your email for now: we'll send you a 6-digit code." });
    else toast("That sign in didn't go through", { tone: "error", detail: "Try again, or use your email and a 6-digit code instead." });
    q.delete("signin");
    window.history.replaceState(null, "", `${window.location.pathname}${q.size ? `?${q}` : ""}${window.location.hash}`);
  }, []);
  return null;
}

/**
 * Every page of the site: the header, the page, the footer. A new page fades and rises in as the
 * old one fades out; inside a library each page fades on its own (see library.tsx). The home page,
 * which is its hero alone, ends without the footer.
 */
export function SiteShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const library = isLibrary(path);
  const key = library ? (path.startsWith("/blocks") ? "/blocks" : "/components") : path;
  return (
    <IconContext.Provider value={DUOTONE}>
      <div className="flex min-h-dvh flex-col bg-canvas">
        <SiteHeader />
        <ViewTransition key={key} enter="page-in" exit="page-out" default="none">
          <div className="flex-1">{children}</div>
        </ViewTransition>
        {path !== "/" && <SiteFooter />}
        <ScrollBlur />
        <ScrollMotion />
        <CommandMenu />
        <CheckoutNotice />
        <SignInNotice />
      </div>
    </IconContext.Provider>
  );
}
