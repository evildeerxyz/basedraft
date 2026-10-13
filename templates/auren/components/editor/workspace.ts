/**
 * Everything around the live agent session: the files you can open, the
 * sidebar's inbox, rules and past sessions, and the composer's menus.
 */

const lines = (src: string) => src.replace(/^\n/, "").replace(/\n$/, "").split("\n");

export const CHARGES = "api/charges.ts";

/** Starting contents of every file except charges.ts, which lives in session.ts. */
export const FILES: Record<string, string[]> = {
  "api/refunds.ts": lines(`
import { Router } from "express";
import { db } from "../lib/db";
import { logger } from "../lib/logger";
import { stripe } from "../lib/stripe";
import { requireAuth } from "../middleware/auth";

export const refunds = Router();

refunds.post("/", requireAuth, async (req, res) => {
  const key = req.header("Idempotency-Key");
  const seen = key ? await db.idempotency.findUnique({ where: { key } }) : null;
  if (seen) return res.status(seen.status).json(seen.body);

  const refund = await stripe.refunds.create(
    { charge: req.body.chargeId },
    { idempotencyKey: key },
  );
  if (key) await db.idempotency.create({ data: { key, status: 201, body: refund } });
  logger.info("refund.created", { id: refund.id, requestId: req.id });
  return res.status(201).json(refund);
});
`),
  "api/webhooks.ts": lines(`
import { Router } from "express";
import { retry } from "../lib/retry";
import { stripe } from "../lib/stripe";

export const webhooks = Router();

webhooks.post("/stripe", async (req, res) => {
  const signature = req.header("stripe-signature") ?? "";
  const event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_SECRET);

  await retry(() => dispatch(event), { attempts: 5 });
  res.sendStatus(200);
});
`),
  "lib/db.ts": lines(`
import { PrismaClient } from "@prisma/client";

export const db = new PrismaClient({
  log: process.env.DEBUG ? ["query"] : [],
});
`),
  "lib/idempotency.ts": lines(`
// Extracted from the pattern in api/refunds.ts.
import type { NextFunction, Request, Response } from "express";
import { db } from "./db";

const WINDOW_MS = 24 * 60 * 60 * 1000;

/** Replays the stored response when a request repeats its Idempotency-Key. */
export function withIdempotency(scope: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = req.header("Idempotency-Key");
    if (!key) return next();
    req.idempotencyKey = \`\${scope}:\${key}\`;

    const seen = await db.idempotency.findUnique({ where: { key: req.idempotencyKey } });
    if (seen && Date.now() - seen.createdAt.getTime() < WINDOW_MS) {
      return res.status(seen.status).json(seen.body);
    }

    const json = res.json.bind(res);
    res.json = (body: unknown) => {
      db.idempotency
        .create({ data: { key: req.idempotencyKey!, status: res.statusCode, body } })
        .catch(() => {});
      return json(body);
    };
    next();
  };
}
`),
  "lib/logger.ts": lines(`
import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: ["req.headers.authorization"],
});
`),
  "test/charges.test.ts": lines(`
import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../src/app";

const body = { amount: 1200, currency: "usd", customerId: "cus_1" };

describe("POST /charges", () => {
  it("creates a charge", async () => {
    const res = await request(app).post("/charges").send(body);
    expect(res.status).toBe(201);
  });

  it("rejects unknown customers", async () => {
    const res = await request(app).post("/charges").send({ ...body, customerId: "nope" });
    expect(res.status).toBe(404);
  });
});
`),
  "package.json": lines(`
{
  "name": "ledger",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "test": "vitest run"
  },
  "dependencies": {
    "express": "^4.21.0",
    "pino": "^9.4.0",
    "stripe": "^17.2.0",
    "zod": "^3.23.8"
  }
}
`),
};

/** Files the agent creates, hidden from the explorer until it does. */
export const CREATED_BY: Record<string, string> = { "lib/idempotency.ts": "idempotent" };

export type TreeNode = { name: string; depth: number; dir?: string; path?: string; parents: string[] };

export const TREE: TreeNode[] = [
  { name: "src", depth: 0, dir: "src", parents: [] },
  { name: "api", depth: 1, dir: "api", parents: ["src"] },
  { name: "charges.ts", depth: 2, path: CHARGES, parents: ["src", "api"] },
  { name: "refunds.ts", depth: 2, path: "api/refunds.ts", parents: ["src", "api"] },
  { name: "webhooks.ts", depth: 2, path: "api/webhooks.ts", parents: ["src", "api"] },
  { name: "lib", depth: 1, dir: "lib", parents: ["src"] },
  { name: "db.ts", depth: 2, path: "lib/db.ts", parents: ["src", "lib"] },
  { name: "idempotency.ts", depth: 2, path: "lib/idempotency.ts", parents: ["src", "lib"] },
  { name: "logger.ts", depth: 2, path: "lib/logger.ts", parents: ["src", "lib"] },
  { name: "test", depth: 0, dir: "test", parents: [] },
  { name: "charges.test.ts", depth: 1, path: "test/charges.test.ts", parents: ["test"] },
  { name: "package.json", depth: 0, path: "package.json", parents: [] },
];

export const PAST_SESSIONS = [
  {
    id: "rate-limit",
    title: "Rate limit POST /charges",
    when: "2h",
    prompt: "Add rate limiting to POST /charges",
    branch: "agent/rate-limit",
    steps: [
      { verb: "Read", target: "lib/limit.ts", detail: "existing limiter" },
      { verb: "Edited", target: "api/charges.ts", detail: "+2 -1" },
      { verb: "Ran", target: "charges.test.ts", detail: "14 passed" },
    ],
    reply: "POST /charges now shares the limiter refunds.ts uses, keyed by account at 30 requests a minute.",
    diff: "+48 -3",
    status: "review" as "review" | "merged",
  },
  {
    id: "flaky",
    title: "Fix flaky webhook test",
    when: "Tue",
    prompt: "Why does the webhook retry test fail on CI?",
    branch: "agent/flaky-retry",
    steps: [
      { verb: "Reproduced", target: "webhooks.test.ts", detail: "3 of 40 runs" },
      { verb: "Bisected", target: "12 commits", detail: "a41f9c2" },
      { verb: "Edited", target: "test/clock.ts", detail: "+6 -2" },
    ],
    reply: "The retry used real timers while the test used fake ones. Both now share the mocked clock; 200 runs pass.",
    diff: "+6 -2",
    status: "merged" as "review" | "merged",
  },
  {
    id: "sdk-docs",
    title: "Document the Ledger SDK",
    when: "Mon",
    prompt: "Write reference docs for the Ledger SDK",
    branch: "agent/sdk-docs",
    steps: [
      { verb: "Read", target: "packages/sdk", detail: "64 files" },
      { verb: "Wrote", target: "docs/sdk", detail: "11 pages" },
      { verb: "Ran", target: "examples", detail: "all compile" },
    ],
    reply: "Eleven pages, one per public module, and every example is compiled in CI so it cannot rot.",
    diff: "+1,180",
    status: "merged" as "review" | "merged",
  },
];

export type InboxItem = { id: string; title: string; body: string; when: string; action: "session" | "agents" | "rule" };

export const INBOX: InboxItem[] = [
  {
    id: "rate-limit",
    title: "Rate limit POST /charges is ready",
    body: "agent/rate-limit · +48 -3 · 14 tests passed",
    when: "2h",
    action: "session",
  },
  {
    id: "react-19",
    title: "React 19 upgrade needs a decision",
    body: "Three components use legacy context. Migrate them, or pin react-dom 18?",
    when: "40m",
    action: "agents",
  },
  {
    id: "suggested-rule",
    title: "Suggested rule from your last four reviews",
    body: "You dropped every change that keyed limits by IP.",
    when: "1d",
    action: "rule",
  },
];

export const SUGGESTED_RULE = "Key rate limits by account, never by IP.";

export const RULES = [
  "Validate request bodies with zod schemas from lib/schemas.",
  "Return errors in the shape defined in lib/errors.ts.",
  "Every handler that moves money must be idempotent.",
  "Log events as noun.verb with the request id.",
];

export const MODELS = [
  { id: "auren-1", label: "auren-1", note: "Balanced. The default." },
  { id: "auren-1-max", label: "auren-1 max", note: "Slower, for large refactors." },
  { id: "local", label: "qwen3-coder", note: "Local. Nothing leaves the machine." },
];

export const MODES = [
  { id: "background", label: "Background", note: "Works on its own branch." },
  { id: "pair", label: "Pair", note: "Edits with you, in your tree." },
  { id: "ask", label: "Ask", note: "Answers only. No edits." },
];

/** Prefix-to-completion pairs that make Tab feel alive when you type. */
export const PREDICTIONS: Array<[string, string]> = [
  ["await db.charge.create({ ", "data: { id: charge.id, customerId, amount } });"],
  ["await db.charge.create({", " data: { id: charge.id, customerId, amount } });"],
  ["await db.", "charge.create({ data: { id: charge.id, customerId, amount } });"],
  ["logger.", `info("charge.created", { id: charge.id, requestId: req.id });`],
  ["return res.", "status(201).json(charge);"],
  ["if (!", `customer) return res.status(404).json({ error: "not_found" });`],
  ["const charge = ", "await stripe.charges.create({ amount, currency, customer: customer.stripeId });"],
  ["import { ", `logger } from "../lib/logger";`],
  ["it(\"", `rejects negative amounts", async () => {`],
  ["expect(", "res.status).toBe(422);"],
];

export function predict(line: string) {
  const typed = line.trimStart();
  if (!typed) return null;
  for (const [prefix, completion] of PREDICTIONS) if (typed === prefix) return completion;
  return null;
}

/** Keywords that route a typed request to one of the recorded sessions. */
export const INTENT_KEYWORDS = [
  ["idempot", "retry", "retries", "double charge", "twice"],
  ["zod", "valid", "schema", "payload"],
  ["log", "request id", "observab", "trace"],
];

export const COMMANDS = [
  { id: "idempotent", label: "/idempotent", note: "Make POST /charges idempotent" },
  { id: "zod", label: "/validate", note: "Validate the body with zod" },
  { id: "logging", label: "/log", note: "Log every charge with the request id" },
  { id: "review", label: "/review", note: "Open the current session" },
  { id: "reset", label: "/reset", note: "Put the demo back the way it was" },
];

export const basename = (path: string) => path.split("/").pop() ?? path;
