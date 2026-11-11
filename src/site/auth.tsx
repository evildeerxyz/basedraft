"use client";

import { ArrowRightIcon, EnvelopeSimpleIcon, GithubLogoIcon, GoogleLogoIcon, InfoIcon } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import { getSession, providerOn, SERVER_SESSION, subscribeSession, SUPABASE_ON, supabase } from "@/lib/supabase";
import { Input } from "@/ui/field";
import { cn } from "@/lib/utils";
import { Dialog, DIALOG_CARD, DialogClose } from "./dialog";
import { BaseDraftLogo, BaseDraftMark } from "./logo";
import { ColorModeSwitch } from "./color-mode";
import { CardNote, Glow, IconTile } from "./plan-parts";
import { btn } from "./sheet";
import { toast } from "./toast";
import { track } from "./analytics";

/*
 * Accounts, on Supabase Auth. Sign in with Google or GitHub, or with an email and a 6-digit code
 * (sent by this site: src/app/api/auth/email). The session is a cookie on this site; `useAuth()`
 * reads it.
 *   - `User` is the shape the rest of the site uses, made from Supabase's user.
 *   - `useAuth()` returns { user, loading, signOut }.
 */

export interface User {
  object: "user";
  id: string;
  email: string;
  emailVerified: boolean;
  firstName: string | null;
  lastName: string | null;
  profilePictureUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export type AuthMode = "sign-in" | "sign-up";
export type AuthReason = "library" | "save";

/* ---------- the signed-in user ---------- */

type AuthUser = { id: string; email: string; emailVerified: boolean; name?: string | null; image?: string | null; createdAt: Date | string; updatedAt: Date | string };

/** Supabase's user, as the card works with it. Their name is in their metadata: from signing up, or from Google or GitHub. */
function authUserOf(u: SupabaseUser): AuthUser {
  const m = (u.user_metadata ?? {}) as { name?: string; full_name?: string; avatar_url?: string };
  return { id: u.id, email: u.email ?? "", emailVerified: Boolean(u.email_confirmed_at), name: m.name || m.full_name || null, image: m.avatar_url ?? null, createdAt: u.created_at, updatedAt: u.updated_at ?? u.created_at };
}

/** The signed-in user, as the site's `User`. */
function toUser(u: AuthUser): User {
  const [first, ...rest] = (u.name ?? "").trim().split(/\s+/).filter(Boolean);
  return { object: "user", id: u.id, email: u.email, emailVerified: u.emailVerified, firstName: first ?? null, lastName: rest.join(" ") || null, profilePictureUrl: u.image ?? null, createdAt: new Date(u.createdAt).toISOString(), updatedAt: new Date(u.updatedAt).toISOString() };
}

/** Changes the name others see. */
const saveDisplayName = (name: string) => supabase().auth.updateUser({ data: { name } });

export async function signOut() {
  await supabase().auth.signOut();
  toast("Signed out", { detail: "Your current draft stays in this browser." });
}

export function useAuth() {
  const session = useSyncExternalStore(subscribeSession, getSession, () => SERVER_SESSION);
  const user = useMemo(() => (session.user ? toUser(authUserOf(session.user)) : null), [session.user]);
  return { user, loading: !session.ready, signOut };
}

/** Whether someone is signed in right now, for code outside React. */
export async function signedIn() {
  if (!SUPABASE_ON) return false;
  const { data } = await supabase().auth.getSession();
  return Boolean(data.session);
}

export const displayName = (u: User) => [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email.split("@")[0];

/** Initials on a disc. Ink for you, gray for everyone else. */
export function Avatar({ name, size = 28, tone = "ink", className }: { name: string; size?: number; tone?: "ink" | "gray"; className?: string }) {
  const letters =
    name
      .split(/[\s@._-]+/)
      .filter(Boolean)
      // Below 20px two letters can't be read, so one does.
      .slice(0, size < 20 ? 1 : 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "?";
  return (
    <span aria-hidden className={cn("grid shrink-0 select-none place-items-center rounded-full font-semibold leading-none", tone === "ink" ? "bg-fg text-canvas" : "bg-fg/[0.08] text-fg", className)} style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}>
      {letters}
    </span>
  );
}

/** The top of an account menu: who's signed in, and on which plan. */
export function AccountHeader({ user }: { user: User }) {
  return (
    <div className="flex items-center gap-2.5">
      <Avatar name={displayName(user)} size={36} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13.5px] font-semibold">{displayName(user)}</div>
        <div className="truncate text-[12px] text-muted">{user.email}</div>
      </div>
    </div>
  );
}

/* ---------- opening the sign in card from anywhere ---------- */

interface AuthRequest {
  id: number;
  mode: AuthMode;
  reason?: AuthReason;
  then?: () => void;
}
let request: AuthRequest | null = null;
const reqListeners = new Set<() => void>();
const emitReq = () => reqListeners.forEach((l) => l());
const subscribeReq = (cb: () => void) => {
  reqListeners.add(cb);
  return () => reqListeners.delete(cb);
};

/** Opens sign up or sign in over the current page. `then` runs once someone is signed in. */
export function openAuth(mode: AuthMode = "sign-up", opts: { reason?: AuthReason; then?: () => void } = {}) {
  request = { id: Date.now(), mode, ...opts };
  emitReq();
}
const closeAuth = () => {
  request = null;
  emitReq();
};

const welcome = (u: User, fresh: boolean) => {
  if (fresh) track("signed_up");
  return fresh ? toast(`Welcome to basedraft, ${u.firstName ?? displayName(u)}`, { detail: "Your drafts now save to your account." }) : toast(`Signed in as ${u.email}`);
};

export function AuthModal() {
  const req = useSyncExternalStore(subscribeReq, () => request, () => null);
  // Keeps the last request while the card animates out.
  const [last, setLast] = useState<AuthRequest>({ id: 0, mode: "sign-up" });
  if (req && req !== last) setLast(req);
  const shown = req ?? last;
  return (
    <Dialog open={req !== null} onClose={closeAuth} labelledBy="auth-title" describedBy="auth-body">
      <DialogClose onClose={closeAuth} />
      <AuthCard
        key={shown.id}
        initialMode={shown.mode}
        reason={shown.reason}
        onDone={(u, fresh) => {
          closeAuth();
          welcome(u, fresh);
          shown.then?.();
        }}
      />
    </Dialog>
  );
}

/* ---------- the card ---------- */

const WHY: Record<AuthReason, string> = {
  library: "Create a free account to keep all your drafts in one place.",
  save: "Create a free account so your drafts are there on every device.",
};

type Problem = { field: "name" | "email" | "code" | "social"; text: string; fix?: AuthMode };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** What a failed code check (or send) means, in words. Supabase says the same for a wrong code and an expired one. */
const CODE_ERROR: Record<string, string> = {
  otp_expired: "That code isn't right, or it has expired. Check the email, or send a new one.",
  over_request_rate_limit: "Too many tries. Wait a minute, then send a new code.",
  over_email_send_rate_limit: "We've sent a few codes already. Wait a minute, then try again.",
};

function Spinner() {
  return <span aria-hidden className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />;
}

function Labeled({ id, label, error, onFix, children }: { id: string; label: string; error?: Problem | null; onFix?: (m: AuthMode) => void; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-ui font-medium">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-meta text-[#d92d20]">
          {error.text}{" "}
          {error.fix && (
            <button type="button" onClick={() => onFix?.(error.fix!)} className="font-medium text-fg underline underline-offset-2">
              {error.fix === "sign-in" ? "Sign in instead" : "Create an account"}
            </button>
          )}
        </p>
      )}
    </div>
  );
}

/** Six boxes, one real field underneath, so paste, autofill from Messages and screen readers all work. */
function CodeInput({ value, onChange, onComplete, invalid }: { value: string; onChange: (v: string) => void; onComplete: (v: string) => void; invalid: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  const [focus, setFocus] = useState(false);
  useEffect(() => ref.current?.focus(), []);
  return (
    <div className="relative flex gap-2">
      <input
        ref={ref}
        id="auth-code"
        value={value}
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, "").slice(0, 6);
          onChange(v);
          if (v.length === 6) onComplete(v);
        }}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        aria-label="6-digit code"
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? "auth-code-error" : undefined}
        className="absolute inset-0 z-10 w-full cursor-text bg-transparent text-[16px] text-transparent caret-transparent outline-none selection:bg-transparent"
      />
      {Array.from({ length: 6 }, (_, i) => {
        const active = focus && i === Math.min(value.length, 5);
        return (
          // The box you're typing into gets the same focus ring as every other field.
          <span
            key={i}
            aria-hidden
            className={cn(
              "grid h-12 flex-1 place-items-center rounded-[4px] border bg-surface text-[20px] font-semibold tabular-nums transition-[border-color,box-shadow] duration-200",
              invalid ? "border-[#ff5a4e]/70" : focus ? "border-fg/25" : "border-line",
              active && (invalid ? "border-[#ff5a4e] ring-4 ring-[#ff5a4e]/20" : "border-accent ring-4 ring-accent/30"),
            )}
          >
            {value[i] ?? (active && <span className="h-5 w-[1.5px] animate-pulse rounded-full bg-fg" />)}
          </span>
        );
      })}
    </div>
  );
}

/**
 * Sign up and sign in in one card: Google or GitHub in a click, or an email and a 6-digit code.
 * Signing up also asks for a name, for your account and the drafts you share.
 */
export function AuthCard({ initialMode, reason, onDone, onModeChange, page }: { initialMode: AuthMode; reason?: AuthReason; onDone: (u: User, fresh: boolean) => void; onModeChange?: (m: AuthMode) => void; page?: boolean }) {
  const [mode, setMode] = useState(initialMode);
  // On its own page the card's title is the page's heading.
  const H = page ? "h1" : "h2";
  const [step, setStep] = useState<"start" | "code" | "name">("start");
  // Signed in, but with no name yet: asked for one before the card closes.
  const [pending, setPending] = useState<{ user: AuthUser; fresh: boolean } | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [problem, setProblem] = useState<Problem | null>(null);
  const [busy, setBusy] = useState<null | "google" | "github" | "email" | "code">(null);
  const up = mode === "sign-up";

  const switchMode = (m: AuthMode) => {
    setMode(m);
    setStep("start");
    setProblem(null);
    setCode("");
    onModeChange?.(m);
  };
  const finish = (u: User, fresh: boolean) => {
    setBusy(null);
    // A new account's welcome email, once it has its name. The server sends it once, however often it's asked.
    if (fresh) void fetch("/api/auth/welcome", { method: "POST" }).catch(() => {});
    onDone(u, fresh);
  };

  // Comes back to this page, signed in (src/app/api/auth/callback).
  const callback = () => `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(`${window.location.pathname}${window.location.search}`)}`;

  // Off to Google or GitHub, and back to this page signed in.
  const social = async (p: "google" | "github") => {
    setProblem(null);
    setBusy(p);
    const notYet = () => {
      setBusy(null);
      setProblem({ field: "social", text: `${p === "google" ? "Google" : "GitHub"} sign in isn't connected yet. Use your email for now.` });
    };
    if (!(await providerOn(p))) return notYet();
    // Google goes through this site, so its consent screen names basedraft (src/server/google.ts).
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- a route that sends you on to Google, not a page
    if (p === "google") return window.location.assign(`/api/auth/google?next=${encodeURIComponent(`${window.location.pathname}${window.location.search}`)}`);
    const { error } = await supabase().auth.signInWithOAuth({ provider: p, options: { redirectTo: callback() } });
    if (error) notYet();
  };

  // The code makes the account on a first sign in; signing up names it as it's made.
  const send = async (em: string) => {
    if (!SUPABASE_ON) return "Accounts aren't set up here yet.";
    const { error } = await supabase().auth.signInWithOtp({ email: em, options: { shouldCreateUser: true, emailRedirectTo: callback(), data: up && name.trim() ? { name: name.trim() } : undefined } });
    return error ? (CODE_ERROR[error.code ?? ""] ?? error.message ?? "We couldn't send a code. Try again in a moment.") : null;
  };

  const sendCode = async (e: FormEvent) => {
    e.preventDefault();
    const em = email.trim().toLowerCase();
    if (up && !name.trim()) return setProblem({ field: "name", text: "Add your name so we know what to call you." });
    if (!EMAIL.test(em)) return setProblem({ field: "email", text: "That doesn't look like an email address." });
    setProblem(null);
    setBusy("email");
    const failed = await send(em);
    setBusy(null);
    if (failed) return setProblem({ field: "email", text: failed });
    setCode("");
    setStep("code");
  };

  const resend = async () => {
    const failed = await send(email.trim().toLowerCase());
    if (failed) setProblem({ field: "code", text: failed });
    else toast("We sent a new code", { detail: `Check ${email.trim()}.` });
  };

  const verify = async (c: string) => {
    if (c.length < 6) return setProblem({ field: "code", text: "Enter all 6 digits." });
    setProblem(null);
    setBusy("code");
    const { data, error } = await supabase().auth.verifyOtp({ email: email.trim().toLowerCase(), token: c, type: "email" });
    if (error || !data.user) {
      setBusy(null);
      return setProblem({ field: "code", text: CODE_ERROR[error?.code ?? ""] ?? error?.message ?? "That didn't work. Try again." });
    }
    let u = authUserOf(data.user);
    // A first sign in makes the account. Signing up named it; signing up as someone who already had an account names it now.
    const fresh = Date.now() - new Date(u.createdAt).getTime() < 120_000;
    if (name.trim() && !u.name) {
      await saveDisplayName(name.trim());
      u = { ...u, name: name.trim() };
    }
    if (!u.name?.trim()) {
      setBusy(null);
      setPending({ user: u, fresh });
      setStep("name");
      return;
    }
    finish(toUser(u), fresh);
  };

  const saveName = async (e: FormEvent) => {
    e.preventDefault();
    if (!pending) return;
    const n = name.trim();
    if (!n) return setProblem({ field: "name", text: "Add the name you'd like people to see, or skip for now." });
    setBusy("email");
    await saveDisplayName(n);
    finish(toUser({ ...pending.user, name: n }), pending.fresh);
  };

  if (step === "name" && pending)
    return (
      <form noValidate onSubmit={saveName}>
        <div className="px-6 pb-5 pt-6">
          <Avatar name={name.trim() || pending.user.email} size={44} />
          <H id="auth-title" className="mt-4 text-title">
            What should we call you?
          </H>
          <p id="auth-body" className="mt-2 text-body text-muted">
            Your name shows on your account and the drafts you share. You can change it any time.
          </p>
        </div>
        <div className="px-6">
          <Labeled id="auth-display-name" label="Display name" error={problem?.field === "name" ? problem : null}>
            <Input id="auth-display-name" autoFocus autoComplete="name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} invalid={problem?.field === "name"} maxLength={60} />
          </Labeled>
        </div>
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-line px-6 py-4">
          <button type="button" onClick={() => finish(toUser(pending.user), pending.fresh)} className="text-ui text-muted transition-colors hover:text-fg">
            Skip for now
          </button>
          <button type="submit" disabled={busy !== null} className={cn(btn.ink, "min-w-[120px]")}>
            {busy ? <Spinner /> : "Continue"}
          </button>
        </div>
      </form>
    );

  if (step === "code")
    return (
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          verify(code);
        }}
      >
        <div className="px-6 pb-5 pt-6">
          <IconTile icon={EnvelopeSimpleIcon} tone="ink" />
          <H id="auth-title" className="mt-4 text-title">
            Check your email
          </H>
          <p id="auth-body" className="mt-2 text-body text-muted">
            We sent a 6-digit code to <span className="font-medium text-fg">{email.trim()}</span>. It works for 10 minutes.
          </p>
        </div>
        <div className="mx-3 rounded-[8px] bg-fg/[0.03] p-1.5">
          <CodeInput value={code} onChange={setCode} onComplete={verify} invalid={problem?.field === "code"} />
          {problem?.field === "code" && (
            <p id="auth-code-error" role="alert" className="mt-2 text-meta text-[#d92d20]">
              {problem.text}
            </p>
          )}
          <div className="mt-2.5 flex justify-between gap-3 px-2 pb-1.5 text-meta text-muted">
            <button
              type="button"
              onClick={() => {
                setStep("start");
                setProblem(null);
              }}
              className="transition-colors hover:text-fg"
            >
              Use a different email
            </button>
            <button type="button" onClick={resend} className="transition-colors hover:text-fg">
              Send a new code
            </button>
          </div>
        </div>
        <div className="mt-5 flex items-center justify-end border-t border-line px-6 py-4">
          <button type="submit" disabled={busy !== null} className={cn(btn.ink, "min-w-[132px]")}>
            {busy === "code" ? <Spinner /> : up ? "Create account" : "Sign in"}
          </button>
        </div>
        <CardNote icon={InfoIcon}>Not there? Check spam, or send a new code.</CardNote>
      </form>
    );

  return (
    <form noValidate onSubmit={sendCode}>
      <div className="px-6 pb-5 pt-6">
        {/* The mark is its own ink tile, so it stands alone at the tile's size. */}
        <BaseDraftMark size={44} />
        <H id="auth-title" className="mt-4 text-title">
          {up ? "Create your account" : "Welcome back"}
        </H>
        <p id="auth-body" className="mt-2 text-body text-muted">
          {up ? (reason ? WHY[reason] : "Save your drafts and pick them up on any device. Free, no card needed.") : "Pick up your drafts right where you left them."}
        </p>
      </div>

      <div className="mx-3 space-y-0.5 rounded-[8px] bg-fg/[0.03] p-1.5">
        {(
          [
            ["google", GoogleLogoIcon, "Continue with Google"],
            ["github", GithubLogoIcon, "Continue with GitHub"],
          ] as const
        ).map(([p, I, label]) => (
          <button
            key={p}
            type="button"
            onClick={() => social(p)}
            disabled={busy !== null}
            className="flex w-full items-center gap-3 rounded-[4px] px-3 py-2.5 text-left transition-[background-color,box-shadow] hover:bg-surface hover:shadow-[0_1px_2px_rgb(var(--bd-shade)/0.08),0_0_0_1px_rgb(var(--bd-ink)/0.05)] disabled:opacity-60"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-[6px] bg-fg/[0.05]">
              <I size={16} weight="duotone" />
            </span>
            <span className="flex-1 text-ui font-medium">{label}</span>
            {busy === p ? <Spinner /> : <ArrowRightIcon size={14} weight="regular" className="text-fg/40" />}
          </button>
        ))}
      </div>
      {problem?.field === "social" && (
        <p role="alert" className="mx-6 mt-2 text-meta text-[#d92d20]">
          {problem.text}
        </p>
      )}

      <div className="flex items-center gap-3 px-6 py-4 text-meta text-subtle">
        <span className="h-px flex-1 bg-line" />
        or with email
        <span className="h-px flex-1 bg-line" />
      </div>

      <div className="space-y-3 px-6">
        {up && (
          <Labeled id="auth-name" label="Name" error={problem?.field === "name" ? problem : null}>
            <Input id="auth-name" data-autofocus autoComplete="name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} invalid={problem?.field === "name"} />
          </Labeled>
        )}
        <Labeled id="auth-email" label="Email" error={problem?.field === "email" ? problem : null} onFix={switchMode}>
          <Input id="auth-email" data-autofocus={up ? undefined : true} type="email" autoComplete="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} invalid={problem?.field === "email"} />
        </Labeled>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line px-6 py-4">
        <p className="text-ui text-muted">
          {up ? "Have an account? " : "New to basedraft? "}
          <button type="button" onClick={() => switchMode(up ? "sign-in" : "sign-up")} className="font-medium text-fg underline-offset-4 hover:underline">
            {up ? "Sign in" : "Create one"}
          </button>
        </p>
        <button type="submit" disabled={busy !== null} className={cn(btn.ink, "min-w-[104px]")}>
          {busy === "email" ? <Spinner /> : "Continue"}
        </button>
      </div>
      <CardNote icon={InfoIcon}>No password to remember. We email you a code each time.</CardNote>
    </form>
  );
}

/* ---------- /sign-in and /sign-up ---------- */

/** Where to go after signing in: a path on this site from ?next=, or Studio. */
function nextPath() {
  const n = new URLSearchParams(window.location.search).get("next");
  return n && n.startsWith("/") && !n.startsWith("//") ? n : "/studio";
}

export function AuthPage({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [done, setDone] = useState(false);
  return (
    <div className="flex min-h-dvh flex-col bg-surface-2">
      <header className="flex h-14 items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="basedraft home">
          <BaseDraftLogo />
        </Link>
        <ColorModeSwitch />
      </header>
      <main id="main" className="grid flex-1 place-items-center px-4 pb-14 pt-2">
        <div className={cn(DIALOG_CARD, "max-w-[460px]")}>
          <Glow className="-z-10" />
          {loading ? (
            <div className="h-[520px]" />
          ) : user && !done ? (
            <div className="px-6 pb-6 pt-6">
              <Avatar name={displayName(user)} size={44} />
              <h1 className="mt-4 text-title">You&apos;re signed in</h1>
              <p className="mt-2 text-body text-muted">As {user.email}.</p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Link href={nextPath()} className={btn.ink}>
                  Continue
                </Link>
                <button type="button" onClick={signOut} className={btn.quiet}>
                  Use another account
                </button>
              </div>
            </div>
          ) : (
            <AuthCard
              page
              initialMode={mode}
              onModeChange={(m) => window.history.replaceState(null, "", `/${m}${window.location.search}`)}
              onDone={(u, fresh) => {
                setDone(true);
                welcome(u, fresh);
                router.push(nextPath());
              }}
            />
          )}
        </div>
      </main>
    </div>
  );
}

/* ---------- your profile ---------- */

let profileOpen = false;
const profileListeners = new Set<() => void>();
const onProfile = (cb: () => void) => {
  profileListeners.add(cb);
  return () => profileListeners.delete(cb);
};
/** Opens the profile card: the display name on your account. */
export function openProfile() {
  profileOpen = true;
  profileListeners.forEach((l) => l());
}
const closeProfile = () => {
  profileOpen = false;
  profileListeners.forEach((l) => l());
};

export function ProfileModal() {
  const open = useSyncExternalStore(onProfile, () => profileOpen, () => false);
  const { user } = useAuth();
  return (
    <Dialog open={open && user !== null} onClose={closeProfile} labelledBy="profile-title" describedBy="profile-body">
      <DialogClose onClose={closeProfile} />
      {user && <ProfileForm key={user.id} user={user} />}
    </Dialog>
  );
}

function ProfileForm({ user }: { user: User }) {
  const [name, setName] = useState([user.firstName, user.lastName].filter(Boolean).join(" "));
  const [busy, setBusy] = useState(false);
  const save = async (e: FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    setBusy(true);
    const { error } = await saveDisplayName(n);
    setBusy(false);
    if (error) return toast("Couldn't save your name", { tone: "error", detail: error.message });
    closeProfile();
    toast("Saved", { detail: `People see you as ${n}.` });
  };
  return (
    <form noValidate onSubmit={save}>
      <div className="px-6 pb-5 pt-6">
        <Avatar name={name.trim() || user.email} size={44} />
        <h2 id="profile-title" className="mt-4 text-title">
          Your profile
        </h2>
        <p id="profile-body" className="mt-2 text-body text-muted">
          Signed in as {user.email}. Your display name shows on the drafts you share.
        </p>
      </div>
      <div className="px-6">
        <label htmlFor="profile-name" className="mb-1.5 block text-ui font-medium">
          Display name
        </label>
        <Input id="profile-name" autoFocus autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="Your name" />
      </div>
      <div className="mt-5 flex items-center justify-end gap-2 border-t border-line px-6 py-4">
        <button type="button" onClick={closeProfile} className={btn.quiet}>
          Cancel
        </button>
        <button type="submit" disabled={busy || !name.trim()} className={cn(btn.ink, "min-w-[96px] disabled:opacity-50")}>
          {busy ? <Spinner /> : "Save"}
        </button>
      </div>
    </form>
  );
}
