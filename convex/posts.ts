/* eslint-disable @typescript-eslint/no-explicit-any */
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireCurrentUser } from "./users";

async function hydratePost(ctx: any, post: any) {
  const [author, category, poll] = await Promise.all([
    ctx.db.get(post.authorId),
    post.category
      ? ctx.db
          .query("forumCategories")
          .withIndex("by_slug", (q: any) => q.eq("slug", post.category))
          .first()
      : null,
    post.type === "poll"
      ? ctx.db
          .query("polls")
          .withIndex("by_post", (q: any) => q.eq("postId", post._id))
          .first()
      : null,
  ]);

  if (!author) {
    return null;
  }

  return {
    ...post,
    author: {
      _id: author._id,
      clerkId: author.clerkId,
      name: author.name,
      username: author.username,
      avatar: author.avatar,
      rank: author.rank,
      karma: author.karma,
      bio: author.bio,
      location: author.location,
      createdAt: author.createdAt,
    },
    categoryInfo: category
      ? {
          _id: category._id,
          slug: category.slug,
          name: category.name,
          icon: category.icon,
          color: category.color,
          description: category.description,
        }
      : null,
    poll,
  };
}

export const list = query({
  args: {
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const posts = args.category
      ? await ctx.db
          .query("posts")
          .withIndex("by_category_createdAt", (q) => q.eq("category", args.category!))
          .order("desc")
          .take(limit)
      : await ctx.db
          .query("posts")
          .withIndex("by_createdAt")
          .order("desc")
          .take(limit);

    return posts.filter((post) => !post.isDemo);
  },
});

export const listDetailed = query({
  args: {
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const posts = await (args.category
      ? ctx.db
          .query("posts")
          .withIndex("by_category_createdAt", (q) => q.eq("category", args.category!))
          .order("desc")
          .take(args.limit ?? 30)
      : ctx.db
          .query("posts")
          .withIndex("by_createdAt")
          .order("desc")
          .take(args.limit ?? 30));

    const hydrated = await Promise.all(posts.filter((post) => !post.isDemo).map((post) => hydratePost(ctx, post)));
    return hydrated.filter((post): post is NonNullable<typeof post> => Boolean(post));
  },
});

export const getById = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.postId);
  },
});

export const getDetailedById = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post || post.isDemo) {
      return null;
    }

    return await hydratePost(ctx, post);
  },
});

export const getByCategory = query({
  args: { category: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("posts")
      .withIndex("by_category_createdAt", (q) => q.eq("category", args.category))
      .order("desc")
      .take(args.limit ?? 20);
  },
});

export const getByAuthor = query({
  args: { authorId: v.id("users"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("posts")
      .withIndex("by_author_createdAt", (q) => q.eq("authorId", args.authorId))
      .order("desc")
      .take(args.limit ?? 20);
  },
});

export const getDetailedByAuthor = query({
  args: { authorId: v.id("users"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_author_createdAt", (q) => q.eq("authorId", args.authorId))
      .order("desc")
      .take(args.limit ?? 20);

    const hydrated = await Promise.all(posts.filter((post) => !post.isDemo).map((post) => hydratePost(ctx, post)));
    return hydrated.filter((post): post is NonNullable<typeof post> => Boolean(post));
  },
});

export const getTrending = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("posts")
      .withIndex("by_likes")
      .order("desc")
      .take(args.limit ?? 10);
  },
});

export const getTrendingDetailed = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_likes")
      .order("desc")
      .take(args.limit ?? 10);

    const hydrated = await Promise.all(posts.filter((post) => !post.isDemo).map((post) => hydratePost(ctx, post)));
    return hydrated.filter((post): post is NonNullable<typeof post> => Boolean(post));
  },
});

export const listTagStats = query({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db.query("posts").collect();
    const counts = new Map<string, number>();

    for (const post of posts) {
      if (post.isDemo) {
        continue;
      }

      for (const tag of post.tags) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }

    return Array.from(counts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((left, right) => right.count - left.count || left.tag.localeCompare(right.tag));
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    category: v.optional(v.string()),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireCurrentUser(ctx);
    const createdAt = Date.now();

    const postId = await ctx.db.insert("posts", {
      authorId: user._id,
      title: args.title.trim(),
      content: args.content.trim(),
      category: args.category,
      tags: args.tags,
      type: "post",
      likes: 0,
      commentCount: 0,
      views: 1,
      isBoosted: false,
      boostExpiry: undefined,
      isPinned: false,
      isDemo: false,
      createdAt,
    });

    if (args.category) {
      const category = await ctx.db
        .query("forumCategories")
        .withIndex("by_slug", (q) => q.eq("slug", args.category!))
        .first();

      if (category) {
        await ctx.db.patch(category._id, {
          postCount: category.postCount + 1,
        });
      }
    }

    return postId;
  },
});
