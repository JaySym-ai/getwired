import type { Metadata } from "next";
import { DEMO_CHAT_ROOMS } from "@/lib/demo-data";
import { ChatRoomPageClient } from "./ChatRoomPageClient";

interface PageProps {
  params: Promise<{ roomId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { roomId } = await params;
  const index = parseInt(roomId, 10);
  const room = DEMO_CHAT_ROOMS[index];
  const name = room?.name ?? "Chat Room";

  return {
    title: name,
    description: room?.description ?? "Chat room on GetWired.dev",
    openGraph: {
      title: `${name} | GetWired.dev`,
      description: room?.description ?? "Chat room on GetWired.dev",
    },
  };
}

export default async function ChatRoomPage({ params }: PageProps) {
  const { roomId } = await params;
  const index = parseInt(roomId, 10);
  return <ChatRoomPageClient roomIndex={index} />;
}

