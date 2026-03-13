import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export const getSubscribers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("newsletterSubscribers").collect();
  },
});

export const isSubscribed = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const normalizedEmail = normalizeEmail(args.email);
    const subscriber = await ctx.db
      .query("newsletterSubscribers")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first();
    return subscriber?.isActive ?? false;
  },
});

export const getSummary = query({
  args: {},
  handler: async (ctx) => {
    const [subscribers, articles] = await Promise.all([
      ctx.db.query("newsletterSubscribers").collect(),
      ctx.db.query("newsArticles").withIndex("by_publishedAt").order("desc").take(3),
    ]);

    return {
      activeSubscriberCount: subscribers.filter((subscriber) => subscriber.isActive).length,
      latestDigestItems: articles
        .filter((article) => !article.isDemo)
        .map((article) => ({
          _id: article._id,
          title: article.title,
          publishedAt: article.publishedAt,
          source: article.source,
          tags: article.tags,
        })),
    };
  },
});

export const subscribe = mutation({
  args: { email: v.string(), userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const normalizedEmail = normalizeEmail(args.email);
    const existing = await ctx.db
      .query("newsletterSubscribers")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: normalizedEmail,
        userId: args.userId ?? existing.userId,
        isActive: true,
      });
      return existing._id;
    }

    return await ctx.db.insert("newsletterSubscribers", {
      email: normalizedEmail,
      userId: args.userId,
      isActive: true,
      subscribedAt: Date.now(),
    });
  },
});
