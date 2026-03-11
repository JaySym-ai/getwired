"use client";

import { useState } from "react";
import { Search, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CategoryCard } from "@/components/forums/CategoryCard";
import { DEMO_CATEGORIES } from "@/lib/demo-data";

export function ForumsPageClient() {
  const [search, setSearch] = useState("");

  const filtered = DEMO_CATEGORIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="size-6 text-[#3B82F6]" />
          <h1 className="text-2xl font-bold text-white">Forums</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Join the conversation across {DEMO_CATEGORIES.length} tech communities
        </p>
      </div>

      {/* Search bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search categories..."
          className="pl-9 bg-zinc-900/30"
        />
      </div>

      {/* Category grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((cat) => (
          <CategoryCard
            key={cat.slug}
            name={cat.name}
            slug={cat.slug}
            icon={cat.icon}
            color={cat.color}
            description={cat.description}
            postCount={cat.postCount}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">No categories match &quot;{search}&quot;</p>
        </div>
      )}
    </div>
  );
}

