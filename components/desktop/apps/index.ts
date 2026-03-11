import type { ComponentType } from "react";
import { FeedApp } from "./FeedApp";
import { ForumsApp } from "./ForumsApp";
import { ChatApp } from "./ChatApp";
import { NewsApp } from "./NewsApp";
import { DiscoverApp } from "./DiscoverApp";
import { MarketplaceApp } from "./MarketplaceApp";
import { ProfileApp } from "./ProfileApp";
import { BookmarksApp } from "./BookmarksApp";
import { NotificationsApp } from "./NotificationsApp";
import { SearchApp } from "./SearchApp";
import { AdminApp } from "./AdminApp";
import { NewsletterApp } from "./NewsletterApp";

/**
 * Maps appId strings (from APP_REGISTRY) to the React component
 * that renders the app content inside a desktop window.
 */
export const APP_CONTENT_MAP: Record<string, ComponentType> = {
  feed: FeedApp,
  forums: ForumsApp,
  chat: ChatApp,
  news: NewsApp,
  discover: DiscoverApp,
  marketplace: MarketplaceApp,
  profile: ProfileApp,
  bookmarks: BookmarksApp,
  notifications: NotificationsApp,
  search: SearchApp,
  admin: AdminApp,
  newsletter: NewsletterApp,
};

