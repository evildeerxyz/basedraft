"use client";

import { FileTextIcon, LinkSimpleIcon, ListIcon, SlidersHorizontalIcon } from "@phosphor-icons/react";
import { useState, type ComponentType } from "react";
import { Button } from "../../ui/button";
import { CopyButton } from "../../ui/copy-button";
import { Input } from "../../ui/input";
import { Segmented } from "../../ui/segmented";
import { Sheet, SheetBody, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "../../ui/sheet";
import { Switch } from "../../ui/switch";
import { hint } from "../_shared/kit";

/* A setting on its own row: what it is, a line on it, and its switch. */
function Setting({ title, note, on }: { title: string; note: string; on?: boolean }) {
  return (
    <label className="flex items-center justify-between gap-4 py-3.5">
      <span>
        <span className="block text-sm font-medium">{title}</span>
        <span className="mt-0.5 block text-xs text-[var(--bd-muted)]">{note}</span>
      </span>
      <Switch defaultChecked={on} aria-label={title} />
    </label>
  );
}

/** A section's settings in Studio, beside the page rather than over it. */
export function Demo() {
  return (
    <div className="grid justify-items-center gap-3">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="lg">
            <SlidersHorizontalIcon weight="duotone" /> Hero settings
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Hero settings</SheetTitle>
            <SheetDescription>Zuno, home page. Changes show on the page as you make them.</SheetDescription>
          </SheetHeader>
          <SheetBody>
            <p className="mb-2 text-xs font-medium text-[var(--bd-subtle)]">Layout</p>
            <Segmented
              label="Layout"
              className="w-full"
              options={[
                { value: "split", label: "Split" },
                { value: "centered", label: "Centered" },
                { value: "stacked", label: "Stacked" },
              ]}
            />
            <p className="mb-2 mt-6 text-xs font-medium text-[var(--bd-subtle)]">Headline</p>
            <Input defaultValue="Money that manages itself." aria-label="Headline" />
            <div className="mt-4 divide-y divide-[var(--bd-line-subtle)]">
              <Setting title="Show the portfolio chart" note="The dithered chart under the headline." on />
              <Setting title="Animate on scroll" note="The chart draws itself as it comes into view." on />
              <Setting title="Show on phones" note="Hide it to start phones on the next section." />
            </div>
          </SheetBody>
          <SheetFooter>
            <SheetClose asChild>
              <Button variant="outline">Cancel</Button>
            </SheetClose>
            <SheetClose asChild>
              <Button>Save</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <p className={hint}>Slides in from the right edge; the page stays in view behind it.</p>
    </div>
  );
}

function Bottom() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">
          <LinkSimpleIcon weight="duotone" /> Share draft
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader className="pt-3">
          <SheetTitle>Share this draft</SheetTitle>
          <SheetDescription>Anyone with the link can look. Only your team can edit.</SheetDescription>
        </SheetHeader>
        <SheetBody>
          <div className="flex items-center gap-2 rounded-full bg-[var(--bd-surface)] py-1 pl-4 pr-1 shadow-[inset_0_0_0_1px_var(--bd-line),var(--bd-shadow-resting)]">
            <span className="min-w-0 flex-1 truncate font-mono text-[12.5px] text-[var(--bd-muted)]">basedraft.site/d/zuno-spring</span>
            <CopyButton value="https://basedraft.site/d/zuno-spring" label="Copy link" variant="pill" />
          </div>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}

const PAGES = ["Home", "Autopilot", "Copilot", "Pricing", "Security", "Help center", "About", "Careers"];

function Left() {
  const [page, setPage] = useState("Home");
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">
          <ListIcon weight="duotone" /> Pages
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Zuno&apos;s pages</SheetTitle>
          <SheetDescription>{PAGES.length} of 25. Pick one to open it.</SheetDescription>
        </SheetHeader>
        <SheetBody className="px-3">
          <ul className="grid gap-0.5">
            {PAGES.map((p) => (
              <li key={p}>
                <SheetClose asChild>
                  <button type="button" onClick={() => setPage(p)} aria-current={page === p ? "page" : undefined} className="flex h-10 w-full items-center gap-3 rounded-[10px] px-3 text-left text-sm transition-colors hover:bg-[rgb(var(--bd-ink)/0.05)] aria-[current=page]:bg-[rgb(var(--bd-ink)/0.06)] aria-[current=page]:font-medium">
                    <FileTextIcon weight="duotone" className="size-4 text-[var(--bd-muted)]" />
                    {p}
                  </button>
                </SheetClose>
              </li>
            ))}
          </ul>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}

const CHANGES = ["New: copy to Paper", "Faster pages in Studio", "Zuno: a calmer pricing table", "Noma: dark mode", "Blocks: filter by template", "Fixed: phone menu on Auren", "Team: invite by link", "Studio: undo across pages"];

function Long() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">What&apos;s new</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>What&apos;s new</SheetTitle>
          <SheetDescription>The last two weeks, newest first.</SheetDescription>
        </SheetHeader>
        <SheetBody>
          <ol className="grid gap-3">
            {[...CHANGES, ...CHANGES].map((c, i) => (
              <li key={i} className="rounded-[14px] p-4 shadow-[inset_0_0_0_1px_var(--bd-line-subtle)]">
                <p className="text-sm font-medium">{c}</p>
                <p className="mt-1 text-xs text-[var(--bd-muted)]">October {21 - Math.floor(i / 2)}</p>
              </li>
            ))}
          </ol>
        </SheetBody>
        <SheetFooter>
          <SheetClose asChild>
            <Button>Done</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export const examples: Record<string, ComponentType> = { bottom: Bottom, left: Left, long: Long };
