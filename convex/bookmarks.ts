import { v } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";

async function requireCurrentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthenticated");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
    .first();

  if (!user) {
    throw new Error("Current user not found");
  }

  return user;
}

export const getByUser = query({
  args: { userId: v.id("users"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    return await ctx.db
      .query("bookmarks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);
  },
});

export const isBookmarked = query({
  args: { userId: v.id("users"), targetId: v.string() },
  handler: async (ctx, args) => {
    const bookmark = await ctx.db
      .query("bookmarks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    return bookmark.some((b) => b.targetId === args.targetId);
  },
});

export const getDetailedForCurrentUser = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser) {
      return [];
    }

    const bookmarks = await ctx.db
      .query("bookmarks")
      .withIndex("by_user", (q) => q.eq("userId", currentUser._id))
      .order("desc")
      .take(args.limit ?? 50);

    return await Promise.all(
      bookmarks.map(async (bookmark) => {
        if (bookmark.targetType === "post") {
          const postId = ctx.db.normalizeId("posts", bookmark.targetId);
          if (!postId) {
            return null;
          }

          const post = await ctx.db.get("posts", postId);
          if (!post) {
            return null;
          }

          const author = await ctx.db.get("users", post.authorId);
          return {
            id: bookmark._id,
            targetType: "post" as const,
            title: post.title,
            subtitle: `by ${author?.name ?? "Unknown"} in ${post.category ?? "General"}`,
            link: post.category ? `/forums/${post.category}/${post._id}` : `/forums/${post._id}`,
            createdAt: bookmark.createdAt,
            meta: {
              likes: post.likes,
              comments: post.commentCount,
              views: post.views,
            },
          };
        }

        if (bookmark.targetType === "news") {
          const articleId = ctx.db.normalizeId("newsArticles", bookmark.targetId);
          if (!articleId) {
            return null;
          }

          const article = await ctx.db.get("newsArticles", articleId);
          if (!article) {
            return null;
          }

          return {
            id: bookmark._id,
            targetType: "news" as const,
            title: article.title,
            subtitle: article.source,
            link: article.url,
            createdAt: bookmark.createdAt,
            meta: {
              source: article.source,
            },
          };
        }

        return null;
      }),
    ).then((items) => items.filter((item) => item !== null));
  },
});

export const removeForCurrentUser = mutation({
  args: { bookmarkId: v.id("bookmarks") },
  handler: async (ctx, args) => {
    const currentUser = await requireCurrentUser(ctx);
    const bookmark = await ctx.db.get("bookmarks", args.bookmarkId);

    if (!bookmark || bookmark.userId !== currentUser._id) {
      throw new Error("Bookmark not found");
    }

    await ctx.db.delete("bookmarks", args.bookmarkId);
  },
});
