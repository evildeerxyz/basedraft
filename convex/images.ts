import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { mustBeMe } from "./access";

/*
 * Images put in place of a template's own (see src/site/images): Studio sends the file straight
 * to storage with an address from here, then asks for the address it's kept at. Signed in only:
 * the image lives in your account with the project that uses it.
 */

/** Pictures only, and no bigger than a photo needs to be. */
const MAX_BYTES = 8 * 1024 * 1024;
const TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export const uploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await mustBeMe(ctx);
    return ctx.storage.generateUploadUrl();
  },
});

export const stored = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    await mustBeMe(ctx);
    const file = await ctx.db.system.get(storageId);
    if (!file || file.size > MAX_BYTES || !TYPES.has(file.contentType ?? "")) {
      if (file) await ctx.storage.delete(storageId);
      throw new Error("That image can't be used: a JPEG, PNG or WebP under 8 MB works.");
    }
    const url = await ctx.storage.getUrl(storageId);
    if (!url) throw new Error("That image didn't save. Try it again.");
    return url;
  },
});
