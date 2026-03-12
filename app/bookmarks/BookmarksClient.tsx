"use client";

import Link from "next/link";
import { Bookmark, X, Heart, MessageSquare, Eye, Newspaper } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAppAuth } from "@/lib/auth";
import { api } from "../../convex/_generated/api";

interface BookmarkItem {
  id: string;
  targetType: "post" | "news" | "user";
  title: string;
  subtitle: string;
  link: string;
  createdAt: number;
  meta?: { likes?: number; comments?: number; views?: number; source?: string };
}

export function BookmarksClient() {
  const { user } = useAppAuth();
  const bookmarks = (useQuery(
    api.bookmarks.getDetailedForCurrentUser,
    user ? { limit: 100 } : "skip",
  ) ?? []) as BookmarkItem[];
  const removeBookmark = useMutation(api.bookmarks.removeForCurrentUser);

  const posts = bookmarks.filter((bookmark) => bookmark.targetType === "post");
  const news = bookmarks.filter((bookmark) => bookmark.targetType === "news");
  const users = bookmarks.filter((bookmark) => bookmark.targetType === "user");

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6 flex items-center gap-3">
        <Bookmark className="size-6 text-[#3B82F6]" />
        <h1 className="text-2xl font-bold text-foreground">Bookmarks</h1>
      </div>

      <Tabs defaultValue="posts">
        <TabsList className="mb-4 border border-border bg-muted/50">
          <TabsTrigger value="posts" className="data-active:text-[#3B82F6]">
            Posts ({posts.length})
          </TabsTrigger>
          <TabsTrigger value="news" className="data-active:text-[#3B82F6]">
            News ({news.length})
          </TabsTrigger>
          <TabsTrigger value="users" className="data-active:text-[#3B82F6]">
            Users ({users.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts">
          <BookmarkList items={posts} onRemove={(id) => void removeBookmark({ bookmarkId: id as never })} />
        </TabsContent>
        <TabsContent value="news">
          <BookmarkList items={news} onRemove={(id) => void removeBookmark({ bookmarkId: id as never })} />
        </TabsContent>
        <TabsContent value="users">
          <BookmarkList items={users} onRemove={(id) => void removeBookmark({ bookmarkId: id as never })} />
        </TabsContent>
      </Tabs>
    </main>
  );
}

function BookmarkList({ items, onRemove }: { items: BookmarkItem[]; onRemove: (id: string) => void }) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 px-4 py-12 text-center">
        <Bookmark className="mx-auto mb-3 size-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">No bookmarks yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <Card key={item.id} className="glass border-border p-3">
          <div className="flex items-start justify-between gap-3">
            <Link href={item.link} className="group min-w-0 flex-1">
              <h3 className="line-clamp-1 text-sm font-medium text-foreground transition-colors group-hover:text-[#3B82F6]">
                {item.title}
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">{item.subtitle}</p>
              {item.meta && item.meta.likes !== undefined && (
                <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Heart className="size-3" />{item.meta.likes}</span>
                  <span className="flex items-center gap-1"><MessageSquare className="size-3" />{item.meta.comments}</span>
                  <span className="flex items-center gap-1"><Eye className="size-3" />{item.meta.views}</span>
                </div>
              )}
              {item.meta?.source && item.meta.likes === undefined && (
                <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <Newspaper className="size-3" />{item.meta.source}
                </div>
              )}
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRemove(item.id)}
              className="size-7 shrink-0 text-muted-foreground hover:text-red-400"
            >
              <X className="size-3.5" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
