import type { Metadata } from "next";
import { PostPageClient } from "./PostPageClient";

interface Props {
  params: Promise<{ category: string; postId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, postId } = await params;
  return {
    title: "Forum Post",
    description: `Discussion ${postId} in ${category} on GetWired.dev`,
    openGraph: {
      title: "Forum Post | GetWired.dev",
      description: "Join the conversation on GetWired.dev.",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: "Forum Post | GetWired.dev",
      description: "Join the conversation on GetWired.dev.",
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { category, postId } = await params;

  return (
    <>
      <PostPageClient categorySlug={category} postId={postId} />
    </>
  );
}
