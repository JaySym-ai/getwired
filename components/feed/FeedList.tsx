"use client";

import { useState, useCallback } from "react";
import { PostCard } from "./PostCard";
import { InfiniteScroll } from "@/components/shared/InfiniteScroll";
import { Skeleton } from "@/components/ui/skeleton";

interface DemoPost {
  title: string;
  content: string;
  category: string;
  tags: string[];
  type: "post" | "poll";
  likes: number;
  commentCount: number;
  views: number;
  isBoosted: boolean;
  isPinned: boolean;
  createdAt: number;
  authorIndex: number;
}

interface FeedListProps {
  posts: DemoPost[];
  isLoading?: boolean;
}

const PAGE_SIZE = 8;

function PostSkeleton() {
  return (
    <div className="glass rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2.5">
        <Skeleton className="size-8 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-2 w-16" />
        </div>
      </div>
      <Skeleton className="h-5 w-3/4" />
      <div className="space-y-1.5">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-12" />
      </div>
    </div>
  );
}

export function FeedList({ posts, isLoading }: FeedListProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<number>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<number, number>>(() => {
    const counts: Record<number, number> = {};
    posts.forEach((p, i) => { counts[i] = p.likes; });
    return counts;
  });

  const hasMore = visibleCount < posts.length;
  const visiblePosts = posts.slice(0, visibleCount);

  const handleLoadMore = useCallback(() => {
    if (loading) return;
    setLoading(true);
    // Simulate network delay
    setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, posts.length));
      setLoading(false);
    }, 600);
  }, [loading, posts.length]);

  const handleLike = (postIndex: number) => {
    setLikedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(postIndex)) {
        next.delete(postIndex);
        setLikeCounts((c) => ({ ...c, [postIndex]: (c[postIndex] ?? 0) - 1 }));
      } else {
        next.add(postIndex);
        setLikeCounts((c) => ({ ...c, [postIndex]: (c[postIndex] ?? 0) + 1 }));
      }
      return next;
    });
  };

  const handleBookmark = (postIndex: number) => {
    setBookmarkedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(postIndex)) next.delete(postIndex);
      else next.add(postIndex);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <PostSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <InfiniteScroll onLoadMore={handleLoadMore} hasMore={hasMore} isLoading={loading}>
      <div className="space-y-4">
        {visiblePosts.map((post, idx) => {
          // Find original index in the full posts array
          const originalIndex = posts.indexOf(post);
          return (
            <PostCard
              key={`${post.title}-${originalIndex}`}
              post={post}
              postIndex={originalIndex}
              liked={likedPosts.has(originalIndex)}
              bookmarked={bookmarkedPosts.has(originalIndex)}
              likeCount={likeCounts[originalIndex] ?? post.likes}
              onLike={() => handleLike(originalIndex)}
              onBookmark={() => handleBookmark(originalIndex)}
            />
          );
        })}
      </div>
    </InfiniteScroll>
  );
}

