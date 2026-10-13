import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";
import { accessTo, me, mustBeMe, projectFor, teamOf, validEmail } from "./access";

/*
 * Studio projects, saved to their owner's account. Shared three ways: with people by email (who
 * can edit or view), with the owner's whole team (who can all edit), and as a view-only link.
 * Everyone with access works on the same project: a save is the whole project, the last one wins,
 * and every open Studio sees it the moment it lands.
 */

const AUTO_VERSION_EVERY = 10 * 60 * 1000;
/** Well under a Convex document's 1 MB; a real project is a few kilobytes. */
const MAX_BYTES = 600_000;
const sized = (data: unknown) => {
  if (JSON.stringify(data ?? null).length > MAX_BYTES) throw new Error("This project is too big to save.");
};

type Card = { id: Id<"projects">; name: string; template: string; updatedAt: number; role: string; owner: string; lead: string | null; shared: boolean };

async function card(ctx: Parameters<typeof accessTo>[0], p: Doc<"projects">, role: string): Promise<Card> {
  const owner = await authComponent.getAnyUserById(ctx, p.ownerId);
  const keys: string[] = p.data?.pages?.[0]?.keys ?? [];
  return { id: p._id, name: p.name, template: p.template, updatedAt: p.updatedAt, role, owner: owner?.name?.trim() || owner?.email || "", lead: keys.map((k) => k.split(":")[0]).find((id) => id !== "nav") ?? null, shared: Boolean(p.teamId) || p.linkAccess === "view" };
}

/** The Library's drafts: yours, your team's, and the ones shared with you. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await me(ctx);
    if (!user) return null;
    const mine = await ctx.db.query("projects").withIndex("by_owner", (q) => q.eq("ownerId", user._id)).order("desc").take(60);
    const t = await teamOf(ctx, user._id);
    const team = t ? (await ctx.db.query("projects").withIndex("by_team", (q) => q.eq("teamId", t.team._id)).order("desc").take(60)).filter((p) => p.ownerId !== user._id) : [];
    const invites = await ctx.db.query("projectMembers").withIndex("by_email", (q) => q.eq("email", user.email)).collect();
    const direct = (await Promise.all(invites.map((m) => ctx.db.get(m.projectId)))).filter((p): p is Doc<"projects"> => Boolean(p) && p!.ownerId !== user._id);
    return {
      mine: await Promise.all(mine.map((p) => card(ctx, p, "owner"))),
      team: await Promise.all(team.map((p) => card(ctx, p, "edit"))),
      shared: await Promise.all(direct.map((p) => card(ctx, p, invites.find((m) => m.projectId === p._id)?.role ?? "view"))),
      teamName: t?.team.name ?? null,
    };
  },
});

/** One project, for Studio: its contents and what you may do with it. Any string is asked about: a broken link is just not there. */
export const get = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const id = ctx.db.normalizeId("projects", args.id);
    const project = id ? await ctx.db.get(id) : null;
    if (!project) return null;
    const user = await me(ctx);
    const access = await accessTo(ctx, project, user);
    if (!access) return { denied: true as const, signedIn: Boolean(user) };
    const owner = access === "owner" ? null : await authComponent.getAnyUserById(ctx, project.ownerId);
    return { denied: false as const, id: project._id, data: project.data, rev: project.rev, client: project.updatedClient ?? null, access, owner: owner ? owner.name?.trim() || owner.email : null };
  },
});

export const create = mutation({
  args: { data: v.any(), client: v.optional(v.string()) },
  handler: async (ctx, { data, client }) => {
    const user = await mustBeMe(ctx);
    sized(data);
    return ctx.db.insert("projects", { ownerId: user._id, name: String(data?.name ?? "Untitled").slice(0, 120), template: String(data?.template ?? "zuno"), data, linkAccess: "none", updatedAt: Date.now(), updatedBy: user._id, updatedClient: client, rev: 1 });
  },
});

/**
 * Saves the whole project, if it's still the version the save was made from (`rev`). If someone
 * else saved in between, nothing changes and Studio merges their save with yours, then tries
 * again. Every ten minutes of editing also keeps an automatic version.
 */
export const save = mutation({
  args: { id: v.id("projects"), data: v.any(), rev: v.number(), client: v.string() },
  handler: async (ctx, { id, data, rev, client }) => {
    const { project, user } = await projectFor(ctx, id, "edit");
    if (project.rev !== rev) return { ok: false as const, rev: project.rev };
    sized(data);
    const now = Date.now();
    const last = await ctx.db.query("versions").withIndex("by_project", (q) => q.eq("projectId", id)).order("desc").first();
    if (!last || now - last._creationTime > AUTO_VERSION_EVERY) await ctx.db.insert("versions", { projectId: id, data: project.data, authorId: user!._id, authorName: user!.name, auto: true });
    const next = rev + 1;
    await ctx.db.patch(id, { data, name: String(data?.name ?? project.name).slice(0, 120), template: String(data?.template ?? project.template), updatedAt: now, updatedBy: user!._id, updatedClient: client, rev: next });
    return { ok: true as const, rev: next };
  },
});

export const remove = mutation({
  args: { id: v.id("projects") },
  handler: async (ctx, { id }) => {
    await projectFor(ctx, id, "owner");
    const rows = [
      ...(await ctx.db.query("projectMembers").withIndex("by_project", (q) => q.eq("projectId", id)).collect()),
      ...(await ctx.db.query("versions").withIndex("by_project", (q) => q.eq("projectId", id)).collect()),
      ...(await ctx.db.query("comments").withIndex("by_project", (q) => q.eq("projectId", id)).collect()),
      ...(await ctx.db.query("presence").withIndex("by_project", (q) => q.eq("projectId", id)).collect()),
    ];
    for (const r of rows) await ctx.db.delete(r._id);
    await ctx.db.delete(id);
  },
});

/* ---------- sharing ---------- */

/** Who a project is shared with, for the Share dialog. */
export const people = query({
  args: { id: v.id("projects") },
  handler: async (ctx, { id }) => {
    const { project, access } = await projectFor(ctx, id, "view");
    const owner = await authComponent.getAnyUserById(ctx, project.ownerId);
    const rows = await ctx.db.query("projectMembers").withIndex("by_project", (q) => q.eq("projectId", id)).collect();
    const t = await teamOf(ctx, project.ownerId);
    return {
      owner: { name: owner?.name?.trim() || owner?.email || "", email: owner?.email ?? "" },
      people: rows.map((m) => ({ id: m._id, email: m.email, role: m.role })),
      linkAccess: project.linkAccess,
      team: t ? { name: t.team.name, shared: project.teamId === t.team._id } : null,
      canManage: access === "owner",
    };
  },
});

export const invite = mutation({
  args: { id: v.id("projects"), email: v.string(), role: v.union(v.literal("edit"), v.literal("view")) },
  handler: async (ctx, args) => {
    const { project, user } = await projectFor(ctx, args.id, "owner");
    const email = args.email.trim().toLowerCase();
    if (!validEmail(email)) throw new Error("That doesn't look like an email address.");
    if (email === user!.email) throw new Error("That's you: you own this project.");
    const rows = await ctx.db.query("projectMembers").withIndex("by_project", (q) => q.eq("projectId", args.id)).collect();
    const known = rows.find((m) => m.email === email);
    if (known) return ctx.db.patch(known._id, { role: args.role });
    await ctx.db.insert("projectMembers", { projectId: args.id, email, role: args.role, invitedBy: user!._id });
    await ctx.scheduler.runAfter(0, internal.mail.projectShared, { projectId: project._id, email, role: args.role, inviter: user!.name });
  },
});

export const setRole = mutation({
  args: { memberId: v.id("projectMembers"), role: v.union(v.literal("edit"), v.literal("view")) },
  handler: async (ctx, { memberId, role }) => {
    const m = await ctx.db.get(memberId);
    if (!m) return;
    await projectFor(ctx, m.projectId, "owner");
    await ctx.db.patch(memberId, { role });
  },
});

export const unshare = mutation({
  args: { memberId: v.id("projectMembers") },
  handler: async (ctx, { memberId }) => {
    const m = await ctx.db.get(memberId);
    if (!m) return;
    await projectFor(ctx, m.projectId, "owner");
    await ctx.db.delete(memberId);
  },
});

export const setLink = mutation({
  args: { id: v.id("projects"), access: v.union(v.literal("none"), v.literal("view")) },
  handler: async (ctx, { id, access }) => {
    await projectFor(ctx, id, "owner");
    await ctx.db.patch(id, { linkAccess: access });
  },
});

/** Shares the project with everyone on the owner's team, or stops. */
export const setTeam = mutation({
  args: { id: v.id("projects"), shared: v.boolean() },
  handler: async (ctx, { id, shared }) => {
    const { project } = await projectFor(ctx, id, "owner");
    const t = await teamOf(ctx, project.ownerId);
    if (shared && !t) throw new Error("You're not on a team yet.");
    await ctx.db.patch(id, { teamId: shared ? t!.team._id : undefined });
  },
});

/** A project as its view-only link shows it: anyone may read it when its link is on. */
export const view = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const id = ctx.db.normalizeId("projects", args.id);
    const project = id ? await ctx.db.get(id) : null;
    if (!project) return null;
    const access = await accessTo(ctx, project, await me(ctx));
    if (!access) return null;
    const owner = await authComponent.getAnyUserById(ctx, project.ownerId);
    return { data: project.data, owner: owner?.name?.trim() || owner?.email?.split("@")[0] || "", updatedAt: project.updatedAt, access };
  },
});
