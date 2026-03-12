import type { Metadata } from "next";
import { ProfilePageClient } from "./ProfilePageClient";

interface Props {
  params: Promise<{ userId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { userId } = await params;
  return {
    title: `Profile ${userId}`,
    description: `Profile ${userId} on GetWired.dev`,
    openGraph: {
      title: `${userId} | GetWired.dev`,
      description: `Profile ${userId} on GetWired.dev`,
      type: "profile",
    },
    twitter: {
      card: "summary",
      title: `${userId} | GetWired.dev`,
      description: `Profile ${userId} on GetWired.dev`,
    },
  };
}

export default async function ProfilePage({ params }: Props) {
  const { userId } = await params;
  return <ProfilePageClient userId={userId} />;
}
