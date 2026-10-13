import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";
import { isProduct } from "./products";

/*
 * Whop's webhook: payments, refunds and ended subscriptions. Signed per Standard Webhooks:
 * HMAC-SHA256 of "{webhook-id}.{webhook-timestamp}.{body}", keyed with WHOP_WEBHOOK_SECRET.
 * Register https://<deployment>.convex.site/whop/webhook in Whop's dashboard.
 */

const enc = new TextEncoder();
const b64 = (bytes: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(bytes)));

/** Whop's `ws_` secrets sign with their own bytes; Standard Webhooks' `whsec_` ones with the base64 after the prefix. */
const keyBytes = (secret: string) => (secret.startsWith("whsec_") ? Uint8Array.from(atob(secret.slice(6)), (c) => c.charCodeAt(0)) : enc.encode(secret));

async function verified(req: Request, body: string) {
  const secret = process.env.WHOP_WEBHOOK_SECRET;
  const id = req.headers.get("webhook-id");
  const ts = req.headers.get("webhook-timestamp");
  const sigs = req.headers.get("webhook-signature");
  if (!secret || !id || !ts || !sigs) return false;
  // Older than five minutes, or from the future: a replay.
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false;
  const key = await crypto.subtle.importKey("raw", keyBytes(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const expected = b64(await crypto.subtle.sign("HMAC", key, enc.encode(`${id}.${ts}.${body}`)));
  // The header can carry several signatures, "v1,<sig> v1,<sig>", while a secret rotates.
  return sigs.split(" ").some((s) => {
    const sig = s.split(",")[1] ?? "";
    if (sig.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
    return diff === 0;
  });
}

type Payment = {
  id: string;
  metadata?: Record<string, string> | null;
  user?: { email?: string | null } | null;
  email?: string | null;
  membership?: { id?: string } | string | null;
  membership_id?: string | null;
  plan?: { id?: string } | string | null;
  total?: number | null;
  usd_total?: number | null;
  currency?: string | null;
};

export const webhook = httpAction(async (ctx, req) => {
  const body = await req.text();
  if (!(await verified(req, body))) return new Response("Bad signature", { status: 401 });
  const event = JSON.parse(body) as { id?: string; type: string; data: Record<string, unknown> };
  const eventId = req.headers.get("webhook-id") ?? event.id ?? "";

  if (event.type === "payment.succeeded") {
    const p = event.data as unknown as Payment;
    const meta = p.metadata ?? {};
    const product = meta.bd_product;
    const email = meta.bd_email ?? p.user?.email ?? p.email;
    // Not one of basedraft's checkouts (or a product it doesn't sell): nothing to deliver.
    if (product && isProduct(product) && email)
      await ctx.runMutation(internal.purchases.record, {
        eventId,
        userId: meta.bd_user,
        email,
        product,
        paymentId: p.id,
        membershipId: typeof p.membership === "string" ? p.membership : (p.membership?.id ?? p.membership_id ?? undefined),
        planId: typeof p.plan === "string" ? p.plan : (p.plan?.id ?? undefined),
        amount: p.total ?? p.usd_total ?? undefined,
        currency: p.currency ?? undefined,
      });
  } else if (event.type === "refund.created") {
    const r = event.data as { payment?: { id?: string } | string; payment_id?: string };
    const paymentId = typeof r.payment === "string" ? r.payment : (r.payment?.id ?? r.payment_id);
    if (paymentId) await ctx.runMutation(internal.purchases.end, { eventId, paymentId, status: "refunded" });
  } else if (event.type === "membership.deactivated" || event.type === "membership.went_invalid") {
    const m = event.data as { id?: string };
    if (m.id) await ctx.runMutation(internal.purchases.end, { eventId, membershipId: m.id, status: "ended" });
  }
  // Whop wants an answer within five seconds; the email goes out on its own.
  return new Response("OK", { status: 200 });
});
