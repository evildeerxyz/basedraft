"use client";

import { BookmarkSimpleIcon, BooksIcon, ClockCounterClockwiseIcon, GlobeHemisphereWestIcon, LinkSimpleIcon, LockSimpleIcon, PlusIcon, TrashIcon, UsersThreeIcon, XIcon } from "@phosphor-icons/react/ssr";
import { LayoutGroup, motion } from "motion/react";
import Image from "next/image";
import { useState, type FormEvent, type ReactNode } from "react";
import type { Draft, Role } from "@/lib/api";
import { Input } from "@/ui/field";
import { Select } from "@/ui/select";
import { cn } from "@/lib/utils";
import { Avatar, displayName, type User } from "@/site/auth";
import { change, refresh, useRpc } from "@/site/db";
import { Dialog, DialogClose } from "@/site/dialog";
import { BaseDraftMark } from "@/site/logo";
import { IconTile } from "@/site/plan-parts";
import { btn } from "@/site/sheet";
import { toast } from "@/site/toast";
import { isFree, sectionOf, sectionShot, templateOf, templateShot, type TemplateSlug } from "@/site/live";
import { useProjectChannel } from "./channel";
import { ago } from "./collab";
import { idOf, type Page, type Project } from "./state";
import { Tool } from "./ui";
import { track } from "@/site/analytics";

/*
 * What an account adds to Studio, all saved to it: sharing a project with people, your team or
 * anyone with its link; a Library of your drafts, your team's and ones shared with you, and the
 * sections you've saved; and version history, this session's every step plus the versions kept
 * in your account.
 */

const why = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong.");

const setRole = change("projects_set_role", "projects_people");
const unshare = change("projects_unshare", "projects_people");
const setLink = change("projects_set_link", "projects_people");
const setTeam = change("projects_set_team", "projects_people");
const removeDraft = change("projects_remove", "projects_list");
const unsave = change("saved_remove", "saved_list");
const keep = change("versions_save", "versions_list");

/** Shares a project through the site, which emails them a link to it. */
async function share(body: { id: string; email: string; role: Role }) {
  const r = await fetch("/api/share", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(((await r.json().catch(() => ({}))) as { error?: string }).error ?? "That didn't go through. Try again.");
  refresh("projects_people");
}

/* ---------- share ---------- */

const ROLES = [
  { value: "edit", label: "Can edit" },
  { value: "view", label: "Can view" },
];
const ACCESS = [
  { value: "none", label: "Only people invited" },
  { value: "view", label: "Anyone with the link can view" },
];

export function ShareDialog({ open, onClose, name, user, projectId }: { open: boolean; onClose: () => void; name: string; user: User | null; projectId: string | null }) {
  const people = useRpc("projects_people", open && projectId ? { id: projectId } : "skip");
  // Who has it can change in another tab, or by its owner while you look.
  useProjectChannel(open ? projectId : null, (event) => {
    if (event === "access" || event === "project") refresh("projects_people");
  });
  const [email, setEmail] = useState("");
  const [role, setNewRole] = useState("edit");
  const [problem, setProblem] = useState("");
  const [busy, setBusy] = useState(false);
  const manage = Boolean(people?.canManage);
  const url = projectId ? `${typeof window === "undefined" ? "" : window.location.origin}/studio?p=${projectId}` : "";

  const send = async (e: FormEvent) => {
    e.preventDefault();
    const em = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return setProblem("Enter an email address to invite.");
    if (!projectId) return;
    setProblem("");
    setBusy(true);
    try {
      await share({ id: projectId, email: em, role: role as Role });
      track("project_shared", { role });
      setEmail("");
      toast(`Shared with ${em}`, { detail: `We emailed them a link. They ${role === "edit" ? "can edit" : "can view"} ${name}.` });
    } catch (err) {
      setProblem(why(err));
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast("Link copied", { detail: people?.linkAccess === "view" ? "Anyone with it can view this project." : "Only people with access can open it." });
    } catch {
      toast("Couldn't copy the link", { tone: "error", detail: url });
    }
  };
  const run = (p: Promise<unknown>) => p.catch((err) => toast("Couldn't change that", { tone: "error", detail: why(err) }));

  return (
    <Dialog open={open} onClose={onClose} labelledBy="share-title" describedBy="share-body" className="max-w-[500px]">
      <DialogClose onClose={onClose} />
      <div className="px-6 pb-5 pt-6">
        <IconTile icon={UsersThreeIcon} tone="ink" />
        <h2 id="share-title" className="mt-4 truncate pr-8 text-title">
          Share {name}
        </h2>
        <p id="share-body" className="mt-2 text-body text-muted">
          {manage ? "People you invite open it in Studio and work on it with you: their cursors, comments and edits show up live." : "Only its owner can change who has access."}
        </p>
      </div>

      {manage && (
        <form onSubmit={send} noValidate className="px-6">
          <div className="flex gap-2">
            <Input
              aria-label="Email to invite"
              placeholder="Add people by email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setProblem("");
              }}
              invalid={!!problem}
              id="share-email"
              size="base"
              className="min-w-0 flex-1"
            />
            <span id="share-role-label" className="sr-only">
              Their access
            </span>
            <Select id="share-role" size="sm" value={role} onChange={setNewRole} options={ROLES} className="w-[120px] shrink-0 [&>button]:h-9 [&>button]:px-3 [&>button]:text-[14px]" />
          </div>
          {problem && (
            <p id="share-email-error" role="alert" className="mt-1.5 text-meta text-[#d92d20]">
              {problem}
            </p>
          )}
          <button type="submit" disabled={busy} className={cn(btn.ink, "mt-2 w-full disabled:opacity-60")}>
            {busy ? "Inviting" : "Invite"}
          </button>
        </form>
      )}

      <ul className="mx-3 mt-4 space-y-0.5 rounded-[8px] bg-fg/[0.03] p-1.5" aria-label="People with access" aria-busy={people === undefined}>
        {people && (
          <li className="flex items-center gap-3 rounded-[6px] px-3 py-2">
            <Avatar name={people.owner.name || people.owner.email} size={32} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-ui font-medium">
                {people.owner.name || people.owner.email}
                {people.owner.email === user?.email && " (you)"}
              </span>
              <span className="block truncate text-meta text-muted">{people.owner.email}</span>
            </span>
            <span className="text-meta text-muted">Owner</span>
          </li>
        )}
        {people?.team && (
          <li className="flex items-center gap-3 rounded-[6px] px-3 py-2">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-fg/[0.08]">
              <UsersThreeIcon size={16} weight="duotone" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-ui font-medium">Everyone on {people.team.name}</span>
              <span className="block truncate text-meta text-muted">{people.team.shared ? "Can edit, in their Library" : "Not shared with the team"}</span>
            </span>
            {manage ? (
              <button type="button" role="switch" aria-checked={people.team.shared} aria-label={`Share with ${people.team.name}`} onClick={() => projectId && void run(setTeam({ id: projectId, shared: !people.team!.shared }))} className={cn("relative h-5 w-9 shrink-0 rounded-full transition-colors", people.team.shared ? "bg-fg" : "bg-fg/20")}>
                <span className={cn("absolute top-0.5 size-4 rounded-full bg-canvas shadow transition-[left]", people.team.shared ? "left-[18px]" : "left-0.5")} />
              </button>
            ) : (
              <span className="text-meta text-muted">{people.team.shared ? "Can edit" : ""}</span>
            )}
          </li>
        )}
        {people?.people.map((p) => (
          <li key={p.id} className="flex items-center gap-3 rounded-[6px] px-3 py-2">
            <Avatar name={p.email} size={32} tone="gray" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-ui font-medium">{p.email}</span>
              <span className="block truncate text-meta text-muted">Invited</span>
            </span>
            {manage ? (
              <>
                <Select id={`role-${p.id}`} size="sm" value={p.role} onChange={(r) => void run(setRole({ member_id: p.id, role: r as Role }))} options={ROLES} className="w-[110px] shrink-0 [&>button]:h-8 [&>button]:border-transparent [&>button]:bg-transparent [&>button]:px-2" />
                <Tool label={`Remove ${p.email}`} onClick={() => void run(unshare({ member_id: p.id }))}>
                  <XIcon size={13} weight="bold" />
                </Tool>
              </>
            ) : (
              <span className="text-meta text-muted">{p.role === "edit" ? "Can edit" : "Can view"}</span>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-5 flex items-center gap-3 border-t border-line px-6 py-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-[7px] bg-fg/[0.05]">
          {people?.linkAccess === "view" ? <GlobeHemisphereWestIcon size={17} weight="duotone" /> : <LockSimpleIcon size={17} weight="duotone" />}
        </span>
        <span id="share-access-label" className="sr-only">
          Who can open the link
        </span>
        {manage ? (
          <Select id="share-access" size="sm" value={people?.linkAccess ?? "none"} onChange={(v) => projectId && void run(setLink({ id: projectId, access: v as "none" | "view" }))} options={ACCESS} className="min-w-0 flex-1 [&>button]:h-9 [&>button]:border-transparent [&>button]:bg-transparent [&>button]:px-2 [&>button]:font-medium" />
        ) : (
          <span className="min-w-0 flex-1 truncate px-2 text-ui font-medium">{ACCESS.find((a) => a.value === people?.linkAccess)?.label}</span>
        )}
        <button type="button" onClick={copy} disabled={!url} className={cn(btn.quiet, "shrink-0")}>
          <LinkSimpleIcon size={15} weight="bold" /> Copy link
        </button>
      </div>
    </Dialog>
  );
}

/* ---------- library ---------- */

export type LibraryTab = "drafts" | "saved";
const TABS: Array<{ id: LibraryTab; label: string }> = [
  { id: "drafts", label: "Drafts" },
  { id: "saved", label: "Saved sections" },
];


export function LibraryDialog({ tab, onTab, onClose, page, currentId, pro, onOpen, onNewDraft, onInsert }: { tab: LibraryTab | null; onTab: (t: LibraryTab) => void; onClose: () => void; page: Page; currentId: string | null; pro: boolean; onOpen: (id: string) => void; onNewDraft: () => void; onInsert: (id: string) => void }) {
  // Holds the tab while the dialog animates out.
  const [last, setLast] = useState<LibraryTab>("drafts");
  if (tab && tab !== last) setLast(tab);
  const shown = tab ?? last;
  const drafts = useRpc("projects_list", tab ? {} : "skip");
  const saved = useRpc("saved_list", tab ? {} : "skip");
  const [doomed, setDoomed] = useState<string | null>(null);
  const t = templateOf(page.template)!;
  const tile = "group relative flex w-full flex-col overflow-hidden rounded-[8px] bg-surface text-left shadow-[0_0_0_1px_rgb(var(--bd-ink)/0.08)] transition-shadow hover:shadow-[0_0_0_1px_rgb(var(--bd-ink)/0.16),0_10px_24px_-14px_rgb(var(--bd-shade)/0.4)]";
  const mine = (saved ?? []).filter((x) => x.template === page.template && sectionOf(page.template, x.sectionId));

  const card = (d: Draft, who?: string) => {
    const lead = d.lead ? sectionOf(d.template as TemplateSlug, d.lead) : undefined;
    const here = d.id === currentId;
    return (
      <li key={d.id} className="relative">
        <button type="button" onClick={() => (here ? onClose() : onOpen(d.id))} className={tile}>
          <span className="relative block aspect-[16/10] bg-surface-2">
            {lead ? <Image src={sectionShot(lead)} alt="" fill sizes="240px" className="object-cover object-top" /> : templateOf(d.template) ? <Image src={templateShot(d.template as TemplateSlug)} alt="" fill sizes="240px" className="object-cover object-top" /> : <span className="grid h-full place-items-center"><BaseDraftMark size={28} /></span>}
            {here && <span className="absolute left-2 top-2 rounded-[5px] bg-fg px-1.5 py-0.5 text-[11.5px] font-semibold text-canvas">Open now</span>}
          </span>
          <span className="block px-3 py-2.5">
            <span className="block truncate text-ui font-medium">{d.name}</span>
            <span className="block truncate text-meta text-muted">
              {who ? `${who}, ` : ""}
              {ago(d.updatedAt)}
            </span>
          </span>
        </button>
        {d.role === "owner" && !here && (
          <button
            type="button"
            onClick={() => {
              if (doomed !== d.id) return setDoomed(d.id);
              setDoomed(null);
              removeDraft({ id: d.id }).then(
                () => toast(`Deleted ${d.name}`),
                (e) => toast("Couldn't delete it", { tone: "error", detail: why(e) }),
              );
            }}
            onBlur={() => setDoomed((x) => (x === d.id ? null : x))}
            aria-label={doomed === d.id ? `Delete ${d.name} for good` : `Delete ${d.name}`}
            className={cn("absolute right-2 top-2 flex h-7 items-center gap-1 rounded-[6px] px-1.5 text-[12px] font-semibold opacity-0 shadow-[0_0_0_1px_rgb(var(--bd-ink)/0.08)] transition-opacity focus-visible:opacity-100 group-hover:opacity-100 [li:hover_&]:opacity-100", doomed === d.id ? "bg-[#d92d20] text-white opacity-100" : "bg-surface text-muted hover:text-[#d92d20]")}
          >
            <TrashIcon size={13} weight="bold" />
            {doomed === d.id && "Delete?"}
          </button>
        )}
      </li>
    );
  };
  const group = (title: string, items: Draft[], extra?: ReactNode, who?: (d: Draft) => string) =>
    (items.length > 0 || extra) && (
      <section key={title} className="mb-4 last:mb-0">
        <h3 className="mb-2 px-1 text-[12.5px] font-medium text-muted">{title}</h3>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((d) => card(d, who?.(d)))}
          {extra}
        </ul>
      </section>
    );

  return (
    <Dialog open={tab !== null} onClose={onClose} labelledBy="library-title" describedBy="library-body" className="max-w-[760px]">
      <DialogClose onClose={onClose} />
      <div className="px-6 pb-4 pt-6">
        <IconTile icon={BooksIcon} tone="ink" />
        <h2 id="library-title" className="mt-4 text-title">
          Library
        </h2>
        <p id="library-body" className="mt-2 text-body text-muted">
          Your drafts, your team&apos;s, the ones shared with you, and the sections you&apos;ve saved. On every device you sign in on.
        </p>
      </div>

      <LayoutGroup id="library-tabs">
        <div role="tablist" aria-label="Library" className="mx-6 inline-flex rounded-[7px] bg-fg/[0.05] p-1">
          {TABS.map((x) => {
            const on = shown === x.id;
            return (
              <button
                key={x.id}
                type="button"
                role="tab"
                id={`library-tab-${x.id}`}
                aria-selected={on}
                aria-controls="library-panel"
                tabIndex={on ? 0 : -1}
                onClick={() => onTab(x.id)}
                onKeyDown={(e) => {
                  if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
                  e.preventDefault();
                  const i = TABS.findIndex((y) => y.id === shown);
                  const n = TABS[(i + (e.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length];
                  onTab(n.id);
                  document.getElementById(`library-tab-${n.id}`)?.focus();
                }}
                className={cn("relative h-8 rounded-[5px] px-3 text-[13.5px] font-medium transition-colors", on ? "text-fg" : "text-muted hover:text-fg")}
              >
                {on && <motion.span layoutId="library-tab" className="absolute inset-0 rounded-[5px] bg-raised shadow-[0_1px_2px_rgb(var(--bd-shade)/0.12)]" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
                <span className="relative">{x.label}</span>
              </button>
            );
          })}
        </div>
      </LayoutGroup>

      <div id="library-panel" role="tabpanel" aria-labelledby={`library-tab-${shown}`} aria-busy={drafts === undefined} className="mx-3 mb-3 mt-4 max-h-[min(500px,56dvh)] min-h-[220px] overflow-y-auto rounded-[8px] bg-fg/[0.03] p-3">
        {shown === "drafts" &&
          drafts && (
            <>
              {group(
                "Yours",
                drafts.mine,
                <li key="new">
                  {/* Built like a draft card (preview, then two lines) so it's always the same height as one. */}
                  <button type="button" onClick={onNewDraft} className="group relative flex w-full flex-col rounded-[8px] text-left transition-colors hover:bg-surface">
                    {/* A CSS dashed border can't set its gap, so the outline is drawn: 6px dashes, 5px gaps. */}
                    <svg aria-hidden className="pointer-events-none absolute inset-[0.75px] size-[calc(100%-1.5px)] overflow-visible">
                      <rect width="100%" height="100%" rx="7.25" fill="none" strokeWidth="1.5" strokeDasharray="6 5" className="stroke-fg/25 transition-[stroke] group-hover:stroke-fg/45" />
                    </svg>
                    <span className="grid aspect-[16/10] w-full place-items-center">
                      <span className="grid size-10 place-items-center rounded-full bg-fg/[0.05] text-muted transition-colors group-hover:bg-fg/[0.08] group-hover:text-fg">
                        <PlusIcon size={18} weight="bold" />
                      </span>
                    </span>
                    <span className="block px-3 py-2.5">
                      <span className="block truncate text-ui font-medium">New draft</span>
                      <span className="block truncate text-meta text-muted">{t.name}&apos;s home page, to start again</span>
                    </span>
                  </button>
                </li>,
              )}
              {group(drafts.teamName ?? "Your team", drafts.team, undefined, (d) => d.owner)}
              {group("Shared with you", drafts.shared, undefined, (d) => d.owner)}
            </>
          )}

        {shown === "saved" &&
          saved &&
          (mine.length === 0 ? (
            <div className="grid min-h-[200px] place-items-center px-6 text-center">
              <div className="max-w-[380px]">
                <BookmarkSimpleIcon size={22} weight="duotone" className="mx-auto text-muted" />
                <p className="mt-3 text-ui font-medium">No {t.name} sections saved yet</p>
                <p className="mt-1 text-ui text-muted">Select a section on the canvas, open More in its toolbar and choose Save to Library. It&apos;s then here for any {t.name} page.</p>
              </div>
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {mine.map((x) => {
                const sec = sectionOf(page.template, x.sectionId)!;
                const locked = !pro && !isFree(sec);
                return (
                  <li key={x.id} className="relative">
                    <button type="button" onClick={() => onInsert(x.sectionId)} className={tile}>
                      <span className="relative block aspect-[16/10] bg-surface-2">
                        <Image src={sectionShot(sec)} alt="" fill sizes="240px" className="object-cover object-top" />
                        {locked && (
                          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-[5px] bg-surface px-1.5 py-0.5 text-[11.5px] font-semibold shadow-[0_0_0_1px_rgb(var(--bd-ink)/0.08)]">
                            <LockSimpleIcon size={11} weight="bold" /> Pro
                          </span>
                        )}
                      </span>
                      <span className="block px-3 py-2.5">
                        <span className="block truncate text-ui font-medium">
                          {t.name} {sec.name.toLowerCase()}
                        </span>
                        <span className="block text-meta text-muted">Saved {ago(x.at)}</span>
                      </span>
                    </button>
                    <button type="button" onClick={() => void unsave({ id: x.id })} aria-label={`Remove ${sec.name} from your Library`} className="absolute right-2 top-2 grid size-7 place-items-center rounded-[6px] bg-surface text-muted opacity-0 shadow-[0_0_0_1px_rgb(var(--bd-ink)/0.08)] transition-opacity hover:text-fg focus-visible:opacity-100 [li:hover_&]:opacity-100">
                      <XIcon size={12} weight="bold" />
                    </button>
                  </li>
                );
              })}
            </ul>
          ))}
      </div>
    </Dialog>
  );
}

/* ---------- version history ---------- */

/** One line on what changed between two versions of a page. */
export function describeChange(a: Page, b: Page): string {
  const name = (p: Page, k: string) => sectionOf(p.template, idOf(k))?.name ?? "a section";
  if (a.template !== b.template) return `Started from ${templateOf(b.template)?.name ?? "a template"}`;
  if (!b.keys.some((k) => a.keys.includes(k)) && b.keys.length && a.keys.length) return `Started over with ${b.name}`;
  if (a.name !== b.name) return `Renamed the page ${b.name}`.trim();
  if (b.keys.length > a.keys.length) {
    const added = b.keys.find((k) => !a.keys.includes(k));
    return added ? `Added ${name(b, added)}` : "Added a section";
  }
  if (b.keys.length < a.keys.length) {
    const gone = a.keys.find((k) => !b.keys.includes(k));
    return gone ? `Removed ${name(a, gone)}` : "Removed a section";
  }
  const i = b.keys.findIndex((k, j) => k !== a.keys[j]);
  if (i >= 0 && !a.keys.includes(b.keys[i])) return `Swapped ${name(a, a.keys[i])} for ${name(b, b.keys[i])}`;
  if (i >= 0) return "Reordered sections";
  return "Edited the page";
}

/** One line on what changed between two versions of a project: its pages, its text, or a page's sections. */
export function describeProject(a: Project, b: Project): string {
  if (a.template !== b.template) return `Started from ${templateOf(b.template)?.name ?? "a template"}`;
  if (b.pages.length > a.pages.length) return `Added the page ${b.pages.find((p) => !a.pages.some((q) => q.id === p.id))?.name ?? ""}`.trim();
  if (b.pages.length < a.pages.length) return `Deleted the page ${a.pages.find((p) => !b.pages.some((q) => q.id === p.id))?.name ?? ""}`.trim();
  if (a.name !== b.name) return `Renamed the project ${b.name}`;
  if (JSON.stringify(a.theme ?? {}) !== JSON.stringify(b.theme ?? {})) return b.theme ? "Changed the colors" : "Went back to the template's colors";
  if (a.edits !== b.edits) {
    const e = b.edits.find((x) => !a.edits.some((y) => y.scope === x.scope && y.from === x.from && y.nth === x.nth && y.to === x.to));
    return e ? `Changed "${e.from.length > 24 ? `${e.from.slice(0, 22)}…` : e.from}"` : "Reset some text";
  }
  for (const p of b.pages) {
    const before = a.pages.find((q) => q.id === p.id);
    if (!before) continue;
    if (before.name !== p.name) return `Renamed a page ${p.name}`;
    if (before.keys !== p.keys) return describeChange(before, p);
  }
  return "Edited the project";
}

function Row({ title, sub, current, named, who, onRestore }: { title: string; sub: string; current?: boolean; named?: boolean; who?: string; onRestore?: () => void }) {
  return (
    <li className="group relative flex gap-3 py-2 pl-4 pr-2">
      {/*
        The timeline. Each row draws its piece of the rail across its full height, padding
        included, so the pieces meet; the first starts at its dot and the last stops at its dot
        (18px down: 8px of padding, 5px to the dot, half its 10px). One version, no rail.
      */}
      <span aria-hidden className="absolute bottom-0 left-[21.5px] top-0 w-px bg-fg/15 group-first:top-[18px] group-last:bottom-auto group-last:h-[18px] group-only:hidden" />
      <span aria-hidden className="flex w-3 shrink-0 justify-center">
        <span className={cn("relative mt-[5px] size-2.5 rounded-full", current ? "bg-fg" : "bg-surface shadow-[inset_0_0_0_1.5px_rgb(var(--bd-ink)/0.35)]")} />
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn("block truncate text-[13px]", current || named ? "font-semibold" : "font-medium")}>{title}</span>
        <span className="flex items-center gap-1.5 text-[12px] text-muted">
          {who && <Avatar name={who} size={16} />}
          {sub}
        </span>
      </span>
      {onRestore && (
        <button type="button" onClick={onRestore} className="h-7 shrink-0 self-center rounded-[8px] px-2 text-[12px] font-medium text-muted opacity-0 transition-[opacity,background-color] hover:bg-fg/[0.06] hover:text-fg focus-visible:opacity-100 group-hover:opacity-100">
          Restore
        </button>
      )}
    </li>
  );
}

/**
 * Version history, in the inspector as in Figma: this session's every step, each restorable, and
 * the versions kept in your account (ones you name, and one saved automatically every ten minutes
 * of editing).
 */
export function HistoryPanel<T>({ past, current, describe, user, projectId, canSave, onRestore, onRestoreSaved, onClose }: { past: T[]; current: T; describe: (a: T, b: T) => string; user: User; projectId: string | null; canSave: boolean; onRestore: (v: T) => void; onRestoreSaved: (id: string) => void; onClose: () => void }) {
  const saved = useRpc("versions_list", projectId ? { project_id: projectId } : "skip");
  // Versions kept by anyone, and the automatic ones saving keeps.
  useProjectChannel(projectId, (event) => {
    if (event === "versions" || event === "joined") refresh("versions_list");
  });
  const [naming, setNaming] = useState<string | null>(null);
  const versions = [...past, current];
  const n = versions.length - 1;
  const me = displayName(user);
  const rows = [];
  for (let k = n - 1; k >= Math.max(0, n - 40); k--) {
    const v = versions[k];
    rows.push(<Row key={k} title={k === 0 ? "When you opened Studio" : describe(versions[k - 1], v)} sub={k === 0 ? "Where this session started" : me} who={k === 0 ? undefined : me} onRestore={() => onRestore(v)} />);
  }
  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!projectId || naming === null) return;
    try {
      await keep({ project_id: projectId, name: naming.trim() || "Saved version" });
      toast("Version saved", { detail: "It's in your account, ready to go back to." });
      setNaming(null);
    } catch (err) {
      toast("Couldn't save the version", { tone: "error", detail: why(err) });
    }
  };
  return (
    <>
      <div className="flex h-10 shrink-0 items-center gap-2 border-t border-line pl-4 pr-2 text-[13px]">
        <ClockCounterClockwiseIcon size={15} weight="duotone" className="text-muted" />
        <span className="flex-1 font-semibold">Version history</span>
        <Tool label="Close version history" onClick={onClose}>
          <XIcon size={13} weight="bold" />
        </Tool>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden border-t border-line pb-4">
        <h3 className="px-4 pb-1 pt-3 text-[12px] font-medium text-subtle">
          This session{n > 0 && `, ${n} ${n === 1 ? "edit" : "edits"}`}
        </h3>
        <ol>
          {/* The latest edit is what made the current version, so it's named here. */}
          <Row title="Current version" sub={n ? describe(versions[n - 1], current) : "No edits yet"} who={me} current />
          {rows}
        </ol>
        <div className="mt-2 flex items-center justify-between gap-2 border-t border-line pl-4 pr-2 pt-2">
          <h3 className="text-[12px] font-medium text-subtle">Saved to your account</h3>
          {canSave && naming === null && (
            <button type="button" onClick={() => setNaming("")} className="h-7 rounded-[6px] px-2 text-[12px] font-medium text-muted transition-colors hover:bg-fg/[0.06] hover:text-fg">
              Save version
            </button>
          )}
        </div>
        {naming !== null && (
          <form onSubmit={save} className="flex gap-1.5 px-3 pb-1 pt-2">
            <input
              autoFocus
              aria-label="Version name"
              placeholder="Name it, like Ready for review"
              value={naming}
              maxLength={80}
              onChange={(e) => setNaming(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === "Escape") setNaming(null);
              }}
              className="h-8 min-w-0 flex-1 rounded-[6px] bg-fg/[0.05] px-2.5 text-[13px] outline-none placeholder:text-subtle focus:ring-2 focus:ring-fg/15"
            />
            <button type="submit" className="h-8 shrink-0 rounded-[6px] bg-fg px-2.5 text-[12.5px] font-semibold text-canvas">
              Save
            </button>
          </form>
        )}
        {saved === undefined ? null : saved.length === 0 ? (
          <p className="px-4 py-2 text-[12.5px] leading-snug text-muted">Nothing saved yet. Every ten minutes of editing keeps a version here on its own, and you can name one any time.</p>
        ) : (
          <ol>
            {saved.map((v) => (
              <Row key={v.id} title={v.name ?? "Autosave"} sub={`${ago(v.at)}, ${v.author}`} named={Boolean(v.name)} who={v.author} onRestore={canSave ? () => onRestoreSaved(v.id) : undefined} />
            ))}
          </ol>
        )}
      </div>
    </>
  );
}
