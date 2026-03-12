/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as bookmarks from "../bookmarks.js";
import type * as chat from "../chat.js";
import type * as comments from "../comments.js";
import type * as events from "../events.js";
import type * as forums from "../forums.js";
import type * as gamification from "../gamification.js";
import type * as marketplace from "../marketplace.js";
import type * as moderation from "../moderation.js";
import type * as news from "../news.js";
import type * as newsletter from "../newsletter.js";
import type * as notifications from "../notifications.js";
import type * as polls from "../polls.js";
import type * as posts from "../posts.js";
import type * as search from "../search.js";
import type * as seed from "../seed.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  bookmarks: typeof bookmarks;
  chat: typeof chat;
  comments: typeof comments;
  events: typeof events;
  forums: typeof forums;
  gamification: typeof gamification;
  marketplace: typeof marketplace;
  moderation: typeof moderation;
  news: typeof news;
  newsletter: typeof newsletter;
  notifications: typeof notifications;
  polls: typeof polls;
  posts: typeof posts;
  search: typeof search;
  seed: typeof seed;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
