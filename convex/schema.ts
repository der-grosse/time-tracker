import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const schema = defineSchema({
  users: defineTable({
    name: v.string(),
    password: v.string(),
    lastLoginAt: v.optional(v.string()),
  }).index("byName", ["name"]),

  timeSlots: defineTable({
    userId: v.id("users"),
    name: v.optional(v.string()),
    // Epoch milliseconds.
    start: v.number(),
    // Undefined while the slot is still running.
    end: v.optional(v.number()),
  }).index("byUser", ["userId", "start"]),
});

export default schema;
