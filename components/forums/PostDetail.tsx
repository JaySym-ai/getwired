"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, Bookmark, Share2, Eye, MessageSquare, Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { UserAvatar } from "@/components/shared/Avatar";
import { RankBadge } from "@/components/shared/Badge";
import { DEMO_USERS, DEMO_POSTS, DEMO_CATEGORIES } from "@/lib/demo-data";

function formatTimeAgo(ts: number): string {
  const d = Date.now() - ts;
  const m = Math.floor(d / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface PostDetailProps { postIndex: number; }

export function PostDetail({ postIndex }: PostDetailProps) {
  const post = DEMO_POSTS[postIndex];
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(post?.likes ?? 0);
  if (!post) return null;
  const author = DEMO_USERS[post.authorIndex];
  if (!author) return null;
  const category = DEMO_CATEGORIES.find((c) => c.slug === post.category);
  const handleLike = () => { setLiked(!liked); setLikeCount((p) => (liked ? p - 1 : p + 1)); };
  const relatedPosts = DEMO_POSTS.map((p, i) => ({ ...p, index: i })).filter((p) => p.category === post.category && p.index !== postIndex).slice(0, 3);

  return (
    <div className="space-y-6">
      <PostContent post={post} author={author} category={category} liked={liked} bookmarked={bookmarked} likeCount={likeCount} onLike={handleLike} onBookmark={() => setBookmarked(!bookmarked)} />
      <AuthorCard author={author} />
      <RelatedPosts posts={relatedPosts} />
    </div>
  );
}

function PostContent({ post, author, category, liked, bookmarked, likeCount, onLike, onBookmark }: { post: (typeof DEMO_POSTS)[number]; author: (typeof DEMO_USERS)[number]; category: (typeof DEMO_CATEGORIES)[number] | undefined; liked: boolean; bookmarked: boolean; likeCount: number; onLike: () => void; onBookmark: () => void; }) {
  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {category && (<Link href={`/forums/${category.slug}`}><Badge variant="secondary" className="text-[10px]" style={{ color: category.color, borderColor: `${category.color}30` }}>{category.name}</Badge></Link>)}
        {post.tags.map((tag) => (<Badge key={tag} variant="secondary" className="text-[10px]">#{tag}</Badge>))}
        {post.isPinned && (<Badge className="bg-[#3B82F6]/10 text-[#3B82F6] text-[10px] border-[#3B82F6]/30">📌 Pinned</Badge>)}
      </div>
      <h1 className="text-xl font-bold text-white mb-4">{post.title}</h1>
      <div className="flex items-center gap-3 mb-6">
        <UserAvatar src={author.avatar} name={author.name} size="md" />
        <div>
          <div className="flex items-center gap-2">
            <Link href={`/profile/${author.username}`} className="text-sm font-medium text-white hover:text-[#3B82F6] transition-colors">{author.name}</Link>
            <RankBadge rank={author.rank} />
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span>{formatTimeAgo(post.createdAt)}</span><span>·</span>
            <span className="flex items-center gap-0.5"><Eye className="size-3" /> {post.views.toLocaleString()}</span>
          </div>
        </div>
      </div>
      <div className="prose prose-invert prose-sm max-w-none text-foreground/90 whitespace-pre-wrap">{post.content}</div>
      <Separator className="my-6" />
      <div className="flex items-center gap-2">
        <Button variant={liked ? "secondary" : "ghost"} size="sm" onClick={onLike} className={`gap-1.5 ${liked ? "text-red-400" : ""}`}><Heart className={`size-3.5 ${liked ? "fill-current" : ""}`} />{likeCount}</Button>
        <Button variant="ghost" size="sm" className="gap-1.5"><MessageSquare className="size-3.5" />{post.commentCount}</Button>
        <Button variant={bookmarked ? "secondary" : "ghost"} size="sm" onClick={onBookmark} className={`gap-1.5 ${bookmarked ? "text-[#3B82F6]" : ""}`}><Bookmark className={`size-3.5 ${bookmarked ? "fill-current" : ""}`} />Save</Button>
        <Button variant="ghost" size="sm" className="gap-1.5"><Share2 className="size-3.5" />Share</Button>
      </div>
    </div>
  );
}

function AuthorCard({ author }: { author: (typeof DEMO_USERS)[number] }) {
  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <UserAvatar src={author.avatar} name={author.name} size="lg" />
        <div>
          <Link href={`/profile/${author.username}`} className="text-sm font-semibold text-white hover:text-[#3B82F6] transition-colors">{author.name}</Link>
          <div className="flex items-center gap-1.5 mt-0.5">
            <RankBadge rank={author.rank} />
            <span className="text-[10px] text-muted-foreground">{author.karma.toLocaleString()} karma</span>
          </div>
        </div>
      </div>
      {author.bio && <p className="text-xs text-muted-foreground mb-3 line-clamp-3">{author.bio}</p>}
      <div className="flex items-center gap-4 text-[10px] text-muted-foreground mb-3">
        {author.location && <span className="flex items-center gap-1"><MapPin className="size-3" /> {author.location}</span>}
        <span className="flex items-center gap-1"><Calendar className="size-3" /> Joined {formatDate(author.createdAt)}</span>
      </div>
      <Link href={`/profile/${author.username}`}><Button variant="outline" size="sm" className="w-full">View Profile</Button></Link>
    </div>
  );
}

function RelatedPosts({ posts }: { posts: Array<(typeof DEMO_POSTS)[number] & { index: number }> }) {
  if (posts.length === 0) return null;
  return (
    <div className="glass rounded-xl p-5">
      <h3 className="text-sm font-semibold text-white mb-3">Related Posts</h3>
      <div className="space-y-3">
        {posts.map((rp) => {
          const rpAuthor = DEMO_USERS[rp.authorIndex];
          return (
            <Link key={rp.index} href={`/forums/${rp.category}/post-${rp.index}`} className="block group">
              <div className="rounded-lg p-3 transition-colors hover:bg-white/5">
                <h4 className="text-xs font-medium text-white group-hover:text-[#3B82F6] transition-colors line-clamp-2">{rp.title}</h4>
                <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
                  <span>{rpAuthor?.name}</span><span>·</span>
                  <span className="flex items-center gap-0.5"><Heart className="size-2.5" /> {rp.likes}</span>
                  <span className="flex items-center gap-0.5"><MessageSquare className="size-2.5" /> {rp.commentCount}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

