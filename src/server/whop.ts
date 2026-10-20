import type { Result } from "@/lib/api";
import { isProduct, PRODUCTS } from "@/lib/products";
import { asBasedraft, call } from "./supabase";

/*
 * Whop: checkouts, and the webhook that says what was paid, refunded or ended. Needs WHOP_API_KEY,
 * each product's WHOP_PLAN_*, and WHOP_WEBHOOK_SECRET for the webhook at <site>/api/whop/webhook.
 */

/** What went wrong opening a checkout, in words for the buyer. */
export class CheckoutError extends Error {}

/**
 * A Whop checkout for one product, for the signed-in person. The checkout carries their basedraft
 * id and email as metadata, which Whop copies onto the payment and its webhook, so the purchase
 * lands on the right account.
 */
export async function startCheckout(product: string, user: { id: string; email: string }) {
  if (!isProduct(product)) throw new CheckoutError("There's nothing called that to buy.");
  const key = process.env.WHOP_API_KEY;
  const plan = process.env[PRODUCTS[product].env];
  if (!key || !plan) throw new CheckoutError("Checkout isn't connected yet.");
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://basedraft.site";
  const res = await fetch("https://api.whop.com/api/v1/checkout_configurations", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Api-Version-Date": "2026-07-01" },
    body: JSON.stringify({
      plan_id: plan,
      metadata: { bd_user: user.id, bd_email: user.email, bd_product: product },
      redirect_url: `${site}/purchases?checkout=done&product=${product}`,
    }),
  });
  const body = (await res.json().catch(() => ({}))) as { purchase_url?: string; message?: string; error?: { message?: string } };
  if (!res.ok || !body.purchase_url) throw new CheckoutError(body.error?.message ?? body.message ?? "Whop didn't open a checkout.");
  return body.purchase_url;
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

/**
 * One webhook event, recorded: payments, refunds and ended subscriptions. Each event counts once,
 * however often Whop delivers it. A new purchase comes back, for its order email.
 */
export async function recordEvent(event: { id?: string; type: string; data: Record<string, unknown> }, eventId: string): Promise<Result<"record_purchase">> {
  const db = asBasedraft();
  if (event.type === "payment.succeeded") {
    const p = event.data as unknown as Payment;
    const meta = p.metadata ?? {};
    const product = meta.bd_product;
    const email = meta.bd_email ?? p.user?.email ?? p.email;
    // Not one of basedraft's checkouts (or a product it doesn't sell): nothing to deliver.
    if (!product || !isProduct(product) || !email) return null;
    return call(db, "record_purchase", {
      event_id: eventId,
      user_id: meta.bd_user,
      email,
      product,
      payment_id: p.id,
      membership_id: typeof p.membership === "string" ? p.membership : (p.membership?.id ?? p.membership_id ?? undefined),
      plan_id: typeof p.plan === "string" ? p.plan : (p.plan?.id ?? undefined),
      amount: p.total ?? p.usd_total ?? undefined,
      currency: p.currency ?? undefined,
    });
  }
  if (event.type === "refund.created") {
    const r = event.data as { payment?: { id?: string } | string; payment_id?: string };
    const paymentId = typeof r.payment === "string" ? r.payment : (r.payment?.id ?? r.payment_id);
    if (paymentId) await call(db, "end_purchase", { event_id: eventId, payment_id: paymentId, status: "refunded" });
  } else if (event.type === "membership.deactivated" || event.type === "membership.went_invalid") {
    const m = event.data as { id?: string };
    if (m.id) await call(db, "end_purchase", { event_id: eventId, membership_id: m.id, status: "ended" });
  }
  return null;
}
