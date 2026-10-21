"use client";

import { FilesIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react/ssr";
import Image from "next/image";
import { useState } from "react";
import type { Draft } from "@/lib/api";
import { cn } from "@/lib/utils";
import { change, useRpc } from "@/site/db";
import { Dialog, DialogClose } from "@/site/dialog";
import { BaseDraftMark } from "@/site/logo";
import { IconTile } from "@/site/plan-parts";
import { toast } from "@/site/toast";
import { sectionOf, sectionShot, templateOf, templateShot, type TemplateSlug } from "@/site/live";

/*
 * Your drafts, saved to your account: open one, start a new one, or delete one you're done with.
 * On every device you sign in on.
 */

const removeDraft = change("projects_remove", "projects_list");

/** "just now", "5m ago", "3h ago", "2d ago", then the date. */
function ago(at: number, now = Date.now()) {
  const s = Math.max(0, (now - at) / 1000);
  if (s < 45) return "just now";
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  if (s < 86400 * 7) return `${Math.round(s / 86400)}d ago`;
  return new Date(at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function DraftsDialog({ open, onClose, template, currentId, onOpen, onNewDraft }: { open: boolean; onClose: () => void; template: TemplateSlug; currentId: string | null; onOpen: (id: string) => void; onNewDraft: () => void }) {
  const drafts = useRpc("projects_list", open ? {} : "skip");
  const [doomed, setDoomed] = useState<string | null>(null);
  const t = templateOf(template)!;
  const tile = "group relative flex w-full flex-col overflow-hidden rounded-[8px] bg-surface text-left shadow-[0_0_0_1px_rgb(var(--bd-ink)/0.08)] transition-shadow hover:shadow-[0_0_0_1px_rgb(var(--bd-ink)/0.16),0_10px_24px_-14px_rgb(var(--bd-shade)/0.4)]";

  const card = (d: Draft) => {
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
            <span className="block truncate text-meta text-muted">{ago(d.updatedAt)}</span>
          </span>
        </button>
        {d.role === "owner" && !here && (
          <button
            type="button"
            onClick={() => {
              // Two clicks: the first asks, the second deletes.
              if (doomed !== d.id) return setDoomed(d.id);
              setDoomed(null);
              removeDraft({ id: d.id }).then(
                () => toast(`Deleted ${d.name}`),
                (e) => toast("Couldn't delete it", { tone: "error", detail: e instanceof Error ? e.message : "Something went wrong." }),
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

  return (
    <Dialog open={open} onClose={onClose} labelledBy="drafts-title" describedBy="drafts-body" className="max-w-[760px]">
      <DialogClose onClose={onClose} />
      <div className="px-6 pb-4 pt-6">
        <IconTile icon={FilesIcon} tone="ink" />
        <h2 id="drafts-title" className="mt-4 text-title">
          Your drafts
        </h2>
        <p id="drafts-body" className="mt-2 text-body text-muted">
          Saved to your account as you work, on every device you sign in on.
        </p>
      </div>
      <div aria-busy={drafts === undefined} className="mx-3 mb-3 max-h-[min(500px,56dvh)] min-h-[220px] overflow-y-auto rounded-[8px] bg-fg/[0.03] p-3">
        {drafts && (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {drafts.mine.map(card)}
            <li>
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
            </li>
          </ul>
        )}
      </div>
    </Dialog>
  );
}
