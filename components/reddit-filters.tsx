"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RedditFiltersProps {
  statusFilter: string;
  onStatusChange: (value: string | null) => void;
  minRelevance: number;
  onRelevanceChange: (value: number) => void;
}

export function RedditFilters({
  statusFilter,
  onStatusChange,
  minRelevance,
  onRelevanceChange,
}: RedditFiltersProps) {
  return (
    <div className="flex gap-4 flex-wrap">
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Status</label>
        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="responded">Responded</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          Min Relevance
        </label>
        <Select
          value={String(minRelevance)}
          onValueChange={(v: string | null) => onRelevanceChange(Number(v ?? 0))}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Any</SelectItem>
            <SelectItem value="20">20+</SelectItem>
            <SelectItem value="40">40+</SelectItem>
            <SelectItem value="60">60+</SelectItem>
            <SelectItem value="80">80+</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

