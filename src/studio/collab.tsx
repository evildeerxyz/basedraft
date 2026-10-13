"use client";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { ArrowUpIcon, ChatCircleIcon, CheckCircleIcon, CheckIcon, TrashIcon, XIcon } from "@phosphor-icons/react";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { toast } from "@/site/toast";
import { DEVICE_LABEL, steady, type CanvasDevice, type Spot } from "./canvas";
import type { View } from "./state";
import { Tool } from "./ui";

/*
 * Working on a project together: who else is in it and where their pointer is, and comments
 * pinned to the page. Pointers go out a few times a second while they move, and every few
 * seconds otherwise, so a quiet tab still shows as here.
 */

export const viewKey = (v: View) => (v.kind === "page" ? `page:${v.id}` : `route:${v.path}`);
export const viewOf = (key: string): View => (key.startsWith("page:") ? { kind: "page", id: key.slice(5) } : { kind: "route", path: key.slice(6) });

/** "just now", "5m", "3h", "2d", then the date. */
export function ago(at: number, now = Date.now()) {
  const s = Math.max(0, (now - at) / 1000);
  if (s < 45) return "just now";
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  if (s < 86400 * 7) return `${Math.round(s / 86400)}d ago`;
  return new Date(at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Someone's initials on a disc in their color. */
export function Face({ name, color, size = 24, className }: { name: string; color: string; size?: number; className?: string }) {
  const letters =
    name
      .split(/[\s@._-]+/)
      .filter(Boolean)
      .slice(0, size < 22 ? 1 : 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "?";
  return (
    <span aria-hidden className={cn("grid shrink-0 select-none place-items-center rounded-full font-semibold leading-none text-white", className)} style={{ width: size, height: size, fontSize: Math.round(size * 0.4), background: color }}>
      {letters}
    </span>
  );
}

/* ---------- presence ---------- */

export type Person = FunctionReturnType<typeof api.presence.list>[number];
const FRESH = 20_000;
const EVERY = 100;

export function usePresence(projectId: Id<"projects"> | null, view: string, selected: string | null) {
  const others = useQuery(api.presence.list, projectId ? { projectId } : "skip");
  const update = useMutation(api.presence.update);
  const leave = useMutation(api.presence.leave);
  const point = useRef<Spot | null>(null);
  const now = useRef({ projectId, view, selected });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sent = useRef(0);

  const flush = useCallback(() => {
    timer.current = null;
    const { projectId: id, view: v, selected: sel } = now.current;
    if (!id) return;
    sent.current = Date.now();
    const p = point.current;
    update({ projectId: id, view: v, device: p?.device, x: p?.x, y: p?.y, selected: sel ?? undefined }).catch(() => {});
  }, [update]);
  const soon = useCallback(() => {
    if (timer.current !== null) return;
    timer.current = setTimeout(flush, Math.max(0, EVERY - (Date.now() - sent.current)));
  }, [flush]);

  useEffect(() => {
    now.current = { projectId, view, selected };
    soon();
  }, [projectId, view, selected, soon]);
  useEffect(() => {
    if (!projectId) return;
    const beat = setInterval(soon, 8000);
    const bye = () => void leave({ projectId }).catch(() => {});
    window.addEventListener("pagehide", bye);
    return () => {
      clearInterval(beat);
      window.removeEventListener("pagehide", bye);
      bye();
    };
  }, [projectId, soon, leave]);

  const onPointer = useCallback(
    (s: Spot | null) => {
      point.current = s;
      soon();
    },
    [soon],
  );

  // Someone who stopped saying they're here has left, even before the server tidies up.
  const [clock, setClock] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setClock(Date.now()), 5000);
    return () => clearInterval(t);
  }, []);
  const people = (others ?? []).filter((o) => !clock || o.at > clock - FRESH);
  return { people, onPointer };
}

/** Everyone else's pointer on this page, with their name beside it. */
export function Cursors({ people, view, place }: { people: Person[]; view: string; place: (s: Spot) => { left: number; top: number } | null }) {
  return (
    <>
      {people.map((p) => {
        if (p.view !== view || !p.device || p.x === null || p.y === null) return null;
        const at = place({ device: p.device as CanvasDevice, x: p.x, y: p.y });
        if (!at) return null;
        return (
          <div key={p.userId} aria-hidden className="pointer-events-none absolute z-40 transition-[left,top] duration-100 ease-linear" style={{ left: at.left, top: at.top, ...steady("0 0") }}>
            <svg width="18" height="20" viewBox="0 0 18 20" className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]">
              <path d="M1.5 1.5l14 7.2-6.3 1.6-2.9 6.2z" fill={p.color} stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" />
            </svg>
            <span className="absolute left-4 top-4 whitespace-nowrap rounded-[6px] px-1.5 py-0.5 text-[12px] font-medium text-white shadow-[0_2px_6px_rgba(0,0,0,0.18)]" style={{ background: p.color }}>
              {p.name}
            </span>
          </div>
        );
      })}
    </>
  );
}

/* ---------- comments ---------- */

export type Comment = FunctionReturnType<typeof api.comments.list>[number];
export const spotOf = (c: Pick<Comment, "device" | "x" | "y" | "anchor">): Spot => ({ device: (c.device ?? "desktop") as CanvasDevice, x: c.x, y: c.y, anchor: c.anchor });

export function useComments(projectId: Id<"projects"> | null) {
  const list = useQuery(api.comments.list, projectId ? { projectId } : "skip");
  const create = useMutation(api.comments.create);
  const resolve = useMutation(api.comments.resolve);
  const remove = useMutation(api.comments.remove);
  const fail = (what: string) => (e: unknown) => {
    toast(`Couldn't ${what}`, { tone: "error", detail: e instanceof Error ? e.message.replace(/^.*Uncaught Error: /, "").split("\n")[0] : undefined });
    return null;
  };
  return {
    all: list ?? [],
    loaded: list !== undefined,
    create: (a: Parameters<typeof create>[0]) => create(a).catch(fail("post that comment")),
    resolve: (id: Id<"comments">, resolved: boolean) => resolve({ id, resolved }).catch(fail(resolved ? "resolve it" : "reopen it")),
    remove: (id: Id<"comments">) => remove({ id }).catch(fail("delete it")),
  };
}

/** The pin's shape: a bubble with its tail on the point, as in Figma. */
function Pin({ name, color, faded, open, onClick, label }: { name: string; color: string; faded?: boolean; open?: boolean; onClick?: () => void; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-expanded={open}
      onClick={onClick}
      className={cn("absolute bottom-0 left-0 grid size-8 place-items-center rounded-[16px_16px_16px_3px] bg-surface p-[3px] shadow-[0_2px_10px_rgba(0,0,0,0.22),0_0_0_1px_rgb(var(--bd-ink)/0.08)] transition-transform hover:scale-105", open && "scale-110 shadow-[0_0_0_2px_var(--bd-fg),0_4px_14px_rgba(0,0,0,0.25)]", faded && "opacity-60")}
    >
      <Face name={name} color={faded ? "#8c8c8c" : color} size={26} />
    </button>
  );
}

function Composer({ placeholder, onSend, onCancel, autoFocus }: { placeholder: string; onSend: (body: string) => Promise<unknown>; onCancel: () => void; autoFocus?: boolean }) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  // Focused without scrolling: the field sits on the canvas, which only its camera moves.
  const field = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (autoFocus) field.current?.focus({ preventScroll: true });
  }, [autoFocus]);
  const send = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!body.trim() || busy) return;
    setBusy(true);
    const ok = await onSend(body.trim());
    setBusy(false);
    if (ok !== null) setBody("");
  };
  const key = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    e.stopPropagation();
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };
  return (
    <form onSubmit={send} className="flex items-end gap-1.5 p-2">
      <textarea
        ref={field}
        aria-label={placeholder}
        placeholder={placeholder}
        value={body}
        rows={Math.min(5, Math.max(1, body.split("\n").length, Math.ceil(body.length / 34)))}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={key}
        className="min-h-9 min-w-0 flex-1 resize-none rounded-[8px] bg-fg/[0.04] px-2.5 py-2 text-[13px] leading-snug outline-none placeholder:text-subtle focus:ring-2 focus:ring-fg/15"
      />
      <button type="submit" disabled={!body.trim() || busy} aria-label="Post" className="grid size-9 shrink-0 place-items-center rounded-[8px] bg-fg text-canvas transition-opacity disabled:opacity-30">
        {busy ? <span aria-hidden className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <ArrowUpIcon size={15} weight="bold" />}
      </button>
    </form>
  );
}

const CARD = "absolute z-50 w-[300px] overflow-hidden rounded-[12px] bg-surface text-left shadow-[0_18px_50px_-12px_rgb(var(--bd-shade)/0.4),0_0_0_1px_rgb(var(--bd-ink)/0.08)]";

/** A pin's thread: the comment, its replies, a reply box, and resolving or deleting it. */
function Thread({ root, replies, me, isOwner, onReply, onResolve, onRemove, onClose }: { root: Comment; replies: Comment[]; me: string | null; isOwner: boolean; onReply: (body: string) => Promise<unknown>; onResolve: () => void; onRemove: (c: Comment) => void; onClose: () => void }) {
  // The newest reply in view. Only the list scrolls: scrollIntoView would also scroll the canvas
  // under the thread, which never scrolls (its camera moves it).
  const list = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const el = list.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [replies.length]);
  return (
    <div role="dialog" aria-label={`Comment by ${root.author}`} className={CARD} style={{ left: 40, top: -44 }} onPointerDown={(e) => e.stopPropagation()}>
      <div className="flex h-10 items-center gap-1 border-b border-line pl-3.5 pr-1.5 text-[13px]">
        <span className="flex-1 font-semibold">Comment</span>
        <Tool label={root.resolved ? "Reopen" : "Resolve"} onClick={onResolve}>
          {root.resolved ? <CheckCircleIcon size={16} weight="fill" className="text-[#14ae5c]" /> : <CheckIcon size={15} weight="bold" />}
        </Tool>
        <Tool label="Close" keys="Esc" onClick={onClose}>
          <XIcon size={13} weight="bold" />
        </Tool>
      </div>
      <ol ref={list} className="max-h-[280px] overflow-y-auto py-1">
        {[root, ...replies].map((c, i) => (
          <li key={c.id} className="group flex gap-2.5 px-3.5 py-2.5">
            <Face name={c.author} color={c.color} size={24} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2 text-[12.5px]">
                <span className="truncate font-semibold">{c.author}</span>
                <span className="shrink-0 text-subtle">{ago(c.at)}</span>
                {(c.authorId === me || isOwner) && (
                  <button type="button" onClick={() => onRemove(c)} aria-label={i === 0 ? "Delete the thread" : "Delete this reply"} className="ml-auto grid size-6 shrink-0 place-items-center rounded-[6px] text-muted opacity-0 transition-opacity hover:bg-[#d92d20]/10 hover:text-[#d92d20] focus-visible:opacity-100 group-hover:opacity-100">
                    <TrashIcon size={13} />
                  </button>
                )}
              </div>
              <p className="mt-0.5 whitespace-pre-wrap break-words text-[13px] leading-snug">{c.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="border-t border-line">
        <Composer placeholder="Reply" onSend={onReply} onCancel={onClose} autoFocus />
      </div>
    </div>
  );
}

/** The pins on this page, the one open with its thread, and a new one being written. */
export function CommentLayer({
  comments,
  view,
  place,
  open,
  draft,
  me,
  myName,
  myColor,
  isOwner,
  showResolved,
  onOpen,
  onPost,
  onReply,
  onResolve,
  onRemove,
  onCancel,
}: {
  comments: Comment[];
  view: string;
  place: (s: Spot) => { left: number; top: number } | null;
  open: Id<"comments"> | null;
  draft: Spot | null;
  me: string | null;
  myName: string;
  myColor: string;
  isOwner: boolean;
  showResolved: boolean;
  onOpen: (id: Id<"comments"> | null) => void;
  onPost: (body: string) => Promise<unknown>;
  onReply: (root: Comment, body: string) => Promise<unknown>;
  onResolve: (root: Comment) => void;
  onRemove: (c: Comment) => void;
  onCancel: () => void;
}) {
  const roots = comments.filter((c) => !c.parentId && c.view === view && (showResolved || !c.resolved || c.id === open));
  const at = draft ? place(draft) : null;
  return (
    <>
      {roots.map((c) => {
        const p = place(spotOf(c));
        if (!p) return null;
        const on = open === c.id;
        const replies = comments.filter((r) => r.parentId === c.id).sort((a, b) => a.at - b.at);
        return (
          <div key={c.id} className={cn("absolute", on ? "z-50" : "z-30")} style={{ left: p.left, top: p.top, ...steady("0 0") }}>
            <Pin name={c.author} color={c.color} faded={c.resolved} open={on} onClick={() => onOpen(on ? null : c.id)} label={`Comment by ${c.author}${replies.length ? `, ${replies.length} ${replies.length === 1 ? "reply" : "replies"}` : ""}`} />
            {on && <Thread root={c} replies={replies} me={me} isOwner={isOwner} onReply={(b) => onReply(c, b)} onResolve={() => onResolve(c)} onRemove={onRemove} onClose={() => onOpen(null)} />}
          </div>
        );
      })}
      {draft && at && (
        <div className="absolute z-50" style={{ left: at.left, top: at.top, ...steady("0 0") }}>
          <Pin name={myName} color={myColor} label="Your new comment" open />
          <div role="dialog" aria-label="New comment" className={CARD} style={{ left: 40, top: -44 }} onPointerDown={(e) => e.stopPropagation()}>
            <Composer placeholder="Add a comment" onSend={onPost} onCancel={onCancel} autoFocus />
          </div>
        </div>
      )}
    </>
  );
}

/** Every thread in the project, in the inspector while commenting: click one to go to it. */
export function CommentsPanel({ comments, loaded, labelOf, open, showResolved, onShowResolved, onGo, onClose, signedIn }: { comments: Comment[]; loaded: boolean; labelOf: (view: string) => string; open: Id<"comments"> | null; showResolved: boolean; onShowResolved: (v: boolean) => void; onGo: (c: Comment) => void; onClose: () => void; signedIn: boolean }) {
  const roots = comments.filter((c) => !c.parentId && (showResolved || !c.resolved)).sort((a, b) => b.at - a.at);
  const resolved = comments.filter((c) => !c.parentId && c.resolved).length;
  return (
    <>
      <div className="flex h-10 shrink-0 items-center gap-2 border-t border-line pl-4 pr-2 text-[13px]">
        <ChatCircleIcon size={15} weight="duotone" className="text-muted" />
        <span className="flex-1 font-semibold">Comments</span>
        {resolved > 0 && (
          <button type="button" aria-pressed={showResolved} onClick={() => onShowResolved(!showResolved)} className={cn("h-7 rounded-[8px] px-2 text-[12px] font-medium transition-colors", showResolved ? "bg-fg/[0.07] text-fg" : "text-muted hover:bg-fg/[0.05] hover:text-fg")}>
            {resolved} resolved
          </button>
        )}
        <Tool label="Stop commenting" keys="C" onClick={onClose}>
          <XIcon size={13} weight="bold" />
        </Tool>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto border-t border-line">
        {!signedIn ? (
          <p className="px-4 py-6 text-[13px] leading-snug text-muted">Sign in to see this project&apos;s comments and add your own.</p>
        ) : !loaded ? null : roots.length === 0 ? (
          <p className="px-4 py-6 text-[13px] leading-snug text-muted">No comments yet. Click anywhere on the page to leave one; everyone the project is shared with sees it.</p>
        ) : (
          <ul className="py-1">
            {roots.map((c) => {
              const replies = comments.filter((r) => r.parentId === c.id).length;
              return (
                <li key={c.id}>
                  <button type="button" onClick={() => onGo(c)} className={cn("flex w-full gap-2.5 px-4 py-3 text-left transition-colors hover:bg-fg/[0.03]", open === c.id && "bg-fg/[0.05]", c.resolved && "opacity-60")}>
                    <Face name={c.author} color={c.resolved ? "#8c8c8c" : c.color} size={24} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline gap-2 text-[12.5px]">
                        <span className="truncate font-semibold">{c.author}</span>
                        <span className="shrink-0 text-subtle">{ago(c.at)}</span>
                      </span>
                      <span className="mt-0.5 line-clamp-2 block break-words text-[13px] leading-snug">{c.body}</span>
                      <span className="mt-1 block truncate text-[12px] text-subtle">
                        {labelOf(c.view)}, {DEVICE_LABEL[(c.device ?? "desktop") as CanvasDevice]}
                        {replies > 0 && `, ${replies} ${replies === 1 ? "reply" : "replies"}`}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
