import { dash } from "@better-auth/infra";
import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth, type BetterAuthOptions } from "better-auth/minimal";
import { emailOTP } from "better-auth/plugins/email-otp";
import { components, internal } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import authConfig from "./auth.config";
import { brand, sendEmail } from "./emails/send";
import { signInCode } from "./emails/templates";

/*
 * Accounts. Better Auth runs here, inside Convex, and keeps its users, sessions and sign-in codes
 * in the Better Auth component's tables. The site proxies /api/auth to it (src/lib/auth-server.ts).
 *
 * Sign in with an email and a 6-digit code, sent through Resend in basedraft's own template
 * (convex/emails), or with Google or GitHub once their keys are set on the deployment. A welcome
 * email follows a new account. The dash plugin connects the Better Auth dashboard.
 *
 * Deployment env: SITE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_API_KEY, RESEND_API_KEY, EMAIL_FROM,
 * and optionally GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET.
 */

export const authComponent = createClient<DataModel>(components.betterAuth);

/** Google and GitHub, each only once its keys are set, so an unset one can't half work. */
function socialProviders() {
  const env = process.env;
  const p: NonNullable<BetterAuthOptions["socialProviders"]> = {};
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) p.google = { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET, prompt: "select_account" };
  if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) p.github = { clientId: env.GITHUB_CLIENT_ID, clientSecret: env.GITHUB_CLIENT_SECRET };
  return p;
}

export const createAuth = (ctx: GenericCtx<DataModel>) =>
  betterAuth({
    baseURL: process.env.SITE_URL,
    database: authComponent.adapter(ctx),
    socialProviders: socialProviders(),
    databaseHooks: {
      user: {
        create: {
          // Welcome, a moment from now, once signing up has saved the name.
          after: async (user) => {
            if ("scheduler" in ctx) await ctx.scheduler.runAfter(20_000, internal.welcome.send, { userId: user.id });
          },
        },
      },
    },
    plugins: [
      emailOTP({
        otpLength: 6,
        expiresIn: 600,
        async sendVerificationOTP({ email, otp }) {
          await sendEmail(email, signInCode(brand(), { code: otp, minutes: 10 }));
        },
      }),
      dash(),
      convex({ authConfig }),
    ],
  } satisfies BetterAuthOptions);

/** Who's signed in, or null. */
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => (await authComponent.safeGetAuthUser(ctx)) ?? null,
});
