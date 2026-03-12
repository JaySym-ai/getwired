import { v } from "convex/values";
import { query } from "./_generated/server";

export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    const events = await ctx.db
      .query("events")
      .withIndex("by_startTime")
      .order("asc")
      .take(limit);
    return events.filter((event) => !event.isDemo);
  },
});

export const getUpcoming = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 5;
    const now = Date.now();
    const events = await ctx.db
      .query("events")
      .withIndex("by_startTime")
      .order("asc")
      .collect();
    return events.filter((event) => !event.isDemo && event.startTime > now).slice(0, limit);
  },
});

export const getByType = query({
  args: { type: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    const events = await ctx.db
      .query("events")
      .withIndex("by_type", (q) => q.eq("type", args.type as "ama" | "meetup" | "hackathon"))
      .take(limit);
    return events.filter((event) => !event.isDemo);
  },
});
