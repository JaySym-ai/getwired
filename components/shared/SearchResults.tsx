"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "convex/react";
import {
  FileText,
  Users,
  Newspaper,
  MessageSquare,
  SearchX,
  ExternalLink,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/Avatar";
import { RankBadge } from "@/components/shared/Badge";
import { TagList } from "@/components/shared/TagList";
import { api } from "../../convex/_generated/api";

export type SearchTab = "all" | "posts" | "users" | "news" | "forums";

interface SearchResultsProps {
  query: string;
  tab: SearchTab;
}

function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, index) =>
        regex.test(part) ? (
          <mark key={index} className="rounded-sm bg-[#3B82F6]/20 px-0.5 text-[#3B82F6]">
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}

function formatRelativeTime(timestamp: number) {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function matchesQuery(text: string, query: string) {
  return text.toLowerCase().includes(query.toLowerCase());
}

export function useSearchResults(query: string) {
  const trimmed = query.trim();
  const posts = useQuery(api.search.searchPosts, trimmed ? { query: trimmed, limit: 20 } : "skip") ?? [];
  const users = useQuery(api.search.searchUsers, trimmed ? { query: trimmed, limit: 10 } : "skip") ?? [];
  const news = useQuery(api.search.searchNews, trimmed ? { query: trimmed, limit: 10 } : "skip") ?? [];
  const forumsSource = useQuery(api.forums.listCategories, trimmed ? {} : "skip") ?? [];

  const forums = useMemo(
    () =>
      forumsSource.filter(
        (category) =>
          matchesQuery(category.name, trimmed) || matchesQuery(category.description, trimmed),
      ),
    [forumsSource, trimmed],
  );

  return { posts, users, news, forums };
}

export function SearchResults({ query, tab }: SearchResultsProps) {
  const { posts, users, news, forums } = useSearchResults(query);

  if (!query.trim()) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <SearchX className="mb-4 size-12 opacity-30" />
        <p className="text-lg font-medium">Start typing to search</p>
        <p className="mt-1 text-sm">Search across posts, users, news, and forums</p>
      </div>
    );
  }

  const totalResults = posts.length + users.length + news.length + forums.length;
  if (totalResults === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <SearchX className="mb-4 size-12 opacity-30" />
        <p className="text-lg font-medium">No results found</p>
        <p className="mt-1 text-sm">Try a different search term</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {(tab === "all" || tab === "posts") && posts.length > 0 && (
        <ResultSection icon={FileText} title="Posts" count={posts.length}>
          {posts.map((post) => (
            <PostResult key={post._id} post={post} query={query} />
          ))}
        </ResultSection>
      )}

      {(tab === "all" || tab === "users") && users.length > 0 && (
        <ResultSection icon={Users} title="Users" count={users.length}>
          {users.map((user) => (
            <UserResult key={user._id} user={user} query={query} />
          ))}
        </ResultSection>
      )}

      {(tab === "all" || tab === "news") && news.length > 0 && (
        <ResultSection icon={Newspaper} title="News" count={news.length}>
          {news.map((article) => (
            <NewsResult key={article._id} article={article} query={query} />
          ))}
        </ResultSection>
      )}

      {(tab === "all" || tab === "forums") && forums.length > 0 && (
        <ResultSection icon={MessageSquare} title="Forums" count={forums.length}>
          {forums.map((category) => (
            <ForumResult key={category._id} category={category} query={query} />
          ))}
        </ResultSection>
      )}
    </div>
  );
}

function ResultSection({
  icon: Icon,
  title,
  count,
  children,
}: {
  icon: React.ElementType;
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <Icon className="size-4 text-[#3B82F6]" />
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
          {count}
        </Badge>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function PostResult({ post, query }: { post: any; query: string }) {
  const preview = post.content.slice(0, 150);
  return (
    <Link href={`/forums/${post.category ?? "off-topic"}/${post._id}`} className="block">
      <div className="glass cursor-pointer rounded-lg p-3 transition-all hover:border-[#3B82F6]/20">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{formatRelativeTime(post.createdAt)}</span>
        </div>
        <h3 className="mb-1 text-sm font-semibold">
          <HighlightText text={post.title} query={query} />
        </h3>
        <p className="line-clamp-2 text-xs text-muted-foreground">
          <HighlightText text={preview} query={query} />
        </p>
        <TagList tags={post.tags.slice(0, 3)} size="sm" className="mt-2" />
      </div>
    </Link>
  );
}

function UserResult({ user, query }: { user: any; query: string }) {
  return (
    <Link href={`/profile/${user.username}`} className="block">
      <div className="glass flex items-center gap-3 rounded-lg p-3 transition-all hover:border-[#3B82F6]/20">
        <UserAvatar src={user.avatar} name={user.name} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">
              <HighlightText text={user.name} query={query} />
            </span>
            <RankBadge rank={user.rank} />
          </div>
          <span className="text-xs text-muted-foreground">
            @<HighlightText text={user.username} query={query} />
          </span>
          {user.bio && (
            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
              <HighlightText text={user.bio} query={query} />
            </p>
          )}
        </div>
        <Button variant="ghost" size="xs" className="shrink-0 text-[#3B82F6]">
          View Profile
        </Button>
      </div>
    </Link>
  );
}

function NewsResult({ article, query }: { article: any; query: string }) {
  return (
    <a href={article.url} target="_blank" rel="noopener noreferrer" className="block">
      <div className="glass rounded-lg p-3 transition-all hover:border-[#3B82F6]/20">
        <div className="mb-1 flex items-center gap-2">
          <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
            {article.source}
          </Badge>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="size-3" />
            {formatRelativeTime(article.publishedAt)}
          </span>
          <ExternalLink className="ml-auto size-3 text-muted-foreground" />
        </div>
        <h3 className="mb-1 text-sm font-semibold">
          <HighlightText text={article.title} query={query} />
        </h3>
        <p className="line-clamp-2 text-xs text-muted-foreground">
          <HighlightText text={article.summary} query={query} />
        </p>
      </div>
    </a>
  );
}

function ForumResult({ category, query }: { category: any; query: string }) {
  return (
    <Link href={`/forums/${category.slug}`} className="block">
      <div className="glass flex items-center gap-3 rounded-lg p-3 transition-all hover:border-[#3B82F6]/20">
        <div
          className="flex size-9 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${category.color}15`, color: category.color }}
        >
          <MessageSquare className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold">
            <HighlightText text={category.name} query={query} />
          </h3>
          <p className="line-clamp-1 text-xs text-muted-foreground">
            <HighlightText text={category.description} query={query} />
          </p>
        </div>
        <Badge variant="secondary" className="shrink-0 px-1.5 py-0 text-[10px]">
          {category.postCount} posts
        </Badge>
      </div>
    </Link>
  );
}
