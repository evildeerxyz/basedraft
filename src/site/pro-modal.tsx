"use client";

import { EyeIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useRef, useState, useSyncExternalStore } from "react";
import { PRO_FEATURES, type FeatureIcon } from "./content";
import { SECTIONS, TEMPLATES } from "./live";
import { Dialog, DialogClose } from "./dialog";
import { ICON } from "./icons";
import { CARD_NOTE, FeatureList, IconTile, NOTE_ICON, NoteIcon, PriceFoot } from "./plan-parts";
import { PREVIEW_AVAILABLE, setPreview, usePlan } from "./plan";
import { openAuth } from "./auth";
import { btn } from "./sheet";
import { toast } from "./toast";

/*
 * Pro, right where you hit it. Anything Pro-only opens this instead of sending people off to
 * another page mid-task: it names what they reached for, shows what else comes with it, and
 * gets them back to work in one click either way.
 */

export type ProReason = "figma" | "paper" | "svg" | "react" | "layout" | "plan";

let reason: ProReason | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** Opens the Pro modal from anywhere, saying which feature brought you here. */
export function openPro(r: ProReason = "plan") {
  reason = r;
  emit();
}
const closePro = () => {
  reason = null;
  emit();
};

const COPY: Record<ProReason, { title: string; body: string }> = {
  figma: { title: "Copy for Figma is in Pro", body: "Paste any section or page into Figma with real auto layout, and desktop, tablet and phone as component variants." },
  paper: { title: "Copy for Paper is in Pro", body: "Paste any section or page into Paper as one responsive frame, with every layer named." },
  svg: { title: "SVG download is in Pro", body: "Take any section or page into any other design tool as a single SVG file." },
  react: { title: "Code export is in Pro", body: "Export your page for its template, in Next.js or Astro, made of its real sections, ready to deploy." },
  layout: { title: "This section's code is in Pro", body: `Pro unlocks all ${TEMPLATES.length} templates and their ${SECTIONS.length} sections, now and as new ones ship.` },
  plan: { title: "basedraft Pro", body: "Everything in basedraft, paid for once, with every update after that." },
};

/** The row to lift out for each reason. */
const HIT: Record<ProReason, FeatureIcon | null> = { figma: "figma", paper: "paper", svg: "paper", react: "code", layout: "layouts", plan: null };

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export function ProModal() {
  const open = useSyncExternalStore(subscribe, () => reason, () => null);
  // Keeps the last reason while the card animates out, so its words don't change mid-exit.
  const [last, setLast] = useState<ProReason>("plan");
  if (open && open !== last) setLast(open);
  const shown = open ?? last;
  const [, { signedIn }] = usePlan();
  const cta = useRef<HTMLAnchorElement>(null);
  const copy = COPY[shown];

  return (
    <Dialog open={open !== null} onClose={closePro} labelledBy="pro-title" describedBy="pro-body" initialFocus={cta}>
      <DialogClose onClose={closePro} />
      <div className="px-6 pb-5 pt-6">
        <IconTile icon={ICON.pro} tone="ink" />
        <h2 id="pro-title" className="mt-4 text-title">
          {copy.title}
        </h2>
        <p id="pro-body" className="mt-2 text-body text-muted">
          {copy.body}
        </p>
      </div>
      <FeatureList items={PRO_FEATURES} hit={HIT[shown]} className="mx-3" />
      <PriceFoot price="$149" period="once" note="Every future update included" noteIcon={NOTE_ICON.updates} className="mt-5">
        <Link href="/pro" onClick={closePro} className={btn.quiet}>
          Compare plans
        </Link>
        <Link ref={cta} href="/checkout?product=pro" prefetch={false} onClick={closePro} className={btn.ink}>
          Get Pro
        </Link>
      </PriceFoot>
      {PREVIEW_AVAILABLE ? (
        <button
          type="button"
          onClick={() => {
            closePro();
            if (!signedIn) return openAuth("sign-in");
            setPreview(true);
            toast("Previewing Pro", { detail: "Development only. Stop it on the Pro page." });
          }}
          className={`${CARD_NOTE} transition-colors hover:bg-fg/[0.02] hover:text-fg`}
        >
          <NoteIcon icon={EyeIcon} />
          <span className="min-w-0">{signedIn ? "Development: preview Pro on this account" : "Development: sign in to preview Pro"}</span>
        </button>
      ) : (
        <div className={CARD_NOTE}>
          <NoteIcon icon={NOTE_ICON.refund} />
          <span className="min-w-0">Paid on Whop. Full refund within 14 days.</span>
        </div>
      )}
    </Dialog>
  );
}
