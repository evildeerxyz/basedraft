import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { me, mustBeMe } from "./access";

/* Sections saved to your Library, to drop into any page of their template. */

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await me(ctx);
    if (!user) return null;
    const rows = await ctx.db.query("saved").withIndex("by_user", (q) => q.eq("userId", user._id)).order("desc").take(100);
    return rows.map((r) => ({ id: r._id, template: r.template, sectionId: r.sectionId, at: r._creationTime }));
  },
});

export const add = mutation({
  args: { template: v.string(), sectionId: v.string() },
  handler: async (ctx, { template, sectionId }) => {
    const user = await mustBeMe(ctx);
    const rows = await ctx.db.query("saved").withIndex("by_user", (q) => q.eq("userId", user._id)).collect();
    if (rows.some((r) => r.template === template && r.sectionId === sectionId)) return;
    await ctx.db.insert("saved", { userId: user._id, template, sectionId });
  },
});

export const remove = mutation({
  args: { id: v.id("saved") },
  handler: async (ctx, { id }) => {
    const user = await mustBeMe(ctx);
    const r = await ctx.db.get(id);
    if (r && r.userId === user._id) await ctx.db.delete(id);
  },
});
