"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { useParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { KnowledgeEditor } from "@/components/knowledge-editor";
import { KnowledgeList } from "@/components/knowledge-list";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Category = "product" | "faq" | "messaging" | "competitor_diff";

export default function KnowledgePage() {
  const params = useParams();
  const projectId = params.projectId as Id<"projects">;
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [editingEntry, setEditingEntry] = useState<Doc<"knowledgeBase"> | null>(null);

  const entries = useQuery(api.knowledgeBase.listByProject, {
    projectId,
    ...(categoryFilter !== "all" ? { category: categoryFilter as Category } : {}),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Knowledge Base</h1>
        <p className="text-muted-foreground">
          Add product info and messaging guidelines for AI-powered responses
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-muted-foreground">
              Filter:
            </label>
            <Select value={categoryFilter} onValueChange={(v: string | null) => setCategoryFilter(v ?? "all")}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="product">Product Info</SelectItem>
                <SelectItem value="faq">FAQ</SelectItem>
                <SelectItem value="messaging">Messaging</SelectItem>
                <SelectItem value="competitor_diff">Competitor Diff</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {entries === undefined ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-24 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <KnowledgeList
              entries={entries}
              onEdit={(entry) => setEditingEntry(entry)}
            />
          )}
        </div>

        <div>
          <KnowledgeEditor
            projectId={projectId}
            entry={editingEntry ?? undefined}
            onComplete={() => setEditingEntry(null)}
          />
        </div>
      </div>
    </div>
  );
}

