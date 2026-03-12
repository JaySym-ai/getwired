import { internalMutation } from "./_generated/server";
import {
  DEMO_USERS,
  DEMO_CATEGORIES,
  DEMO_POSTS,
  DEMO_COMMENTS,
  DEMO_CHAT_ROOMS,
  DEMO_CHAT_MESSAGES,
  DEMO_NEWS_ARTICLES,
  DEMO_NOTIFICATIONS,
  DEMO_POLLS,
  DEMO_EVENTS,
  DEMO_PROMOTIONS,
  DEMO_BOOKMARKS,
  DEMO_FOLLOWS,
  DEMO_MODERATION_LOGS,
  DEMO_NEWSLETTER_SUBSCRIBERS,
} from "../lib/demo-data";
import { Id } from "./_generated/dataModel";

function requireIndexedValue<T>(values: T[], index: number, label: string): T {
  const value = values[index];
  if (value === undefined) {
    throw new Error(`Missing ${label} at index ${index}`);
  }
  return value;
}

export const seedAll = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existingUsers = await ctx.db.query("users").first();
    if (existingUsers) {
      console.log("Database already seeded. Skipping.");
      return { status: "already_seeded" };
    }

    console.log("🌱 Seeding database with demo data...");

    // 1. Seed users
    const userIds: Id<"users">[] = [];
    for (const user of DEMO_USERS) {
      const id = await ctx.db.insert("users", user);
      userIds.push(id);
    }
    console.log(`✅ Seeded ${userIds.length} users`);

    // 2. Seed forum categories
    for (const cat of DEMO_CATEGORIES) {
      await ctx.db.insert("forumCategories", cat);
    }
    console.log(`✅ Seeded ${DEMO_CATEGORIES.length} forum categories`);

    // 3. Seed posts
    const postIds: Id<"posts">[] = [];
    for (const post of DEMO_POSTS) {
      const { authorIndex, ...postData } = post;
      const id = await ctx.db.insert("posts", {
        ...postData,
        authorId: requireIndexedValue(userIds, authorIndex, "userId"),
      });
      postIds.push(id);
    }
    console.log(`✅ Seeded ${postIds.length} posts`);

    // 4. Seed comments
    const commentIds: Id<"comments">[] = [];
    for (const comment of DEMO_COMMENTS) {
      const { postIndex, authorIndex, isReply, parentIndex, ...commentData } =
        comment;
      const data: Record<string, unknown> = {
        ...commentData,
        postId: requireIndexedValue(postIds, postIndex, "postId"),
        authorId: requireIndexedValue(userIds, authorIndex, "userId"),
        isDemo: true,
      };
      if (isReply && parentIndex !== undefined && commentIds[parentIndex]) {
        data.parentId = commentIds[parentIndex];
      }
      const id = await ctx.db.insert("comments", data as never);
      commentIds.push(id);
    }
    console.log(`✅ Seeded ${commentIds.length} comments`);

    // 5. Seed chat rooms
    const roomIds: Id<"chatRooms">[] = [];
    for (const room of DEMO_CHAT_ROOMS) {
      const { creatorIndex, ...roomData } = room;
      const id = await ctx.db.insert("chatRooms", {
        ...roomData,
        members: userIds,
        createdBy: requireIndexedValue(userIds, creatorIndex, "userId"),
      });
      roomIds.push(id);
    }
    console.log(`✅ Seeded ${roomIds.length} chat rooms`);

    // 6. Seed chat messages
    for (const msg of DEMO_CHAT_MESSAGES) {
      const { roomIndex, authorIndex, reactions, ...msgData } = msg;
      await ctx.db.insert("chatMessages", {
        ...msgData,
        roomId: requireIndexedValue(roomIds, roomIndex, "roomId"),
        authorId: requireIndexedValue(userIds, authorIndex, "userId"),
        reactions: reactions.map((r) => ({
          emoji: r.emoji,
          userId: requireIndexedValue(userIds, r.userIndex, "userId"),
        })),
        isDemo: true,
      });
    }
    console.log(`✅ Seeded ${DEMO_CHAT_MESSAGES.length} chat messages`);

    // 7. Seed news articles
    const newsArticleIds: Id<"newsArticles">[] = [];
    for (const article of DEMO_NEWS_ARTICLES) {
      const id = await ctx.db.insert("newsArticles", article);
      newsArticleIds.push(id);
    }
    console.log(`✅ Seeded ${newsArticleIds.length} news articles`);

    // 8. Seed notifications
    for (const notif of DEMO_NOTIFICATIONS) {
      const { userIndex, fromUserIndex, ...notifData } = notif;
      await ctx.db.insert("notifications", {
        ...notifData,
        userId: requireIndexedValue(userIds, userIndex, "userId"),
        fromUserId:
          fromUserIndex !== undefined
            ? requireIndexedValue(userIds, fromUserIndex, "userId")
            : undefined,
        isDemo: true,
      });
    }
    console.log(`✅ Seeded ${DEMO_NOTIFICATIONS.length} notifications`);

    // 9. Seed polls
    for (const poll of DEMO_POLLS) {
      const { postIndex, ...pollData } = poll;
      await ctx.db.insert("polls", {
        ...pollData,
        postId: requireIndexedValue(postIds, postIndex, "postId"),
        voters: userIds,
      });
    }
    console.log(`✅ Seeded ${DEMO_POLLS.length} polls`);

    // 10. Seed events
    for (const event of DEMO_EVENTS) {
      const { hostIndex, ...eventData } = event;
      await ctx.db.insert("events", {
        ...eventData,
        hostId: requireIndexedValue(userIds, hostIndex, "userId"),
        attendees: userIds.slice(0, 3),
      });
    }
    console.log(`✅ Seeded ${DEMO_EVENTS.length} events`);

    // 11. Seed promotions
    for (const promo of DEMO_PROMOTIONS) {
      const { userIndex, ...promoData } = promo;
      await ctx.db.insert("promotions", {
        ...promoData,
        userId: requireIndexedValue(userIds, userIndex, "userId"),
      });
    }
    console.log(`✅ Seeded ${DEMO_PROMOTIONS.length} promotions`);

    // 12. Seed bookmarks
    for (const bookmark of DEMO_BOOKMARKS) {
      const { userIndex, postIndex, newsIndex, ...bookmarkData } = bookmark;
      let targetId: string;
      if (bookmarkData.targetType === "post" && postIndex !== undefined) {
        targetId = requireIndexedValue(postIds, postIndex, "postId") as string;
      } else if (bookmarkData.targetType === "news" && newsIndex !== undefined) {
        targetId = requireIndexedValue(newsArticleIds, newsIndex, "newsArticleId") as string;
      } else {
        targetId = "unknown";
      }
      await ctx.db.insert("bookmarks", {
        userId: requireIndexedValue(userIds, userIndex, "userId"),
        targetId,
        targetType: bookmarkData.targetType,
        createdAt: bookmarkData.createdAt,
      });
    }
    console.log(`✅ Seeded ${DEMO_BOOKMARKS.length} bookmarks`);

    // 13. Seed follows
    for (const follow of DEMO_FOLLOWS) {
      const { followerIndex, targetUserIndex, targetTag, targetCategory, ...followData } = follow;
      let targetId: string;
      if (followData.targetType === "user" && targetUserIndex !== undefined) {
        targetId = requireIndexedValue(userIds, targetUserIndex, "userId") as string;
      } else if (followData.targetType === "tag" && targetTag) {
        targetId = targetTag;
      } else if (followData.targetType === "category" && targetCategory) {
        targetId = targetCategory;
      } else {
        targetId = "unknown";
      }
      await ctx.db.insert("follows", {
        followerId: requireIndexedValue(userIds, followerIndex, "userId"),
        targetId,
        targetType: followData.targetType,
        createdAt: followData.createdAt,
      });
    }
    console.log(`✅ Seeded ${DEMO_FOLLOWS.length} follows`);

    // 14. Seed moderation logs
    for (const log of DEMO_MODERATION_LOGS) {
      const { authorIndex, ...logData } = log;
      await ctx.db.insert("moderationLogs", {
        ...logData,
        contentId: `demo-content-${Math.random().toString(36).slice(2)}`,
        authorId: requireIndexedValue(userIds, authorIndex, "userId"),
      });
    }
    console.log(`✅ Seeded ${DEMO_MODERATION_LOGS.length} moderation logs`);

    // 15. Seed newsletter subscribers
    for (const sub of DEMO_NEWSLETTER_SUBSCRIBERS) {
      const { userIndex, ...subData } = sub;
      await ctx.db.insert("newsletterSubscribers", {
        ...subData,
        userId:
          userIndex !== undefined
            ? requireIndexedValue(userIds, userIndex, "userId")
            : undefined,
      });
    }
    console.log(`✅ Seeded ${DEMO_NEWSLETTER_SUBSCRIBERS.length} newsletter subscribers`);

    console.log("🎉 Database seeding complete!");
    return { status: "seeded", userCount: userIds.length, postCount: postIds.length };
  },
});
