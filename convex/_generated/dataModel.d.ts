/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Stub for Convex generated types.
 * This will be replaced when Convex schema is set up and `npx convex dev` generates real types.
 */

export type TableNames =
  | "users"
  | "posts"
  | "comments"
  | "forumCategories"
  | "chatRooms"
  | "chatMessages"
  | "newsArticles"
  | "notifications"
  | "bookmarks"
  | "follows"
  | "polls"
  | "events"
  | "promotions"
  | "newsletterSubscribers"
  | "moderationLogs";

export type Id<T extends TableNames> = string & { __tableName: T };

export type DataModel = Record<TableNames, any>;

