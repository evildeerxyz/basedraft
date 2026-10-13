import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { authComponent } from "./auth";

/*
 * Who's asking, and what they may do with a project. Every project and team function goes
 * through here, so access is decided in one place.
 */

export type Me = { _id: string; email: string; name: string };

export async function me(ctx: QueryCtx): Promise<Me | null> {
  const u = await authComponent.safeGetAuthUser(ctx);
  return u ? { _id: u._id, email: u.email.toLowerCase(), name: u.name?.trim() || u.email.split("@")[0] } : null;
}

export async function mustBeMe(ctx: QueryCtx) {
  const u = await me(ctx);
  if (!u) throw new Error("Sign in first.");
  return u;
}

/** The team someone owns or is an active member of, with their role in it. */
export async function teamOf(ctx: QueryCtx, userId: string): Promise<{ team: Doc<"teams">; role: "owner" | "member" } | null> {
  const owned = await ctx.db.query("teams").withIndex("by_owner", (q) => q.eq("ownerId", userId)).first();
  if (owned) return { team: owned, role: "owner" };
  const seat = (await ctx.db.query("teamMembers").withIndex("by_user", (q) => q.eq("userId", userId)).collect()).find((m) => m.status === "active");
  const team = seat ? await ctx.db.get(seat.teamId) : null;
  return team ? { team, role: "member" } : null;
}

export type Access = "owner" | "edit" | "view";
const RANK: Record<Access, number> = { view: 1, edit: 2, owner: 3 };
export const atLeast = (a: Access | null, need: Access) => a !== null && RANK[a] >= RANK[need];

/** What `user` may do with `project`: own it, edit it (shared, or their team's), view it, or nothing. */
export async function accessTo(ctx: QueryCtx, project: Doc<"projects">, user: Me | null): Promise<Access | null> {
  if (user) {
    if (project.ownerId === user._id) return "owner";
    if (project.teamId) {
      const team = await teamOf(ctx, user._id);
      if (team && team.team._id === project.teamId) return "edit";
    }
    const shared = (await ctx.db.query("projectMembers").withIndex("by_project", (q) => q.eq("projectId", project._id)).collect()).find((m) => m.email === user.email);
    if (shared) return shared.role;
  }
  return project.linkAccess === "view" ? "view" : null;
}

export async function projectFor(ctx: QueryCtx, id: Id<"projects">, need: Access) {
  const project = await ctx.db.get(id);
  if (!project) throw new Error("That project isn't there any more.");
  const user = await me(ctx);
  const access = await accessTo(ctx, project, user);
  if (!atLeast(access, need)) throw new Error(need === "view" ? "You don't have access to this project." : "You can only view this project.");
  return { project, user, access: access! };
}

/** A steady color per person, for their cursor and comment pins. */
const COLORS = ["#9747ff", "#0d99ff", "#14ae5c", "#f24822", "#ff8c00", "#e33bb0", "#00a3a3", "#6b5cff"];
export function colorFor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return COLORS[h % COLORS.length];
}

export const SEATS = 10;
export const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
