import { ConvexError, v } from "convex/values";
import { action } from "./_generated/server";
import { authComponent } from "./auth";
import { isProduct, PRODUCTS } from "./products";

/**
 * A Whop checkout for one product, for the signed-in person. The checkout carries their basedraft
 * id and email as metadata, which Whop copies onto the payment and its webhook, so the purchase
 * lands on the right account. Needs WHOP_API_KEY and the product's WHOP_PLAN_* on the deployment.
 */
export const start = action({
  args: { product: v.string() },
  handler: async (ctx, { product }) => {
    if (!isProduct(product)) throw new ConvexError("There's nothing called that to buy.");
    const user = await authComponent.getAuthUser(ctx);
    const key = process.env.WHOP_API_KEY;
    const plan = process.env[PRODUCTS[product].env];
    if (!key || !plan) throw new ConvexError("Checkout isn't connected yet.");
    const site = process.env.SITE_URL ?? "https://basedraft.site";
    const res = await fetch("https://api.whop.com/api/v1/checkout_configurations", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Api-Version-Date": "2026-07-01" },
      body: JSON.stringify({
        plan_id: plan,
        metadata: { bd_user: user._id, bd_email: user.email, bd_product: product },
        redirect_url: `${site}/purchases?checkout=done&product=${product}`,
      }),
    });
    const body = (await res.json().catch(() => ({}))) as { purchase_url?: string; message?: string; error?: { message?: string } };
    if (!res.ok || !body.purchase_url) throw new ConvexError(body.error?.message ?? body.message ?? "Whop didn't open a checkout.");
    return { url: body.purchase_url };
  },
});
