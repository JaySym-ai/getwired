/* eslint-disable @typescript-eslint/no-explicit-any */
import { v } from "convex/values";
import { query } from "./_generated/server";

async function getCategoryStats(ctx: any) {
  const posts = (await ctx.db.query("posts").collect()).filter((post: any) => !post.isDemo);
  const counts = new Map<string, { postCount: number; commentCount: number; latestPost: any | null }>();

  for (const post of posts) {
    const key = post.category ?? "off-topic";
    const current = counts.get(key) ?? {
      postCount: 0,
      commentCount: 0,
      latestPost: null,
    };

    current.postCount += 1;
    current.commentCount += post.commentCount ?? 0;
    if (!current.latestPost || post.createdAt > current.latestPost.createdAt) {
      current.latestPost = post;
    }

    counts.set(key, current);
  }

  return counts;
}

async function hydrateCategory(ctx: any, category: any, statsBySlug: Map<string, any>) {
  const room = category.chatRoomId ? await ctx.db.get(category.chatRoomId) : null;
  const stats = statsBySlug.get(category.slug);

  return {
    ...category,
    postCount: stats?.postCount ?? 0,
    commentCount: stats?.commentCount ?? 0,
    latestPost: stats?.latestPost
      ? {
          _id: stats.latestPost._id,
          title: stats.latestPost.title,
          createdAt: stats.latestPost.createdAt,
          commentCount: stats.latestPost.commentCount,
        }
      : null,
    chatRoom: room
      ? {
          _id: room._id,
          name: room.name,
          type: room.type,
        }
      : null,
  };
}

export const listCategories = query({
  args: {},
  handler: async (ctx) => {
    const [categories, statsBySlug] = await Promise.all([
      ctx.db
        .query("forumCategories")
        .withIndex("by_order")
        .order("asc")
        .collect(),
      getCategoryStats(ctx),
    ]);

    const hydrated = await Promise.all(
      categories.map((category) => hydrateCategory(ctx, category, statsBySlug)),
    );
    return hydrated;
  },
});

export const getCategoryBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const [category, statsBySlug] = await Promise.all([
      ctx.db
        .query("forumCategories")
        .withIndex("by_slug", (q) => q.eq("slug", args.slug))
        .first(),
      getCategoryStats(ctx),
    ]);

    return category ? await hydrateCategory(ctx, category, statsBySlug) : null;
  },
});
