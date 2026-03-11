"use client";

import Link from "next/link";
import { ExternalLink, MessageSquare, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TagList } from "@/components/shared/TagList";

// Source color mapping
const SOURCE_COLORS: Record<string, string> = {
  "Hacker News": "#FF6600",
  "The Verge": "#A855F7",
  "TechCrunch": "#3B82F6",
  "Ars Technica": "#FF4500",
  "Wired": "#FFFFFF",
  "Dev.to": "#3B82F6",
  "Product Hunt": "#DA552F",
  "Smashing Magazine": "#EF4444",
  "NYT Technology": "#888888",
  "MIT Technology Review": "#A855F7",
  "IEEE Spectrum": "#10B981",
  "The Register": "#EF4444",
  "ZDNet": "#3B82F6",
  "VentureBeat": "#F59E0B",
};

export interface DemoNewsArticle {
  title: string;
  url: string;
  source: string;
  summary: string;
  imageUrl?: string;
  tags: string[];
  publishedAt: number;
  isDemo: boolean;
  createdAt: number;
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

interface NewsCardProps {
  article: DemoNewsArticle;
  articleIndex: number;
}

export function NewsCard({ article, articleIndex }: NewsCardProps) {
  const sourceColor = SOURCE_COLORS[article.source] ?? "#888888";

  return (
    <article className="glass rounded-xl p-4 transition-all duration-200 hover:border-[#3B82F6]/20 hover:glow-green-sm group flex flex-col">
      {/* Source + Time */}
      <div className="flex items-center justify-between mb-2">
        <Badge
          variant="outline"
          className="text-[10px] font-semibold border-transparent"
          style={{ backgroundColor: `${sourceColor}20`, color: sourceColor }}
        >
          {article.source}
        </Badge>
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Clock className="size-3" />
          {formatRelativeTime(article.publishedAt)}
        </span>
      </div>

      {/* Title — links to original URL */}
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block mb-2 group-hover:text-[#3B82F6] transition-colors"
      >
        <h3 className="text-base font-semibold leading-snug flex items-start gap-1.5">
          <span className="flex-1">{article.title}</span>
          <ExternalLink className="size-3.5 shrink-0 mt-1 opacity-0 group-hover:opacity-60 transition-opacity" />
        </h3>
      </a>

      {/* AI Summary */}
      <p className="text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-3 flex-1">
        {article.summary}
      </p>

      {/* Tags */}
      <TagList tags={article.tags.slice(0, 4)} size="sm" className="mb-3" />

      {/* Discuss button */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
        <Link href={`/forums/ai-ml/post-${articleIndex % 20}`}>
          <Button
            variant="ghost"
            size="xs"
            className="text-muted-foreground hover:text-[#3B82F6] gap-1.5"
          >
            <MessageSquare className="size-3.5" />
            Discuss on GetWired
          </Button>
        </Link>
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-muted-foreground hover:text-[#3B82F6] transition-colors flex items-center gap-1"
        >
          Read full article
          <ExternalLink className="size-3" />
        </a>
      </div>
    </article>
  );
}

