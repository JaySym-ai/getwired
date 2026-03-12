/* eslint-disable @typescript-eslint/no-explicit-any */
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireCurrentUser } from "./users";

async function hydrateComment(ctx: any, comment: any) {
  const [author, post] = await Promise.all([ctx.db.get(comment.authorId), ctx.db.get(comment.postId)]);

  if (!author || !post) {
    return null;
  }

  return {
    ...comment,
    author: {
      _id: author._id,
      clerkId: author.clerkId,
      name: author.name,
      username: author.username,
      avatar: author.avatar,
      rank: author.rank,
    },
    postTitle: post.title,
  };
}

export const getByPost = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_post_createdAt", (q) => q.eq("postId", args.postId))
      .order("asc")
      .collect();

    const hydrated = await Promise.all(comments.filter((comment) => !comment.isDemo).map((comment) => hydrateComment(ctx, comment)));
    return hydrated.filter((comment): comment is NonNullable<typeof comment> => Boolean(comment));
  },
});

export const getByAuthor = query({
  args: { authorId: v.id("users"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_author_createdAt", (q) => q.eq("authorId", args.authorId))
      .order("desc")
      .take(args.limit ?? 20);

    const hydrated = await Promise.all(comments.filter((comment) => !comment.isDemo).map((comment) => hydrateComment(ctx, comment)));
    return hydrated.filter((comment): comment is NonNullable<typeof comment> => Boolean(comment));
  },
});

export const getReplies = query({
  args: { parentId: v.id("comments") },
  handler: async (ctx, args) => {
    const replies = await ctx.db
      .query("comments")
      .withIndex("by_parent_createdAt", (q) => q.eq("parentId", args.parentId))
      .order("asc")
      .collect();

    const hydrated = await Promise.all(replies.filter((comment) => !comment.isDemo).map((comment) => hydrateComment(ctx, comment)));
    return hydrated.filter((comment): comment is NonNullable<typeof comment> => Boolean(comment));
  },
});

export const create = mutation({
  args: {
    postId: v.id("posts"),
    content: v.string(),
    parentId: v.optional(v.id("comments")),
  },
  handler: async (ctx, args) => {
    const { user } = await requireCurrentUser(ctx);
    const post = await ctx.db.get(args.postId);

    if (!post) {
      throw new Error("Post not found");
    }

    const commentId = await ctx.db.insert("comments", {
      postId: args.postId,
      authorId: user._id,
      parentId: args.parentId,
      content: args.content.trim(),
      likes: 0,
      isDemo: false,
      createdAt: Date.now(),
    });

    await ctx.db.patch(args.postId, {
      commentCount: post.commentCount + 1,
    });

    return commentId;
  },
});
