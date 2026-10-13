"use client";

import { ArrowLeftIcon, CheckIcon, HouseIcon, SunHorizonIcon, TrendUpIcon, UmbrellaIcon, type Icon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ditherTile } from "@/lib/dither";
import { cn, EASE_OUT, formatUSD } from "@/lib/utils";
import { Field, Input } from "../ui/Field";
import { RollingNumber } from "../ui/RollingNumber";
import { PASSWORD_RULES, PasswordInput, PasswordStrength, PrimaryButton } from "./parts";
import { pal } from "@/lib/palette";

/* ---------- plan maths ---------- */

const GOALS: Array<{ value: Goal; label: string; desc: string; icon: Icon }> = [
  { value: "retirement", label: "Retirement", desc: "Grow tax-advantaged savings for later life.", icon: SunHorizonIcon },
  { value: "home", label: "A home", desc: "Build up a down payment over the next few years.", icon: HouseIcon },
  { value: "wealth", label: "Building wealth", desc: "Invest for the long run, with no fixed date.", icon: TrendUpIcon },
  { value: "safety", label: "A safety net", desc: "Keep money ready for the unexpected.", icon: UmbrellaIcon },
];
type Goal = "retirement" | "home" | "wealth" | "safety";
type Drop = "sell" | "wait" | "more";
type Horizon = "short" | "mid" | "long";

const PLANS = [
  { name: "Conservative", rate: 0.045, mix: [25, 10, 50, 0, 15] },
  { name: "Balanced", rate: 0.06, mix: [40, 15, 30, 3, 12] },
  { name: "Growth", rate: 0.075, mix: [55, 18, 12, 5, 10] },
];
const MIX = ["US stocks", "International", "Bonds", "Crypto", "Cash"];
const LEVELS = [1, 0.75, 0.5, 0.32, 0.16];

function planFor(drop: Drop, horizon: Horizon) {
  const byFeel = drop === "sell" ? 0 : drop === "wait" ? 1 : 2;
  const cap = horizon === "short" ? 0 : horizon === "mid" ? 1 : 2;
  return Math.min(byFeel, cap);
}
function yearsFor(goal: Goal, horizon: Horizon) {
  if (horizon === "short") return 3;
  if (horizon === "mid") return 7;
  return goal === "retirement" ? 30 : 15;
}
function project(initial: number, monthly: number, rate: number, years: number) {
  const pts: number[] = [];
  const months = years * 12;
  let v = initial;
  const samples = 30;
  let next = 0;
  for (let m = 0; m <= months; m++) {
    if (m >= (next / samples) * months) {
      pts.push(v);
      next++;
    }
    v = v * (1 + rate / 12) + monthly;
  }
  while (pts.length < samples + 1) pts.push(v);
  return { pts, final: pts[pts.length - 1], paid: initial + monthly * months };
}

/* ---------- live preview ---------- */

function PlanPreview({ plan, initial, monthly, years, name }: { plan: number; initial: number; monthly: number; years: number; name: string }) {
  const p = PLANS[plan];
  const { pts, final, paid } = useMemo(() => project(initial, monthly, p.rate, years), [initial, monthly, p.rate, years]);
  const W = 520;
  const H = 200;
  const max = Math.max(...pts) || 1;
  const xy = pts.map((v, i) => [(i / (pts.length - 1)) * W, H - 8 - (v / max) * (H - 24)] as const);
  const line = xy.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${W},${H} L0,${H} Z`;

  return (
    <div className="rounded-[32px] border border-white/[0.08] bg-ink-2 p-7 sm:p-9">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[16px] text-white/60">{name ? `${name}'s plan` : "Your plan"}</div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={p.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3, ease: EASE_OUT }} className="mt-1 text-[clamp(2.2rem,3.6vw,3rem)] font-semibold leading-none tracking-[-0.045em]">
              {p.name}
            </motion.div>
          </AnimatePresence>
        </div>
        <span className="rounded-full bg-white/[0.07] px-3.5 py-1.5 text-[15px] text-white/80">{(p.rate * 100).toFixed(1)}% a year, hypothetical</span>
      </div>

      <div className="mt-8 flex h-4 gap-[3px] overflow-hidden rounded-full">
        {p.mix.map((v, i) =>
          v ? (
            <motion.span
              key={MIX[i]}
              className="h-full rounded-[3px]"
              style={LEVELS[i] === 1 ? { background: pal.accent } : { backgroundImage: ditherTile(pal.accent, LEVELS[i], 1), backgroundSize: "4px 4px" }}
              initial={false}
              animate={{ width: `${v}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
            />
          ) : null,
        )}
      </div>
      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
        {p.mix.map((v, i) =>
          v ? (
            <li key={MIX[i]} className="flex items-center gap-2 text-[15px] text-white/70">
              <span className="size-3 rounded-[3px]" style={LEVELS[i] === 1 ? { background: pal.accent } : { backgroundImage: ditherTile(pal.accent, LEVELS[i], 1), backgroundSize: "4px 4px" }} />
              {MIX[i]} <span className="tabular-nums text-white">{v}%</span>
            </li>
          ) : null,
        )}
      </ul>

      <div className="mt-10 text-[16px] text-white/60">In {years} years you could have</div>
      <div className="mt-1 text-[clamp(2.6rem,4.4vw,3.75rem)] font-semibold leading-none tracking-[-0.05em]">
        <RollingNumber value={formatUSD(final, 0)} />
      </div>
      <div className="mt-3 text-[16px] text-white/65">
        You put in <span className="text-white">{formatUSD(paid, 0)}</span>
        <span className="text-white/40"> · </span>
        Growth <span className="text-accent">+{formatUSD(Math.max(0, final - paid), 0)}</span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="mt-8 h-auto w-full" aria-hidden>
        <defs>
          <pattern id="signup-dither" width="6" height="6" patternUnits="userSpaceOnUse">
            <image href={ditherTile(pal.accent, 0.32, 1.5).slice(5, -2)} width="6" height="6" />
          </pattern>
        </defs>
        <motion.path initial={false} animate={{ d: area }} transition={{ type: "spring", stiffness: 80, damping: 18 }} fill="url(#signup-dither)" />
        <motion.path initial={false} animate={{ d: line }} transition={{ type: "spring", stiffness: 80, damping: 18 }} fill="none" stroke={pal.accent} strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <p className="mt-5 text-[15px] leading-relaxed text-white/55">Hypothetical projection, not a guarantee. Assumes a steady return after the Plus fee. Real returns vary and you can lose money.</p>
    </div>
  );
}

/* ---------- inputs ---------- */

function RadioRows<T extends string>({ name, legend, options, value, onChange }: { name: string; legend: string; options: Array<{ value: T; label: string; desc?: string; icon?: Icon }>; value: T; onChange: (v: T) => void }) {
  return (
    <fieldset>
      <legend className="text-[19px] font-medium">{legend}</legend>
      <div className="mt-4 space-y-2">
        {options.map((o) => {
          const on = value === o.value;
          const I = o.icon;
          return (
            <label key={o.value} className={cn("flex cursor-pointer items-center gap-4 rounded-[18px] border px-5 py-4 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-lime", on ? "border-lime bg-lime/[0.07]" : "border-white/10 hover:border-white/25")}>
              <input type="radio" name={name} value={o.value} checked={on} onChange={() => onChange(o.value)} className="sr-only" />
              {I && <I size={26} weight={on ? "fill" : "regular"} className={on ? "text-accent" : "text-white/60"} />}
              <span className="flex-1">
                <span className="block text-[18px] font-medium">{o.label}</span>
                {o.desc && <span className="mt-0.5 block text-[16px] text-white/60">{o.desc}</span>}
              </span>
              <span className={cn("grid size-6 shrink-0 place-items-center rounded-full border-2 transition-colors", on ? "border-lime bg-lime text-on-lime" : "border-white/25")}>{on && <CheckIcon size={13} weight="bold" />}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function Chips<T extends string | number>({ name, legend, options, value, onChange, format }: { name: string; legend: string; options: T[]; value: T; onChange: (v: T) => void; format: (v: T) => string }) {
  return (
    <fieldset>
      <legend className="text-[19px] font-medium">{legend}</legend>
      <div className={cn("mt-4 grid gap-2", options.length === 3 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4")}>
        {options.map((o) => {
          const on = value === o;
          return (
            <label key={String(o)} className={cn("relative grid h-14 cursor-pointer place-items-center rounded-[14px] text-[17px] font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-lime", on ? "text-on-lime" : "bg-white/[0.05] text-white/80 hover:bg-white/[0.09]")}>
              <input type="radio" name={name} checked={on} onChange={() => onChange(o)} className="sr-only" />
              {on && <motion.span layoutId={`chip-${name}`} className="absolute inset-0 rounded-[14px] bg-lime" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
              <span className="relative">{format(o)}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/* ---------- flow ---------- */

const STEPS = ["Account", "Goal", "Comfort", "Deposits", "Review"];

export function SignupFlow() {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [f, setF] = useState({ name: "", email: "", password: "", goal: "wealth" as Goal, drop: "wait" as Drop, horizon: "long" as Horizon, initial: 500, monthly: 250, agree: false });
  const [errors, setErrors] = useState<Partial<Record<"name" | "email" | "password" | "agree", string>>>({});
  const heading = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    heading.current?.focus();
  }, [step, done]);

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));
  const plan = planFor(f.drop, f.horizon);
  const years = yearsFor(f.goal, f.horizon);
  const firstName = f.name.trim().split(" ")[0];

  const next = (e: FormEvent) => {
    e.preventDefault();
    if (step === 0) {
      const er: typeof errors = {};
      if (!f.name.trim()) er.name = "What should we call you?";
      if (!/^\S+@\S+\.\S+$/.test(f.email)) er.email = "Enter an email like you@example.com.";
      if (PASSWORD_RULES.filter((r) => r.test(f.password)).length < 3 || f.password.length < 8) er.password = "Use at least 8 characters and two of the other rules.";
      setErrors(er);
      if (Object.keys(er).length) return;
    }
    if (step === 4) {
      if (!f.agree) return setErrors({ agree: "Please agree to the terms to open your account." });
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setDone(true);
      }, 1100);
      return;
    }
    setErrors({});
    setStep((s) => s + 1);
  };

  const title = ["Create your account.", "What are you investing for?", "How do you feel about risk?", "How much to start?", "Check your plan."][step];
  const sub = [
    "Two minutes, no paperwork. You can fund it later.",
    "It shapes how long your money is invested and how we measure progress.",
    "There are no wrong answers. Your plan should be one you can stick with.",
    "Start with as little as $1. You can change both amounts any time.",
    "Everything here can be changed later in Settings.",
  ][step];

  return (
    <div className="grid w-full gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
      <div className="w-full max-w-[520px]">
        {!done && (
          <div className="mb-10">
            <div className="flex items-center justify-between text-[16px]">
              {step > 0 ? (
                <button onClick={() => setStep((s) => s - 1)} className="group inline-flex items-center gap-2 text-white/70 transition-colors hover:text-white">
                  <ArrowLeftIcon size={18} className="transition-transform group-hover:-translate-x-1" /> Back
                </button>
              ) : (
                <span className="text-white/60">Open a Zuno account</span>
              )}
              <span className="text-white/60">
                Step {step + 1} of {STEPS.length}
              </span>
            </div>
            <div className="mt-4 flex gap-1.5" aria-hidden>
              {STEPS.map((s, i) => (
                <span key={s} className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.08]">
                  <motion.span className="block h-full rounded-full bg-lime" initial={false} animate={{ width: i <= step ? "100%" : "0%" }} transition={{ duration: 0.45, ease: EASE_OUT }} />
                </span>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence mode="wait" initial={false}>
          {done ? (
            <motion.div key="done" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: EASE_OUT }} role="status">
              <motion.span initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 260, damping: 16 }} className="grid size-16 place-items-center rounded-full bg-lime text-on-lime">
                <CheckIcon size={30} weight="bold" />
              </motion.span>
              <h1 ref={heading} tabIndex={-1} className="mt-8 text-[clamp(2.6rem,5vw,3.75rem)] font-semibold leading-[0.98] tracking-[-0.045em] outline-none">
                Welcome to Zuno, {firstName}.
              </h1>
              <p className="mt-5 text-[19px] leading-relaxed text-white/65">
                Your {PLANS[plan].name} portfolio is ready. We sent a confirmation to <span className="text-white">{f.email}</span>. Link a bank in the app to fund your first {formatUSD(f.initial, 0)}.
              </p>
              <div className="mt-10 space-y-3">
                <Link href="/#app" className="flex h-14 items-center justify-center rounded-[14px] bg-lime px-6 text-[17px] font-medium text-on-lime">
                  Take a tour of the app
                </Link>
                <Link href="/" className="flex h-14 items-center justify-center rounded-[14px] text-[17px] text-white/70 transition-colors hover:text-white">
                  Back to zuno.com
                </Link>
              </div>
            </motion.div>
          ) : (
            <motion.form key={step} onSubmit={next} noValidate initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.35, ease: EASE_OUT }}>
              <h1 ref={heading} tabIndex={-1} className="text-[clamp(2.4rem,4.6vw,3.5rem)] font-semibold leading-[1] tracking-[-0.045em] text-balance outline-none">
                {title}
              </h1>
              <p className="mt-4 text-[19px] leading-relaxed text-white/65">{sub}</p>

              <div className="mt-10 space-y-8">
                {step === 0 && (
                  <>
                    <Field label="First and last name" htmlFor="s-name" error={errors.name}>
                      <Input id="s-name" autoComplete="name" value={f.name} onChange={(e) => set("name", e.target.value)} invalid={Boolean(errors.name)} />
                    </Field>
                    <Field label="Email" htmlFor="s-email" error={errors.email}>
                      <Input id="s-email" type="email" autoComplete="email" value={f.email} onChange={(e) => set("email", e.target.value)} invalid={Boolean(errors.email)} placeholder="you@example.com" />
                    </Field>
                    <div>
                      <Field label="Password" htmlFor="s-password" error={errors.password}>
                        <PasswordInput id="s-password" autoComplete="new-password" value={f.password} onChange={(e) => set("password", e.target.value)} invalid={Boolean(errors.password)} />
                      </Field>
                      <PasswordStrength value={f.password} />
                    </div>
                  </>
                )}
                {step === 1 && <RadioRows name="goal" legend="Pick the closest" options={GOALS} value={f.goal} onChange={(v) => set("goal", v)} />}
                {step === 2 && (
                  <>
                    <RadioRows
                      name="drop"
                      legend="If your portfolio fell 20% in a month, you'd…"
                      options={[
                        { value: "sell" as Drop, label: "Sell to stop the losses" },
                        { value: "wait" as Drop, label: "Wait for it to recover" },
                        { value: "more" as Drop, label: "Invest more while it's cheap" },
                      ]}
                      value={f.drop}
                      onChange={(v) => set("drop", v)}
                    />
                    <Chips<Horizon> name="horizon" legend="When will you need this money?" options={["short", "mid", "long"]} value={f.horizon} onChange={(v) => set("horizon", v)} format={(v) => ({ short: "Under 3 yrs", mid: "3 to 10 yrs", long: "10+ yrs" })[v]} />
                  </>
                )}
                {step === 3 && (
                  <>
                    <Chips<number> name="initial" legend="Start with" options={[100, 500, 1000, 5000]} value={f.initial} onChange={(v) => set("initial", v)} format={(v) => formatUSD(v, 0)} />
                    <Chips<number> name="monthly" legend="Then every month" options={[0, 100, 250, 500]} value={f.monthly} onChange={(v) => set("monthly", v)} format={(v) => (v ? formatUSD(v, 0) : "Nothing yet")} />
                  </>
                )}
                {step === 4 && (
                  <>
                    <dl className="divide-y divide-white/[0.07] rounded-[22px] bg-ink-2 px-6">
                      {[
                        { k: "Name", v: f.name, s: 0 },
                        { k: "Goal", v: GOALS.find((g) => g.value === f.goal)?.label, s: 1 },
                        { k: "Plan", v: PLANS[plan].name, s: 2 },
                        { k: "Start with", v: formatUSD(f.initial, 0), s: 3 },
                        { k: "Every month", v: f.monthly ? formatUSD(f.monthly, 0) : "Nothing yet", s: 3 },
                      ].map((r) => (
                        <div key={r.k} className="flex items-center justify-between gap-4 py-4">
                          <dt className="text-[17px] text-white/60">{r.k}</dt>
                          <dd className="flex items-center gap-4 text-[17px]">
                            {r.v}
                            <button type="button" onClick={() => setStep(r.s)} className="text-[16px] text-accent underline-offset-4 hover:underline" aria-label={`Edit ${r.k.toLowerCase()}`}>
                              Edit
                            </button>
                          </dd>
                        </div>
                      ))}
                    </dl>
                    <Agree checked={f.agree} onChange={(v) => set("agree", v)} error={errors.agree}>
                      I agree to the{" "}
                      <Link href="/legal/terms" className="text-accent underline underline-offset-4">
                        Terms of service
                      </Link>
                      ,{" "}
                      <Link href="/legal/privacy" className="text-accent underline underline-offset-4">
                        Privacy policy
                      </Link>{" "}
                      and{" "}
                      <Link href="/legal/form-crs" className="text-accent underline underline-offset-4">
                        Form CRS
                      </Link>
                      .
                    </Agree>
                  </>
                )}
              </div>

              <div className="mt-10">
                <PrimaryButton loading={loading}>{step === 4 ? "Create my account" : "Continue"}</PrimaryButton>
              </div>
              {step === 0 && (
                <p className="mt-8 text-[17px] text-white/65">
                  Already have an account?{" "}
                  <Link href="/login" className="text-accent underline-offset-4 hover:underline">
                    Log in
                  </Link>
                </p>
              )}
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      <div className="lg:sticky lg:top-28 lg:self-start">
        <PlanPreview plan={plan} initial={f.initial} monthly={f.monthly} years={years} name={firstName} />
      </div>
    </div>
  );
}

function Agree({ checked, onChange, error, children }: { checked: boolean; onChange: (v: boolean) => void; error?: string; children: ReactNode }) {
  return (
    <div>
      <label className="flex cursor-pointer gap-4 text-[17px] leading-relaxed text-white/80">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" aria-invalid={Boolean(error) || undefined} aria-describedby={error ? "agree-error" : undefined} />
        <span className={cn("mt-0.5 grid size-6 shrink-0 place-items-center rounded-[7px] border-2 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-lime peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-ink", checked ? "border-lime bg-lime text-on-lime" : error ? "border-down" : "border-white/30")}>
          {checked && <CheckIcon size={14} weight="bold" />}
        </span>
        <span>{children}</span>
      </label>
      {error && (
        <p id="agree-error" role="alert" className="mt-2 pl-10 text-[15px] text-down">
          {error}
        </p>
      )}
    </div>
  );
}
