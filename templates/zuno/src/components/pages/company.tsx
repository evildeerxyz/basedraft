"use client";

import { ArrowUpRightIcon, CheckIcon, CopyIcon, DownloadSimpleIcon, PlusIcon } from "@phosphor-icons/react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useMemo, useState, type FormEvent } from "react";
import { cn, EASE_OUT } from "@/lib/utils";
import { Field, Input, Textarea } from "../ui/Field";
import { Select } from "../ui/Select";
import { LogoMark } from "../ui/Logo";

/* ---------------- Careers ---------------- */

const ROLES = [
  { team: "Engineering", title: "Senior iOS Engineer", where: "New York or remote (US)", pay: "$185K to $235K", body: "Own the Home and Invest tabs end to end. You'll work in SwiftUI, care about 60fps charts, and ship to 380,000 people every week." },
  { team: "Engineering", title: "Staff Backend Engineer, Trading", where: "New York", pay: "$230K to $290K", body: "Design the systems that place and reconcile millions of fractional orders a day. Go, Postgres and a healthy fear of rounding errors." },
  { team: "Engineering", title: "Machine Learning Engineer, Copilot", where: "New York or London", pay: "$210K to $270K", body: "Make Copilot more accurate and more honest. Evaluation pipelines, retrieval over financial data, and guardrails that hold up under pressure." },
  { team: "Engineering", title: "Security Engineer", where: "Remote (US)", pay: "$190K to $240K", body: "Threat-model everything, run our bug bounty and help keep 380,000 accounts boring in the best way." },
  { team: "Design", title: "Senior Product Designer", where: "New York", pay: "$170K to $215K", body: "Design the calmest money app on earth. Strong interaction and motion skills, and the patience to explain complex things simply." },
  { team: "Design", title: "Brand Designer", where: "New York or remote (US)", pay: "$140K to $175K", body: "Shape how Zuno looks and sounds everywhere, from the app icon to the subway ad." },
  { team: "Investing", title: "Portfolio Strategist", where: "New York", pay: "$160K to $210K", body: "Research and maintain our model portfolios, swap pairs and rebalancing rules alongside the investment committee." },
  { team: "Investing", title: "Tax Research Lead", where: "New York", pay: "$165K to $205K", body: "Keep our harvesting and asset location logic correct as tax law changes. CPA or EA preferred." },
  { team: "Operations", title: "Member Support Specialist", where: "Remote (US)", pay: "$62K to $78K", body: "Help members in real time over chat and phone. You'll be the reason our median reply time stays under five minutes." },
  { team: "Operations", title: "Compliance Manager", where: "New York", pay: "$150K to $190K", body: "Partner with product teams so new features ship quickly and stay on the right side of SEC and FINRA rules." },
  { team: "Operations", title: "Payments Operations Analyst", where: "New York", pay: "$95K to $120K", body: "Own ACH, wires and transfers from other brokers. Spreadsheets, bank portals and a talent for finding the missing $0.03." },
];
const TEAMS = ["All", "Engineering", "Design", "Investing", "Operations"] as const;

export function RolesBoard() {
  const [team, setTeam] = useState<(typeof TEAMS)[number]>("All");
  const [open, setOpen] = useState<string | null>(null);
  const roles = useMemo(() => ROLES.filter((r) => team === "All" || r.team === team), [team]);

  return (
    <div>
      <LayoutGroup id="teams">
        <div className="no-scrollbar flex gap-1 overflow-x-auto rounded-[15px] bg-white/[0.05] p-1 sm:w-fit">
          {TEAMS.map((t) => (
            <button key={t} onClick={() => setTeam(t)} aria-pressed={team === t} className={cn("relative h-12 shrink-0 rounded-[11px] px-5 text-[17px] font-medium transition-colors", team === t ? "text-ink" : "text-white/70 hover:text-white")}>
              {team === t && <motion.span layoutId="team-pill" className="absolute inset-0 rounded-[10px] bg-paper" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
              <span className="relative">
                {t} <span className="ml-0.5 tabular-nums opacity-55">{t === "All" ? ROLES.length : ROLES.filter((r) => r.team === t).length}</span>
              </span>
            </button>
          ))}
        </div>
      </LayoutGroup>

      <ul className="mt-10 divide-y divide-white/[0.08] border-b border-white/[0.08]">
        <AnimatePresence initial={false} mode="popLayout">
          {roles.map((r) => {
            const isOpen = open === r.title;
            const id = r.title.toLowerCase().replace(/[^a-z]+/g, "-");
            return (
              <motion.li key={r.title} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                <button onClick={() => setOpen(isOpen ? null : r.title)} aria-expanded={isOpen} aria-controls={`role-${id}`} className="group grid w-full gap-1.5 py-7 text-left sm:grid-cols-[1fr_230px_190px_40px] sm:items-center sm:gap-6">
                  <span className="text-[21px] font-medium tracking-[-0.02em] group-hover:text-accent sm:text-[23px]">{r.title}</span>
                  <span className="text-[17px] text-white/60">{r.where}</span>
                  <span className="text-[17px] tabular-nums text-white/75">{r.pay}</span>
                  <motion.span animate={{ rotate: isOpen ? 45 : 0 }} className="hidden size-10 place-items-center rounded-full bg-white/[0.06] sm:grid">
                    <PlusIcon size={18} weight="bold" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div id={`role-${id}`} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: EASE_OUT }} className="overflow-hidden">
                      <div className="flex flex-col gap-5 pb-6 sm:flex-row sm:items-end sm:justify-between">
                        <p className="max-w-[640px] text-[18px] leading-relaxed text-white/70">{r.body}</p>
                        <a href={`mailto:jobs@zuno.com?subject=${encodeURIComponent(r.title)}`} className="inline-flex h-12 shrink-0 items-center gap-2 rounded-[12px] bg-lime px-5 text-[17px] font-medium text-on-lime">
                          Apply <ArrowUpRightIcon size={14} weight="bold" />
                        </a>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </div>
  );
}

/* ---------------- Press ---------------- */

const MARK_SVG = (bg: string, fg: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" shape-rendering="crispEdges"><rect width="28" height="28" rx="8" fill="${bg}"/><g fill="${fg}"><rect x="3.75" y="3.75" width="20.5" height="2.7"/><rect x="18.15" y="6.8" width="5.75" height="2.7"/><rect x="15.1" y="9.85" width="5.75" height="2.7"/><rect x="12.05" y="12.9" width="5.75" height="2.7"/><rect x="9" y="15.95" width="5.75" height="2.7"/><rect x="5.95" y="19" width="5.75" height="2.7"/><rect x="3.75" y="22.05" width="20.5" height="2.7"/></g></svg>`;

function download(name: string, svg: string) {
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

const COLORS = [
  { name: "Zuno Lime", hex: "#C8FF3E", fg: "#000" },
  { name: "Ink", hex: "#000000", fg: "#fff" },
  { name: "Graphite", hex: "#1C1C1E", fg: "#fff" },
  { name: "Paper", hex: "#F5F5F5", fg: "#000" },
];

export function BrandAssets() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (hex: string) => {
    await navigator.clipboard?.writeText(hex);
    setCopied(hex);
    setTimeout(() => setCopied((c) => (c === hex ? null : c)), 1400);
  };

  const logos = [
    { name: "Mark on lime", file: "zuno-mark.svg", svg: MARK_SVG("#c8ff3e", "#000000"), bg: "bg-ink-3" },
    { name: "Mark on black", file: "zuno-mark-black.svg", svg: MARK_SVG("#000000", "#c8ff3e"), bg: "bg-ink-3" },
    { name: "Mark on white", file: "zuno-mark-white.svg", svg: MARK_SVG("#ffffff", "#000000"), bg: "bg-paper" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        {logos.map((l) => (
          <div key={l.file} className="overflow-hidden rounded-[20px] border border-white/[0.08]">
            <div className={cn("grid aspect-[4/3] place-items-center", l.bg)} dangerouslySetInnerHTML={{ __html: l.svg.replace("<svg ", '<svg width="88" height="88" ') }} />
            <div className="flex items-center justify-between bg-ink-2 px-5 py-4">
              <span className="text-[16px]">{l.name}</span>
              <button onClick={() => download(l.file, l.svg)} className="inline-flex items-center gap-1.5 text-[15px] text-white/70 hover:text-white" aria-label={`Download ${l.name} as SVG`}>
                <DownloadSimpleIcon size={15} /> SVG
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {COLORS.map((c) => (
          <button
            key={c.hex}
            onClick={() => copy(c.hex)}
            className="group flex aspect-[5/3] flex-col justify-between rounded-[20px] border border-white/[0.08] p-5 text-left"
            style={{ background: c.hex, color: c.fg }}
            aria-label={`Copy ${c.name} ${c.hex}`}
          >
            <span className="text-[17px] font-medium">{c.name}</span>
            <span className="flex items-center justify-between font-mono text-[15px]">
              {c.hex}
              <span className="opacity-60 group-hover:opacity-100">{copied === c.hex ? <CheckIcon size={15} weight="bold" /> : <CopyIcon size={15} />}</span>
            </span>
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-6 rounded-[20px] border border-white/[0.08] bg-ink-2 p-7">
        <div className="flex items-center gap-5">
          <LogoMark size={44} />
          <div>
            <div className="text-[17px] font-medium">Typeface: Geist and Geist Mono</div>
            <div className="mt-0.5 text-[16px] text-white/60">Free and open source. Headlines in Geist Semibold, tight tracking.</div>
          </div>
        </div>
        <span className="text-[40px] font-semibold tracking-[-0.05em]">Aa 0123</span>
      </div>
    </div>
  );
}

/* ---------------- Contact ---------------- */

const TOPICS = [
  { value: "Account help", label: "Account help", hint: "Deposits, withdrawals, logging in" },
  { value: "Partnerships", label: "Partnerships", hint: "Employers, advisers and platforms" },
  { value: "Press", label: "Press", hint: "Interviews and data requests" },
  { value: "API access", label: "API access", hint: "Build on the read-only Zuno API" },
  { value: "Something else", label: "Something else" },
];

export function ContactForm({ defaultTopic = "Account help" }: { defaultTopic?: string }) {
  const [values, setValues] = useState({ name: "", email: "", topic: defaultTopic, message: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof values, string>>>({});
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");

  const set = (k: keyof typeof values) => (e: { target: { value: string } }) => setValues((v) => ({ ...v, [k]: e.target.value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!values.name.trim()) next.name = "Please tell us your name.";
    if (!/^\S+@\S+\.\S+$/.test(values.email)) next.email = "Enter an email address like you@example.com.";
    if (values.message.trim().length < 10) next.message = "A sentence or two helps us route this to the right person.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setState("sending");
    setTimeout(() => setState("sent"), 900);
  };

  if (state === "sent")
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-[20px] border border-lime/30 bg-lime/[0.06] p-8" role="status">
        <span className="grid size-11 place-items-center rounded-full bg-lime text-on-lime">
          <CheckIcon size={20} weight="bold" />
        </span>
        <h3 className="mt-5 text-[24px] font-semibold tracking-tight">Thanks, {values.name.split(" ")[0]}.</h3>
        <p className="mt-2 max-w-[440px] text-[17px] leading-relaxed text-white/70">
          We&apos;ve sent a confirmation to {values.email}. A real person will reply within one business day, usually much sooner.
        </p>
      </motion.div>
    );

  return (
    <form onSubmit={submit} noValidate className="space-y-5 rounded-[20px] border border-white/[0.08] bg-ink-2 p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" htmlFor="c-name" error={errors.name}>
          <Input id="c-name" autoComplete="name" value={values.name} onChange={set("name")} invalid={Boolean(errors.name)} />
        </Field>
        <Field label="Email" htmlFor="c-email" error={errors.email}>
          <Input id="c-email" type="email" autoComplete="email" value={values.email} onChange={set("email")} invalid={Boolean(errors.email)} />
        </Field>
      </div>
      <Field label="Topic" htmlFor="c-topic">
        <Select id="c-topic" value={values.topic} onChange={(v) => setValues((s) => ({ ...s, topic: v }))} options={TOPICS} />
      </Field>
      <Field label="Message" htmlFor="c-message" error={errors.message} hint="Please don't include account numbers or passwords.">
        <Textarea id="c-message" value={values.message} onChange={set("message")} invalid={Boolean(errors.message)} />
      </Field>
      <button type="submit" disabled={state === "sending"} className="inline-flex h-12 items-center gap-2 rounded-[12px] bg-lime px-6 text-[17px] font-medium text-on-lime disabled:opacity-60">
        {state === "sending" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
