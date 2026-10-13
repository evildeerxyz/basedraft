import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { authComponent, createAuth } from "./auth";
import { ASSETS } from "./emails/assets";
import { webhook } from "./whop";

const http = httpRouter();

// Better Auth's endpoints, under /api/auth on the deployment's .convex.site address.
authComponent.registerRoutes(http, createAuth);

// Whop: payments, refunds and ended subscriptions.
http.route({ path: "/whop/webhook", method: "POST", handler: webhook });

// The images in basedraft's emails, at addresses any mail client can load. Each address names
// its own contents, so it can be cached forever.
for (const { path, data } of Object.values(ASSETS)) {
  const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
  http.route({
    path,
    method: "GET",
    handler: httpAction(async () => new Response(bytes, { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=31536000, immutable" } })),
  });
}

export default http;
