/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as access from "../access.js";
import type * as auth from "../auth.js";
import type * as checkout from "../checkout.js";
import type * as comments from "../comments.js";
import type * as crons from "../crons.js";
import type * as delivery from "../delivery.js";
import type * as emails_assets from "../emails/assets.js";
import type * as emails_send from "../emails/send.js";
import type * as emails_templates from "../emails/templates.js";
import type * as http from "../http.js";
import type * as images from "../images.js";
import type * as mail from "../mail.js";
import type * as presence from "../presence.js";
import type * as products from "../products.js";
import type * as projects from "../projects.js";
import type * as purchases from "../purchases.js";
import type * as saved from "../saved.js";
import type * as teams from "../teams.js";
import type * as versions from "../versions.js";
import type * as welcome from "../welcome.js";
import type * as whop from "../whop.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  access: typeof access;
  auth: typeof auth;
  checkout: typeof checkout;
  comments: typeof comments;
  crons: typeof crons;
  delivery: typeof delivery;
  "emails/assets": typeof emails_assets;
  "emails/send": typeof emails_send;
  "emails/templates": typeof emails_templates;
  http: typeof http;
  images: typeof images;
  mail: typeof mail;
  presence: typeof presence;
  products: typeof products;
  projects: typeof projects;
  purchases: typeof purchases;
  saved: typeof saved;
  teams: typeof teams;
  versions: typeof versions;
  welcome: typeof welcome;
  whop: typeof whop;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: import("@convex-dev/better-auth/_generated/component.js").ComponentApi<"betterAuth">;
};
