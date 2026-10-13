import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { brand, sendEmail } from "./emails/send";
import { purchaseReady } from "./emails/templates";
import { PRODUCTS, type Product } from "./products";

/** The order's email: what's theirs now, and the two ways to take it, a download or a GitHub repository. */
export const send = internalAction({
  args: { purchaseId: v.id("purchases") },
  handler: async (ctx, { purchaseId }) => {
    const p = await ctx.runQuery(internal.purchases.get, { id: purchaseId });
    if (!p) return;
    const product = PRODUCTS[p.product as Product];
    await sendEmail(p.email, purchaseReady(brand(), { product: p.product, name: product?.name ?? p.product, template: product?.template ?? false, order: p.paymentId, amount: p.amount, currency: p.currency }));
  },
});
