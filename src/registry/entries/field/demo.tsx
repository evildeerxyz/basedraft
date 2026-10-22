"use client";

import { GlobeIcon } from "@phosphor-icons/react";
import { useState, type ComponentType } from "react";
import { Field } from "../../ui/field";
import { Input } from "../../ui/input";
import { Select } from "../../ui/select";
import { Textarea } from "../../ui/textarea";

/* Naming a published site: a hint until something's wrong, the count on the right. */
export function Demo() {
  const [name, setName] = useState("zuno-site");
  const bad = /[^a-z0-9-]/.test(name);
  return (
    <Field label="Subdomain" hint="Lowercase letters, numbers and dashes." error={bad ? "Only lowercase letters, numbers and dashes." : name ? undefined : "Give the site a name."} count={name.length} max={24} className="max-w-[320px]">
      <Input value={name} onChange={(e) => setName(e.target.value)} leading={<GlobeIcon weight="duotone" />} trailing=".basedraft.site" spellCheck={false} />
    </Field>
  );
}

function Hint() {
  return (
    <Field label="Site name" hint="Shown in the browser tab and when a link is shared." className="max-w-[320px]">
      <Input defaultValue="Zuno" />
    </Field>
  );
}

function WithError() {
  return (
    <Field label="Email" error="Add the part after the dot, like .co" className="max-w-[320px]">
      <Input type="email" defaultValue="maya@fieldwork" />
    </Field>
  );
}

function RequiredOptional() {
  return (
    <div className="grid w-full max-w-[320px] gap-4">
      <Field label="Your name" required>
        <Input defaultValue="Maya Okafor" autoComplete="name" />
      </Field>
      <Field label="Company" optional>
        <Input placeholder="Fieldwork" autoComplete="organization" />
      </Field>
    </div>
  );
}

function Count() {
  const [text, setText] = useState("Make the hero about tax-loss harvesting.");
  return (
    <Field label="Tell Claude Code what to change" count={text.length} max={160} error={text.length > 160 ? "Keep it to 160 characters." : undefined} className="max-w-[360px]">
      <Textarea value={text} onChange={(e) => setText(e.target.value)} />
    </Field>
  );
}

function WithSelect() {
  return (
    <Field label="Framework" hint="Change it later from your Purchases page." className="max-w-[300px]">
      <Select
        defaultValue="next"
        options={[
          { value: "next", label: "Next.js 16" },
          { value: "astro", label: "Astro 7" },
        ]}
      />
    </Field>
  );
}

export const examples: Record<string, ComponentType> = { hint: Hint, error: WithError, required: RequiredOptional, count: Count, select: WithSelect };
