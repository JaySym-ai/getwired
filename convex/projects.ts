import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthenticatedUser } from "./helpers";

export const create = mutation({
  args: {
    name: v.string(),
    url: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const projectId = await ctx.db.insert("projects", {
      userId: user._id,
      name: args.name,
      url: args.url,
      description: args.description,
      status: "scanning",
      createdAt: Date.now(),
    });

    // Schedule the website scan to run immediately after this mutation commits
    await ctx.scheduler.runAfter(0, internal.scanning.scanWebsiteInternal, {
      projectId,
      url: args.url,
    });

    return projectId;
  },
});

export const listMyProjects = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    return await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

export const getProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== user._id) {
      throw new Error("Project not found");
    }
    return project;
  },
});

export const updateStatus = internalMutation({
  args: {
    projectId: v.id("projects"),
    status: v.union(
      v.literal("scanning"),
      v.literal("ready"),
      v.literal("error")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.projectId, {
      status: args.status,
      scannedAt: args.status === "ready" ? Date.now() : undefined,
    });
  },
});

export const deleteProject = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== user._id) {
      throw new Error("Project not found");
    }
    await ctx.db.delete(args.projectId);
  },
});

