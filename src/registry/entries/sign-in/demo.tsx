"use client";

import { useState, type ComponentType } from "react";
import { SignIn } from "../../pro-ui/sign-in";
import { Segmented } from "../../ui/segmented";
import { hint } from "../_shared/kit";

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** A plain mark for a made-up product: two rings, overlapping. */
function Mark() {
  return (
    <span className="grid size-10 place-items-center rounded-[12px] text-[var(--bd-ui-ink-text)] [background:var(--bd-ui-ink)] shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_6px_14px_-8px_rgb(0_0_0/0.5)]">
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
        <circle cx="9" cy="12" r="5" />
        <circle cx="15" cy="12" r="5" />
      </svg>
    </span>
  );
}

const TERMS = "By continuing, you agree to the Terms and the Privacy policy.";

export function Demo() {
  const [run, setRun] = useState(0);
  return (
    <div className="grid w-full justify-items-center gap-3">
      <SignIn
        key={run}
        logo={<Mark />}
        title="Sign in to Acme"
        providers={["google", "github"]}
        lastUsed="github"
        method="code"
        onProvider={() => wait(1100)}
        onEmail={() => wait(700)}
        onCode={async (_, code) => {
          await wait(800);
          if (code === "000000") throw new Error("That code isn't right. Check the email and try again.");
        }}
        onResend={() => wait(600)}
        signUpHref="#sign-up"
        footer={TERMS}
      />
      <p className={`${hint} text-center`}>
        Any email works; any code but 000000 signs you in.{" "}
        <button type="button" onClick={() => setRun((n) => n + 1)} className="underline underline-offset-4">
          Start over
        </button>
      </p>
    </div>
  );
}

function Password() {
  return (
    <SignIn
      title="Welcome back"
      description="Sign in to your team's workspace."
      providers={["google", "apple", "github"]}
      lastUsed="email"
      method="password"
      onEmail={() => wait(500)}
      onPassword={async (_, pw) => {
        await wait(800);
        if (pw.length < 8) throw new Error("That password isn't right. Try again, or reset it.");
      }}
      forgotHref="#forgot"
      signUpHref="#sign-up"
    />
  );
}

function Split() {
  const [look, setLook] = useState("dither");
  return (
    <div className="grid w-full max-w-[880px] gap-3">
      <div className="flex justify-end">
        <Segmented
          label="The art"
          value={look}
          onValueChange={setLook}
          options={[
            { value: "dither", label: "Dither" },
            { value: "smooth", label: "Smooth" },
          ]}
        />
      </div>
      <SignIn
        layout="split"
        dither={look === "dither"}
        logo={<Mark />}
        title="Sign in to Acme"
        providers={["google"]}
        method="code"
        onEmail={() => wait(600)}
        onCode={() => wait(800)}
        quote={{ text: "We moved the whole team over in an afternoon, and nobody asked how to sign in.", name: "Priya Raman", role: "Head of engineering" }}
        footer={TERMS}
      />
    </div>
  );
}

export const examples: Record<string, ComponentType> = { password: Password, split: Split };
