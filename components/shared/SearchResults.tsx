"use client";

import Link from "next/link";
import { useMemo } from "react";
import { FileText, Users, Newspaper, MessageSquare, SearchX, ExternalLink, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/Avatar";
import { RankBadge } from "@/components/shared/Badge";
import { TagList } from "@/components/shared/TagList";
import { DEMO_POSTS, DEMO_USERS, DEMO_NEWS_ARTICLES, DEMO_CATEGORIES } from "@/lib/demo-data";
import type { UserRank } from "@/lib/types";

export type SearchTab = "all" | "posts" | "users" | "news" | "forums";

interface SearchResultsProps {
  query: string;
  tab: SearchTab;
}

// Highlight matching text
function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-[#3B82F6]/20 text-[#3B82F6] rounded-sm px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function formatRelativeTime(timestamp: number): string {
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

function matchesQuery(text: string, query: string): boolean {
  return text.toLowerCase().includes(query.toLowerCase());
}

export function useSearchResults(query: string) {
  return useMemo(() => {
    if (!query.trim()) return { posts: [], users: [], news: [], forums: [] };
    const q = query.trim();

    const posts = DEMO_POSTS
      .map((p, i) => ({ ...p, _index: i }))
      .filter((p) => matchesQuery(p.title, q) || matchesQuery(p.content, q));

    const users = DEMO_USERS.filter(
      (u) => matchesQuery(u.name, q) || matchesQuery(u.username, q) || matchesQuery(u.bio ?? "", q)
    );

    const news = DEMO_NEWS_ARTICLES.filter(
      (a) => matchesQuery(a.title, q) || matchesQuery(a.summary, q)
    );

    const forums = DEMO_CATEGORIES.filter(
      (c) => matchesQuery(c.name, q) || matchesQuery(c.description, q)
    );

    return { posts, users, news, forums };
  }, [query]);
}

export function SearchResults({ query, tab }: SearchResultsProps) {
  const { posts, users, news, forums } = useSearchResults(query);

  if (!query.trim()) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <SearchX className="size-12 mb-4 opacity-30" />
        <p className="text-lg font-medium">Start typing to search</p>
        <p className="text-sm mt-1">Search across posts, users, news, and forums</p>
      </div>
    );
  }

  const totalResults = posts.length + users.length + news.length + forums.length;

  if (totalResults === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <SearchX className="size-12 mb-4 opacity-30" />
        <p className="text-lg font-medium">No results found</p>
        <p className="text-sm mt-1">Try a different search term</p>
      </div>
    );
  }

  const showPosts = tab === "all" || tab === "posts";
  const showUsers = tab === "all" || tab === "users";
  const showNews = tab === "all" || tab === "news";
  const showForums = tab === "all" || tab === "forums";

  return (
    <div className="space-y-8">
      {showPosts && posts.length > 0 && (
        <ResultSection icon={FileText} title="Posts" count={posts.length}>
          {posts.map((post) => (
            <PostResult key={post._index} post={post} query={query} />
          ))}
        </ResultSection>
      )}
      {showUsers && users.length > 0 && (
        <ResultSection icon={Users} title="Users" count={users.length}>
          {users.map((user) => (
            <UserResult key={user.username} user={user} query={query} />
          ))}
        </ResultSection>
      )}
      {showNews && news.length > 0 && (
        <ResultSection icon={Newspaper} title="News" count={news.length}>
          {news.map((article, i) => (
            <NewsResult key={i} article={article} query={query} />
          ))}
        </ResultSection>
      )}
      {showForums && forums.length > 0 && (
        <ResultSection icon={MessageSquare} title="Forums" count={forums.length}>
          {forums.map((cat) => (
            <ForumResult key={cat.slug} category={cat} query={query} />
          ))}
        </ResultSection>
      )}
    </div>
  );
}

// --- Sub-components below (will be added via str-replace-editor) ---

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
      <div className="flex items-center gap-2 mb-3">
        <Icon className="size-4 text-[#3B82F6]" />
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{count}</Badge>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

interface PostWithIndex {
  title: string;
  content: string;
  category: string;
  tags: string[];
  type: string;
  likes: number;
  commentCount: number;
  views: number;
  createdAt: number;
  authorIndex: number;
  _index: number;
}

function PostResult({ post, query }: { post: PostWithIndex; query: string }) {
  const author = DEMO_USERS[post.authorIndex];
  const preview = post.content.slice(0, 150);
  return (
    <Link href={`/forums/${post.category}/post-${post._index}`} className="block">
      <div className="glass rounded-lg p-3 hover:border-[#3B82F6]/20 transition-all">
        <div className="flex items-center gap-2 mb-1">
          {author && (
            <span className="text-xs text-muted-foreground">{author.name}</span>
          )}
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Clock className="size-3" />
            {formatRelativeTime(post.createdAt)}
          </span>
        </div>
        <h3 className="text-sm font-semibold mb-1">
          <HighlightText text={post.title} query={query} />
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-2">
          <HighlightText text={preview} query={query} />
        </p>
        <TagList tags={post.tags.slice(0, 3)} size="sm" className="mt-2" />
      </div>
    </Link>
  );
}

function UserResult({ user, query }: { user: typeof DEMO_USERS[number]; query: string }) {
  return (
    <Link href={`/profile/${user.username}`} className="block">
      <div className="glass rounded-lg p-3 hover:border-[#3B82F6]/20 transition-all flex items-center gap-3">
        <UserAvatar src={user.avatar} name={user.name} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">
              <HighlightText text={user.name} query={query} />
            </span>
            <RankBadge rank={user.rank as UserRank} />
          </div>
          <span className="text-xs text-muted-foreground">
            @<HighlightText text={user.username} query={query} />
          </span>
          {user.bio && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
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

function NewsResult({ article, query }: { article: typeof DEMO_NEWS_ARTICLES[number]; query: string }) {
  return (
    <a href={article.url} target="_blank" rel="noopener noreferrer" className="block">
      <div className="glass rounded-lg p-3 hover:border-[#3B82F6]/20 transition-all">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {article.source}
          </Badge>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Clock className="size-3" />
            {formatRelativeTime(article.publishedAt)}
          </span>
          <ExternalLink className="size-3 text-muted-foreground ml-auto" />
        </div>
        <h3 className="text-sm font-semibold mb-1">
          <HighlightText text={article.title} query={query} />
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-2">
          <HighlightText text={article.summary} query={query} />
        </p>
      </div>
    </a>
  );
}

function ForumResult({ category, query }: { category: typeof DEMO_CATEGORIES[number]; query: string }) {
  return (
    <Link href={`/forums/${category.slug}`} className="block">
      <div className="glass rounded-lg p-3 hover:border-[#3B82F6]/20 transition-all flex items-center gap-3">
        <div
          className="flex size-9 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${category.color}15`, color: category.color }}
        >
          <MessageSquare className="size-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold">
            <HighlightText text={category.name} query={query} />
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-1">
            <HighlightText text={category.description} query={query} />
          </p>
        </div>
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
          {category.postCount} posts
        </Badge>
      </div>
    </Link>
  );
}

