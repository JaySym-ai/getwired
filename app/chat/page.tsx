import type { Metadata } from "next";
import { ChatPageClient } from "./ChatPageClient";

export const metadata: Metadata = {
  title: "Chat",
  description: "Real-time chat rooms for the GetWired.dev community — AI, web dev, security, startups, and more.",
  openGraph: {
    title: "Chat | GetWired.dev",
    description: "Real-time chat rooms for the GetWired.dev community.",
  },
};

export default function ChatPage() {
  return <ChatPageClient />;
}

