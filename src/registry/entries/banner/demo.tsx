"use client";

import { ArrowCounterClockwiseIcon } from "@phosphor-icons/react";
import { useState, type ComponentProps, type ComponentType, type ReactNode } from "react";
import { Banner } from "../../ui/banner";
import { Button } from "../../ui/button";

/** The demos' links stay on this page. */
function Stay({ onClick, ...props }: ComponentProps<"a">) {
  return (
    <a
      {...props}
      onClick={(e) => {
        e.preventDefault();
        onClick?.(e);
      }}
    />
  );
}

/** A small site, to show the banner where it lives: over the header. */
function Page({ children }: { children: ReactNode }) {
  return (
    <div className="w-full max-w-[600px] overflow-hidden rounded-[18px] bg-[var(--bd-surface)] shadow-[inset_0_0_0_1px_var(--bd-line),var(--bd-shadow-raised)]">
      {children}
      <div className="flex items-center justify-between px-5 py-3.5">
        <span className="flex items-center gap-2 text-sm font-medium text-[var(--bd-fg)]">
          <span className="size-4 rounded-[4px] [background:var(--bd-ui-ink)]" />
          Acme
        </span>
        <span className="flex gap-4 text-[13px] text-[var(--bd-muted)]">
          <span>Product</span>
          <span>Pricing</span>
          <span>Security</span>
        </span>
      </div>
      <div className="grid gap-2 px-5 pb-8 pt-4">
        <span className="h-5 w-2/3 rounded-full bg-[var(--bd-ui-track)]" />
        <span className="h-5 w-1/2 rounded-full bg-[var(--bd-ui-track)]" />
      </div>
    </div>
  );
}

export function Demo() {
  const [run, setRun] = useState(0);
  const [gone, setGone] = useState(false);
  return (
    <div className="grid w-full max-w-[600px] justify-items-center gap-3">
      <Page>
        <Banner
          key={run}
          badge="New"
          href="/whats-new"
          cta="See what's new"
          link={Stay}
          dismissible
          onDismiss={() => setGone(true)}
          messages={["Shared inboxes are here, for the whole team", "Acme for teams: one plan, every seat", "Join 52,000 teams who answer faster"]}
        />
      </Page>
      <div className="h-8">
        {gone && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setGone(false);
              setRun((r) => r + 1);
            }}
          >
            <ArrowCounterClockwiseIcon weight="regular" /> Show it again
          </Button>
        )}
      </div>
    </div>
  );
}

function Paper() {
  return (
    <Page>
      <Banner variant="paper" badge="Sale" href="/pricing" cta="Get Pro" link={Stay}>
        Every template, 30% off until Sunday
      </Banner>
    </Page>
  );
}

function Remember() {
  const [run, setRun] = useState(0);
  return (
    <div className="grid w-full max-w-[600px] justify-items-center gap-3">
      <Page>
        <Banner key={run} dismissible storageKey="zuno-banner-maintenance">
          Scheduled maintenance Sunday, 2 to 3 AM UTC
        </Banner>
      </Page>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          localStorage.removeItem("zuno-banner-maintenance");
          dispatchEvent(new Event("bd-banner"));
          setRun((r) => r + 1);
        }}
      >
        <ArrowCounterClockwiseIcon weight="regular" /> Forget it was closed
      </Button>
    </div>
  );
}

export const examples: Record<string, ComponentType> = { paper: Paper, remember: Remember };
