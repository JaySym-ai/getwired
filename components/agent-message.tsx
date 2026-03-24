"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { AgentToolCall } from "@/components/agent-tool-call";
import { Bot, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AgentMessageProps {
  run: Doc<"agentRuns">;
}

export function AgentMessage({ run }: AgentMessageProps) {
  const toolCalls = useQuery(api.agent.getToolCalls, { runId: run._id });

  return (
    <div className="space-y-3">
      {/* User prompt */}
      <div className="flex gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <User className="h-4 w-4" />
        </div>
        <div className="flex-1 pt-1">
          <p className="text-sm">{run.prompt}</p>
        </div>
      </div>

      {/* Agent response */}
      <div className="flex gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
          <Bot className="h-4 w-4" />
        </div>
        <div className="flex-1 space-y-2 pt-1">
          {/* Tool calls */}
          {toolCalls && toolCalls.length > 0 && (
            <div className="space-y-1.5">
              {toolCalls.map((tc) => (
                <AgentToolCall key={tc._id} toolCall={tc} />
              ))}
            </div>
          )}

          {/* Result or loading */}
          {run.status === "running" ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Thinking...</span>
            </div>
          ) : run.status === "failed" ? (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {run.result ?? "An error occurred"}
            </div>
          ) : run.result ? (
            <div className="text-sm whitespace-pre-wrap">{run.result}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

