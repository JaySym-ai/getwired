/* eslint-disable @typescript-eslint/no-explicit-any */
import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { requireCurrentUser } from "./users";
import { DEFAULT_CHAT_RETENTION_DAYS } from "../lib/community-defaults";

function extractMentions(content: string) {
  return Array.from(
    new Set(
      [...content.matchAll(/@([a-z0-9_]+)/gi)]
        .map((match) => match[1]?.toLowerCase().trim() ?? "")
        .filter(Boolean),
    ),
  );
}

async function getCurrentUserId(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
    .first();

  return user?._id ?? null;
}

async function buildMessage(ctx: any, message: any, currentUserId: any) {
  const [author, replies] = await Promise.all([
    ctx.db.get(message.authorId),
    ctx.db
      .query("chatMessages")
      .withIndex("by_thread_createdAt", (q: any) => q.eq("threadId", message._id))
      .collect(),
  ]);

  if (!author) {
    return null;
  }

  const reactions = Array.from(
    message.reactions.reduce((map: Map<string, { emoji: string; count: number; reacted: boolean }>, reaction: any) => {
      const existing = map.get(reaction.emoji);
      if (existing) {
        existing.count += 1;
        existing.reacted = existing.reacted || reaction.userId === currentUserId;
      } else {
        map.set(reaction.emoji, {
          emoji: reaction.emoji,
          count: 1,
          reacted: reaction.userId === currentUserId,
        });
      }
      return map;
    }, new Map()).values(),
  );

  return {
    _id: message._id,
    roomId: message.roomId,
    threadId: message.threadId,
    content: message.content,
    mentions: message.mentions,
    createdAt: message.createdAt,
    threadCount: replies.length,
    reactions,
    author: {
      _id: author._id,
      clerkId: author.clerkId,
      name: author.name,
      username: author.username,
      avatar: author.avatar,
      rank: author.rank,
    },
    isOwn: currentUserId ? message.authorId === currentUserId : false,
  };
}

export const listRooms = query({
  args: { type: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserId(ctx);
    const rooms = args.type
      ? await ctx.db
          .query("chatRooms")
          .withIndex("by_type", (q) => q.eq("type", args.type as "public" | "private" | "dm"))
          .collect()
      : await ctx.db.query("chatRooms").collect();
    const liveRooms = rooms.filter((room) => !room.isDemo);

    const roomsWithState = await Promise.all(
      liveRooms.map(async (room) => {
        const latestMessage = await ctx.db
          .query("chatMessages")
          .withIndex("by_room_createdAt", (q) => q.eq("roomId", room._id))
          .order("desc")
          .first();
        const latestAuthor = latestMessage ? await ctx.db.get(latestMessage.authorId) : null;

        if (room.type === "private" || room.type === "dm") {
          if (!currentUserId || !room.members.some((memberId) => memberId === currentUserId)) {
            return null;
          }
        }

        const memberDocs = await Promise.all(room.members.slice(0, 4).map((memberId) => ctx.db.get(memberId)));

        return {
          ...room,
          lastMessage: latestMessage
            ? {
                content: latestMessage.content,
                createdAt: latestMessage.createdAt,
                author: latestAuthor
                  ? {
                      _id: latestAuthor._id,
                      name: latestAuthor.name,
                      username: latestAuthor.username,
                    }
                  : null,
              }
            : null,
          memberPreview: memberDocs
            .filter((member): member is NonNullable<typeof member> => Boolean(member))
            .map((member) => ({
              _id: member._id,
              name: member.name,
              username: member.username,
              avatar: member.avatar,
            })),
        };
      }),
    );

    return roomsWithState
      .filter((room): room is NonNullable<typeof room> => Boolean(room))
      .sort((left, right) => {
        const leftTime = left.lastMessage?.createdAt ?? left.createdAt;
        const rightTime = right.lastMessage?.createdAt ?? right.createdAt;
        return rightTime - leftTime;
      });
  },
});

export const getRoomById = query({
  args: { roomId: v.id("chatRooms") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.roomId);
  },
});

export const getRoomByCategorySlug = query({
  args: { categorySlug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("chatRooms")
      .withIndex("by_categorySlug", (q) => q.eq("categorySlug", args.categorySlug))
      .first();
  },
});

export const getMessages = query({
  args: { roomId: v.id("chatRooms"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserId(ctx);
    const limit = args.limit ?? 100;
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_room_createdAt", (q) => q.eq("roomId", args.roomId))
      .order("desc")
      .take(limit);

    const hydrated = await Promise.all(
      messages
        .reverse()
        .filter((message) => !message.threadId && !message.isDemo)
        .map((message) => buildMessage(ctx, message, currentUserId)),
    );

    return hydrated.filter((message): message is NonNullable<typeof message> => Boolean(message));
  },
});

export const getThreadMessages = query({
  args: { threadId: v.id("chatMessages") },
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserId(ctx);
    const replies = await ctx.db
      .query("chatMessages")
      .withIndex("by_thread_createdAt", (q) => q.eq("threadId", args.threadId))
      .order("asc")
      .collect();

    const hydrated = await Promise.all(
      replies.filter((reply) => !reply.isDemo).map((reply) => buildMessage(ctx, reply, currentUserId)),
    );
    return hydrated.filter((message): message is NonNullable<typeof message> => Boolean(message));
  },
});

export const sendMessage = mutation({
  args: {
    roomId: v.id("chatRooms"),
    content: v.string(),
    threadId: v.optional(v.id("chatMessages")),
  },
  handler: async (ctx, args) => {
    const { user } = await requireCurrentUser(ctx);
    const room = await ctx.db.get(args.roomId);

    if (!room) {
      throw new Error("Chat room not found");
    }

    if ((room.type === "private" || room.type === "dm") && !room.members.some((memberId) => memberId === user._id)) {
      throw new Error("You do not have access to this room");
    }

    return await ctx.db.insert("chatMessages", {
      roomId: args.roomId,
      authorId: user._id,
      content: args.content.trim(),
      threadId: args.threadId,
      reactions: [],
      mentions: extractMentions(args.content),
      isDemo: false,
      createdAt: Date.now(),
    });
  },
});

export const toggleReaction = mutation({
  args: {
    messageId: v.id("chatMessages"),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireCurrentUser(ctx);
    const message = await ctx.db.get(args.messageId);

    if (!message) {
      throw new Error("Message not found");
    }

    const existingIndex = message.reactions.findIndex(
      (reaction) => reaction.emoji === args.emoji && reaction.userId === user._id,
    );

    const reactions =
      existingIndex >= 0
        ? message.reactions.filter((_, index) => index !== existingIndex)
        : [...message.reactions, { emoji: args.emoji, userId: user._id }];

    await ctx.db.patch(args.messageId, { reactions });
  },
});

export const createRoom = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    type: v.optional(v.union(v.literal("public"), v.literal("private"))),
    categorySlug: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireCurrentUser(ctx);

    return await ctx.db.insert("chatRooms", {
      name: args.name.trim(),
      description: args.description?.trim() || undefined,
      type: args.type ?? "public",
      categorySlug: args.categorySlug,
      members: [user._id],
      createdBy: user._id,
      isDemo: false,
      createdAt: Date.now(),
    });
  },
});

export const cleanupOldMessages = internalMutation({
  args: { olderThan: v.number() },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_createdAt")
      .order("asc")
      .collect();

    let deleted = 0;
    for (const message of messages) {
      if (message.createdAt >= args.olderThan) {
        break;
      }

      await ctx.db.delete(message._id);
      deleted += 1;
    }

    return { deleted };
  },
});

export const cleanupExpiredMessages = internalMutation({
  args: {},
  handler: async (ctx) => {
    const olderThan = Date.now() - DEFAULT_CHAT_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_createdAt")
      .order("asc")
      .collect();

    let deleted = 0;
    for (const message of messages) {
      if (message.createdAt >= olderThan) {
        break;
      }

      await ctx.db.delete(message._id);
      deleted += 1;
    }

    return { deleted };
  },
});
