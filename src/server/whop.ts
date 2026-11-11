import { TIP } from "@/lib/tip";

/*
 * Whop, for the one thing basedraft takes money for: buying its maker a Claude plan, for whatever
 * amount someone types. Each one is a Whop checkout made for that amount, a one-time payment, with
 * a plan made on the spot under one product. Needs WHOP_API_KEY (allowed to make checkouts, plans
 * and products) and WHOP_COMPANY_ID (biz_...). WHOP_TIP_PRODUCT (prod_...) is optional: without
 * it, Whop finds or makes the product by its identifier below.
 */

/** What went wrong opening a checkout, in words for the person paying. */
export class CheckoutError extends Error {}

/** Whether the keys are here, so the dialog can say so before anyone types an amount. */
export const tipsOpen = () => Boolean(process.env.WHOP_API_KEY && process.env.WHOP_COMPANY_ID);

/** A Whop checkout for a Claude plan of `amount` dollars. Answers with where to send the person paying. */
export async function startTip(amount: number) {
  if (!Number.isFinite(amount) || amount < TIP.min || amount > TIP.max) throw new CheckoutError(`Pick an amount from $${TIP.min} to $${TIP.max.toLocaleString("en-US")}.`);
  const key = process.env.WHOP_API_KEY;
  const company = process.env.WHOP_COMPANY_ID;
  if (!key || !company) throw new CheckoutError("Payments are being connected. Try again soon.");
  const dollars = Math.round(amount * 100) / 100;
  const product = process.env.WHOP_TIP_PRODUCT;
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://basedraft.site";
  const res = await fetch("https://api.whop.com/api/v1/checkout_configurations", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Api-Version-Date": "2026-07-01" },
    body: JSON.stringify({
      mode: "payment",
      plan: {
        company_id: company,
        currency: "usd",
        initial_price: dollars,
        plan_type: "one_time",
        release_method: "buy_now",
        // Made for this one checkout, so it stays off the product's public page.
        visibility: "hidden",
        title: "A Claude plan for basedraft",
        ...(product ? { product_id: product } : { product: { external_identifier: "basedraft-claude-plan", title: "Buy me a Claude plan", description: "basedraft is free and open source. This pays for the Claude plan that builds it." } }),
      },
      metadata: { bd_tip: String(dollars) },
      redirect_url: `${site}/?tip=thanks`,
    }),
  });
  const body = (await res.json().catch(() => ({}))) as { purchase_url?: string; message?: string; error?: { message?: string } };
  if (!res.ok || !body.purchase_url) {
    console.error("Whop checkout:", res.status, body.error?.message ?? body.message ?? "no purchase_url");
    throw new CheckoutError("Whop didn't open a checkout. Try again in a moment.");
  }
  return body.purchase_url;
}
