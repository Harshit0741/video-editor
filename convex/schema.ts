import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  projects: defineTable({
    userId: v.id("users"),
    title: v.string(),
    duration: v.number(),
    timeline: v.array(
      v.object({
        id: v.string(),
        type: v.union(
          v.literal("video"),
          v.literal("audio"),
          v.literal("text"),
          v.literal("image"),
          v.literal("subtitle")
        ),
        startTime: v.number(),
        endTime: v.number(),
        fileId: v.optional(v.id("_storage")),
        text: v.optional(v.string()),
        isMuted: v.optional(v.boolean()),
        style: v.optional(v.object({
          fontSize: v.optional(v.number()),
          color: v.optional(v.string()),
          opacity: v.optional(v.number()),
          border: v.optional(v.string()),
          animation: v.optional(v.string()),
          position: v.optional(v.object({
            x: v.number(),
            y: v.number(),
            width: v.optional(v.number()),
            height: v.optional(v.number()),
          })),
        }))
      })
    )
  }).index("by_user", ["userId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
