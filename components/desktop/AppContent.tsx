"use client";

import React, { Suspense } from "react";
import { Loader2 } from "lucide-react";

// Lazy-load each app's content to keep the bundle lean
const ForumsApp = React.lazy(() =>
  import("@/components/desktop/apps/ForumsApp").then((m) => ({ default: m.ForumsApp }))
);
const ChatApp = React.lazy(() =>
  import("@/components/desktop/apps/ChatApp").then((m) => ({ default: m.ChatApp }))
);
const NewsApp = React.lazy(() =>
  import("@/components/desktop/apps/NewsApp").then((m) => ({ default: m.NewsApp }))
);
const DiscoverApp = React.lazy(() =>
  import("@/components/desktop/apps/DiscoverApp").then((m) => ({ default: m.DiscoverApp }))
);
const FeedApp = React.lazy(() =>
  import("@/components/desktop/apps/FeedApp").then((m) => ({ default: m.FeedApp }))
);
const ProfileApp = React.lazy(() =>
  import("@/components/desktop/apps/ProfileApp").then((m) => ({ default: m.ProfileApp }))
);
const BookmarksApp = React.lazy(() =>
  import("@/components/desktop/apps/BookmarksApp").then((m) => ({ default: m.BookmarksApp }))
);
const NotificationsApp = React.lazy(() =>
  import("@/components/desktop/apps/NotificationsApp").then((m) => ({ default: m.NotificationsApp }))
);
const SearchApp = React.lazy(() =>
  import("@/components/desktop/apps/SearchApp").then((m) => ({ default: m.SearchApp }))
);
const AdminApp = React.lazy(() =>
  import("@/components/desktop/apps/AdminApp").then((m) => ({ default: m.AdminApp }))
);
const MarketplaceApp = React.lazy(() =>
  import("@/components/desktop/apps/MarketplaceApp").then((m) => ({ default: m.MarketplaceApp }))
);
const NewsletterApp = React.lazy(() =>
  import("@/components/desktop/apps/NewsletterApp").then((m) => ({ default: m.NewsletterApp }))
);

function WindowLoading() {
  return (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  );
}

/** Placeholder for apps that don't have dedicated content yet */
function PlaceholderContent({ appId, title }: { appId: string; title: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-lg font-semibold text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground">
        This app is coming soon. ({appId})
      </p>
    </div>
  );
}

interface AppContentProps {
  appId: string;
  title: string;
}

/**
 * Maps an appId from the window manager registry to the actual page content.
 * Each content component is wrapped to fit inside a window (full height, scrollable).
 */
export function AppContent({ appId, title }: AppContentProps) {
  return (
    <Suspense fallback={<WindowLoading />}>
      <div className="h-full overflow-auto">
        {renderContent(appId, title)}
      </div>
    </Suspense>
  );
}

function renderContent(appId: string, title: string): React.ReactNode {
  switch (appId) {
    case "feed":
      return <FeedApp />;
    case "forums":
      return <ForumsApp />;
    case "chat":
      return <ChatApp />;
    case "news":
      return <NewsApp />;
    case "discover":
      return <DiscoverApp />;
    case "profile":
      return <ProfileApp />;
    case "bookmarks":
      return <BookmarksApp />;
    case "notifications":
      return <NotificationsApp />;
    case "search":
      return <SearchApp />;
    case "admin":
      return <AdminApp />;
    case "marketplace":
      return <MarketplaceApp />;
    case "newsletter":
      return <NewsletterApp />;
    default:
      return <PlaceholderContent appId={appId} title={title} />;
  }
}
