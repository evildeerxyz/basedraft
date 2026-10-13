"use client";

import { ArrowLeftIcon, ArrowSquareOutIcon, CheckCircleIcon, GitBranchIcon, GithubLogoIcon, GitPullRequestIcon, LockSimpleIcon, MagnifyingGlassIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { templateOf } from "@/site/live";
import { btnSm } from "@/site/sheet";
import { previewHeaders } from "@/site/plan";
import { Input } from "@/ui/field";
import { save, type Project } from "./state";
import { Segments } from "./ui";
import { track } from "@/site/analytics";

/*
 * Sending a project to GitHub instead of downloading it. A new repository gets the whole site,
 * ready to run; one you already have gets a pull request, so nothing lands without you seeing it.
 */

type Me = { configured: boolean; user: { login: string; avatar: string } | null };
type Repo = { name: string; private: boolean; branch: string; pushed: string };
type Sent = { url: string; repo: string; wrote: "site" | "update"; files: number; pull?: number; missed: string[] };
type Status = { kind: "idle" } | { kind: "sending" } | { kind: "sent"; sent: Sent } | { kind: "error"; message: string };

/** Where GitHub sends you back to: Studio, with this dialog open again. */
export const GITHUB_RETURN = "/studio?export=github";

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "my-site";
const REPO_NAME = /^[A-Za-z0-9._-]{1,100}$/;

function ago(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  if (s < 86400 * 30) return `${Math.round(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

async function json<T>(r: Response): Promise<T> {
  const j = (await r.json().catch(() => ({}))) as T & { error?: string };
  if (!r.ok) throw new Error(j.error ?? "Something went wrong");
  return j;
}

export function GitHubPanel({ project, onBack, back = "Files", returnTo = GITHUB_RETURN }: { project: Project; onBack: () => void; back?: string; returnTo?: string }) {
  const t = templateOf(project.template)!;
  const [me, setMe] = useState<Me | null>(null);
  const [where, setWhere] = useState<"new" | "existing">("new");
  const [name, setName] = useState(slug(project.name));
  const [priv, setPriv] = useState(true);
  const [repos, setRepos] = useState<Repo[] | null>(null);
  const [repoError, setRepoError] = useState<string | null>(null);
  const [repo, setRepo] = useState<string | null>(null);
  const [how, setHow] = useState<"pr" | "commit">("pr");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  useEffect(() => {
    fetch("/api/github/me")
      .then((r) => json<Me>(r))
      .then(setMe)
      .catch(() => setMe({ configured: false, user: null }));
  }, []);

  const signedIn = Boolean(me?.user);
  useEffect(() => {
    if (where !== "existing" || !signedIn || repos) return;
    fetch("/api/github/repos")
      .then((r) => json<{ repos: Repo[] }>(r))
      .then((j) => setRepos(j.repos))
      .catch((e: Error) => setRepoError(e.message));
  }, [where, signedIn, repos]);

  // A real link: connecting is a trip to GitHub's own page and back.
  const login = `/api/github/login?return=${encodeURIComponent(returnTo)}`;
  const disconnect = async () => {
    await fetch("/api/github/logout", { method: "POST" }).catch(() => null);
    setMe((m) => (m ? { ...m, user: null } : m));
    setRepos(null);
  };

  const picked = repos?.find((r) => r.name === repo) ?? null;
  const nameOk = REPO_NAME.test(name) && !name.startsWith(".");
  const ready = where === "new" ? nameOk : Boolean(picked);
  const go = async () => {
    setStatus({ kind: "sending" });
    try {
      const target = where === "new" ? { kind: "new", name, private: priv } : { kind: "existing", repo, direct: how === "commit" };
      const sent = await json<Sent>(await fetch("/api/github/push", { method: "POST", headers: { "Content-Type": "application/json", ...previewHeaders() }, body: JSON.stringify({ project, target }) }));
      track("sent_to_github", { template: project.template, kind: target.kind });
      setStatus({ kind: "sent", sent });
    } catch (e) {
      setStatus({ kind: "error", message: e instanceof Error ? e.message : "Something went wrong" });
    }
  };

  const head = (
    <div className="flex items-center justify-between gap-3 px-6 pt-4">
      <button type="button" onClick={onBack} className="-ml-2 inline-flex h-8 items-center gap-1.5 rounded-control px-2 text-ui text-muted transition-colors hover:bg-fg/[0.05] hover:text-fg">
        <ArrowLeftIcon size={14} weight="bold" /> {back}
      </button>
      {me?.user && (
        <div className="flex items-center gap-2 text-ui">
          {/* eslint-disable-next-line @next/next/no-img-element -- GitHub's avatar, at a size GitHub already serves */}
          <img src={`${me.user.avatar}&s=48`} alt="" className="size-6 rounded-full" />
          <span className="font-medium">{me.user.login}</span>
          <button type="button" onClick={disconnect} className="ml-1 text-meta text-muted underline-offset-2 hover:text-fg hover:underline">
            Disconnect
          </button>
        </div>
      )}
    </div>
  );

  if (!me) return <>{head}<div className="grid h-[280px] place-items-center text-ui text-muted">Checking GitHub…</div></>;

  if (!me.configured)
    return (
      <>
        {head}
        <div className="px-6 pb-6 pt-4">
          <Card icon={<GithubLogoIcon size={22} weight="fill" />} title="GitHub isn't connected on this site yet">
            {process.env.NODE_ENV === "production" ? (
              <p>Download the project for now; it&apos;s the same site, as a zip.</p>
            ) : (
              <>
                <p>
                  Make an OAuth app at <span className="font-mono text-fg">github.com/settings/developers</span> with the callback URL{" "}
                  <span className="font-mono text-fg">{typeof window === "undefined" ? "" : window.location.origin}/api/github/callback</span>, then put its keys in <span className="font-mono text-fg">.env.local</span> and restart basedraft:
                </p>
                <pre className="mt-3 rounded-[6px] bg-fg/[0.05] px-3 py-2.5 font-mono text-[12.5px] leading-relaxed text-fg">{"GITHUB_CLIENT_ID=…\nGITHUB_CLIENT_SECRET=…"}</pre>
              </>
            )}
          </Card>
        </div>
      </>
    );

  if (!me.user)
    return (
      <>
        {head}
        <div className="px-6 pb-6 pt-4">
          <Card icon={<GithubLogoIcon size={22} weight="fill" />} title="Connect GitHub">
            <p>Send this project to a new repository, or open a pull request on one you have. basedraft only writes when you press send.</p>
            {/* The project is saved as you work, a moment behind; save it now, before leaving for GitHub. */}
            <a href={login} onClick={() => save(project)} className={cn(btnSm.ink, "mt-4")}>
              <GithubLogoIcon size={15} weight="fill" /> Connect GitHub
            </a>
          </Card>
        </div>
      </>
    );

  if (status.kind === "sent") {
    const s = status.sent;
    return (
      <>
        {head}
        <div className="px-6 pb-6 pt-4">
          <Card icon={<CheckCircleIcon size={22} weight="fill" className="text-[#1f9d55]" />} title={s.files ? `Sent to ${s.repo}` : `${s.repo} already has this`}>
            <p>
              {!s.files
                ? "Your pages and text are already in it. Nothing new to send."
                : s.wrote === "site"
                  ? `The whole site: ${t.name}'s code with your pages and text written in, ${s.files} files.`
                  : `Your pages and text, written into its ${t.name} code: ${s.files} ${s.files === 1 ? "file" : "files"}.`}
              {s.pull ? " It's waiting for you as a pull request." : ""}
            </p>
            {s.missed.length > 0 && (
              <div className="mt-3 rounded-[6px] bg-fg/[0.04] px-3 py-2.5 text-meta">
                <p className="font-medium text-fg">These didn&apos;t match the code, so change them by hand:</p>
                <ul className="mt-1 list-disc pl-4">
                  {s.missed.slice(0, 6).map((m) => (
                    <li key={m}>&ldquo;{m}&rdquo;</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <a href={s.url} target="_blank" rel="noreferrer" className={btnSm.ink}>
                {s.pull ? <GitPullRequestIcon size={15} weight="bold" /> : <GithubLogoIcon size={15} weight="fill" />}
                {s.pull ? `Open pull request #${s.pull}` : "Open on GitHub"}
                <ArrowSquareOutIcon size={13} className="opacity-70" />
              </a>
              <button type="button" onClick={() => setStatus({ kind: "idle" })} className={btnSm.quiet}>
                Send again
              </button>
            </div>
          </Card>
        </div>
      </>
    );
  }

  const sending = status.kind === "sending";
  return (
    <>
      {head}
      <div className="px-6 pb-2 pt-4">
        <Segments
          full
          label="Where to send it"
          value={where}
          onChange={setWhere}
          options={[
            { value: "new", label: "New repository" },
            { value: "existing", label: "Existing repository" },
          ]}
        />
        {where === "new" ? (
          <div className="mt-4">
            <label htmlFor="gh-name" className="text-ui font-medium">
              Name
            </label>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="shrink-0 text-ui text-muted">{me.user.login} /</span>
              <Input id="gh-name" size="sm" value={name} onChange={(e) => setName(e.target.value)} invalid={!nameOk} spellCheck={false} autoComplete="off" className="min-w-0 flex-1 font-mono" />
            </div>
            <label className="mt-3 flex cursor-pointer items-center gap-2.5 text-ui">
              <input type="checkbox" checked={priv} onChange={(e) => setPriv(e.target.checked)} className="peer sr-only" />
              <span aria-hidden className="relative h-[18px] w-[30px] rounded-full bg-fg/[0.15] transition-colors peer-checked:bg-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent/40 after:absolute after:left-[2px] after:top-[2px] after:size-[14px] after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-[12px]" />
              Private
              <LockSimpleIcon size={13} className="text-muted" />
            </label>
            <p className="mt-3 text-meta text-muted">The whole site, ready to run: {t.name}&apos;s code with your {project.pages.length === 1 ? "page" : `${project.pages.length} pages`} and your text written in.</p>
          </div>
        ) : (
          <div className="mt-4">
            <RepoPicker repos={repos} error={repoError} value={repo} onChange={setRepo} />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <Segments
                label="How to send it"
                value={how}
                onChange={setHow}
                options={[
                  { value: "pr", label: "Pull request" },
                  { value: "commit", label: `Commit to ${picked?.branch ?? "main"}` },
                ]}
              />
              <p className="text-meta text-muted">{how === "pr" ? "On its own branch, for you to review and merge." : "Straight onto the branch."}</p>
            </div>
            <p className="mt-3 text-meta text-muted">A copy of {t.name} gets just your pages and text. Anything else gets the whole site.</p>
          </div>
        )}
        {status.kind === "error" && (
          <p role="alert" className="mt-3 flex items-start gap-2 rounded-[6px] bg-[#ff5a4e]/10 px-3 py-2 text-meta text-[#d93a2f] dark:text-[#ff8a80]">
            <WarningCircleIcon size={15} weight="fill" className="mt-px shrink-0" /> {status.message}
          </p>
        )}
      </div>
      <div className="mt-4 flex items-center justify-end gap-2 border-t border-line px-4 py-3">
        <button type="button" disabled={!ready || sending} onClick={go} className={cn(btnSm.ink, "min-w-[150px] justify-center disabled:opacity-40")}>
          {sending ? (
            <>
              <motion.span aria-hidden className="size-3.5 rounded-full border-2 border-current border-t-transparent" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }} />
              Sending
            </>
          ) : where === "new" ? (
            <>
              <GithubLogoIcon size={15} weight="fill" /> Create repository
            </>
          ) : how === "pr" ? (
            <>
              <GitPullRequestIcon size={15} weight="bold" /> Open pull request
            </>
          ) : (
            <>
              <GitBranchIcon size={15} weight="bold" /> Commit
            </>
          )}
        </button>
      </div>
    </>
  );
}

function Card({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[10px] bg-surface p-5 shadow-[0_0_0_1px_rgb(var(--bd-ink)/0.08)]">
      <div className="flex items-center gap-2.5">
        {icon}
        <h3 className="text-heading">{title}</h3>
      </div>
      <div className="mt-2 text-ui text-muted">{children}</div>
    </div>
  );
}

/** Your repositories, searchable, as a list you move through with the arrow keys. */
function RepoPicker({ repos, error, value, onChange }: { repos: Repo[] | null; error: string | null; value: string | null; onChange: (r: string) => void }) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const list = useRef<HTMLDivElement>(null);
  const id = useId();
  const shown = (repos ?? []).filter((r) => r.name.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 100);

  const key = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = Math.min(shown.length - 1, Math.max(0, active + (e.key === "ArrowDown" ? 1 : -1)));
      setActive(next);
      list.current?.querySelectorAll("[role=option]")[next]?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter" && shown[active]) {
      e.preventDefault();
      onChange(shown[active].name);
    }
  };

  return (
    <div className="overflow-hidden rounded-[8px] shadow-[0_0_0_1px_var(--bd-line)]">
      <div className="relative">
        <MagnifyingGlassIcon size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          role="combobox"
          aria-expanded="true"
          aria-controls={id}
          aria-activedescendant={shown[active] ? `${id}-${active}` : undefined}
          aria-label="Find a repository"
          placeholder="Find a repository"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setActive(0);
          }}
          onKeyDown={key}
          className="h-10 w-full border-b border-line bg-transparent pl-8 pr-3 text-ui outline-none placeholder:text-subtle focus-visible:bg-fg/[0.02]"
        />
      </div>
      <div ref={list} id={id} role="listbox" aria-label="Repositories" className="max-h-[208px] overflow-y-auto p-1">
        {error ? (
          <p className="px-3 py-6 text-center text-meta text-muted">{error}</p>
        ) : !repos ? (
          <p className="px-3 py-6 text-center text-meta text-muted">Loading your repositories…</p>
        ) : !shown.length ? (
          <p className="px-3 py-6 text-center text-meta text-muted">{repos.length ? "No repository matches that." : "You don't have any repositories you can push to yet."}</p>
        ) : (
          shown.map((r, i) => (
            <div
              key={r.name}
              id={`${id}-${i}`}
              role="option"
              aria-selected={r.name === value}
              onMouseEnter={() => setActive(i)}
              onClick={() => onChange(r.name)}
              className={cn("flex h-9 cursor-pointer items-center gap-2 rounded-[6px] px-2.5 text-ui", i === active && "bg-fg/[0.05]", r.name === value && "bg-accent/10 text-fg")}
            >
              <span className="min-w-0 flex-1 truncate">{r.name}</span>
              {r.private && <LockSimpleIcon size={12} className="shrink-0 text-muted" />}
              <span className="shrink-0 text-meta text-subtle">{ago(r.pushed)}</span>
              {r.name === value && <CheckCircleIcon size={14} weight="fill" className="shrink-0 text-accent" />}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
