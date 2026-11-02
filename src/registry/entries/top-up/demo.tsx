"use client";

import { useState, type ComponentType } from "react";
import { TopUp, type TopUpMethod } from "../../pro-ui/top-up";

const METHODS: TopUpMethod[] = [
  { id: "visa", brand: "Visa", last4: "4242", expires: "08/28" },
  { id: "amex", brand: "Amex", last4: "1005", expires: "02/27" },
  { id: "bank", brand: "Checking", last4: "6789" },
];

export function Demo() {
  const [balance, setBalance] = useState(184.2);
  return (
    <div className="w-full max-w-[440px]">
      <TopUp
        title="Add credits"
        balance={balance}
        pace={{ perDay: 9.6, from: "2026-11-12" }}
        methods={METHODS}
        autoReload={{ amount: 100, below: 20 }}
        receipt="emily@acme.com"
        onConfirm={({ amount }) =>
          new Promise<void>((done) =>
            setTimeout(() => {
              setBalance((b) => b + amount);
              done();
            }, 1400),
          )
        }
        onAddMethod={() => undefined}
      />
    </div>
  );
}

function Declined() {
  return (
    <div className="w-full max-w-[440px]">
      <TopUp
        balance={18.4}
        presets={[20, 50, 100]}
        defaultAmount={50}
        methods={METHODS.slice(0, 1)}
        confirm="press"
        onConfirm={() => new Promise<void>((_, fail) => setTimeout(() => fail(new Error("Your card was declined. Try another card, or a smaller amount.")), 1100))}
      />
    </div>
  );
}

export const examples: Record<string, ComponentType> = { declined: Declined };
