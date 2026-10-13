"use client";

import { AnimatePresence, motion } from "motion/react";
import { Fragment, useState } from "react";
import { BrandMark } from "@/components/site/brand";
import { Band } from "@/components/site/ui";
import { cn } from "@/lib/cn";
import type { Brand } from "@/lib/brands";

/*
 * Where pello works, said as sentences with the tools in them. Point at one, or tab to it, and the
 * line under says what pello does there.
 */

const TOOLS: Record<Brand, { name: string; does: string }> = {
  notion: { name: "Notion", does: "Reads the handbook pages you share, and notices when one changes." },
  drive: { name: "Google Drive", does: "Reads policies and contracts from the folders you pick, and nothing else." },
  confluence: { name: "Confluence", does: "Reads the spaces you choose, and links each answer back to its page." },
  slack: { name: "Slack", does: "Answers in the thread or a direct message, and asks leads to decide in one click." },
  teams: { name: "Teams", does: "The same answers and approvals as in Slack, for companies on Microsoft." },
  gmail: { name: "email", does: "Answers anything sent to people@ your company, with the passage attached." },
  okta: { name: "Okta", does: "Signs everyone in, and gives each person what their role should see." },
  calendar: { name: "Google Calendar", does: "Books time off, first weeks and 1:1s, and checks for customer calls." },
  zoom: { name: "Zoom", does: "Adds a link to every interview and first week meeting it books." },
  xero: { name: "Xero", does: "Sends each month's payroll and expenses, already reconciled." },
  github: { name: "GitHub", does: "Opens a new engineer's account before day one, and closes it when they leave." },
  linear: { name: "Linear", does: "Adds new starters to their team, with their first issues waiting." },
};

const SENTENCES: Array<Array<string | Brand>> = [
  ["It reads your handbook from ", "notion", ", ", "drive", " and ", "confluence", "."],
  [" Your people ask it in ", "slack", ", ", "teams", " or ", "gmail", "."],
  [" It signs them in with ", "okta", ", books time in ", "calendar", " and ", "zoom", ", sends payroll to ", "xero", ", and opens accounts in ", "github", " and ", "linear", " before day one."],
];

export function WorksWith() {
  const [on, setOn] = useState<Brand | null>(null);
  return (
    <Band id="works-with" inner="py-24 lg:py-28">
      <h2 className="text-[15px] font-medium text-mute">Where pello works</h2>
      <p className="mt-6 max-w-[1040px] text-pretty text-[clamp(1.6rem,3vw,2.6rem)] font-medium leading-[1.35] tracking-[-0.035em] text-ink">
        {SENTENCES.map((s, i) => (
          <Fragment key={i}>
            {s.map((part, j) =>
              part in TOOLS ? (
                <button key={j} type="button" onPointerEnter={() => setOn(part as Brand)} onPointerLeave={() => setOn(null)} onFocus={() => setOn(part as Brand)} onBlur={() => setOn(null)} className={cn("inline-flex items-baseline gap-[0.25em] rounded-[6px] underline decoration-line-strong decoration-2 underline-offset-[0.18em] transition-[color,opacity]", on && on !== part ? "opacity-40" : "opacity-100", on === part && "decoration-ink")}>
                  <BrandMark brand={part as Brand} className="size-[0.8em] translate-y-[0.08em] self-center" />
                  {TOOLS[part as Brand].name}
                </button>
              ) : (
                <Fragment key={j}>{part}</Fragment>
              ),
            )}
          </Fragment>
        ))}
      </p>
      <div className="mt-8 min-h-[28px]" aria-live="polite">
        <AnimatePresence mode="wait">
          <motion.p key={on ?? "none"} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="text-[17px] text-mute">
            {on ? (
              <>
                <span className="font-medium text-ink">{TOOLS[on].name === "email" ? "Email" : TOOLS[on].name}.</span> {TOOLS[on].does}
              </>
            ) : (
              "Point at any of them to see what pello does there. Setting each one up takes a few minutes, and it reads only what you share."
            )}
          </motion.p>
        </AnimatePresence>
      </div>
    </Band>
  );
}
