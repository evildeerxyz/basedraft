"use client";

import { AppleLogoIcon, ArrowLeftIcon, CircleNotchIcon, EyeIcon, EyeSlashIcon, GithubLogoIcon } from "@phosphor-icons/react";
import { animate, AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useLayoutEffect, useRef, useState, type ElementType, type FormEvent, type ReactNode } from "react";

/*
 * Signing in, in two short steps: a provider in one click, or an email and then a password or a
 * six-digit code. The steps slide the way you're going, a wrong answer shakes the step and says
 * what to do, and the code fills from a paste or the phone's suggestion and sends itself when it's
 * whole. Split, it sits beside a panel of art: a glow drawn in an ordered dither, or smooth.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

export type SignInProvider = "google" | "github" | "apple";

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8z" />
      <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.8 14.2a6.6 6.6 0 0 1 0-4.3V7.1H2.1a11 11 0 0 0 0 9.9l3.7-2.8z" />
      <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7.1l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4z" />
    </svg>
  );
}

const PROVIDERS: Record<SignInProvider, { label: string; icon: (c: string) => ReactNode }> = {
  google: { label: "Google", icon: (c) => <GoogleMark className={c} /> },
  github: { label: "GitHub", icon: (c) => <GithubLogoIcon weight="fill" className={c} /> },
  apple: { label: "Apple", icon: (c) => <AppleLogoIcon weight="fill" className={c} /> },
};

/* ---------- The art beside it ---------- */

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const tile = (lit: number) => {
  let rects = "";
  BAYER.forEach((v, i) => {
    if (v < lit) rects += `<rect x='${(i % 4) * 2}' y='${Math.floor(i / 4) * 2}' width='2' height='2'/>`;
  });
  return `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='8' height='8'>${rects}</svg>`)}")`;
};
const RINGS = 9;

/** A glow rising from the bottom: rings of dots, sparse to dense, or the same as a smooth wash. */
function Glow({ dither }: { dither: boolean }) {
  const still = useReducedMotion();
  const fill = "radial-gradient(120% 90% at 50% 100%, oklch(72% 0.17 300), oklch(64% 0.19 265) 40%, oklch(56% 0.16 220) 70%, transparent)";
  if (!dither) return <div aria-hidden className="absolute inset-0 opacity-90" style={{ background: fill }} />;
  return (
    <div aria-hidden className="absolute inset-0">
      {Array.from({ length: RINGS }, (_, k) => {
        const m = tile(Math.round(((k + 1) / RINGS) * 16));
        const r = 100 - (k / RINGS) * 78;
        return (
          <motion.div
            key={k}
            initial={still ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + k * 0.07, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 origin-bottom"
            style={{ background: fill, maskImage: `${m}, radial-gradient(${r}% ${r * 0.8}% at 50% 100%, #000 99%, transparent 100%)`, WebkitMaskImage: `${m}, radial-gradient(${r}% ${r * 0.8}% at 50% 100%, #000 99%, transparent 100%)`, maskComposite: "intersect", WebkitMaskComposite: "source-in", maskSize: "8px 8px, 100% 100%", WebkitMaskSize: "8px 8px, 100% 100%", maskRepeat: "repeat, no-repeat", WebkitMaskRepeat: "repeat, no-repeat" }}
          />
        );
      })}
    </div>
  );
}

/* ---------- Parts ---------- */

/**
 * A box that eases to the height of what's in it, measured rather than scaled, so text never
 * stretches. Its edge sits 8px out, so focus rings and the shake aren't cut off.
 */
function AutoHeight({ children, className }: { children: ReactNode; className?: string }) {
  const inner = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | "auto">("auto");
  const still = useReducedMotion();
  useLayoutEffect(() => {
    const el = inner.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setHeight(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <motion.div initial={false} animate={{ height }} transition={still ? { duration: 0 } : { type: "spring", stiffness: 340, damping: 36 }} className={cx("-m-2 overflow-hidden", className)}>
      <div ref={inner} className="p-2">
        {children}
      </div>
    </motion.div>
  );
}

const FIELD = "h-10 w-full rounded-[12px] bg-[var(--bd-ui-field)] px-3 text-[14px] text-[var(--bd-fg)] shadow-[var(--bd-ui-well)] outline-none transition-shadow placeholder:text-[var(--bd-subtle)] focus:shadow-[var(--bd-ui-well),0_0_0_3px_var(--bd-ui-focus)] aria-[invalid=true]:shadow-[var(--bd-ui-well),0_0_0_1.5px_var(--bd-ui-stop)]";
const MAIN = "relative flex h-10 w-full items-center justify-center gap-2 rounded-[12px] text-[14px] font-medium text-[var(--bd-ui-ink-text)] outline-none [background:var(--bd-ui-ink)] shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_6px_16px_-8px_rgb(0_0_0/0.55)] transition-[filter] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--bd-ui-focus)] disabled:pointer-events-none disabled:opacity-70";
const Spin = () => <CircleNotchIcon weight="bold" className="size-4 animate-spin" aria-hidden />;

/** Six boxes over one real input, so a paste, an autofill or the keys all just work. */
function Code({ value, onChange, invalid, disabled, label }: { value: string; onChange: (v: string) => void; invalid: boolean; disabled: boolean; label: string }) {
  const [focused, setFocused] = useState(true);
  const still = useReducedMotion();
  const at = Math.min(value.length, 5);
  return (
    <div className="relative">
      <input
        autoFocus
        aria-label={label}
        aria-invalid={invalid}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="absolute inset-0 z-10 w-full cursor-text bg-transparent text-transparent caret-transparent outline-none selection:bg-transparent"
      />
      <div aria-hidden className="flex items-center gap-2">
        {Array.from({ length: 6 }, (_, i) => {
          const active = focused && i === at && !disabled;
          const cell = (
            <span
              key={i}
              className={cx(
                "relative grid h-12 min-w-0 flex-1 place-items-center rounded-[12px] bg-[var(--bd-ui-field)] text-[20px] font-medium tabular-nums text-[var(--bd-fg)] transition-shadow duration-150",
                invalid ? "shadow-[var(--bd-ui-well),0_0_0_1.5px_var(--bd-ui-stop)]" : active ? "shadow-[var(--bd-ui-well),0_0_0_2px_var(--bd-fg)]" : "shadow-[var(--bd-ui-well)]",
              )}
            >
              <AnimatePresence initial={false}>
                {value[i] && (
                  <motion.span key={value[i] + i} initial={still ? false : { y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 600, damping: 30 }}>
                    {value[i]}
                  </motion.span>
                )}
              </AnimatePresence>
              {active && !value[i] && <motion.span className="absolute h-5 w-[2px] rounded-full bg-[var(--bd-fg)]" animate={still ? undefined : { opacity: [1, 1, 0, 0] }} transition={{ duration: 1, repeat: Infinity, times: [0, 0.5, 0.5, 1] }} />}
            </span>
          );
          return i === 3 ? [<span key="dash" className="h-[2px] w-2 shrink-0 rounded-full bg-[var(--bd-line-strong)]" />, cell] : cell;
        })}
      </div>
    </div>
  );
}

export type SignInProps = {
  /** "Sign in to Acme". */
  title?: string;
  description?: ReactNode;
  /** The mark over the title. */
  logo?: ReactNode;
  /** The providers to offer, in order. */
  providers?: SignInProvider[];
  /** The way they signed in last time, tagged "Last used". */
  lastUsed?: SignInProvider | "email";
  /** After the email: a password, or a code sent to it. */
  method?: "password" | "code";
  /** Signs in with a provider; usually a redirect. */
  onProvider?: (provider: SignInProvider) => void | Promise<void>;
  /** Runs on Continue with the email: check it, or send the code. Throw to say what's wrong. */
  onEmail?: (email: string) => void | Promise<void>;
  /** Checks the password. Throw to say it's wrong. */
  onPassword?: (email: string, password: string) => void | Promise<void>;
  /** Checks the code. Throw to say it's wrong. */
  onCode?: (email: string, code: string) => void | Promise<void>;
  /** Sends the code again. */
  onResend?: (email: string) => void | Promise<void>;
  /** Where "Forgot password?" goes. */
  forgotHref?: string;
  /** Where "Sign up" goes. */
  signUpHref?: string;
  /** Your router's link, like Next.js's Link. */
  link?: ElementType;
  /** Small print under it: terms, privacy. */
  footer?: ReactNode;
  /** A card alone, or beside a panel of art with a quote. */
  layout?: "card" | "split";
  /** The quote on the panel. */
  quote?: { text: string; name: string; role?: string };
  /** The panel's glow in an ordered dither; false paints it smooth. */
  dither?: boolean;
  className?: string;
};

type Step = "start" | "secret" | "done";
const message = (e: unknown, fallback: string) => (e instanceof Error && e.message ? e.message : fallback);

export function SignIn({
  title = "Sign in",
  description = "Welcome back. Pick up where you left off.",
  logo,
  providers = ["google", "github"],
  lastUsed,
  method = "password",
  onProvider,
  onEmail,
  onPassword,
  onCode,
  onResend,
  forgotHref,
  signUpHref,
  link: Link = "a",
  footer,
  layout = "card",
  quote,
  dither = true,
  className,
}: SignInProps) {
  const [step, setStep] = useState<Step>("start");
  const [back, setBack] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [shown, setShown] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<{ at: Step; text: string; n: number } | null>(null);
  const [wait, setWait] = useState(0);
  const [via, setVia] = useState<string | null>(null);
  const still = useReducedMotion();
  const id = useId();
  const sent = useRef(false);
  const steps = useRef<HTMLDivElement>(null);

  // The resend button counts down a second at a time.
  useEffect(() => {
    if (!wait) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const fail = (at: Step, text: string) => {
    setError((e) => ({ at, text, n: (e?.n ?? 0) + 1 }));
    if (!still && steps.current) animate(steps.current, { x: [0, -6, 6, -4, 4, 0] }, { duration: 0.36 });
  };
  const run = async (key: string, fn: () => void | Promise<void>, at: Step, fallback: string) => {
    setBusy(key);
    setError(null);
    try {
      await fn();
      return true;
    } catch (e) {
      fail(at, message(e, fallback));
      return false;
    } finally {
      setBusy(null);
    }
  };

  const toSecret = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return fail("start", "Enter an email like name@company.com.");
    if (await run("email", () => onEmail?.(email.trim()), "start", "We couldn't use that email.")) {
      setBack(false);
      setVia(null);
      setStep("secret");
      setCode("");
      setPassword("");
      if (method === "code") setWait(30);
    }
  };
  const submitPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!password) return fail("secret", "Enter your password.");
    if (await run("secret", () => onPassword?.(email.trim(), password), "secret", "That password isn't right.")) setStep("done");
  };
  const submitCode = async (c: string) => {
    if (sent.current) return;
    sent.current = true;
    const ok = await run("secret", () => onCode?.(email.trim(), c), "secret", "That code isn't right. Check the email and try again.");
    sent.current = false;
    if (ok) setStep("done");
    else setCode("");
  };
  const resend = async () => {
    if (await run("resend", () => onResend?.(email.trim()), "secret", "We couldn't send it. Try again in a moment.")) setWait(30);
  };

  const errAt = (s: Step) => (error?.at === s ? error : null);
  const errLine = (s: Step) => (
    <AnimatePresence initial={false}>
      {error?.at === s && (
        <motion.p key="err" id={`${id}-err`} role="alert" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.12 } }} transition={{ duration: 0.2 }} className="text-[13px] text-[var(--bd-ui-stop)]">
          {error.text}
        </motion.p>
      )}
    </AnimatePresence>
  );
  const dir = back ? -1 : 1;
  const slide = {
    initial: still ? { opacity: 0 } : { opacity: 0, x: dir * 28 },
    animate: { opacity: 1, x: 0 },
    exit: still ? { opacity: 0 } : { opacity: 0, x: dir * -28 },
    transition: { x: { type: "spring" as const, stiffness: 420, damping: 36 }, opacity: { duration: 0.16 } },
  };
  const LINK = "font-medium text-[var(--bd-fg)] underline decoration-[rgb(var(--bd-ink)/0.25)] underline-offset-4 outline-none transition-[text-decoration-color] hover:decoration-[rgb(var(--bd-ink)/0.6)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--bd-ui-focus)]";

  const card = (
    <AutoHeight className="w-[calc(100%+16px)] max-w-[396px]">
      <div className="relative grid content-center gap-6">
        <div className="grid gap-3">
          {logo && <div className="mb-1">{logo}</div>}
          <div className="grid [&>*]:[grid-area:1/1]">
            <AnimatePresence initial={false}>
              <motion.div
                key={step === "secret" ? `secret-${method}` : step}
                initial={still ? { opacity: 0 } : { opacity: 0, y: 8, filter: "blur(3px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={still ? { opacity: 0 } : { opacity: 0, y: -6, filter: "blur(3px)", transition: { duration: 0.16 } }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                className="grid gap-3"
              >
                <h2 className="text-[24px] font-semibold leading-tight tracking-[-0.025em]">{step === "secret" ? (method === "code" ? "Check your email" : "Enter your password") : step === "done" ? "You're in" : title}</h2>
                <p className="text-[14px] leading-relaxed text-[var(--bd-muted)]">
                  {step === "secret" ? (
                    method === "code" ? (
                      <>
                        We sent a six-digit code to <span className="font-medium text-[var(--bd-fg)]">{email.trim()}</span>.
                      </>
                    ) : (
                      <>
                        Signing in as <span className="font-medium text-[var(--bd-fg)]">{email.trim()}</span>.
                      </>
                    )
                  ) : step === "done" ? (
                    "Taking you to your workspace."
                  ) : (
                    description
                  )}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div ref={steps} className="relative">
          <AnimatePresence mode="popLayout" initial={false} custom={dir}>
            {step === "start" && (
              <motion.div key="start" {...slide} className="grid gap-5">
                {providers.length > 0 && (
                  <div className="grid gap-2">
                    {providers.map((p) => (
                      <button
                        key={p}
                        type="button"
                        disabled={!!busy}
                        onClick={async () => {
                          if (await run(p, () => onProvider?.(p), "start", `We couldn't reach ${PROVIDERS[p].label}. Try again.`)) {
                            setVia(PROVIDERS[p].label);
                            setStep("done");
                          }
                        }}
                        className="grid h-10 grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-[12px] bg-[var(--bd-surface)] px-2 text-[14px] font-medium text-[var(--bd-fg)] outline-none shadow-[inset_0_0_0_1px_var(--bd-line-strong),0_1px_2px_rgb(var(--bd-shade)/0.06)] transition-colors hover:bg-[rgb(var(--bd-ink)/0.035)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--bd-ui-focus)] disabled:opacity-60"
                      >
                        {/* The label in the middle column, the tag in the last: centered while there's room, and never under the tag. */}
                        <span aria-hidden />
                        <span className="flex items-center gap-2.5 whitespace-nowrap">
                          {busy === p ? <Spin /> : PROVIDERS[p].icon("size-[18px]")}
                          Continue with {PROVIDERS[p].label}
                        </span>
                        <span className="justify-self-end">{lastUsed === p && <span className="block whitespace-nowrap rounded-full bg-[rgb(var(--bd-ink)/0.07)] px-2 py-0.5 text-[10.5px] font-medium text-[var(--bd-muted)]">Last used</span>}</span>
                      </button>
                    ))}
                  </div>
                )}
                {providers.length > 0 && (
                  <div className="flex items-center gap-3 text-[12px] text-[var(--bd-subtle)]">
                    <span className="h-px flex-1 bg-[var(--bd-line-subtle)]" />
                    or
                    <span className="h-px flex-1 bg-[var(--bd-line-subtle)]" />
                  </div>
                )}
                <form noValidate onSubmit={toSecret} className="grid gap-2.5">
                  <label htmlFor={`${id}-email`} className="flex items-center justify-between text-[13px] font-medium">
                    Email
                    {lastUsed === "email" && <span className="rounded-full bg-[rgb(var(--bd-ink)/0.07)] px-2 py-0.5 text-[10.5px] font-medium text-[var(--bd-muted)]">Last used</span>}
                  </label>
                  <input id={`${id}-email`} type="email" autoComplete="email" autoFocus={back} placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!errAt("start")} aria-describedby={errAt("start") ? `${id}-err` : undefined} className={FIELD} />
                  <button type="submit" disabled={!!busy} className={MAIN}>
                    {busy === "email" ? <Spin /> : "Continue"}
                  </button>
                  {errLine("start")}
                </form>
              </motion.div>
            )}

            {step === "secret" && (
              <motion.div key="secret" {...slide} className="grid gap-4">
                <div>
                  {method === "password" ? (
                    <form noValidate onSubmit={submitPassword} className="grid gap-2.5">
                      <div className="flex items-center justify-between">
                        <label htmlFor={`${id}-pw`} className="text-[13px] font-medium">
                          Password
                        </label>
                        {forgotHref && (
                          <Link href={forgotHref} className={cx(LINK, "text-[12.5px] font-normal text-[var(--bd-muted)]")}>
                            Forgot password?
                          </Link>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          id={`${id}-pw`}
                          type={shown ? "text" : "password"}
                          autoComplete="current-password"
                          autoFocus
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          aria-invalid={!!errAt("secret")}
                          aria-describedby={errAt("secret") ? `${id}-err` : undefined}
                          className={cx(FIELD, "pr-11")}
                        />
                        <button type="button" aria-label={shown ? "Hide the password" : "Show the password"} aria-pressed={shown} onClick={() => setShown((s) => !s)} className="absolute right-1 top-1 grid size-8 place-items-center rounded-[9px] text-[var(--bd-subtle)] outline-none transition-colors hover:text-[var(--bd-fg)] focus-visible:outline-2 focus-visible:outline-[color:var(--bd-ui-focus)]">
                          {shown ? <EyeSlashIcon weight="bold" className="size-4" /> : <EyeIcon weight="bold" className="size-4" />}
                        </button>
                      </div>
                      <button type="submit" disabled={!!busy} className={MAIN}>
                        {busy === "secret" ? <Spin /> : "Sign in"}
                      </button>
                    </form>
                  ) : (
                    <div className="grid gap-3">
                      <Code
                        label="Six-digit code"
                        value={code}
                        invalid={!!errAt("secret")}
                        disabled={busy === "secret"}
                        onChange={(v) => {
                          setCode(v);
                          if (error) setError(null);
                          if (v.length === 6) submitCode(v);
                        }}
                      />
                      <p className="flex h-5 items-center gap-2 text-[12.5px] text-[var(--bd-subtle)]">
                        {busy === "secret" ? (
                          <>
                            <Spin /> Checking the code
                          </>
                        ) : wait ? (
                          <span className="tabular-nums">Resend the code in {wait}s</span>
                        ) : (
                          <>
                            Didn&apos;t get it?
                            <button type="button" onClick={resend} disabled={!!busy} className={cx(LINK, "text-[12.5px]")}>
                              {busy === "resend" ? "Sending" : "Send it again"}
                            </button>
                          </>
                        )}
                      </p>
                    </div>
                  )}
                  <div className="mt-2.5 empty:hidden">{errLine("secret")}</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setBack(true);
                    setError(null);
                    setStep("start");
                  }}
                  className="flex w-fit items-center gap-1.5 rounded-full text-[13px] font-medium text-[var(--bd-muted)] outline-none transition-colors hover:text-[var(--bd-fg)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--bd-ui-focus)]"
                >
                  <ArrowLeftIcon weight="bold" className="size-3.5" />
                  Use another email
                </button>
              </motion.div>
            )}

            {step === "done" && (
              <motion.div
                key="done"
                initial={still ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ default: { type: "spring", stiffness: 360, damping: 30 }, opacity: { duration: 0.22, delay: 0.06 } }}
                className="flex items-center gap-3 rounded-[14px] p-3 shadow-[inset_0_0_0_1px_var(--bd-line-subtle)]"
              >
                <motion.span initial={still ? false : { scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 520, damping: 22, delay: 0.12 }} className="grid size-9 place-items-center rounded-full bg-[var(--bd-ui-ok)] text-white">
                  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <motion.path d="M5 12.5 10 17.5 19 7.5" initial={{ pathLength: still ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.28, duration: 0.38, ease: [0.65, 0, 0.35, 1] }} />
                  </svg>
                </motion.span>
                <span className="grid">
                  <span className="text-[14px] font-medium">Signed in</span>
                  <span className="text-[12.5px] text-[var(--bd-muted)]">{via ? `With ${via}` : email.trim()}</span>
                </span>
                <span className="ml-auto text-[var(--bd-subtle)]">
                  <Spin />
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence mode="popLayout" initial={false}>
          {(signUpHref || footer) && step !== "done" && (
            <motion.div key="foot" exit={{ opacity: 0, transition: { duration: 0.14 } }} className="grid gap-3 text-[13px] text-[var(--bd-muted)]">
              {signUpHref && (
                <p>
                  New here?{" "}
                  <Link href={signUpHref} className={LINK}>
                    Create an account
                  </Link>
                </p>
              )}
              {footer && <div className="text-[12px] leading-relaxed text-[var(--bd-subtle)]">{footer}</div>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AutoHeight>
  );

  if (layout === "card") {
    return <section className={cx("grid w-full max-w-[440px] justify-items-center rounded-[28px] bg-[var(--bd-surface)] p-8 text-[var(--bd-fg)] shadow-[inset_0_0_0_1px_var(--bd-line),var(--bd-shadow-resting)] max-[460px]:p-6", className)}>{card}</section>;
  }
  return (
    <section className={cx("@container w-full overflow-hidden rounded-[28px] bg-[var(--bd-surface)] text-[var(--bd-fg)] shadow-[inset_0_0_0_1px_var(--bd-line),var(--bd-shadow-resting)]", className)}>
      <div className="grid @[720px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="grid place-items-center p-8 @[720px]:p-10">{card}</div>
        <div className="relative hidden min-h-[480px] overflow-hidden bg-[oklch(16%_0.01_275)] @[720px]:block">
          <Glow dither={dither} />
          {quote && (
            <figure className="absolute inset-x-6 bottom-6 grid gap-3 rounded-[18px] bg-[rgb(10_10_14/0.55)] p-5 text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)] backdrop-blur-md">
              <blockquote className="text-[15px] leading-snug">&ldquo;{quote.text}&rdquo;</blockquote>
              <figcaption className="text-[12.5px] text-white/65">
                {quote.name}
                {quote.role && `, ${quote.role}`}
              </figcaption>
            </figure>
          )}
        </div>
      </div>
    </section>
  );
}
