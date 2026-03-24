"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Pencil } from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  product: "Product Info",
  faq: "FAQ",
  messaging: "Messaging",
  competitor_diff: "Competitor Diff",
};

interface KnowledgeListProps {
  entries: Doc<"knowledgeBase">[];
  onEdit?: (entry: Doc<"knowledgeBase">) => void;
}

export function KnowledgeList({ entries, onEdit }: KnowledgeListProps) {
  const remove = useMutation(api.knowledgeBase.remove);

  if (entries.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No knowledge base entries yet. Add product info, FAQs, and messaging
        guidelines to help the AI craft better responses.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <Card key={entry._id}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm">{entry.title}</CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {CATEGORY_LABELS[entry.category] ?? entry.category}
                </Badge>
              </div>
              <div className="flex gap-1">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(entry)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => remove({ entryId: entry._id })}
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground line-clamp-3">
              {entry.content}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Updated {new Date(entry.updatedAt).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

