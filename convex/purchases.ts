import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import { internalMutation, internalQuery, query, type QueryCtx } from "./_generated/server";
import { teamOf } from "./access";
import { authComponent } from "./auth";
import { unlocked } from "./products";

/* What someone has bought, and what it lets them take. */

async function activeFor(ctx: QueryCtx, user: { _id: string; email: string }) {
  const byId = await ctx.db.query("purchases").withIndex("by_user", (q) => q.eq("userId", user._id)).collect();
  // Bought before signing up, or straight from Whop: matched by the email it was bought with.
  const byEmail = await ctx.db.query("purchases").withIndex("by_email", (q) => q.eq("email", user.email.toLowerCase())).collect();
  const seen = new Set<string>();
  return [...byId, ...byEmail].filter((p) => p.status === "active" && !seen.has(p._id) && seen.add(p._id));
}

/** Someone on a team whose owner has the Team plan has Pro through it, for as long as they're on it. */
async function viaTeam(ctx: QueryCtx, user: { _id: string; email: string }) {
  const t = await teamOf(ctx, user._id);
  if (!t || t.role === "owner") return false;
  const owner = await authComponent.getAnyUserById(ctx, t.team.ownerId);
  if (!owner) return false;
  return (await activeFor(ctx, { _id: owner._id, email: owner.email })).some((p) => p.product === "team");
}

/** Everything someone may take: what they bought, plus Pro from their team. */
async function productsFor(ctx: QueryCtx, user: { _id: string; email: string }) {
  const rows = await activeFor(ctx, user);
  const products = [...new Set(rows.map((r) => r.product))];
  if (!products.includes("pro") && !products.includes("team") && (await viaTeam(ctx, user))) products.push("pro");
  return { rows, products };
}

/** The signed-in person's purchases and the templates they unlock, or null when signed out. */
export const mine = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) return null;
    const { rows, products } = await productsFor(ctx, user);
    return {
      products,
      templates: unlocked(products),
      pro: products.includes("pro") || products.includes("team"),
      viaTeam: !rows.some((r) => r.product === "pro" || r.product === "team") && products.includes("pro"),
      purchases: rows.map((r: Doc<"purchases">) => ({ id: r._id, product: r.product, at: r._creationTime, amount: r.amount, currency: r.currency })),
    };
  },
});

/** Whether the signed-in person may take a template's code. */
export const owns = query({
  args: { template: v.string() },
  handler: async (ctx, { template }) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) return false;
    const { products } = await productsFor(ctx, user);
    return unlocked(products).includes(template as never);
  },
});

/** A paid order, from the webhook. Recording the same payment twice changes nothing. */
export const record = internalMutation({
  args: { eventId: v.string(), userId: v.optional(v.string()), email: v.string(), product: v.string(), paymentId: v.string(), membershipId: v.optional(v.string()), planId: v.optional(v.string()), amount: v.optional(v.number()), currency: v.optional(v.string()) },
  handler: async (ctx, a) => {
    if (await ctx.db.query("webhookEvents").withIndex("by_event", (q) => q.eq("eventId", a.eventId)).first()) return null;
    await ctx.db.insert("webhookEvents", { eventId: a.eventId });
    const known = await ctx.db.query("purchases").withIndex("by_payment", (q) => q.eq("paymentId", a.paymentId)).first();
    if (known) return null;
    const id = await ctx.db.insert("purchases", { userId: a.userId, email: a.email.toLowerCase(), product: a.product, paymentId: a.paymentId, membershipId: a.membershipId, planId: a.planId, amount: a.amount, currency: a.currency, status: "active" });
    // The order's email, with the download and GitHub links, goes out from an action.
    await ctx.scheduler.runAfter(0, internal.delivery.send, { purchaseId: id });
    return id;
  },
});

/** A refund or an ended subscription takes the purchase's access away. */
export const end = internalMutation({
  args: { eventId: v.string(), paymentId: v.optional(v.string()), membershipId: v.optional(v.string()), status: v.union(v.literal("refunded"), v.literal("ended")) },
  handler: async (ctx, { eventId, paymentId, membershipId, status }) => {
    if (await ctx.db.query("webhookEvents").withIndex("by_event", (q) => q.eq("eventId", eventId)).first()) return;
    await ctx.db.insert("webhookEvents", { eventId });
    const row = paymentId
      ? await ctx.db.query("purchases").withIndex("by_payment", (q) => q.eq("paymentId", paymentId)).first()
      : membershipId
        ? await ctx.db.query("purchases").withIndex("by_membership", (q) => q.eq("membershipId", membershipId)).first()
        : null;
    if (row) await ctx.db.patch(row._id, { status });
  },
});

export const get = internalQuery({
  args: { id: v.id("purchases") },
  handler: async (ctx, { id }) => ctx.db.get(id),
});
