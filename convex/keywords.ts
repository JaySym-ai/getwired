import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { getAuthenticatedUser } from "./helpers";

export const insertBulk = internalMutation({
  args: {
    projectId: v.id("projects"),
    keywords: v.array(
      v.object({
        keyword: v.string(),
        source: v.union(
          v.literal("extracted"),
          v.literal("competitor"),
          v.literal("manual")
        ),
      })
    ),
  },
  handler: async (ctx, args) => {
    for (const kw of args.keywords) {
      await ctx.db.insert("keywords", {
        projectId: args.projectId,
        keyword: kw.keyword,
        source: kw.source,
        tracked: true,
      });
    }
  },
});

export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== user._id) {
      throw new Error("Project not found");
    }
    return await ctx.db
      .query("keywords")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

export const addKeyword = mutation({
  args: {
    projectId: v.id("projects"),
    keyword: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== user._id) {
      throw new Error("Project not found");
    }
    return await ctx.db.insert("keywords", {
      projectId: args.projectId,
      keyword: args.keyword,
      source: "manual",
      tracked: true,
    });
  },
});

export const toggleTracked = mutation({
  args: { keywordId: v.id("keywords") },
  handler: async (ctx, args) => {
    const keyword = await ctx.db.get(args.keywordId);
    if (!keyword) throw new Error("Keyword not found");
    await ctx.db.patch(args.keywordId, { tracked: !keyword.tracked });
  },
});

export const deleteKeyword = mutation({
  args: { keywordId: v.id("keywords") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.keywordId);
  },
});

export const updateKeyword = mutation({
  args: {
    keywordId: v.id("keywords"),
    keyword: v.optional(v.string()),
    searchVolume: v.optional(v.number()),
    difficulty: v.optional(v.number()),
    trendDirection: v.optional(
      v.union(
        v.literal("rising"),
        v.literal("stable"),
        v.literal("declining")
      )
    ),
    seoRank: v.optional(v.number()),
    geoScore: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { keywordId, ...updates } = args;
    // Filter out undefined values
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(keywordId, filtered);
  },
});

