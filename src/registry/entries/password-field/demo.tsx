"use client";

import type { ComponentType } from "react";
import { PasswordField } from "../../ui/password-field";
import { hint } from "../_shared/kit";

export function Demo() {
  return (
    <div className="grid w-full max-w-[360px] gap-3">
      <PasswordField label="Create a password" name="password" autoComplete="new-password" placeholder="At least 12 characters" />
      <p className={hint}>Try one, and watch the rules tick.</p>
    </div>
  );
}

function SignIn() {
  return (
    <div className="w-full max-w-[360px]">
      <PasswordField label="Password" autoComplete="current-password" rules={false} meter={false} />
    </div>
  );
}

function Rules() {
  return (
    <div className="w-full max-w-[360px]">
      <PasswordField
        label="New password"
        autoComplete="new-password"
        rules={[
          { label: "16 characters or more", test: (v) => v.length >= 16 },
          { label: "Not your email", test: (v) => !!v && !v.includes("maya@fieldwork.co") },
          { label: "No spaces", test: (v) => !!v && !/\s/.test(v) },
        ]}
      />
    </div>
  );
}

export const examples: Record<string, ComponentType> = { signin: SignIn, rules: Rules };
