"use client";

import { CheckCircleIcon, EnvelopeSimpleIcon, LockSimpleIcon, UsersThreeIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { Member } from "@/lib/api";
import { Input } from "@/ui/field";
import { cn } from "@/lib/utils";
import { Avatar, displayName, openAuth, signOut, useAuth } from "./auth";
import { change, refresh, useRpc } from "./db";
import { usePlan } from "./plan";
import { btn, btnSm } from "./sheet";
import { toast } from "./toast";
import { track } from "./analytics";

/*
 * The Team plan's ten seats. The owner names the team, invites people by email and removes them;
 * an invite is a link that works once, for that email. Everyone on the team has Pro while they're
 * on it, and the drafts shared with the team are in all their Libraries.
 */

const why = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong.");
const CARD = "bd-reveal rounded-[var(--bd-r-sheet)] bg-surface shadow-[0_0_0_1px_var(--bd-line)]";

export function Team() {
  const { user, loading } = useAuth();
  const [, { preview }] = usePlan();
  const data = useRpc("teams_mine", user ? { preview } : "skip");

  if (loading || (user && data === undefined)) return <div className="h-[420px]" aria-busy="true" />;

  if (!user || !data)
    return (
      <div className={cn(CARD, "p-6 md:p-8")}>
        <LockSimpleIcon size={22} weight="duotone" className="text-muted" />
        <h2 className="mt-3 text-heading">Sign in to see your team</h2>
        <p className="mt-1.5 max-w-[520px] text-body text-muted">Your team, its people and the invites you&apos;ve sent are in your account.</p>
        <button type="button" onClick={() => openAuth("sign-in")} className={cn(btn.ink, "mt-5")}>
          Sign in
        </button>
      </div>
    );

  if (!data.team) return data.canCreate ? <CreateTeam preview={preview} /> : <NoTeam />;
  return <TeamView team={data.team} role={data.role!} people={data.people!} seats={data.seats!} me={user.email} />;
}

/** Without the Team plan: what it adds, and how to get it. */
function NoTeam() {
  const points = ["Pro for everyone on it, up to 10 people", "Drafts shared with the whole team, in everyone's Library", "Live cursors and comments on the canvas", "Client projects, and priority support"];
  return (
    <div className={cn(CARD, "p-6 md:p-8")}>
      <UsersThreeIcon size={22} weight="duotone" className="text-muted" />
      <h2 className="mt-3 text-heading">Teams come with basedraft Team</h2>
      <p className="mt-1.5 max-w-[560px] text-body text-muted">One license for the whole team, $399 once. Get it, then invite your people here.</p>
      <ul className="mt-5 grid gap-2 sm:grid-cols-2">
        {points.map((p) => (
          <li key={p} className="flex items-start gap-2.5 text-ui">
            <CheckCircleIcon size={17} weight="fill" className="mt-px shrink-0 text-fg/70" />
            {p}
          </li>
        ))}
      </ul>
      <div className="mt-6 flex flex-wrap gap-2">
        <a href="/checkout?product=team" className={btn.ink}>
          Get Team for $399
        </a>
        <Link href="/pro" className={btn.quiet}>
          Compare plans
        </Link>
      </div>
      <p className="mt-5 text-ui text-muted">Joining someone else&apos;s team? Open the invite link from their email, signed in with the address it went to.</p>
    </div>
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
    <form onSubmit={submit} className={cn(CARD, "p-6 md:p-8")}>
      <UsersThreeIcon size={22} weight="duotone" className="text-muted" />
      <h2 className="mt-3 text-heading">Name your team</h2>
      <p className="mt-1.5 max-w-[520px] text-body text-muted">
        Your Team plan has 10 seats. Name the team, then invite people by email.
        {preview && " Development preview: no Team purchase needed here."}
      </p>
      <div className="mt-5 flex max-w-[460px] gap-2">
        <Input id="team-name" aria-label="Team name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} size="base" className="min-w-0 flex-1" />
        <button type="submit" disabled={busy} className={cn(btn.ink, "shrink-0 disabled:opacity-60")}>
          Make the team
        </button>
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
    <div className="space-y-6">
      <section className={cn(CARD, "p-5 md:p-6")} aria-labelledby="team-title">
        <div className="flex flex-wrap items-center justify-between gap-4">
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
                className="-ml-1.5 w-full max-w-[420px] rounded-[6px] bg-transparent px-1.5 py-0.5 text-heading outline-none transition-colors hover:bg-fg/[0.04] focus:bg-fg/[0.05] focus:ring-2 focus:ring-fg/15"
              />
            ) : (
              <h2 id="team-title" className="text-heading">
                {team.name}
              </h2>
            )}
            <p className="mt-1 text-ui text-muted">{owner ? "You own this team. Everyone on it has Pro while they're on it." : "You're on this team, with Pro through it."}</p>
          </div>
          <div className="w-[180px]">
            <div className="flex justify-between text-meta text-muted">
              <span>Seats</span>
              <span className="tabular-nums">
                {people.length} of {seats}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-fg/[0.08]">
              <div className="h-full rounded-full bg-fg" style={{ width: `${(people.length / seats) * 100}%` }} />
            </div>
          </div>
        </div>

        {owner && (
          <form onSubmit={send} noValidate className="mt-6">
            <label htmlFor="invite-email" className="text-ui font-medium">
              Invite someone
            </label>
            <div className="mt-2 flex max-w-[560px] gap-2">
              <Input
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
                size="base"
                className="min-w-0 flex-1"
              />
              <button type="submit" disabled={busy || full} className={cn(btn.ink, "shrink-0 disabled:opacity-50")}>
                <EnvelopeSimpleIcon size={15} weight="bold" /> {busy ? "Inviting" : "Send invite"}
              </button>
            </div>
            {problem && (
              <p role="alert" className="mt-1.5 text-meta text-[#d92d20]">
                {problem}
              </p>
            )}
          </form>
        )}
      </section>

      <section aria-labelledby="people-title">
        <h2 id="people-title" className="mb-3 px-1 text-heading">
          People
        </h2>
        <ul className={cn(CARD, "divide-y divide-line overflow-hidden")}>
          {sorted.map((m) => {
            const you = m.email === me;
            return (
              <li key={m.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                <Avatar name={m.name ?? m.email} size={34} tone={m.status === "active" ? "ink" : "gray"} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-ui font-medium">
                    {m.name ?? m.email}
                    {you && " (you)"}
                  </span>
                  <span className="block truncate text-meta text-muted">{m.name ? m.email : m.status === "invited" ? "Invite sent, waiting for them to join" : m.email}</span>
                </span>
                <span className={cn("rounded-[5px] px-1.5 py-0.5 text-meta font-medium", m.status === "invited" ? "bg-fg/[0.05] text-muted" : "bg-fg/[0.07]")}>{m.role === "owner" ? "Owner" : m.status === "invited" ? "Invited" : "Member"}</span>
                {owner && m.role !== "owner" && (
                  <span className="flex gap-1.5">
                    {m.status === "invited" && (
                      <button type="button" onClick={() => void run(sendInvite({ memberId: m.id }), `Sent ${m.email} the invite again`)} className={btnSm.quiet}>
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
                      className={cn(btnSm.quiet, doomed === m.id && "bg-[#d92d20] text-white hover:bg-[#b42318]")}
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
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-1">
            <p className="text-ui text-muted">Leaving ends your Pro through the team. Your own drafts stay yours.</p>
            <button
              type="button"
              onClick={() => {
                if (doomed !== "leave") return setDoomed("leave");
                void run(leave({}), `You left ${team.name}`);
              }}
              onBlur={() => setDoomed(null)}
              className={cn(btnSm.quiet, doomed === "leave" && "bg-[#d92d20] text-white hover:bg-[#b42318]")}
            >
              {doomed === "leave" ? "Leave for good?" : "Leave the team"}
            </button>
          </div>
        )}
      </section>

      <p className="px-1 text-ui text-muted">
        To work on a draft together, open it in{" "}
        <Link href="/studio" className="font-medium text-fg underline-offset-2 hover:underline">
          Studio
        </Link>
        , choose Share and turn on Everyone on {team.name}. It shows up in everyone&apos;s Library, with each other&apos;s cursors and comments on the canvas.
      </p>
    </div>
  );
}

/** Joining a team from an invite link. */
export function Invite({ token }: { token: string }) {
  const { user, loading } = useAuth();
  const invite = useRpc("teams_invitation", { token });
  const router = useRouter();
  const [joined, setJoined] = useState(false);
  const [busy, setBusy] = useState(false);

  if (joined)
    return (
      <div className={cn(CARD, "p-6 md:p-8")}>
        <CheckCircleIcon size={22} weight="fill" className="text-[#1f9d55]" />
        <h2 className="mt-3 text-heading">You&apos;re on the team</h2>
        <p className="mt-1.5 text-body text-muted">Taking you to it.</p>
      </div>
    );
  if (loading || invite === undefined) return <div className="h-[320px]" aria-busy="true" />;
  if (invite === null)
    return (
      <div className={cn(CARD, "p-6 md:p-8")}>
        <EnvelopeSimpleIcon size={22} weight="duotone" className="text-muted" />
        <h2 className="mt-3 text-heading">This invite isn&apos;t open any more</h2>
        <p className="mt-1.5 max-w-[520px] text-body text-muted">It&apos;s been used, or the team&apos;s owner cancelled it. Ask them to send you a new one.</p>
        <Link href="/team" className={cn(btn.quiet, "mt-5")}>
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
    <div className={cn(CARD, "p-6 md:p-8")}>
      <UsersThreeIcon size={22} weight="duotone" className="text-muted" />
      <h2 className="mt-3 text-heading">
        {invite.inviter} invited you to {invite.team}
      </h2>
      <p className="mt-1.5 max-w-[560px] text-body text-muted">You&apos;ll work on the team&apos;s drafts together, with each other&apos;s cursors and comments on the canvas, and have Pro while you&apos;re on the team.</p>
      {!user ? (
        <>
          <p className="mt-5 text-ui text-muted">
            The invite is for <span className="font-medium text-fg">{invite.email}</span>. Sign in or make an account with it to join.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => openAuth("sign-up", { reason: "team" })} className={btn.ink}>
              Make an account
            </button>
            <button type="button" onClick={() => openAuth("sign-in")} className={btn.quiet}>
              Sign in
            </button>
          </div>
        </>
      ) : mismatch ? (
        <>
          <p className="mt-5 max-w-[560px] text-ui text-muted">
            You&apos;re signed in as <span className="font-medium text-fg">{user.email}</span>, but the invite is for <span className="font-medium text-fg">{invite.email}</span>. Sign in with that address to join.
          </p>
          <button type="button" onClick={() => void signOut()} className={cn(btn.quiet, "mt-3")}>
            Sign out
          </button>
        </>
      ) : (
        <button type="button" onClick={() => void join()} disabled={busy} className={cn(btn.ink, "mt-6 disabled:opacity-60")}>
          Join {invite.team}
        </button>
      )}
    </div>
  );
}
