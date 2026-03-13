import { v } from "convex/values";
import { query } from "./_generated/server";

export const getActivePromotions = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("promotions")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
  },
});

export const getSummary = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const promotions = (await ctx.db
      .query("promotions")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect()).filter((promotion) => !promotion.isDemo && promotion.endTime > now);

    const counts = {
      boost: 0,
      banner: 0,
      sponsored: 0,
    };

    let totalImpressions = 0;
    let totalClicks = 0;

    for (const promotion of promotions) {
      counts[promotion.type] += 1;
      totalImpressions += promotion.impressions;
      totalClicks += promotion.clicks;
    }

    return {
      activePromotionCount: promotions.length,
      counts,
      totalImpressions,
      totalClicks,
    };
  },
});

export const getByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("promotions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});
