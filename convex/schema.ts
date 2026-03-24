import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ── Users (synced from Clerk) ──
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_clerk_id", ["clerkId"]),

  // ── Projects ──
  projects: defineTable({
    userId: v.id("users"),
    name: v.string(),
    url: v.string(),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("scanning"),
      v.literal("ready"),
      v.literal("error")
    ),
    scannedAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  // ── Keywords ──
  keywords: defineTable({
    projectId: v.id("projects"),
    keyword: v.string(),
    source: v.union(
      v.literal("extracted"),
      v.literal("competitor"),
      v.literal("manual")
    ),
    searchVolume: v.optional(v.number()),
    difficulty: v.optional(v.number()),
    trendDirection: v.optional(
      v.union(
        v.literal("rising"),
        v.literal("stable"),
        v.literal("declining")
      )
    ),
    seoRank: v.optional(v.number()),
    geoScore: v.optional(v.number()),
    tracked: v.optional(v.boolean()),
  }).index("by_project", ["projectId"]),

  // ── Competitors ──
  competitors: defineTable({
    projectId: v.id("projects"),
    domain: v.string(),
    name: v.optional(v.string()),
    overlapScore: v.optional(v.number()),
    discoveredAt: v.number(),
  }).index("by_project", ["projectId"]),

  // ── Competitor Keywords (join table) ──
  competitorKeywords: defineTable({
    competitorId: v.id("competitors"),
    keywordId: v.id("keywords"),
    rank: v.optional(v.number()),
  })
    .index("by_competitor", ["competitorId"])
    .index("by_keyword", ["keywordId"]),

  // ── Reddit Posts ──
  redditPosts: defineTable({
    projectId: v.id("projects"),
    keywordId: v.optional(v.id("keywords")),
    redditId: v.string(),
    subreddit: v.string(),
    title: v.string(),
    selfText: v.optional(v.string()),
    url: v.string(),
    score: v.number(),
    numComments: v.number(),
    createdUtc: v.number(),
    relevanceScore: v.number(),
    status: v.union(
      v.literal("new"),
      v.literal("reviewed"),
      v.literal("responded"),
      v.literal("dismissed")
    ),
    suggestedResponse: v.optional(v.string()),
    discoveredAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_project_status", ["projectId", "status"])
    .index("by_reddit_id", ["redditId"]),

  // ── Knowledge Base ──
  knowledgeBase: defineTable({
    projectId: v.id("projects"),
    title: v.string(),
    content: v.string(),
    category: v.union(
      v.literal("product"),
      v.literal("faq"),
      v.literal("messaging"),
      v.literal("competitor_diff")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_project", ["projectId"]),

  // ── Agent Runs ──
  agentRuns: defineTable({
    projectId: v.id("projects"),
    userId: v.id("users"),
    prompt: v.string(),
    status: v.union(
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed")
    ),
    result: v.optional(v.string()),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  }).index("by_project", ["projectId"]),

  // ── Agent Tool Calls (child of agentRuns) ──
  agentToolCalls: defineTable({
    runId: v.id("agentRuns"),
    toolName: v.string(),
    input: v.string(),
    output: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed")
    ),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
  }).index("by_run", ["runId"]),

  // ── Keyword Snapshots (time-series for tracking) ──
  keywordSnapshots: defineTable({
    keywordId: v.id("keywords"),
    searchVolume: v.optional(v.number()),
    seoRank: v.optional(v.number()),
    geoScore: v.optional(v.number()),
    trendScore: v.optional(v.number()),
    snapshotDate: v.number(),
  }).index("by_keyword", ["keywordId"]),

  // ── Alerts ──
  alerts: defineTable({
    projectId: v.id("projects"),
    type: v.union(
      v.literal("reddit_mention"),
      v.literal("rank_change"),
      v.literal("trend_spike"),
      v.literal("new_competitor")
    ),
    title: v.string(),
    description: v.string(),
    isRead: v.boolean(),
    relatedId: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_project_unread", ["projectId", "isRead"]),
});

