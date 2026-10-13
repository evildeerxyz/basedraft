import betterAuth from "@convex-dev/better-auth/convex.config";
import { defineApp } from "convex/server";

const app = defineApp();
// Better Auth's users, sessions, accounts and sign-in codes, in their own component tables.
app.use(betterAuth);

export default app;
