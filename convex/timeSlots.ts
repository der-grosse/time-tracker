import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { requireUser } from "./auth";

/** Fetch a slot and ensure it belongs to the given user. */
async function requireOwnedSlot(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  id: Id<"timeSlots">,
): Promise<Doc<"timeSlots">> {
  const slot = await ctx.db.get(id);
  if (!slot || slot.userId !== userId) {
    throw new Error("Time slot not found");
  }
  return slot;
}

/** The user's currently running slot (no end time), if any. */
async function findRunning(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
): Promise<Doc<"timeSlots"> | null> {
  const slots = await ctx.db
    .query("timeSlots")
    .withIndex("byUser", (q) => q.eq("userId", userId))
    .collect();
  return slots.find((s) => s.end === undefined) ?? null;
}

/**
 * All slots relevant to the home page: everything started on/after `since`
 * (start of the week) plus any currently running slot. Newest first.
 */
export const list = query({
  args: { since: v.number() },
  async handler(ctx, { since }) {
    const user = await requireUser(ctx);
    const slots = await ctx.db
      .query("timeSlots")
      .withIndex("byUser", (q) => q.eq("userId", user._id))
      .collect();
    return slots
      .filter((s) => s.end === undefined || s.start >= since)
      .sort((a, b) => b.start - a.start);
  },
});

/** Start a new running slot, closing any slot that is already running. */
export const start = mutation({
  args: { name: v.optional(v.string()) },
  async handler(ctx, { name }) {
    const user = await requireUser(ctx);
    const now = Date.now();

    const running = await findRunning(ctx, user._id);
    if (running) {
      await ctx.db.patch(running._id, { end: now });
    }

    return await ctx.db.insert("timeSlots", {
      userId: user._id,
      name: name?.trim() ? name.trim() : undefined,
      start: now,
    });
  },
});

/** Stop the currently running slot, if any. */
export const stop = mutation({
  args: {},
  async handler(ctx) {
    const user = await requireUser(ctx);
    const running = await findRunning(ctx, user._id);
    if (running) {
      await ctx.db.patch(running._id, { end: Date.now() });
    }
    return running?._id ?? null;
  },
});

/** Edit a slot's name and/or start/end times. */
export const update = mutation({
  args: {
    id: v.id("timeSlots"),
    name: v.optional(v.string()),
    start: v.optional(v.number()),
    end: v.optional(v.number()),
  },
  async handler(ctx, { id, name, start, end }) {
    const user = await requireUser(ctx);
    const slot = await requireOwnedSlot(ctx, user._id, id);

    const nextStart = start ?? slot.start;
    const nextEnd = end ?? slot.end;
    if (nextEnd !== undefined && nextEnd < nextStart) {
      throw new Error("End time must be after start time");
    }

    await ctx.db.patch(id, {
      ...(name !== undefined ? { name: name.trim() ? name.trim() : undefined } : {}),
      ...(start !== undefined ? { start } : {}),
      ...(end !== undefined ? { end } : {}),
    });
    return true;
  },
});

/** Delete a slot. */
export const remove = mutation({
  args: { id: v.id("timeSlots") },
  async handler(ctx, { id }) {
    const user = await requireUser(ctx);
    await requireOwnedSlot(ctx, user._id, id);
    await ctx.db.delete(id);
    return true;
  },
});
