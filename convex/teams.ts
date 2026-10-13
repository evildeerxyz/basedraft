import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { authComponent } from "./auth";
import { me, mustBeMe, SEATS, teamOf, validEmail, type Me } from "./access";

/*
 * Teams: the Team plan's ten seats. The owner invites people by email; an invite is a link that
 * works once, for that email, and joining gives them Pro while they're on the team. The owner
 * can remove anyone; anyone can leave. A team exists once its owner has the Team plan (or, on a
 * development deployment, previews it).
 */

const previewAllowed = (preview?: boolean) => preview === true && process.env.BD_PREVIEW_ALLOWED === "1";

async function hasTeamPlan(ctx: QueryCtx, user: Me) {
  const rows = [
    ...(await ctx.db.query("purchases").withIndex("by_user", (q) => q.eq("userId", user._id)).collect()),
    ...(await ctx.db.query("purchases").withIndex("by_email", (q) => q.eq("email", user.email)).collect()),
  ];
  return rows.some((p) => p.product === "team" && p.status === "active");
}

async function people(ctx: QueryCtx, team: Doc<"teams">) {
  const rows = await ctx.db.query("teamMembers").withIndex("by_team", (q) => q.eq("teamId", team._id)).collect();
  return Promise.all(
    rows.map(async (m) => {
      const u = m.userId ? await authComponent.getAnyUserById(ctx, m.userId) : null;
      return { id: m._id, email: m.email, role: m.role, status: m.status, name: u?.name?.trim() || null };
    }),
  );
}

/** Your team, its people and your place in it, or what's stopping you from having one. */
export const mine = query({
  args: { preview: v.optional(v.boolean()) },
  handler: async (ctx, { preview }) => {
    const user = await me(ctx);
    if (!user) return null;
    const t = await teamOf(ctx, user._id);
    if (!t) return { team: null, canCreate: previewAllowed(preview) || (await hasTeamPlan(ctx, user)) };
    return { team: { id: t.team._id, name: t.team.name }, role: t.role, people: await people(ctx, t.team), seats: SEATS, canCreate: false };
  },
});

export const create = mutation({
  args: { name: v.string(), preview: v.optional(v.boolean()) },
  handler: async (ctx, { name, preview }) => {
    const user = await mustBeMe(ctx);
    if (await teamOf(ctx, user._id)) throw new Error("You're already on a team.");
    if (!previewAllowed(preview) && !(await hasTeamPlan(ctx, user))) throw new Error("Teams come with basedraft Team.");
    const teamId = await ctx.db.insert("teams", { ownerId: user._id, name: name.trim().slice(0, 60) || `${user.name}'s team` });
    await ctx.db.insert("teamMembers", { teamId, email: user.email, userId: user._id, role: "owner", status: "active" });
    return teamId;
  },
});

async function ownedTeam(ctx: MutationCtx) {
  const user = await mustBeMe(ctx);
  const t = await teamOf(ctx, user._id);
  if (!t || t.role !== "owner") throw new Error("Only the team's owner can do that.");
  return { user, team: t.team };
}

export const rename = mutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const { team } = await ownedTeam(ctx);
    if (name.trim()) await ctx.db.patch(team._id, { name: name.trim().slice(0, 60) });
  },
});

/** An invite by email: a seat held for them, and a link sent to join. */
export const invite = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const { user, team } = await ownedTeam(ctx);
    const email = args.email.trim().toLowerCase();
    if (!validEmail(email)) throw new Error("That doesn't look like an email address.");
    const rows = await ctx.db.query("teamMembers").withIndex("by_team", (q) => q.eq("teamId", team._id)).collect();
    if (rows.some((m) => m.email === email)) throw new Error("They're already on the team, or invited.");
    if (rows.length >= SEATS) throw new Error(`Your team has all ${SEATS} seats taken. Remove someone to invite another.`);
    const token = crypto.randomUUID().replace(/-/g, "");
    const id = await ctx.db.insert("teamMembers", { teamId: team._id, email, role: "member", status: "invited", token, invitedBy: user._id });
    await ctx.scheduler.runAfter(0, internal.mail.teamInvite, { memberId: id, inviter: user.name, inviterEmail: user.email });
    return id;
  },
});

export const resend = mutation({
  args: { memberId: v.id("teamMembers") },
  handler: async (ctx, { memberId }) => {
    const { user, team } = await ownedTeam(ctx);
    const m = await ctx.db.get(memberId);
    if (!m || m.teamId !== team._id || m.status !== "invited") throw new Error("That invite isn't open any more.");
    await ctx.scheduler.runAfter(0, internal.mail.teamInvite, { memberId, inviter: user.name, inviterEmail: user.email });
  },
});

/** The owner takes someone off the team, or cancels an invite. Their Pro ends with it. */
export const remove = mutation({
  args: { memberId: v.id("teamMembers") },
  handler: async (ctx, { memberId }) => {
    const { team } = await ownedTeam(ctx);
    const m = await ctx.db.get(memberId);
    if (!m || m.teamId !== team._id) return;
    if (m.role === "owner") throw new Error("The owner can't be removed from their own team.");
    await ctx.db.delete(memberId);
  },
});

export const leave = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await mustBeMe(ctx);
    const seat = (await ctx.db.query("teamMembers").withIndex("by_user", (q) => q.eq("userId", user._id)).collect()).find((m) => m.status === "active" && m.role === "member");
    if (seat) await ctx.db.delete(seat._id);
  },
});

/** What an invite link is for, shown before joining. Anyone with the link can read this much. */
export const invitation = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const m = token ? await ctx.db.query("teamMembers").withIndex("by_token", (q) => q.eq("token", token)).first() : null;
    if (!m || m.status !== "invited") return null;
    const team = await ctx.db.get(m.teamId);
    const inviter = m.invitedBy ? await authComponent.getAnyUserById(ctx, m.invitedBy) : null;
    return { team: team?.name ?? "a team", inviter: inviter?.name?.trim() || inviter?.email || "Someone", email: m.email };
  },
});

export const accept = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const user = await mustBeMe(ctx);
    const m = await ctx.db.query("teamMembers").withIndex("by_token", (q) => q.eq("token", token)).first();
    if (!m || m.status !== "invited") throw new Error("That invite has been used or cancelled.");
    if (m.email !== user.email) throw new Error(`This invite is for ${m.email}. Sign in with that email to join.`);
    const current = await teamOf(ctx, user._id);
    if (current && current.team._id !== m.teamId) throw new Error(`You're on ${current.team.name}. Leave it first to join another team.`);
    await ctx.db.patch(m._id, { status: "active", userId: user._id, token: undefined });
    return m.teamId;
  },
});
