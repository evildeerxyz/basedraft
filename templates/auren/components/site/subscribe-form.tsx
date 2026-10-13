"use client";

import { useState, type FormEvent } from "react";
import { CheckIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/site";

/** Release-notes signup. There is no backend yet, so it confirms locally. */
export function SubscribeForm({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (valid) setDone(true);
  };

  if (done)
    return (
      <p className={cn("flex h-12 items-center gap-2.5 text-[15px]", tone === "dark" ? "text-fog" : "text-ink/70")}>
        <CheckIcon size={16} weight="bold" className="text-accent" />
        Thanks. Release notes will go to {email}.
      </p>
    );

  return (
    <form onSubmit={submit} className="flex max-w-[440px] gap-2">
      <label htmlFor="subscribe-email" className="sr-only">
        Email address
      </label>
      <input
        id="subscribe-email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@company.com"
        className={cn(
          "h-12 min-w-0 flex-1 rounded-[6px] border px-4 text-[15px] outline-none transition-colors",
          tone === "dark"
            ? "border-paper/15 bg-ink text-paper placeholder:text-mute focus:border-paper/40"
            : "border-ink/15 bg-paper-2 text-ink placeholder:text-ink/35 focus:border-ink/40",
        )}
      />
      <button
        type="submit"
        disabled={!valid}
        className={cn(
          "inline-flex h-12 items-center gap-2 rounded-[6px] px-4 text-[14.5px] font-medium transition-colors disabled:opacity-50",
          tone === "dark" ? "bg-paper text-ink hover:bg-accent" : "bg-ink text-paper hover:bg-ink-3",
        )}
      >
        Subscribe
      </button>
    </form>
  );
}
