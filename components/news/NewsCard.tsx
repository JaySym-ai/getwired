"use client";

import { ExternalLink, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TagList } from "@/components/shared/TagList";

const SOURCE_COLORS: Record<string, string> = {
  "Hacker News": "#FF6600",
  "The Verge": "#EF4444",
  TechCrunch: "#16A34A",
  "Ars Technica": "#F97316",
  Wired: "#E5E7EB",
};

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

interface NewsCardProps {
  article: {
    _id: string;
    title: string;
    url: string;
    source: string;
    summary: string;
    tags: string[];
    publishedAt: number;
  };
}

export function NewsCard({ article }: NewsCardProps) {
  const sourceColor = SOURCE_COLORS[article.source] ?? "#94A3B8";

  return (
    <article className="group flex flex-col rounded-xl p-4 transition-all duration-200 glass hover:border-[#3B82F6]/20 hover:glow-green-sm">
      <div className="mb-2 flex items-center justify-between">
        <Badge
          variant="outline"
          className="border-transparent text-[10px] font-semibold"
          style={{ backgroundColor: `${sourceColor}20`, color: sourceColor }}
        >
          {article.source}
        </Badge>
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Clock className="size-3" />
          {formatRelativeTime(article.publishedAt)}
        </span>
      </div>

      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mb-2 block transition-colors group-hover:text-[#3B82F6]"
      >
        <h3 className="flex items-start gap-1.5 text-base font-semibold leading-snug">
          <span className="flex-1">{article.title}</span>
          <ExternalLink className="mt-1 size-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-60" />
        </h3>
      </a>

      <p className="mb-3 flex-1 line-clamp-4 text-sm leading-relaxed text-muted-foreground">
        {article.summary}
      </p>

      <TagList tags={article.tags.slice(0, 4)} size="sm" className="mb-3" />

      <div className="mt-auto border-t border-border pt-2">
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-[#3B82F6]"
        >
          Read on source site
          <ExternalLink className="size-3" />
        </a>
      </div>
    </article>
  );
}
