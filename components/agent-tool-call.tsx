"use client";

import { useState } from "react";
import { Doc } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  MessageSquare,
  Key,
  Users,
  TrendingUp,
  Search,
  Bot,
  PenLine,
  BookOpen,
  ChevronRight,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  MessageSquare,
  Key,
  Users,
  TrendingUp,
  Search,
  Bot,
  PenLine,
  BookOpen,
};

function getToolIcon(toolName: string) {
  const toolIcons: Record<string, string> = {
    search_reddit: "MessageSquare",
    find_keywords: "Key",
    analyze_competitors: "Users",
    check_trends: "TrendingUp",
    seo_analysis: "Search",
    geo_analysis: "Bot",
    draft_response: "PenLine",
    knowledge_lookup: "BookOpen",
  };
  const iconName = toolIcons[toolName] ?? "Search";
  return iconMap[iconName] ?? Search;
}

export function AgentToolCall({ toolCall }: { toolCall: Doc<"agentToolCalls"> }) {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = getToolIcon(toolCall.toolName);

  const statusIcon =
    toolCall.status === "running" ? (
      <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
    ) : toolCall.status === "completed" ? (
      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
    ) : toolCall.status === "failed" ? (
      <XCircle className="h-3.5 w-3.5 text-red-500" />
    ) : (
      <Loader2 className="h-3.5 w-3.5 text-muted-foreground" />
    );

  const duration =
    toolCall.completedAt && toolCall.startedAt
      ? `${((toolCall.completedAt - toolCall.startedAt) / 1000).toFixed(1)}s`
      : null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm hover:bg-muted transition-colors">
          <ChevronRight
            className={cn(
              "h-3.5 w-3.5 transition-transform",
              isOpen && "rotate-90"
            )}
          />
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{toolCall.toolName.replace(/_/g, " ")}</span>
          <div className="ml-auto flex items-center gap-2">
            {duration && (
              <span className="text-xs text-muted-foreground">{duration}</span>
            )}
            {statusIcon}
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ml-6 mt-1 space-y-1 rounded-md border bg-background p-3 text-xs">
          <div>
            <span className="font-medium text-muted-foreground">Input: </span>
            <code className="break-all">{toolCall.input}</code>
          </div>
          {toolCall.output && (
            <div>
              <span className="font-medium text-muted-foreground">Output: </span>
              <code className="break-all whitespace-pre-wrap">
                {toolCall.output.slice(0, 500)}
                {toolCall.output.length > 500 && "..."}
              </code>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

