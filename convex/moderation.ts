import { v } from "convex/values";
import { query } from "./_generated/server";

export const getLogs = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const logs = await ctx.db
      .query("moderationLogs")
      .withIndex("by_createdAt")
      .order("desc")
      .take(limit);
    return logs.filter((log) => !log.isDemo);
  },
});

export const getByAuthor = query({
  args: { authorId: v.id("users") },
  handler: async (ctx, args) => {
    const logs = await ctx.db
      .query("moderationLogs")
      .withIndex("by_author", (q) => q.eq("authorId", args.authorId))
      .collect();
    return logs.filter((log) => !log.isDemo);
  },
});
