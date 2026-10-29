"use client";

import { ArrowCounterClockwiseIcon, RocketLaunchIcon } from "@phosphor-icons/react";
import { useState, useSyncExternalStore, type ComponentType, type ReactNode } from "react";
import { Button } from "../../ui/button";
import { Countdown } from "../../ui/countdown";
import { hint } from "../_shared/kit";

/* The demos count to a moment worked out in the browser, so the page builds without a clock. */
const noop = () => () => {};
function Later({ children }: { children: () => ReactNode }) {
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  return mounted ? children() : <div className="h-[96px]" />;
}

function Launch() {
  const [at] = useState(() => Date.now() + ((3 * 24 + 7) * 3600 + 24 * 60 + 50) * 1000);
  return (
    <div className="grid justify-items-center gap-4 text-center">
      <p className="text-sm font-medium text-[var(--bd-fg)]">Acme for teams launches in</p>
      <Countdown to={at} label="Acme for teams launches" />
      <p className={hint}>Each digit rolls down as it turns over.</p>
    </div>
  );
}

export function Demo() {
  return <Later>{() => <Launch />}</Later>;
}

function Sale() {
  const [at] = useState(() => Date.now() + (2 * 3600 + 14 * 60 + 9) * 1000);
  return (
    <p className="text-sm text-[var(--bd-muted)]">
      Every template, 30% off. Ends in <Countdown to={at} variant="inline" units={["hours", "minutes", "seconds"]} label="The sale ends" className="text-[var(--bd-fg)]" />
    </p>
  );
}

function Done() {
  const [run, setRun] = useState(0);
  return (
    <div className="grid justify-items-center gap-3">
      <Later>{() => <Short key={run} />}</Later>
      <Button variant="ghost" size="sm" onClick={() => setRun((r) => r + 1)}>
        <ArrowCounterClockwiseIcon weight="regular" /> Again
      </Button>
    </div>
  );
}

function Short() {
  const [at] = useState(() => Date.now() + 8000);
  return (
    <Countdown
      to={at}
      units={["minutes", "seconds"]}
      label="Doors open"
      done={
        <p className="flex h-[96px] items-center gap-2 text-[15px] font-medium text-[var(--bd-fg)]">
          <RocketLaunchIcon weight="duotone" className="size-5 text-[var(--bd-ui-ok)]" /> Doors are open. Come in.
        </p>
      }
    />
  );
}

export const examples: Record<string, ComponentType> = { sale: () => <Later>{() => <Sale />}</Later>, done: Done };
