"use client";

import { ArrowRightIcon, CheckCircleIcon, CheckIcon, EnvelopeSimpleIcon, LockSimpleIcon, UsersThreeIcon, type Icon } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type InputHTMLAttributes, type ReactNode } from "react";
import type { Member } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Avatar, displayName, openAuth, signOut, useAuth } from "./auth";
import { change, refresh, useRpc } from "./db";
import { usePlan } from "./plan";
import { IconTile } from "./plan-parts";
import { btn, btnLg, btnSm } from "./sheet";
import { toast } from "./toast";
import { track } from "./analytics";

/*
 * The Team plan's ten seats. The owner names the team, invites people by email and removes them;
 * an invite is a link that works once, for that email. Everyone on the team has Pro while they're
 * on it.
 */

/* The team form's text field: 44px, 14px corners, a hairline that firms up on focus. */
const FIELD = "h-11 w-full rounded-[14px] border bg-surface px-3.5 text-[16px] text-fg outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-subtle disabled:opacity-60";
const fieldTone = (invalid?: boolean) => (invalid ? "border-[#d92d20]/60 focus:border-[#d92d20] focus:shadow-[0_0_0_3px_rgb(217_45_32/0.14)]" : "border-line focus:border-line-strong focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--bd-fg)_7%,transparent)]");

function TextField({ invalid, className, ...props }: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return <input aria-invalid={invalid || undefined} aria-describedby={invalid && props.id ? `${props.id}-error` : undefined} className={cn(FIELD, fieldTone(invalid), className)} {...props} />;
}

const why = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong.");
/* A quiet gray frame with 34px corners, a white panel set in it at 26px, and the panel's heading. */
const FRAME = "bd-reveal mx-auto max-w-[720px] rounded-[var(--bd-r-stage)] bg-surface-2 p-2";
const PANEL = "rounded-[var(--bd-r-sheet)] bg-surface p-7 sm:p-9";
const TITLE = "mt-5 text-[22px] font-medium leading-[1.1] tracking-[-0.02em]";
const BODY = "mt-3 max-w-[560px] text-ui leading-[1.55] text-muted";

/** A message in a frame: an icon, a heading, a line, and what to do. */
function Card({ icon, title, children }: { icon: Icon; title: ReactNode; children: ReactNode }) {
  return (
    <div className={FRAME}>
      <div className={PANEL}>
        <IconTile icon={icon} />
        <h2 className={TITLE}>{title}</h2>
        {children}
      </div>
    </div>
  );
}

export function Team() {
  const { user, loading } = useAuth();
  const [, { preview }] = usePlan();
  const data = useRpc("teams_mine", user ? { preview } : "skip");

  if (loading || (user && data === undefined)) return <div className="h-[420px]" aria-busy="true" />;

  if (!user || !data)
    return (
      <Card icon={LockSimpleIcon} title="Sign in to see your team">
        <p className={BODY}>Your team, its people and the invites you&apos;ve sent are in your account.</p>
        <button type="button" onClick={() => openAuth("sign-in")} className={cn(btnLg.ink, "mt-7")}>
          Sign in
        </button>
      </Card>
    );

  if (!data.team) return data.canCreate ? <CreateTeam preview={preview} /> : <NoTeam />;
  return <TeamView team={data.team} role={data.role!} people={data.people!} seats={data.seats!} me={user.email} />;
}

/** Without the Team plan: what it adds, and how to get it. */
function NoTeam() {
  const points = ["Pro for everyone on it, up to 10 people", "One license, managed in one place", "Client projects", "Priority support"];
  return (
    <Card icon={UsersThreeIcon} title="Teams come with basedraft Team">
      <p className={BODY}>One license for the whole team, $399 once. Get it, then invite your people here.</p>
      <ul className="mt-7 grid gap-2.5 border-t border-line pt-7 sm:grid-cols-2">
        {points.map((p) => (
          <li key={p} className="flex items-start gap-2.5 text-ui">
            <CheckIcon size={14} weight="duotone" className="mt-[3px] shrink-0" />
            {p}
          </li>
        ))}
      </ul>
      <div className="mt-8 flex flex-wrap gap-2">
        <a href="/checkout?product=team" className={btnLg.ink}>
          Get Team for $399 <ArrowRightIcon weight="regular" size={15} />
        </a>
        <Link href="/pro" className={btnLg.outline}>
          Compare plans
        </Link>
      </div>
      <p className="mt-6 text-meta text-subtle">Joining someone else&apos;s team? Open the invite link from their email, signed in with the address it went to.</p>
    </Card>
  );
}

function CreateTeam({ preview }: { preview: boolean }) {
  const { user } = useAuth();
  const create = change("teams_create", "teams_mine");
  const [name, setName] = useState(() => (user ? `${displayName(user).split(" ")[0]}'s team` : ""));
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await create({ name, preview });
      toast(`${name.trim() || "Your team"} is ready`, { detail: "Invite your people next." });
    } catch (err) {
      toast("Couldn't make the team", { tone: "error", detail: why(err) });
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit} className={FRAME}>
      <div className={PANEL}>
        <IconTile icon={UsersThreeIcon} />
        <h2 className={TITLE}>Name your team</h2>
        <p className={BODY}>
          Your Team plan has 10 seats. Name the team, then invite people by email.
          {preview && " Development preview: no Team purchase needed here."}
        </p>
        <div className="mt-7 flex max-w-[480px] gap-2">
          <TextField id="team-name" aria-label="Team name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} className="min-w-0 flex-1" />
          <button type="submit" disabled={busy} className="btn-ink h-11 shrink-0 rounded-full px-[18px] text-ui font-medium disabled:opacity-60">
            Make the team
          </button>
        </div>
      </div>
    </form>
  );
}

/** Invites, and invites again, through the site: it sends the email with the link to join. */
async function sendInvite(body: { email: string } | { memberId: string }) {
  const r = await fetch("/api/team/invite", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(((await r.json().catch(() => ({}))) as { error?: string }).error ?? "That didn't go through. Try again.");
  refresh("teams_mine");
}
const rename = change("teams_rename", "teams_mine");
const remove = change("teams_remove", "teams_mine");
// Leaving takes the Pro the team gave, too.
const leave = change("teams_leave", "teams_mine", "purchases_mine", "projects_list");
const accept = change("teams_accept", "teams_mine", "purchases_mine", "projects_list");

function TeamView({ team, role, people, seats, me }: { team: { id: string; name: string }; role: "owner" | "member"; people: Member[]; seats: number; me: string }) {
  const owner = role === "owner";
  const [name, setName] = useState(team.name);
  const [email, setEmail] = useState("");
  const [problem, setProblem] = useState("");
  const [busy, setBusy] = useState(false);
  const [doomed, setDoomed] = useState<string | null>(null);
  const sorted = [...people].sort((a, b) => (a.role === "owner" ? -1 : b.role === "owner" ? 1 : a.status === b.status ? a.email.localeCompare(b.email) : a.status === "active" ? -1 : 1));
  const full = people.length >= seats;

  const send = async (e: FormEvent) => {
    e.preventDefault();
    const em = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return setProblem("Enter an email address to invite.");
    setProblem("");
    setBusy(true);
    try {
      await sendInvite({ email: em });
      track("team_invite_sent");
      setEmail("");
      toast(`Invited ${em}`, { detail: "We emailed them a link to join." });
    } catch (err) {
      setProblem(why(err));
    } finally {
      setBusy(false);
    }
  };
  const run = (p: Promise<unknown>, done: string) => p.then(() => toast(done), (err) => toast("Couldn't do that", { tone: "error", detail: why(err) }));

  return (
    <div className="mx-auto max-w-[1120px] space-y-20">
      <section className="bd-reveal rounded-[var(--bd-r-stage)] bg-surface-2 p-2" aria-labelledby="team-title">
        <div className="rounded-[var(--bd-r-sheet)] bg-surface p-7 sm:p-9">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="min-w-0 flex-1">
              {owner ? (
                <input
                  id="team-title"
                  aria-label="Team name"
                  value={name}
                  maxLength={60}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => name.trim() && name.trim() !== team.name && void run(rename({ name }), "Renamed the team")}
                  onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                  className="-ml-2 w-full max-w-[460px] rounded-[12px] bg-transparent px-2 py-1 font-display text-[32px] leading-[1.1] tracking-[-0.035em] outline-none transition-colors hover:bg-surface-2 focus:bg-surface-2 focus:shadow-[inset_0_0_0_1px_var(--bd-line)]"
                />
              ) : (
                <h2 id="team-title" className="font-display text-[32px] leading-[1.1] tracking-[-0.035em]">
                  {team.name}
                </h2>
              )}
              <p className="mt-2 text-ui text-muted">{owner ? "You own this team. Everyone on it has Pro while they're on it." : "You're on this team, with Pro through it."}</p>
            </div>
            <div className="w-[200px] pt-2">
              <div className="flex justify-between text-meta text-muted">
                <span>Seats</span>
                <span className="tabular-nums">
                  {people.length} of {seats}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2 shadow-[inset_0_0_0_1px_var(--bd-line-subtle)]">
                <div className="h-full rounded-full bg-fg" style={{ width: `${(people.length / seats) * 100}%` }} />
              </div>
            </div>
          </div>

          {owner && (
            <form onSubmit={send} noValidate className="mt-8 border-t border-line pt-7">
              <label htmlFor="invite-email" className="text-ui font-medium">
                Invite someone
              </label>
              <div className="mt-2 flex max-w-[560px] gap-2">
                <TextField
                  id="invite-email"
                  type="email"
                  placeholder={full ? "Every seat is taken" : "name@company.com"}
                  value={email}
                  disabled={full}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setProblem("");
                  }}
                  invalid={!!problem}
                  className="min-w-0 flex-1"
                />
                <button type="submit" disabled={busy || full} className="btn-ink inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-[18px] text-ui font-medium disabled:opacity-50">
                  <EnvelopeSimpleIcon weight="duotone" size={15} /> {busy ? "Inviting" : "Send invite"}
                </button>
              </div>
              {problem && (
                <p id="invite-email-error" role="alert" className="mt-2 text-meta text-[#d92d20] dark:text-[#ff8a80]">
                  {problem}
                </p>
              )}
            </form>
          )}
        </div>
      </section>

      <section aria-labelledby="people-title">
        <h2 id="people-title" className="mb-8 text-title">
          People
        </h2>
        <ul className="space-y-0.5 rounded-[var(--bd-r-stage)] bg-surface-2 p-3 sm:p-6">
          {sorted.map((m) => {
            const you = m.email === me;
            return (
              <li key={m.id} className="flex flex-wrap items-center gap-3 rounded-[14px] bg-surface px-3 py-2.5">
                <Avatar name={m.name ?? m.email} size={32} tone={m.status === "active" ? "ink" : "gray"} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-ui font-medium">
                    {m.name ?? m.email}
                    {you && " (you)"}
                  </span>
                  <span className="block truncate text-meta text-subtle">{m.name ? m.email : m.status === "invited" ? "Invite sent, waiting for them to join" : m.email}</span>
                </span>
                <span className={cn("inline-flex h-[22px] items-center rounded-full border px-2 text-[11px] font-medium", m.status === "invited" ? "border-line text-muted" : "border-line-strong text-fg")}>{m.role === "owner" ? "Owner" : m.status === "invited" ? "Invited" : "Member"}</span>
                {owner && m.role !== "owner" && (
                  <span className="flex gap-1.5">
                    {m.status === "invited" && (
                      <button type="button" onClick={() => void run(sendInvite({ memberId: m.id }), `Sent ${m.email} the invite again`)} className={btnSm.outline}>
                        Resend
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (doomed !== m.id) return setDoomed(m.id);
                        setDoomed(null);
                        void run(remove({ member_id: m.id }), m.status === "invited" ? `Cancelled ${m.email}'s invite` : `Removed ${m.name ?? m.email} from the team`);
                      }}
                      onBlur={() => setDoomed((x) => (x === m.id ? null : x))}
                      className={cn(btnSm.outline, doomed === m.id && "bg-[#d92d20] text-white shadow-none hover:bg-[#b42318]")}
                    >
                      {doomed === m.id ? (m.status === "invited" ? "Cancel it?" : "Remove them?") : m.status === "invited" ? "Cancel invite" : "Remove"}
                    </button>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
        {!owner && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-ui text-muted">Leaving ends your Pro through the team. Your own drafts stay yours.</p>
            <button
              type="button"
              onClick={() => {
                if (doomed !== "leave") return setDoomed("leave");
                void run(leave({}), `You left ${team.name}`);
              }}
              onBlur={() => setDoomed(null)}
              className={cn(btn.outline, doomed === "leave" && "bg-[#d92d20] text-white shadow-none hover:bg-[#b42318]")}
            >
              {doomed === "leave" ? "Leave for good?" : "Leave the team"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

/* The invite page's card: the dialog's white card with 34px corners, and its full-width 44px buttons. */
const INVITE = "rounded-[var(--bd-r-stage)] border border-line bg-surface p-7 shadow-[var(--bd-shadow-raised)] sm:p-9";
const INVITE_INK = "btn-ink flex h-11 w-full items-center justify-center rounded-full px-[18px] text-ui font-medium";
const INVITE_LINE = "flex h-11 w-full items-center justify-center rounded-full border border-line bg-surface px-[18px] text-ui font-medium transition-colors hover:bg-surface-2";

/** Joining a team from an invite link. */
export function Invite({ token }: { token: string }) {
  const { user, loading } = useAuth();
  const invite = useRpc("teams_invitation", { token });
  const router = useRouter();
  const [joined, setJoined] = useState(false);
  const [busy, setBusy] = useState(false);

  if (joined)
    return (
      <div className={INVITE}>
        <IconTile icon={CheckCircleIcon} />
        <h2 className={TITLE}>You&apos;re on the team</h2>
        <p className={BODY}>Taking you to it.</p>
      </div>
    );
  if (loading || invite === undefined) return <div className="h-[320px]" aria-busy="true" />;
  if (invite === null)
    return (
      <div className={INVITE}>
        <IconTile icon={EnvelopeSimpleIcon} />
        <h2 className={TITLE}>This invite isn&apos;t open any more</h2>
        <p className={BODY}>It&apos;s been used, or the team&apos;s owner cancelled it. Ask them to send you a new one.</p>
        <Link href="/team" className={cn(INVITE_LINE, "mt-7")}>
          Go to Team
        </Link>
      </div>
    );

  const join = async () => {
    setBusy(true);
    try {
      await accept({ token });
      setJoined(true);
      toast(`Welcome to ${invite.team}`, { detail: "You have Pro while you're on the team." });
      router.push("/team");
    } catch (err) {
      toast("Couldn't join", { tone: "error", detail: why(err) });
      setBusy(false);
    }
  };
  const mismatch = user && user.email.toLowerCase() !== invite.email;
  return (
    <div className={INVITE}>
      <IconTile icon={UsersThreeIcon} />
      <h2 className={TITLE}>
        {invite.inviter} invited you to {invite.team}
      </h2>
      <p className={BODY}>You&apos;ll have Pro, every template and export, for as long as you&apos;re on the team.</p>
      {!user ? (
        <>
          <p className="mt-6 border-t border-line pt-6 text-ui text-muted">
            The invite is for <span className="font-medium text-fg">{invite.email}</span>. Sign in or make an account with it to join.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => openAuth("sign-up", { reason: "team" })} className={INVITE_INK}>
              Make an account
            </button>
            <button type="button" onClick={() => openAuth("sign-in")} className={INVITE_LINE}>
              Sign in
            </button>
          </div>
        </>
      ) : mismatch ? (
        <>
          <p className="mt-6 border-t border-line pt-6 text-ui text-muted">
            You&apos;re signed in as <span className="font-medium text-fg">{user.email}</span>, but the invite is for <span className="font-medium text-fg">{invite.email}</span>. Sign in with that address to join.
          </p>
          <button type="button" onClick={() => void signOut()} className={cn(INVITE_LINE, "mt-4")}>
            Sign out
          </button>
        </>
      ) : (
        <button type="button" onClick={() => void join()} disabled={busy} className={cn(INVITE_INK, "mt-7 disabled:opacity-60")}>
          Join {invite.team}
        </button>
      )}
    </div>
  );
}
