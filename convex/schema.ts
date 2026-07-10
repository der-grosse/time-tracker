import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const schema = defineSchema({
  users: defineTable({
    name: v.string(),
    password: v.string(),
    lastLoginAt: v.optional(v.string()),
  }).index("byName", ["name"]),
});

export default schema;
