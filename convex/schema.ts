import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  /** Everything bought through Whop, one row per purchase, tied to a basedraft account by id or email. */
  purchases: defineTable({
    userId: v.optional(v.string()),
    email: v.string(),
    product: v.string(),
    status: v.union(v.literal("active"), v.literal("refunded"), v.literal("ended")),
    paymentId: v.optional(v.string()),
    membershipId: v.optional(v.string()),
    planId: v.optional(v.string()),
    amount: v.optional(v.number()),
    currency: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_email", ["email"])
    .index("by_payment", ["paymentId"])
    .index("by_membership", ["membershipId"]),
  /** Webhook deliveries already handled: Whop delivers at least once, sometimes twice. */
  webhookEvents: defineTable({ eventId: v.string() }).index("by_event", ["eventId"]),

  /** A Team plan's people: one owner, up to ten seats. Members get Pro while they're in it. */
  teams: defineTable({ ownerId: v.string(), name: v.string() }).index("by_owner", ["ownerId"]),
  teamMembers: defineTable({
    teamId: v.id("teams"),
    email: v.string(),
    userId: v.optional(v.string()),
    role: v.union(v.literal("owner"), v.literal("member")),
    status: v.union(v.literal("invited"), v.literal("active")),
    token: v.optional(v.string()),
    invitedBy: v.optional(v.string()),
  })
    .index("by_team", ["teamId"])
    .index("by_user", ["userId"])
    .index("by_email", ["email"])
    .index("by_token", ["token"]),

  /** A Studio project, saved to its owner's account and shared with whoever they choose. */
  projects: defineTable({
    ownerId: v.string(),
    name: v.string(),
    template: v.string(),
    data: v.any(),
    teamId: v.optional(v.id("teams")),
    linkAccess: v.union(v.literal("none"), v.literal("view")),
    updatedAt: v.number(),
    updatedBy: v.optional(v.string()),
    /** The open Studio (one browser tab) that saved last, so it knows its own save when it comes back. */
    updatedClient: v.optional(v.string()),
    rev: v.number(),
  })
    .index("by_owner", ["ownerId", "updatedAt"])
    .index("by_team", ["teamId", "updatedAt"]),
  /** People a project is shared with, by email, so it's waiting for them when they sign up. */
  projectMembers: defineTable({ projectId: v.id("projects"), email: v.string(), role: v.union(v.literal("edit"), v.literal("view")), invitedBy: v.string() })
    .index("by_project", ["projectId"])
    .index("by_email", ["email"]),
  /** Saved versions of a project: named ones, and one every ten minutes of editing. */
  versions: defineTable({ projectId: v.id("projects"), name: v.optional(v.string()), data: v.any(), authorId: v.string(), authorName: v.string(), auto: v.boolean() }).index("by_project", ["projectId"]),
  /** Comments pinned to a spot on a page, and their replies. */
  comments: defineTable({
    projectId: v.id("projects"),
    view: v.string(),
    device: v.optional(v.string()),
    /** The section (or block) the pin sits on; x and y are then from its top left, so it moves with it. */
    anchor: v.optional(v.string()),
    x: v.number(),
    y: v.number(),
    parentId: v.optional(v.id("comments")),
    authorId: v.string(),
    authorName: v.string(),
    body: v.string(),
    resolved: v.optional(v.boolean()),
  })
    .index("by_project", ["projectId"])
    .index("by_parent", ["parentId"]),
  /** Who's in a project right now, and where their pointer is. */
  presence: defineTable({
    projectId: v.id("projects"),
    userId: v.string(),
    name: v.string(),
    color: v.string(),
    view: v.string(),
    device: v.optional(v.string()),
    x: v.optional(v.number()),
    y: v.optional(v.number()),
    selected: v.optional(v.string()),
    at: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_project_user", ["projectId", "userId"])
    .index("by_at", ["at"]),
  /** Sections saved to someone's Library, to drop into any page of their template. */
  saved: defineTable({ userId: v.string(), template: v.string(), sectionId: v.string() }).index("by_user", ["userId"]),
});
