import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { projectFor } from "./access";

/* Saved versions of a project: named ones you make, and the automatic ones saving keeps. */

export const list = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    await projectFor(ctx, projectId, "view");
    const rows = await ctx.db.query("versions").withIndex("by_project", (q) => q.eq("projectId", projectId)).order("desc").take(50);
    return rows.map((r) => ({ id: r._id, name: r.name ?? null, at: r._creationTime, author: r.authorName, auto: r.auto }));
  },
});

/** Keeps the project as it is now, under a name. */
export const save = mutation({
  args: { projectId: v.id("projects"), name: v.string() },
  handler: async (ctx, { projectId, name }) => {
    const { project, user } = await projectFor(ctx, projectId, "edit");
    await ctx.db.insert("versions", { projectId, name: name.trim().slice(0, 80) || "Saved version", data: project.data, authorId: user!._id, authorName: user!.name, auto: false });
  },
});

/** A version's contents, to restore in Studio (which saves it as the project again). */
export const get = query({
  args: { id: v.id("versions") },
  handler: async (ctx, { id }) => {
    const ver = await ctx.db.get(id);
    if (!ver) return null;
    await projectFor(ctx, ver.projectId, "edit");
    return { data: ver.data, name: ver.name ?? null, at: ver._creationTime };
  },
});
