import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient, User } from "@supabase/supabase-js";

/*
 * Supabase in the browser: accounts, the database's functions (supabase/migrations), live
 * channels and image storage. The session is kept in this site's cookies, so the server reads the
 * same one. Without a Supabase address (a checkout that hasn't set one up) the site still runs;
 * accounts just can't sign in.
 */

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const SUPABASE_URL = URL_ ?? "";
export const SUPABASE_ON = Boolean(URL_ && KEY);

let client: SupabaseClient | null = null;
/** The one Supabase client in this tab. Browser only. */
export function supabase(): SupabaseClient {
  if (!SUPABASE_ON) throw new Error("Accounts aren't set up here yet.");
  return (client ??= createBrowserClient(URL_!, KEY!));
}

/** Whether Google or GitHub sign in is turned on for the project, so a button never leads to an error page. */
export async function providerOn(provider: "google" | "github") {
  if (!SUPABASE_ON) return false;
  const r = await fetch(`${URL_}/auth/v1/settings`, { headers: { apikey: KEY! } }).catch(() => null);
  const s = (await r?.json().catch(() => null)) as { external?: Record<string, boolean> } | null;
  return Boolean(s?.external?.[provider]);
}

/* ---------- who's signed in ---------- */

/**
 * The signed-in person, as Supabase has them, kept current as they sign in and out or change
 * their name. A token refreshing, or the tab coming back into view, changes nothing here.
 */
export type Session = { user: User | null; ready: boolean };
let session: Session = { user: null, ready: !SUPABASE_ON };
const listeners = new Set<() => void>();
let started = false;

const sameUser = (a: User | null, b: User | null) =>
  a === b || (a !== null && b !== null && a.id === b.id && a.email === b.email && a.email_confirmed_at === b.email_confirmed_at && JSON.stringify(a.user_metadata) === JSON.stringify(b.user_metadata));

function start() {
  if (started || !SUPABASE_ON || typeof window === "undefined") return;
  started = true;
  supabase().auth.onAuthStateChange((_event, s) => {
    const user = s?.user ?? null;
    if (session.ready && sameUser(session.user, user)) return;
    session = { user, ready: true };
    // Told once Supabase's own handling is done: a listener may call Supabase straight away.
    setTimeout(() => listeners.forEach((l) => l()), 0);
  });
}

export function subscribeSession(listener: () => void) {
  start();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export const getSession = () => session;
export const SERVER_SESSION: Session = { user: null, ready: false };
