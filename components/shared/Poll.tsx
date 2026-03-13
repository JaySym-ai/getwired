"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, Clock } from "lucide-react";

interface PollOption {
  text: string;
  votes: number;
}

interface PollProps {
  pollId: string;
  question: string;
  options: PollOption[];
  expiresAt?: number;
}

const STORAGE_KEY = "getwired-poll-votes";

function getVotedPolls(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveVote(pollId: string, optionIndex: number) {
  const votes = getVotedPolls();
  votes[pollId] = optionIndex;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(votes));
}

export function Poll({ pollId, question, options, expiresAt }: PollProps) {
  const [initialVote] = useState(() => getVotedPolls()[pollId]);
  const [selected, setSelected] = useState<number | null>(initialVote ?? null);
  const [hasVoted, setHasVoted] = useState(() => initialVote !== undefined);
  const [localOptions, setLocalOptions] = useState(options);
  const [renderedAt] = useState(() => Date.now());

  const totalVotes = localOptions.reduce((sum, o) => sum + o.votes, 0);

  const handleVote = () => {
    if (selected === null || hasVoted) return;
    const updated = localOptions.map((opt, i) =>
      i === selected ? { ...opt, votes: opt.votes + 1 } : opt
    );
    setLocalOptions(updated);
    setHasVoted(true);
    saveVote(pollId, selected);
  };

  const isExpired = expiresAt ? renderedAt > expiresAt : false;

  return (
    <Card className="glass border-border" data-testid="poll">
      <CardContent className="p-4">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
          <BarChart3 className="size-3.5 text-[#3B82F6]" />
          <span className="font-medium">Poll</span>
        </div>

        <h4 className="text-sm font-bold mb-3">{question}</h4>

        <div className="space-y-2">
          {localOptions.map((option, index) => {
            const pct = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
            const isSelected = selected === index;

            return (
              <button
                key={option.text}
                type="button"
                onClick={() => !hasVoted && !isExpired && setSelected(index)}
                disabled={hasVoted || isExpired}
                className={`relative w-full rounded-lg border p-2.5 text-left text-sm transition-all ${
                  isSelected && !hasVoted
                    ? "border-[#3B82F6]/50 bg-[#3B82F6]/10"
                    : "border-border hover:border-border"
                } ${hasVoted || isExpired ? "cursor-default" : "cursor-pointer"}`}
              >
                {/* Vote bar background */}
                {hasVoted && (
                  <div
                    className="absolute inset-0 rounded-lg bg-[#3B82F6]/10 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                )}
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {!hasVoted && !isExpired && (
                      <div
                        className={`size-4 rounded-full border-2 shrink-0 ${
                          isSelected ? "border-[#3B82F6] bg-[#3B82F6]" : "border-border"
                        }`}
                      >
                        {isSelected && (
                          <div className="size-full rounded-full flex items-center justify-center">
                            <div className="size-1.5 rounded-full bg-black" />
                          </div>
                        )}
                      </div>
                    )}
                    <span className={isSelected && hasVoted ? "font-medium text-[#3B82F6]" : ""}>
                      {option.text}
                    </span>
                  </div>
                  {hasVoted && (
                    <span className="text-xs text-muted-foreground tabular-nums shrink-0 ml-2">
                      {pct}% ({option.votes})
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-muted-foreground">{totalVotes.toLocaleString()} votes</span>
          <div className="flex items-center gap-2">
            {expiresAt && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="size-3" />
                {isExpired ? "Ended" : `Ends ${new Date(expiresAt).toLocaleDateString()}`}
              </span>
            )}
            {!hasVoted && !isExpired && (
              <Button
                size="sm"
                disabled={selected === null}
                onClick={handleVote}
                className="bg-[#3B82F6] text-white hover:bg-[#3B82F6]/80 text-xs h-7"
                data-testid="poll-vote-button"
                aria-label="Submit vote"
              >
                Vote
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
