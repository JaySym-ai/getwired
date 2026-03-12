"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { api } from "../../convex/_generated/api";

function getTagSize(count: number, minCount: number, maxCount: number) {
  const range = maxCount - minCount || 1;
  const ratio = (count - minCount) / range;
  if (ratio > 0.75) return "text-xl font-bold";
  if (ratio > 0.5) return "text-lg font-semibold";
  if (ratio > 0.25) return "text-base font-medium";
  return "text-sm";
}

function getTagColor(count: number, minCount: number, maxCount: number) {
  const range = maxCount - minCount || 1;
  const ratio = (count - minCount) / range;
  const g = Math.round(200 + ratio * 55);
  const r = Math.round(200 - ratio * 200);
  const b = Math.round(200 - ratio * 135);
  return `rgb(${r}, ${g}, ${b})`;
}

export function TrendingTags() {
  const tagStats = useQuery(api.posts.listTagStats, {}) ?? [];
  const maxCount = tagStats[0]?.count ?? 1;
  const minCount = tagStats[tagStats.length - 1]?.count ?? 1;

  return (
    <Card className="glass border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <TrendingUp className="size-4 text-[#3B82F6]" />
          Trending Tags
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          {tagStats.map(({ tag, count }) => (
            <Link
              key={tag}
              href={`/search?q=${encodeURIComponent(tag)}`}
              className={`${getTagSize(count, minCount, maxCount)} cursor-pointer transition-all duration-200 hover:scale-110 hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.4)]`}
              style={{ color: getTagColor(count, minCount, maxCount) }}
            >
              #{tag}
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
