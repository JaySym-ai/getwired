import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    username: v.string(),
    email: v.string(),
    avatar: v.optional(v.string()),
    avatarStorageId: v.optional(v.id("_storage")),
    bio: v.optional(v.string()),
    location: v.optional(v.string()),
    website: v.optional(v.string()),
    github: v.optional(v.string()),
    linkedin: v.optional(v.string()),
    twitter: v.optional(v.string()),
    techStack: v.array(v.string()),
    aiTools: v.array(v.string()),
    tags: v.array(v.string()),
    experience: v.array(
      v.object({
        title: v.string(),
        company: v.string(),
        period: v.string(),
        description: v.string(),
      })
    ),
    projects: v.array(
      v.object({
        name: v.string(),
        url: v.string(),
        description: v.string(),
        techStack: v.array(v.string()),
      })
    ),
    education: v.array(
      v.object({
        school: v.string(),
        degree: v.string(),
        field: v.string(),
        year: v.string(),
      })
    ),
    certifications: v.array(
      v.object({
        name: v.string(),
        issuer: v.string(),
        year: v.string(),
        url: v.optional(v.string()),
      })
    ),
    rank: v.union(
      v.literal("newbie"),
      v.literal("active"),
      v.literal("contributor"),
      v.literal("expert"),
      v.literal("top"),
      v.literal("moderator")
    ),
    karma: v.number(),
    role: v.union(v.literal("user"), v.literal("moderator"), v.literal("admin")),
    isDemo: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_username", ["username"])
    .index("by_karma", ["karma"]),

  posts: defineTable({
    authorId: v.id("users"),
    title: v.string(),
    content: v.string(),
    category: v.optional(v.string()),
    tags: v.array(v.string()),
    type: v.union(v.literal("post"), v.literal("news_discussion"), v.literal("poll")),
    likes: v.number(),
    commentCount: v.number(),
    views: v.number(),
    isBoosted: v.boolean(),
    boostExpiry: v.optional(v.number()),
    isPinned: v.boolean(),
    isDemo: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_author", ["authorId"])
    .index("by_author_createdAt", ["authorId", "createdAt"])
    .index("by_category", ["category"])
    .index("by_category_createdAt", ["category", "createdAt"])
    .index("by_createdAt", ["createdAt"])
    .index("by_likes", ["likes"]),

  comments: defineTable({
    postId: v.id("posts"),
    authorId: v.id("users"),
    parentId: v.optional(v.id("comments")),
    content: v.string(),
    likes: v.number(),
    isDemo: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_post", ["postId"])
    .index("by_post_createdAt", ["postId", "createdAt"])
    .index("by_author", ["authorId"])
    .index("by_author_createdAt", ["authorId", "createdAt"])
    .index("by_parent", ["parentId"])
    .index("by_parent_createdAt", ["parentId", "createdAt"]),

  forumCategories: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    icon: v.string(),
    color: v.string(),
    postCount: v.number(),
    chatRoomId: v.optional(v.id("chatRooms")),
    order: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_order", ["order"]),

  chatRooms: defineTable({
    name: v.string(),
    type: v.union(v.literal("public"), v.literal("private"), v.literal("dm")),
    categorySlug: v.optional(v.string()),
    members: v.array(v.id("users")),
    description: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
    isDemo: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_type", ["type"])
    .index("by_categorySlug", ["categorySlug"]),

  chatMessages: defineTable({
    roomId: v.id("chatRooms"),
    authorId: v.id("users"),
    content: v.string(),
    threadId: v.optional(v.id("chatMessages")),
    reactions: v.array(
      v.object({
        emoji: v.string(),
        userId: v.id("users"),
      })
    ),
    mentions: v.array(v.string()),
    isDemo: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_room_createdAt", ["roomId", "createdAt"])
    .index("by_thread", ["threadId"])
    .index("by_thread_createdAt", ["threadId", "createdAt"])
    .index("by_createdAt", ["createdAt"]),

  rssFeeds: defineTable({
    name: v.string(),
    url: v.string(),
    siteUrl: v.optional(v.string()),
    categorySlug: v.optional(v.string()),
    isActive: v.boolean(),
    lastFetchedAt: v.optional(v.number()),
    lastError: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_url", ["url"])
    .index("by_isActive", ["isActive"]),

  newsArticles: defineTable({
    feedId: v.optional(v.id("rssFeeds")),
    externalId: v.string(),
    title: v.string(),
    url: v.string(),
    source: v.string(),
    summary: v.string(),
    imageUrl: v.optional(v.string()),
    tags: v.array(v.string()),
    discussionPostId: v.optional(v.id("posts")),
    publishedAt: v.number(),
    isDemo: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_externalId", ["externalId"])
    .index("by_url", ["url"])
    .index("by_feed_publishedAt", ["feedId", "publishedAt"])
    .index("by_source", ["source"])
    .index("by_source_publishedAt", ["source", "publishedAt"])
    .index("by_publishedAt", ["publishedAt"]),

  notifications: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("like"),
      v.literal("comment"),
      v.literal("mention"),
      v.literal("follow"),
      v.literal("news")
    ),
    message: v.string(),
    link: v.string(),
    isRead: v.boolean(),
    fromUserId: v.optional(v.id("users")),
    isDemo: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_createdAt", ["createdAt"]),

  bookmarks: defineTable({
    userId: v.id("users"),
    targetId: v.string(),
    targetType: v.union(
      v.literal("post"),
      v.literal("news"),
      v.literal("user"),
      v.literal("category"),
      v.literal("tag")
    ),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_target", ["targetId"]),

  follows: defineTable({
    followerId: v.id("users"),
    targetId: v.string(),
    targetType: v.union(v.literal("user"), v.literal("tag"), v.literal("category")),
    createdAt: v.number(),
  })
    .index("by_follower", ["followerId"])
    .index("by_target", ["targetId"]),

  polls: defineTable({
    postId: v.id("posts"),
    question: v.string(),
    options: v.array(
      v.object({
        text: v.string(),
        votes: v.number(),
      })
    ),
    voters: v.array(v.id("users")),
    expiresAt: v.optional(v.number()),
    isDemo: v.boolean(),
  }).index("by_post", ["postId"]),

  events: defineTable({
    title: v.string(),
    description: v.string(),
    type: v.union(v.literal("ama"), v.literal("meetup"), v.literal("hackathon")),
    hostId: v.id("users"),
    startTime: v.number(),
    endTime: v.number(),
    tags: v.array(v.string()),
    attendees: v.array(v.id("users")),
    isDemo: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_startTime", ["startTime"])
    .index("by_type", ["type"]),

  promotions: defineTable({
    userId: v.id("users"),
    type: v.union(v.literal("boost"), v.literal("banner"), v.literal("sponsored")),
    targetId: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("expired"), v.literal("pending")),
    startTime: v.number(),
    endTime: v.number(),
    impressions: v.number(),
    clicks: v.number(),
    price: v.number(),
    isDemo: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  newsletterSubscribers: defineTable({
    email: v.string(),
    userId: v.optional(v.id("users")),
    isActive: v.boolean(),
    subscribedAt: v.number(),
  }).index("by_email", ["email"]),

  mediaFiles: defineTable({
    storageId: v.id("_storage"),
    folder: v.string(),
    kind: v.string(),
    ownerId: v.optional(v.id("users")),
    createdAt: v.number(),
  })
    .index("by_storageId", ["storageId"])
    .index("by_owner_folder", ["ownerId", "folder"])
    .index("by_folder", ["folder"]),

  moderationLogs: defineTable({
    contentType: v.union(v.literal("post"), v.literal("comment"), v.literal("chat")),
    contentId: v.string(),
    authorId: v.id("users"),
    reason: v.string(),
    action: v.union(v.literal("blocked"), v.literal("flagged"), v.literal("approved")),
    isDemo: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_author", ["authorId"])
    .index("by_createdAt", ["createdAt"]),
});
