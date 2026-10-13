import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { colorFor, projectFor } from "./access";

/* Comments pinned to a spot on a page of a project, as in Figma: a thread per pin. */

export const list = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    await projectFor(ctx, projectId, "view");
    const rows = await ctx.db.query("comments").withIndex("by_project", (q) => q.eq("projectId", projectId)).collect();
    return rows.map((c) => ({ id: c._id, view: c.view, device: c.device ?? null, anchor: c.anchor ?? null, x: c.x, y: c.y, parentId: c.parentId ?? null, author: c.authorName, authorId: c.authorId, color: colorFor(c.authorId), body: c.body, resolved: Boolean(c.resolved), at: c._creationTime }));
  },
});

/** A new pin, or a reply in a pin's thread. Anyone who can view a project can comment on it. */
export const create = mutation({
  args: { projectId: v.id("projects"), view: v.string(), device: v.optional(v.string()), anchor: v.optional(v.string()), x: v.number(), y: v.number(), body: v.string(), parentId: v.optional(v.id("comments")) },
  handler: async (ctx, a) => {
    const { user } = await projectFor(ctx, a.projectId, "view");
    if (!user) throw new Error("Sign in to comment.");
    const body = a.body.trim().slice(0, 4000);
    if (!body) throw new Error("Write something first.");
    if (a.parentId) {
      const parent = await ctx.db.get(a.parentId);
      if (!parent || parent.projectId !== a.projectId) throw new Error("That thread isn't there any more.");
    }
    return ctx.db.insert("comments", { projectId: a.projectId, view: a.view, device: a.device, anchor: a.anchor, x: a.x, y: a.y, parentId: a.parentId, authorId: user._id, authorName: user.name, body });
  },
});

export const resolve = mutation({
  args: { id: v.id("comments"), resolved: v.boolean() },
  handler: async (ctx, { id, resolved }) => {
    const c = await ctx.db.get(id);
    if (!c) return;
    await projectFor(ctx, c.projectId, "view");
    await ctx.db.patch(id, { resolved });
  },
});

/** Deletes a comment (its author, or the project's owner); a pin goes with its whole thread. */
export const remove = mutation({
  args: { id: v.id("comments") },
  handler: async (ctx, { id }) => {
    const c = await ctx.db.get(id);
    if (!c) return;
    const { user, access } = await projectFor(ctx, c.projectId, "view");
    if (c.authorId !== user?._id && access !== "owner") throw new Error("Only its author or the project's owner can delete a comment.");
    for (const r of await ctx.db.query("comments").withIndex("by_parent", (q) => q.eq("parentId", id)).collect()) await ctx.db.delete(r._id);
    await ctx.db.delete(id);
  },
});
