/* eslint-disable @typescript-eslint/no-explicit-any */
import { internal } from "./_generated/api";
import { internalMutation, mutation } from "./_generated/server";
import { DEFAULT_FORUM_CATEGORIES, DEFAULT_RSS_FEEDS } from "../lib/community-defaults";

async function ensureDefaultsImpl(ctx: any) {
  const demoUsers = await ctx.db.query("users").collect();
  const demoUserIds = demoUsers.filter((user: any) => user.isDemo).map((user: any) => user._id);

  for (const comment of await ctx.db.query("comments").collect()) {
    if (comment.isDemo) {
      await ctx.db.delete(comment._id);
    }
  }

  for (const message of await ctx.db.query("chatMessages").collect()) {
    if (message.isDemo) {
      await ctx.db.delete(message._id);
    }
  }

  for (const room of await ctx.db.query("chatRooms").collect()) {
    if (room.isDemo) {
      await ctx.db.delete(room._id);
    }
  }

  for (const article of await ctx.db.query("newsArticles").collect()) {
    if (article.isDemo) {
      await ctx.db.delete(article._id);
    }
  }

  for (const notification of await ctx.db.query("notifications").collect()) {
    if (notification.isDemo) {
      await ctx.db.delete(notification._id);
    }
  }

  for (const poll of await ctx.db.query("polls").collect()) {
    if (poll.isDemo) {
      await ctx.db.delete(poll._id);
    }
  }

  for (const event of await ctx.db.query("events").collect()) {
    if (event.isDemo) {
      await ctx.db.delete(event._id);
    }
  }

  for (const promotion of await ctx.db.query("promotions").collect()) {
    if (promotion.isDemo) {
      await ctx.db.delete(promotion._id);
    }
  }

  for (const log of await ctx.db.query("moderationLogs").collect()) {
    if (log.isDemo) {
      await ctx.db.delete(log._id);
    }
  }

  for (const bookmark of await ctx.db.query("bookmarks").collect()) {
    if (demoUserIds.some((userId: any) => bookmark.userId === userId)) {
      await ctx.db.delete(bookmark._id);
    }
  }

  for (const follow of await ctx.db.query("follows").collect()) {
    if (demoUserIds.some((userId: any) => follow.followerId === userId)) {
      await ctx.db.delete(follow._id);
    }
  }

  for (const post of await ctx.db.query("posts").collect()) {
    if (post.isDemo) {
      await ctx.db.delete(post._id);
    }
  }

  for (const user of demoUsers) {
    if (user.isDemo) {
      await ctx.db.delete(user._id);
    }
  }

  const existingCategories = await ctx.db.query("forumCategories").collect();
  const categoriesBySlug = new Map<string, any>(
    existingCategories.map((category: { _id: unknown; slug: string }) => [category.slug, category]),
  );

  for (const category of DEFAULT_FORUM_CATEGORIES) {
    if (!categoriesBySlug.has(category.slug)) {
      const id = await ctx.db.insert("forumCategories", {
        ...category,
        postCount: 0,
        chatRoomId: undefined,
      });
      categoriesBySlug.set(category.slug, { _id: id, ...category, postCount: 0, chatRoomId: undefined });
    }
  }

  for (const category of DEFAULT_FORUM_CATEGORIES) {
    const existingRoom = await ctx.db
      .query("chatRooms")
      .withIndex("by_categorySlug", (q: { eq: (field: string, value: string) => unknown }) =>
        q.eq("categorySlug", category.slug),
      )
      .first();

    if (!existingRoom) {
      const roomId = await ctx.db.insert("chatRooms", {
        name: `${category.name} Chat`,
        type: "public",
        categorySlug: category.slug,
        members: [],
        description: category.description,
        createdBy: undefined,
        isDemo: false,
        createdAt: Date.now(),
      });

      const dbCategory = categoriesBySlug.get(category.slug);
      if (dbCategory) {
        await ctx.db.patch(dbCategory._id, { chatRoomId: roomId });
      }
    }
  }

  let createdFeeds = 0;
  for (const feed of DEFAULT_RSS_FEEDS) {
    const existingFeed = await ctx.db
      .query("rssFeeds")
      .withIndex("by_url", (q: { eq: (field: string, value: string) => unknown }) => q.eq("url", feed.url))
      .first();

    if (!existingFeed) {
      createdFeeds += 1;
      await ctx.db.insert("rssFeeds", {
        ...feed,
        isActive: true,
        lastFetchedAt: undefined,
        lastError: undefined,
        createdAt: Date.now(),
      });
    }
  }

  const livePosts = await ctx.db.query("posts").collect();
  for (const [slug, category] of categoriesBySlug.entries()) {
    const count = livePosts.filter((post: any) => !post.isDemo && post.category === slug).length;
    await ctx.db.patch(category._id, { postCount: count });
  }

  return { createdFeeds };
}

export const ensureDefaultsInternal = internalMutation({
  args: {},
  handler: async (ctx) => {
    return await ensureDefaultsImpl(ctx);
  },
});

export const ensureDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    const result = await ensureDefaultsImpl(ctx);
    const existingArticle = await ctx.db.query("newsArticles").first();

    if (!existingArticle) {
      await ctx.scheduler.runAfter(0, internal.news.refreshAllFeeds, {});
    }

    return result;
  },
});
