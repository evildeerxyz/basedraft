"use client";

import { GlobeIcon, ShoppingBagIcon, UserCircleIcon } from "@phosphor-icons/react";
import type { ComponentType } from "react";
import { Wizard, type WizardStep } from "../../pro-ui/wizard";
import { Field } from "../../ui/field";
import { Input } from "../../ui/input";
import { RadioGroup, RadioGroupItem } from "../../ui/radio-group";

type Values = { name: string; email: string; kind: string; address: string };
const INITIAL: Values = { name: "", email: "", kind: "", address: "" };
const KINDS: Record<string, string> = { portfolio: "Portfolio", store: "Store", product: "Product site" };

/* Starting a site: who it's for, what kind, and where it lives. */
const STEPS: WizardStep<Values>[] = [
  {
    id: "you",
    title: "About you",
    description: "We'll send the link to your site here.",
    render: ({ field, errors }) => (
      <div className="grid gap-4">
        <Field label="Your name" error={errors.name}>
          <Input {...field("name")} autoComplete="name" placeholder="Riley Parker" />
        </Field>
        <Field label="Email" error={errors.email}>
          <Input {...field("email")} type="email" autoComplete="email" placeholder="riley@parker.studio" />
        </Field>
      </div>
    ),
    validate: (v) => {
      const e: Partial<Record<keyof Values, string>> = {};
      if (!v.name.trim()) e.name = "Add your name.";
      if (!/^\S+@\S+\.\S+$/.test(v.email)) e.email = "That email doesn't look right.";
      return Object.keys(e).length ? e : undefined;
    },
    summary: (v) => [
      { label: "Name", value: v.name },
      { label: "Email", value: v.email },
    ],
  },
  {
    id: "kind",
    title: "Your site",
    description: "We'll start you from a template that fits.",
    render: ({ choice, errors }) => (
      <div data-wizard-field="kind" className="grid gap-2">
        <RadioGroup {...choice("kind")} variant="card" label="Kind of site">
          <RadioGroupItem value="portfolio" label="Portfolio" description="Your work, a page for each project." icon={<UserCircleIcon weight="duotone" />} />
          <RadioGroupItem value="store" label="Store" description="Products, a cart and checkout." icon={<ShoppingBagIcon weight="duotone" />} />
          <RadioGroupItem value="product" label="Product site" description="A launch page, pricing and docs." icon={<GlobeIcon weight="duotone" />} />
        </RadioGroup>
        {errors.kind && <p className="px-1 text-[13px] text-[var(--bd-ui-stop)]">{errors.kind}</p>}
      </div>
    ),
    validate: (v) => (v.kind ? undefined : { kind: "Choose one to start from." }),
    summary: (v) => [{ label: "Kind", value: KINDS[v.kind] }],
  },
  {
    id: "address",
    title: "Its address",
    description: "You can connect your own domain later.",
    render: ({ field, errors }) => (
      <Field label="Address" hint="Letters, numbers and dashes." error={errors.address}>
        <Input {...field("address")} placeholder="parker" trailing={<span className="text-[13px] text-[var(--bd-subtle)]">.basedraft.site</span>} />
      </Field>
    ),
    validate: (v) => (/^[a-z0-9-]{3,}$/.test(v.address) ? undefined : { address: "At least 3 letters, numbers or dashes." }),
    summary: (v) => [{ label: "Address", value: `${v.address}.basedraft.site` }],
  },
];

const send = () => new Promise<void>((r) => setTimeout(r, 1400));

export function Demo() {
  return (
    <Wizard
      steps={STEPS}
      initialValues={INITIAL}
      onSubmit={send}
      submitLabel="Create my site"
      label="Start a site"
      done={{ title: "Your site is ready", description: (v) => `${v.address}.basedraft.site is live. We sent the link to ${v.email}.`, restart: "Start another" }}
      className="max-w-[460px]"
    />
  );
}

function NoReview() {
  return <Wizard steps={STEPS} initialValues={INITIAL} onSubmit={send} review={false} submitLabel="Create my site" label="Start a site" className="max-w-[460px]" />;
}

export const examples: Record<string, ComponentType> = { "no-review": NoReview };
