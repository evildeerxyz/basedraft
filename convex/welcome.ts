import { v } from "convex/values";
import { components } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { brand, sendEmail } from "./emails/send";
import { welcome } from "./emails/templates";

/**
 * The welcome email, a moment after an account is made: by then signing up has saved the name,
 * so it can say hello properly.
 */
export const send = internalAction({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const user = (await ctx.runQuery(components.betterAuth.adapter.findOne, { model: "user", where: [{ field: "_id", value: userId }] })) as { email: string; name?: string } | null;
    if (!user) return;
    await sendEmail(user.email, welcome(brand(), { name: user.name }));
  },
});
