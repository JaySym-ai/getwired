"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Bookmark, X, Heart, MessageSquare, Eye, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { UserAvatar } from "@/components/shared/Avatar";
import { DEMO_BOOKMARKS, DEMO_POSTS, DEMO_NEWS_ARTICLES, DEMO_USERS as DATA_USERS } from "@/lib/demo-data";
import { useDemoAuth } from "@/lib/demo-auth";

const USER_ID_TO_INDEX: Record<string, number> = {
  user_001: 0,
  user_002: 1,
  user_003: 2,
  user_004: 3,
  user_005: 5,
};

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
  const { user } = useDemoAuth();
  const userIndex = user ? (USER_ID_TO_INDEX[user.id] ?? 0) : 0;

  const initialBookmarks = useMemo(() => {
    return DEMO_BOOKMARKS
      .filter((b) => b.userIndex === userIndex)
      .map((b): BookmarkItem | null => {
        if (b.targetType === "post" && b.postIndex !== undefined) {
          const post = DEMO_POSTS[b.postIndex];
          if (!post) return null;
          const author = DATA_USERS[post.authorIndex];
          return {
            id: `post-${b.postIndex}`,
            targetType: "post",
            title: post.title,
            subtitle: `by ${author?.name ?? "Unknown"} in ${post.category ?? "General"}`,
            link: `/forums/${post.category}/post-${b.postIndex}`,
            createdAt: b.createdAt,
            meta: { likes: post.likes, comments: post.commentCount, views: post.views },
          };
        }
        if (b.targetType === "news" && b.newsIndex !== undefined) {
          const article = DEMO_NEWS_ARTICLES[b.newsIndex];
          if (!article) return null;
          return {
            id: `news-${b.newsIndex}`,
            targetType: "news",
            title: article.title,
            subtitle: article.source,
            link: article.url,
            createdAt: b.createdAt,
            meta: { source: article.source },
          };
        }
        return null;
      })
      .filter((b): b is BookmarkItem => b !== null);
  }, [userIndex]);

  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(initialBookmarks);

  const remove = (id: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  };

  const posts = bookmarks.filter((b) => b.targetType === "post");
  const news = bookmarks.filter((b) => b.targetType === "news");
  const users = bookmarks.filter((b) => b.targetType === "user");

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Bookmark className="size-6 text-[#3B82F6]" />
        <h1 className="text-2xl font-bold text-white">Bookmarks</h1>
      </div>

      <Tabs defaultValue="posts">
        <TabsList className="mb-4 bg-zinc-900/40 border border-white/8">
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
          <BookmarkList items={posts} onRemove={remove} />
        </TabsContent>
        <TabsContent value="news">
          <BookmarkList items={news} onRemove={remove} />
        </TabsContent>
        <TabsContent value="users">
          <BookmarkList items={users} onRemove={remove} />
        </TabsContent>
      </Tabs>
    </main>
  );
}

function BookmarkList({ items, onRemove }: { items: BookmarkItem[]; onRemove: (id: string) => void }) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-white/5 bg-white/[0.02] px-4 py-12 text-center">
        <Bookmark className="mx-auto size-10 text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground">No bookmarks yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <Card key={item.id} className="glass border-white/5 p-3">
          <div className="flex items-start justify-between gap-3">
            <Link href={item.link} className="flex-1 min-w-0 group">
              <h3 className="text-sm font-medium text-white group-hover:text-[#3B82F6] transition-colors line-clamp-1">
                {item.title}
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">{item.subtitle}</p>
              {item.meta && (item.meta.likes !== undefined) && (
                <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Heart className="size-3" />{item.meta.likes}</span>
                  <span className="flex items-center gap-1"><MessageSquare className="size-3" />{item.meta.comments}</span>
                  <span className="flex items-center gap-1"><Eye className="size-3" />{item.meta.views}</span>
                </div>
              )}
              {item.meta?.source && !item.meta.likes && (
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

