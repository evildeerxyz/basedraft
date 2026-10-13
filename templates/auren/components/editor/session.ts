/**
 * A recorded agent session against a small payments service. Each task is a
 * unified diff over BASE, plus the steps the agent narrates while working.
 */

export type DiffLine = { t: " " | "+" | "-"; s: string };
export type StepKind = "search" | "read" | "create" | "edit" | "run" | "test";
/** One line of the agent transcript: "Read `api/refunds.ts` · reuses its key pattern". */
export type Step = { kind: StepKind; verb: string; target: string; detail: string; ms?: number };
export type Task = {
  id: string;
  /** Label for the numbered intent buttons. */
  short: string;
  prompt: string;
  branch: string;
  steps: Step[];
  diff: DiffLine[];
  /** One review note per change, in order. */
  notes: string[];
  /** What the agent says when it is done. */
  reply: string;
  /** Files touched, for the Changes list. The open file's counts are computed live. */
  files: Array<{ path: string; add: number; del: number }>;
  summary: { files: number; add: number; del: number };
};

const diff = (src: string): DiffLine[] =>
  src
    .replace(/^\n/, "")
    .replace(/\n$/, "")
    .split("\n")
    .map((l) => ({ t: l[0] === "+" || l[0] === "-" ? l[0] : " ", s: l.slice(1) }));

export const FILE = "src/api/charges.ts";

export const BASE: string[] = [
  `import { Router } from "express";`,
  `import { db } from "../lib/db";`,
  `import { stripe } from "../lib/stripe";`,
  `import { requireAuth } from "../middleware/auth";`,
  ``,
  `export const charges = Router();`,
  ``,
  `charges.post("/", requireAuth, async (req, res) => {`,
  `  const { amount, currency, customerId } = req.body;`,
  ``,
  `  const customer = await db.customer.findUnique({`,
  `    where: { id: customerId },`,
  `  });`,
  `  if (!customer) return res.status(404).json({ error: "not_found" });`,
  ``,
  `  const charge = await stripe.charges.create({`,
  `    amount,`,
  `    currency,`,
  `    customer: customer.stripeId,`,
  `  });`,
  ``,
  `  await db.charge.create({ data: { id: charge.id, customerId, amount } });`,
  `  return res.status(201).json(charge);`,
  `});`,
];

/** The line the "user" is typing when the demo opens, and Tab's suggestion. */
export const TYPING_LINE = 21;
export const TYPED = `  await db.charge.create({ `;
export const GHOST = BASE[TYPING_LINE].slice(TYPED.length);

export const TASKS: Task[] = [
  {
    id: "idempotent",
    short: "Idempotent charges",
    prompt: "Make POST /charges idempotent",
    branch: "agent/idempotent-charges",
    steps: [
      { kind: "search", verb: "Searched for", target: "idempotency", detail: "4 hits" },
      { kind: "read", verb: "Read", target: "api/refunds.ts", detail: "same key pattern" },
      { kind: "create", verb: "Created", target: "lib/idempotency.ts", detail: "+28" },
      { kind: "edit", verb: "Edited", target: "api/charges.ts", detail: "+6 -6" },
      { kind: "test", verb: "Ran", target: "charges.test.ts", detail: "12 passed", ms: 1100 },
    ],
    diff: diff(`
 import { Router } from "express";
 import { db } from "../lib/db";
 import { stripe } from "../lib/stripe";
 import { requireAuth } from "../middleware/auth";
+import { withIdempotency } from "../lib/idempotency";

 export const charges = Router();

-charges.post("/", requireAuth, async (req, res) => {
+charges.post("/", requireAuth, withIdempotency("charge"), async (req, res) => {
   const { amount, currency, customerId } = req.body;

   const customer = await db.customer.findUnique({
     where: { id: customerId },
   });
   if (!customer) return res.status(404).json({ error: "not_found" });

-  const charge = await stripe.charges.create({
-    amount,
-    currency,
-    customer: customer.stripeId,
-  });
+  const charge = await stripe.charges.create(
+    { amount, currency, customer: customer.stripeId },
+    { idempotencyKey: req.idempotencyKey },
+  );

   await db.charge.create({ data: { id: charge.id, customerId, amount } });
   return res.status(201).json(charge);
 });
`),
    reply:
      "Retries with the same Idempotency-Key now get the stored response instead of a second charge. It reuses the 24h window from refunds.ts.",
    files: [
      { path: "api/charges.ts", add: 6, del: 6 },
      { path: "lib/idempotency.ts", add: 28, del: 0 },
    ],
    summary: { files: 2, add: 34, del: 6 },
    notes: [
      "Import the new middleware, extracted from the pattern in refunds.ts.",
      "Mount it before the handler, so a retry returns the stored response.",
      "Pass the key to Stripe as well, so a crash mid-request cannot charge twice.",
    ],
  },
  {
    id: "zod",
    short: "Validate with zod",
    prompt: "Validate the request body with zod",
    branch: "agent/validate-charges",
    steps: [
      { kind: "read", verb: "Read", target: "package.json", detail: "zod 3.23" },
      { kind: "search", verb: "Found", target: "lib/errors.ts", detail: "422 shape" },
      { kind: "edit", verb: "Edited", target: "api/charges.ts", detail: "+10 -1" },
      { kind: "run", verb: "Ran", target: "tsc --noEmit", detail: "0 errors", ms: 900 },
      { kind: "test", verb: "Ran", target: "charges.test.ts", detail: "14 passed", ms: 1000 },
    ],
    diff: diff(`
 import { Router } from "express";
+import { z } from "zod";
 import { db } from "../lib/db";
 import { stripe } from "../lib/stripe";
 import { requireAuth } from "../middleware/auth";

 export const charges = Router();

+const ChargeInput = z.object({
+  amount: z.number().int().positive(),
+  currency: z.enum(["usd", "eur", "gbp"]),
+  customerId: z.string().uuid(),
+});
+
 charges.post("/", requireAuth, async (req, res) => {
-  const { amount, currency, customerId } = req.body;
+  const input = ChargeInput.safeParse(req.body);
+  if (!input.success) return res.status(422).json(input.error.flatten());
+  const { amount, currency, customerId } = input.data;

   const customer = await db.customer.findUnique({
     where: { id: customerId },
   });
   if (!customer) return res.status(404).json({ error: "not_found" });

   const charge = await stripe.charges.create({
     amount,
     currency,
     customer: customer.stripeId,
   });

   await db.charge.create({ data: { id: charge.id, customerId, amount } });
   return res.status(201).json(charge);
 });
`),
    reply: "Bad payloads now fail fast with a 422 in the shape lib/errors.ts uses. I added tests for an unknown currency and a negative amount.",
    files: [
      { path: "api/charges.ts", add: 10, del: 1 },
      { path: "test/charges.test.ts", add: 22, del: 0 },
    ],
    summary: { files: 2, add: 32, del: 1 },
    notes: [
      "zod 3.23 is already a dependency.",
      "Currencies match the ones billing/plans.ts accepts.",
      "Fail with a 422 in the error shape from lib/errors.ts.",
    ],
  },
  {
    id: "logging",
    short: "Log request ids",
    prompt: "Log every charge with the request id",
    branch: "agent/charge-logging",
    steps: [
      { kind: "read", verb: "Read", target: "lib/logger.ts", detail: "pino" },
      { kind: "search", verb: "Matched", target: "api/refunds.ts", detail: "noun.verb" },
      { kind: "edit", verb: "Edited", target: "api/charges.ts", detail: "+2" },
      { kind: "run", verb: "Ran", target: "eslint", detail: "clean", ms: 800 },
    ],
    diff: diff(`
 import { Router } from "express";
 import { db } from "../lib/db";
 import { stripe } from "../lib/stripe";
 import { requireAuth } from "../middleware/auth";
+import { logger } from "../lib/logger";

 export const charges = Router();

 charges.post("/", requireAuth, async (req, res) => {
   const { amount, currency, customerId } = req.body;

   const customer = await db.customer.findUnique({
     where: { id: customerId },
   });
   if (!customer) return res.status(404).json({ error: "not_found" });

   const charge = await stripe.charges.create({
     amount,
     currency,
     customer: customer.stripeId,
   });

   await db.charge.create({ data: { id: charge.id, customerId, amount } });
+  logger.info("charge.created", { id: charge.id, requestId: req.id, amount });
   return res.status(201).json(charge);
 });
`),
    reply: "Every charge now logs charge.created with the request id, following the event naming in refunds.ts.",
    files: [{ path: "api/charges.ts", add: 2, del: 0 }],
    summary: { files: 1, add: 2, del: 0 },
    notes: ["Use the shared pino logger.", "Event name follows refunds.ts: noun.verb."],
  },
];

/** The first step that writes to disk; Ask mode stops just before it. */
export const firstWrite = (task: Task) => task.steps.findIndex((s) => s.kind === "create" || s.kind === "edit");

/** Index of the change each diff line belongs to, or -1 for context. */
export function hunkIds(diff: DiffLine[]) {
  let hunk = -1;
  let inside = false;
  return diff.map((line) => {
    if (line.t === " ") {
      inside = false;
      return -1;
    }
    if (!inside) hunk++;
    inside = true;
    return hunk;
  });
}
