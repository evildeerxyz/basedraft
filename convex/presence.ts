import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { colorFor, projectFor } from "./access";

/*
 * Who's in a project now and where their pointer is. Each open Studio updates its row a few
 * times a second while the pointer moves, and every few seconds otherwise; a row nobody has
 * touched for a while is someone who left.
 */

const FRESH = 20_000;

export const list = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const { user } = await projectFor(ctx, projectId, "view");
    const since = Date.now() - FRESH;
    const rows = await ctx.db.query("presence").withIndex("by_project", (q) => q.eq("projectId", projectId)).collect();
    return rows.filter((r) => r.at > since && r.userId !== user?._id).map((r) => ({ userId: r.userId, name: r.name, color: r.color, view: r.view, device: r.device ?? null, x: r.x ?? null, y: r.y ?? null, selected: r.selected ?? null, at: r.at }));
  },
});

export const update = mutation({
  args: { projectId: v.id("projects"), view: v.string(), device: v.optional(v.string()), x: v.optional(v.number()), y: v.optional(v.number()), selected: v.optional(v.string()) },
  handler: async (ctx, a) => {
    const { user } = await projectFor(ctx, a.projectId, "view");
    if (!user) return;
    const row = await ctx.db.query("presence").withIndex("by_project_user", (q) => q.eq("projectId", a.projectId).eq("userId", user._id)).first();
    const next = { view: a.view, device: a.device, x: a.x, y: a.y, selected: a.selected, at: Date.now(), name: user.name };
    if (row) await ctx.db.patch(row._id, next);
    else await ctx.db.insert("presence", { projectId: a.projectId, userId: user._id, color: colorFor(user._id), ...next });
  },
});

export const leave = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const { user } = await projectFor(ctx, projectId, "view");
    if (!user) return;
    const row = await ctx.db.query("presence").withIndex("by_project_user", (q) => q.eq("projectId", projectId).eq("userId", user._id)).first();
    if (row) await ctx.db.delete(row._id);
  },
});

/** Clears out people who left without saying so (a closed laptop). */
export const sweep = internalMutation({
  args: {},
  handler: async (ctx) => {
    const old = await ctx.db.query("presence").withIndex("by_at", (q) => q.lt("at", Date.now() - 10 * 60_000)).take(500);
    for (const r of old) await ctx.db.delete(r._id);
  },
});
