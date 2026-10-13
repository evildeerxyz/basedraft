import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction, internalQuery } from "./_generated/server";
import { brand, sendEmail } from "./emails/send";
import { projectShared as sharedEmail, teamInvite as inviteEmail } from "./emails/templates";

/* The emails teams and sharing send, from actions so a slow send never holds up a mutation. */

export const inviteRow = internalQuery({
  args: { memberId: v.id("teamMembers") },
  handler: async (ctx, { memberId }) => {
    const m = await ctx.db.get(memberId);
    if (!m || m.status !== "invited" || !m.token) return null;
    const team = await ctx.db.get(m.teamId);
    return { email: m.email, token: m.token, team: team?.name ?? "a team" };
  },
});

export const teamInvite = internalAction({
  args: { memberId: v.id("teamMembers"), inviter: v.string(), inviterEmail: v.optional(v.string()) },
  handler: async (ctx, { memberId, inviter, inviterEmail }) => {
    const row = await ctx.runQuery(internal.mail.inviteRow, { memberId });
    if (!row) return;
    await sendEmail(row.email, inviteEmail(brand(), { team: row.team, inviter, inviterEmail, token: row.token }));
  },
});

export const projectName = internalQuery({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => (await ctx.db.get(projectId))?.name ?? null,
});

export const projectShared = internalAction({
  args: { projectId: v.id("projects"), email: v.string(), role: v.union(v.literal("edit"), v.literal("view")), inviter: v.string() },
  handler: async (ctx, { projectId, email, role, inviter }) => {
    const name = await ctx.runQuery(internal.mail.projectName, { projectId });
    if (name === null) return;
    await sendEmail(email, sharedEmail(brand(), { project: name, inviter, role, id: projectId }));
  },
});
