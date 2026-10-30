"use client";

import { ArrowCounterClockwiseIcon, CookieIcon } from "@phosphor-icons/react";
import { useEffect, useState, type ComponentType } from "react";
import { Button } from "../../ui/button";
import { Consent, openConsent, type ConsentCategory } from "../../ui/consent";
import { hint } from "../_shared/kit";

const KINDS: ConsentCategory[] = [
  { id: "necessary", label: "Necessary", description: "Signing in, your cart, and remembering this choice.", required: true },
  { id: "analytics", label: "Analytics", description: "Which pages are read, counted without knowing who you are." },
  { id: "marketing", label: "Marketing", description: "Whether an ad brought you here." },
];

/** A demo starts fresh on every visit: it forgets the last answer and tells the card, so the card shows. */
function useFreshStart(key: string) {
  useEffect(() => {
    localStorage.removeItem(key);
    dispatchEvent(new StorageEvent("storage", { key }));
  }, [key]);
}

export function Demo() {
  const [run, setRun] = useState(0);
  const [saved, setSaved] = useState<Record<string, boolean> | null>(null);
  const key = "bd-demo-consent";
  useFreshStart(key);
  return (
    <div className="grid w-full max-w-[380px] justify-items-center gap-3">
      <Consent key={run} position="inline" storageKey={key} categories={KINDS} policyHref="#privacy" onSave={setSaved} />
      {saved && (
        <div className="grid justify-items-center gap-2">
          <p className={`${hint} text-center`}>Saved: {KINDS.filter((k) => saved[k.id]).map((k) => k.label).join(", ")}</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => openConsent(key)}>
              <CookieIcon weight="duotone" /> Cookie settings
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                localStorage.removeItem(key);
                setSaved(null);
                setRun((r) => r + 1);
              }}
            >
              <ArrowCounterClockwiseIcon weight="regular" /> Start over
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Short() {
  const [run, setRun] = useState(0);
  const key = "bd-demo-consent-short";
  useFreshStart(key);
  return (
    <div className="grid w-full max-w-[380px] justify-items-center gap-3">
      <Consent key={run} position="inline" storageKey={key} title="Cookies, briefly" description="Only to count visits. Nothing is sold." categories={[KINDS[0], KINDS[1]]} />
      <Button
        size="sm"
        variant="ghost"
        onClick={() => {
          localStorage.removeItem(key);
          setRun((r) => r + 1);
        }}
      >
        <ArrowCounterClockwiseIcon weight="regular" /> Start over
      </Button>
    </div>
  );
}

export const examples: Record<string, ComponentType> = { short: Short };
