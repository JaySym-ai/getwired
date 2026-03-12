import type { Metadata } from "next";
import { ChatRoomPageClient } from "./ChatRoomPageClient";

interface PageProps {
  params: Promise<{ roomId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { roomId } = await params;
  return {
    title: "Chat Room",
    description: `Live chat room ${roomId} on GetWired.dev`,
    openGraph: {
      title: "Chat Room | GetWired.dev",
      description: "Join the live conversation on GetWired.dev.",
    },
    twitter: {
      card: "summary",
      title: "Chat Room | GetWired.dev",
      description: "Join the live conversation on GetWired.dev.",
    },
  };
}

export default async function ChatRoomPage({ params }: PageProps) {
  const { roomId } = await params;
  return <ChatRoomPageClient roomId={roomId} />;
}
