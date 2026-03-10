"use client";

import { useEffect, useState } from "react";
import { DEMO_USERS } from "@/lib/demo-auth";

const TYPING_USERS = [DEMO_USERS[1]!, DEMO_USERS[2]!, DEMO_USERS[3]!];

export function TypingIndicator() {
  const [typingUser, setTypingUser] = useState<string | null>(null);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const showTyping = () => {
      const user = TYPING_USERS[Math.floor(Math.random() * TYPING_USERS.length)]!;
      setTypingUser(user.displayName);

      timeout = setTimeout(() => {
        setTypingUser(null);
        timeout = setTimeout(showTyping, 3000 + Math.random() * 7000);
      }, 2000 + Math.random() * 2000);
    };

    timeout = setTimeout(showTyping, 2000 + Math.random() * 3000);

    return () => clearTimeout(timeout);
  }, []);

  if (!typingUser) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-1.5 text-xs text-muted-foreground">
      <span className="font-medium text-foreground/70">{typingUser}</span>
      <span>is typing</span>
      <span className="flex gap-0.5">
        <span className="inline-block size-1 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
        <span className="inline-block size-1 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
        <span className="inline-block size-1 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
      </span>
    </div>
  );
}

