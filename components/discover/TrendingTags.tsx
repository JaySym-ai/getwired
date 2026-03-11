"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { DEMO_POSTS } from "@/lib/demo-data";

// Calculate tag frequencies from demo posts
function getTagFrequencies(): { tag: string; count: number }[] {
  const tagMap: Record<string, number> = {};
  for (const post of DEMO_POSTS) {
    for (const tag of post.tags) {
      tagMap[tag] = (tagMap[tag] ?? 0) + 1;
    }
  }
  return Object.entries(tagMap)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

const allTags = getTagFrequencies();
const maxCount = allTags[0]?.count ?? 1;
const minCount = allTags[allTags.length - 1]?.count ?? 1;

function getTagSize(count: number): string {
  const range = maxCount - minCount || 1;
  const ratio = (count - minCount) / range;
  if (ratio > 0.75) return "text-xl font-bold";
  if (ratio > 0.5) return "text-lg font-semibold";
  if (ratio > 0.25) return "text-base font-medium";
  return "text-sm";
}

function getTagColor(count: number): string {
  const range = maxCount - minCount || 1;
  const ratio = (count - minCount) / range;
  // Gradient from white (low) to green (high)
  const g = Math.round(200 + ratio * 55); // 200-255
  const r = Math.round(200 - ratio * 200); // 200-0
  const b = Math.round(200 - ratio * 135); // 200-65
  return `rgb(${r}, ${g}, ${b})`;
}

export function TrendingTags() {
  return (
    <Card className="glass border-white/8">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <TrendingUp className="size-4 text-[#3B82F6]" />
          Trending Tags
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          {allTags.map(({ tag, count }) => (
            <Link
              key={tag}
              href={`/search?q=${encodeURIComponent(tag)}`}
              className={`${getTagSize(count)} transition-all duration-200 hover:scale-110 hover:drop-shadow-[0_0_8px_rgba(0,255,65,0.4)] cursor-pointer`}
              style={{ color: getTagColor(count) }}
            >
              #{tag}
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

