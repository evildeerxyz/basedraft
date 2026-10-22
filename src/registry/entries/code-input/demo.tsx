"use client";

import { ArrowCounterClockwiseIcon, CheckIcon } from "@phosphor-icons/react";
import { useState, type ComponentType } from "react";
import { CodeInput } from "../../ui/code-input";
import { Field } from "../../ui/field";

/* Signing in with the code from an email: it checks once the last digit is in, then says so. */
export function Demo() {
  const [state, setState] = useState<"idle" | "checking" | "wrong" | "in">("idle");
  const [run, setRun] = useState(0);
  return (
    <div className="grid justify-items-center gap-3.5 text-center">
      <p className="max-w-[300px] text-sm text-[var(--bd-muted)]">
        Enter the code we sent to <span className="font-medium text-[var(--bd-fg)]">maya@fieldwork.co</span>
      </p>
      <CodeInput
        key={run}
        label="Sign-in code"
        invalid={state === "wrong"}
        disabled={state === "checking" || state === "in"}
        onValueChange={() => state === "wrong" && setState("idle")}
        onComplete={(code) => {
          setState("checking");
          setTimeout(() => setState(code === "482916" ? "in" : "wrong"), 700);
        }}
      />
      <p aria-live="polite" className="flex min-h-6 items-center gap-1.5 text-xs text-[var(--bd-subtle)]">
        {state === "checking" && "Checking the code"}
        {state === "wrong" && <span className="text-[var(--bd-ui-stop)]">That code didn&apos;t work. Try 482916.</span>}
        {state === "idle" && "Try 482916"}
        {state === "in" && (
          <>
            <CheckIcon weight="bold" className="text-[var(--bd-ui-ok)]" /> Signed in
            <button
              type="button"
              onClick={() => {
                setState("idle");
                setRun((r) => r + 1);
              }}
              className="ml-2 inline-flex items-center gap-1 rounded-full px-2 py-1 font-medium text-[var(--bd-fg)] hover:bg-[var(--bd-surface-2)]"
            >
              <ArrowCounterClockwiseIcon weight="regular" /> Again
            </button>
          </>
        )}
      </p>
    </div>
  );
}

function Basic() {
  return <CodeInput label="Sign-in code" />;
}

function WithError() {
  return (
    <Field label="Sign-in code" error="That code didn't work. Ask for a new one.">
      <CodeInput defaultValue="482915" />
    </Field>
  );
}

function Invite() {
  return <CodeInput mode="alphanumeric" split={false} label="Team invite code" defaultValue="BD7Q" />;
}

function Small() {
  return (
    <div className="grid justify-items-center gap-2.5">
      <p className="text-xs text-[var(--bd-muted)]">Enter the 4 digits Studio shows on your other device</p>
      <CodeInput size="sm" length={4} label="Pairing code" />
    </div>
  );
}

function Disabled() {
  return <CodeInput disabled defaultValue="482916" label="Sign-in code" />;
}

export const examples: Record<string, ComponentType> = { basic: Basic, error: WithError, invite: Invite, small: Small, disabled: Disabled };
