import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.storage.generateUploadUrl();
  },
});

export const createProject = mutation({
  args: {
    title: v.string(),
    duration: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("projects", {
      userId,
      title: args.title,
      duration: args.duration,
      timeline: [],
    });
  },
});

export const getProject = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Project not found");
    }

    // Get signed URLs for all files in the timeline
    const timeline = await Promise.all(
      project.timeline.map(async (item) => ({
        ...item,
        url: item.fileId ? await ctx.storage.getUrl(item.fileId) : undefined,
      }))
    );

    return { ...project, timeline };
  },
});

export const updateTimeline = mutation({
  args: {
    projectId: v.id("projects"),
    timeline: v.array(
      v.object({
        id: v.string(),
        type: v.union(v.literal("video"), v.literal("audio"), v.literal("text"), v.literal("image"), v.literal("subtitle")),
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
        })),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Project not found");
    }

    await ctx.db.patch(args.projectId, {
      timeline: args.timeline,
    });
  },
});
