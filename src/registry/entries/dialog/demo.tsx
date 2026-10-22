"use client";

import { CheckIcon, GithubLogoIcon, PencilSimpleLineIcon, UsersThreeIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useState, type ComponentType } from "react";
import { Button } from "../../ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogIcon, DialogTitle, DialogTrigger } from "../../ui/dialog";
import { Input } from "../../ui/input";
import { hint } from "../_shared/kit";

/* A row of what's about to happen, on a quiet well. */
function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 text-sm">
      <span className="text-[var(--bd-muted)]">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

/** Publishing a template to GitHub: what it will make, then the one action. */
export function Demo() {
  const [done, setDone] = useState(false);
  return (
    <div className="grid justify-items-center gap-3">
      <Dialog onOpenChange={(o) => o && setDone(false)}>
        <DialogTrigger asChild>
          <Button variant="metal" size="lg">
            <GithubLogoIcon weight="duotone" /> Publish to GitHub
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogIcon>
            <GithubLogoIcon weight="duotone" />
          </DialogIcon>
          <DialogTitle>Publish Zuno to GitHub</DialogTitle>
          <DialogDescription>We make a new private repository and push the whole site to it. Later changes go in as pull requests.</DialogDescription>
          <div className="mt-5 divide-y divide-[var(--bd-line-subtle)] rounded-[14px] px-4 py-1 shadow-[var(--bd-ui-well)]">
            <Fact label="Repository" value="fieldwork/zuno-site" />
            <Fact label="Branch" value="main" />
            <Fact label="Files" value="61" />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Not yet</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button onClick={() => setDone(true)}>Publish</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <p className={hint}>{done ? "Published: fieldwork/zuno-site" : "Opens over the page; Escape or a click behind it closes it."}</p>
    </div>
  );
}

function Confirm() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Leave Studio</Button>
      </DialogTrigger>
      <DialogContent size="sm">
        <DialogIcon>
          <WarningCircleIcon weight="duotone" />
        </DialogIcon>
        <DialogTitle>Leave without saving?</DialogTitle>
        <DialogDescription>Your last three edits to the hero aren&apos;t saved yet.</DialogDescription>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Keep editing</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button>Leave</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Rename() {
  const [name, setName] = useState("Zuno, spring launch");
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <PencilSimpleLineIcon weight="duotone" /> Rename draft
        </Button>
      </DialogTrigger>
      <DialogContent size="sm" glow={false}>
        <DialogTitle>Rename this draft</DialogTitle>
        <DialogDescription>Only you and your team see this name.</DialogDescription>
        <form
          className="mt-5"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <Input data-autofocus value={name} onChange={(e) => setName(e.target.value)} aria-label="Draft name" />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button type="submit">Save</Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Locked() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <UsersThreeIcon weight="duotone" /> Set up your team
        </Button>
      </DialogTrigger>
      <DialogContent dismissible={false} closeButton={false}>
        <DialogIcon>
          <UsersThreeIcon weight="duotone" />
        </DialogIcon>
        <DialogTitle>Name your team</DialogTitle>
        <DialogDescription>Your Team license has 10 seats. Give the team a name so invites say who they&apos;re from.</DialogDescription>
        <div className="mt-5">
          <Input data-autofocus placeholder="Fieldwork Studio" aria-label="Team name" />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button>Continue</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Controlled() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <Button
        variant="outline"
        loading={busy}
        onClick={() => {
          setBusy(true);
          setTimeout(() => {
            setBusy(false);
            setOpen(true);
          }, 900);
        }}
      >
        Export the code
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="sm">
          <DialogIcon>
            <CheckIcon weight="bold" />
          </DialogIcon>
          <DialogTitle>Your code is ready</DialogTitle>
          <DialogDescription>zuno-site.zip, Next.js 16, 2.4 MB.</DialogDescription>
          <DialogFooter>
            <DialogClose asChild>
              <Button>Download</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export const examples: Record<string, ComponentType> = { confirm: Confirm, form: Rename, locked: Locked, controlled: Controlled };
