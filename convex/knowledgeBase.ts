import { v } from "convex/values";
import { mutation, query, internalQuery } from "./_generated/server";
import { getAuthenticatedUser } from "./helpers";

export const create = mutation({
  args: {
    projectId: v.id("projects"),
    title: v.string(),
    content: v.string(),
    category: v.union(
      v.literal("product"),
      v.literal("faq"),
      v.literal("messaging"),
      v.literal("competitor_diff")
    ),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== user._id) throw new Error("Not found");

    return await ctx.db.insert("knowledgeBase", {
      projectId: args.projectId,
      title: args.title,
      content: args.content,
      category: args.category,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    entryId: v.id("knowledgeBase"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    category: v.optional(
      v.union(
        v.literal("product"),
        v.literal("faq"),
        v.literal("messaging"),
        v.literal("competitor_diff")
      )
    ),
  },
  handler: async (ctx, args) => {
    const { entryId, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(entryId, { ...filtered, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { entryId: v.id("knowledgeBase") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.entryId);
  },
});

export const listByProject = query({
  args: {
    projectId: v.id("projects"),
    category: v.optional(
      v.union(
        v.literal("product"),
        v.literal("faq"),
        v.literal("messaging"),
        v.literal("competitor_diff")
      )
    ),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== user._id) throw new Error("Not found");

    let entries = await ctx.db
      .query("knowledgeBase")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    if (args.category) {
      entries = entries.filter((e) => e.category === args.category);
    }
    return entries;
  },
});

export const searchInternal = internalQuery({
  args: {
    projectId: v.id("projects"),
    searchTerm: v.string(),
  },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("knowledgeBase")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    if (!args.searchTerm) return entries;

    const term = args.searchTerm.toLowerCase();
    return entries.filter(
      (e) =>
        e.title.toLowerCase().includes(term) ||
        e.content.toLowerCase().includes(term)
    );
  },
});

