import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import {
  mutation,
  query,
  type ActionCtx,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";

interface JWTPayload {
  v: "2.0";
  _id: string;
  name: string;
}

type User = Omit<JWTPayload, "v" | "_id"> & {
  _id: Id<"users">;
};

export async function requireUser(ctx: QueryCtx | ActionCtx | MutationCtx): Promise<User>;
export async function requireUser(
  ctx: QueryCtx | ActionCtx | MutationCtx,
  filter: {
    allowNull: true;
  },
): Promise<User | null>;
export async function requireUser(
  ctx: QueryCtx | ActionCtx | MutationCtx,
  filter?: Partial<{
    allowNull: false;
  }>,
): Promise<User>;
export async function requireUser(
  ctx: QueryCtx | ActionCtx | MutationCtx,
  filter?: Partial<{
    allowNull: boolean;
  }>,
): Promise<User | null> {
  const payload = await ctx.auth.getUserIdentity();
  if (filter?.allowNull && !payload) {
    return null;
  }
  if (!payload) {
    throw new Error("Not authenticated");
  }
  if (!("v" in payload) || payload.v !== "2.0") {
    throw new Error("Unsupported JWT version");
  }
  if (!("_id" in payload) || typeof payload._id !== "string") {
    throw new Error("Malformed _id");
  }
  if (!("name" in payload) || typeof payload.name !== "string") {
    throw new Error("Malformed name");
  }
  return {
    _id: payload._id,
    name: payload.name,
  } as User;
}

export async function requireServerJWT(ctx: QueryCtx | ActionCtx | MutationCtx) {
  const user = await requireUser(ctx);
  if (!user || user._id !== "NEXTJS_SERVER_JWT") {
    throw new Error("Unauthorized");
  }
}

export const getUserFromName = query({
  args: {
    name: v.string(),
  },
  async handler(ctx, args) {
    await requireServerJWT(ctx);

    const user = await ctx.db
      .query("users")
      .withIndex("byName", (q) => q.eq("name", args.name))
      .first();

    return user;
  },
});
export const register = mutation({
  args: {
    name: v.string(),
    email: v.optional(v.string()),
    password: v.string(),
  },
  async handler(ctx, args) {
    await requireServerJWT(ctx);

    const existingUser = await ctx.db
      .query("users")
      .withIndex("byName", (q) => q.eq("name", args.name))
      .first();

    if (existingUser) {
      throw new Error("Username already taken");
    }

    const userID = await ctx.db.insert("users", {
      name: args.name,
      password: args.password,
    });
    return userID;
  },
});

export const updateLastLogin = mutation({
  args: {
    userID: v.id("users"),
  },
  async handler(ctx, args) {
    await requireServerJWT(ctx);

    await ctx.db.patch(args.userID, {
      lastLoginAt: new Date().toISOString(),
    });
    return true;
  },
});
