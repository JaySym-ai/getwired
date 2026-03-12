/* eslint-disable @typescript-eslint/no-explicit-any */
import { v } from "convex/values";
import { query } from "./_generated/server";

async function hydrateCategory(ctx: any, category: any) {
  const room = category.chatRoomId ? await ctx.db.get(category.chatRoomId) : null;

  return {
    ...category,
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
    const categories = await ctx.db
      .query("forumCategories")
      .withIndex("by_order")
      .order("asc")
      .collect();

    const hydrated = await Promise.all(categories.map((category) => hydrateCategory(ctx, category)));
    return hydrated;
  },
});

export const getCategoryBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const category = await ctx.db
      .query("forumCategories")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    return category ? await hydrateCategory(ctx, category) : null;
  },
});
