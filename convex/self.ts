import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireServerJWT, requireUser } from "./auth";

export const get = query({
  args: {
    userID: v.optional(v.id("users")),
  },
  async handler(ctx, args) {
    const payload = await requireUser(ctx);
    let isNextServer = false;
    if (args.userID) {
      await requireServerJWT(ctx);
      isNextServer = true;
    }
    const userID = args.userID ?? payload._id;
    const userDoc = await ctx.db.get(userID);
    if (!userDoc) return null;
    return {
      _id: userDoc._id,
      name: userDoc.name,
      ...(isNextServer ? { hashedPassword: userDoc.password } : {}),
    };
  },
});

export const update = mutation({
  args: {
    name: v.optional(v.string()),
  },
  async handler(ctx, args) {
    const { _id } = await requireUser(ctx);
    await ctx.db.patch(_id, {
      ...(args.name !== undefined ? { name: args.name } : {}),
    });
    return true;
  },
});
