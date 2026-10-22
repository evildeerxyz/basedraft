"use client";

import { ArrowCounterClockwiseIcon, DownloadSimpleIcon } from "@phosphor-icons/react";
import { useState, type ComponentType } from "react";
import { Button } from "../../ui/button";
import { Step, Steps } from "../../ui/stepper";

/*
 * Taking Zuno home, a step at a time: each step you're on carries the button that finishes it,
 * and the line fills as you go. Again starts over.
 */

export function Demo() {
  const [at, setAt] = useState(0);
  const next = () => setAt((a) => a + 1);
  return (
    <div className="w-full max-w-[340px]">
      <Steps current={at} aria-label="Take Zuno home">
        <Step title="Buy Zuno" description="$79 once, or every template with Pro.">
          {at === 0 && (
            <Button size="sm" onClick={next}>
              Buy Zuno, $79
            </Button>
          )}
        </Step>
        <Step title="Download zuno.zip" description="From your Purchases page, in Next.js or Astro.">
          {at === 1 && (
            <Button variant="outline" size="sm" onClick={next}>
              <DownloadSimpleIcon weight="duotone" /> zuno.zip
            </Button>
          )}
        </Step>
        <Step title="Run it" description="Unzip it, then npm install and npm run dev.">
          {at === 2 && (
            <Button variant="outline" size="sm" onClick={next}>
              It runs
            </Button>
          )}
        </Step>
      </Steps>
      {at === 3 && (
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-[rgb(var(--bd-ink)/0.08)] pt-4">
          <p className="text-[13px] text-[var(--bd-muted)]">Zuno runs as it is.</p>
          <Button variant="ghost" size="sm" onClick={() => setAt(0)}>
            <ArrowCounterClockwiseIcon weight="regular" /> Again
          </Button>
        </div>
      )}
    </div>
  );
}

export const examples: Record<string, ComponentType> = {
  horizontal: () => (
    <Steps current={1} orientation="horizontal" aria-label="Checkout" className="max-w-[440px]">
      <Step title="Plan" description="Pro" />
      <Step title="Details" description="Your email" />
      <Step title="Pay" description="Card or PayPal" />
    </Steps>
  ),
  action: () => (
    <Steps current={1} className="max-w-[340px]">
      <Step title="Buy Zuno" description="Paid, $79 once." />
      <Step title="Download zuno.zip" description="From your Purchases page.">
        <Button variant="outline" size="sm">
          <DownloadSimpleIcon weight="duotone" /> zuno.zip
        </Button>
      </Step>
      <Step title="Run it" description="npm install and npm run dev." />
    </Steps>
  ),
  done: () => (
    <Steps current={3} className="max-w-[340px]">
      <Step title="Account made" description="Signed in with your email." />
      <Step title="Team named" description="Fieldwork, 4 of 10 seats." />
      <Step title="Invites sent" description="Maya and Jonah will get an email." />
    </Steps>
  ),
};
