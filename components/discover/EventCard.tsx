"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/Avatar";
import { Calendar, Users } from "lucide-react";
import { DEMO_USERS } from "@/lib/demo-data";
import type { EventType } from "@/lib/types";

const EVENT_COLORS: Record<EventType, { bg: string; text: string; label: string }> = {
  ama: { bg: "bg-purple-500/20", text: "text-purple-400", label: "AMA" },
  meetup: { bg: "bg-blue-500/20", text: "text-blue-400", label: "Meetup" },
  hackathon: { bg: "bg-amber-500/20", text: "text-amber-400", label: "Hackathon" },
};

interface EventCardProps {
  event: {
    title: string;
    description: string;
    type: EventType;
    hostIndex: number;
    startTime: number;
    endTime: number;
    tags: string[];
  };
}

function formatDateTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function EventCard({ event }: EventCardProps) {
  const [rsvp, setRsvp] = useState(false);
  const [attendeeCount, setAttendeeCount] = useState(Math.floor(Math.random() * 40) + 10);
  const host = DEMO_USERS[event.hostIndex];
  const typeConfig = EVENT_COLORS[event.type];
  const attendeeAvatars = DEMO_USERS.slice(0, 4);

  const handleRsvp = () => {
    setRsvp((prev) => {
      setAttendeeCount((c) => (prev ? c - 1 : c + 1));
      return !prev;
    });
  };

  return (
    <Card className="glass border-white/8 hover:border-[#3B82F6]/20 transition-all">
      <CardContent className="p-4">
        {/* Type badge */}
        <div className="flex items-center justify-between mb-3">
          <Badge className={`${typeConfig.bg} ${typeConfig.text} border-none text-[10px] font-semibold`}>
            {typeConfig.label}
          </Badge>
        </div>

        {/* Title & description */}
        <h3 className="text-sm font-semibold mb-1.5">{event.title}</h3>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{event.description}</p>

        {/* Date/time */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
          <Calendar className="size-3.5 text-[#3B82F6]" />
          <span>{formatDateTime(event.startTime)}</span>
        </div>

        {/* Host */}
        {host && (
          <div className="flex items-center gap-2 mb-3">
            <UserAvatar src={host.avatar} name={host.name} size="sm" />
            <div>
              <p className="text-xs font-medium">Hosted by {host.name}</p>
              <p className="text-[10px] text-muted-foreground">@{host.username}</p>
            </div>
          </div>
        )}

        {/* Attendees + RSVP */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Avatar stack */}
            <div className="flex -space-x-2">
              {attendeeAvatars.map((u) => (
                <UserAvatar
                  key={u.clerkId}
                  src={u.avatar}
                  name={u.name}
                  size="sm"
                  className="ring-2 ring-[#0A0A0A]"
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="size-3" />
              {attendeeCount}
            </span>
          </div>

          <Button
            size="sm"
            variant={rsvp ? "default" : "outline"}
            onClick={handleRsvp}
            className={
              rsvp
                ? "bg-[#3B82F6] text-white hover:bg-[#3B82F6]/80 text-xs h-7"
                : "border-[#3B82F6]/30 text-[#3B82F6] hover:bg-[#3B82F6]/10 text-xs h-7"
            }
          >
            {rsvp ? "Going ✓" : "RSVP"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

