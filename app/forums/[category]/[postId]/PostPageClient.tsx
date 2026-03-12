"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useQuery } from "convex/react";
import { PostDetail } from "@/components/forums/PostDetail";
import { CommentTree } from "@/components/forums/CommentTree";
import { api } from "../../../../convex/_generated/api";

interface PostPageClientProps {
  categorySlug: string;
  postId: string;
}

export function PostPageClient({ categorySlug, postId }: PostPageClientProps) {
  const category = useQuery(api.forums.getCategoryBySlug, { slug: categorySlug });
  const post = useQuery(api.posts.getDetailedById, { postId: postId as never });

  if (post === undefined || category === undefined) {
    return null;
  }

  if (!post) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center text-muted-foreground">
        <p className="text-sm">Post not found</p>
        <Link href="/forums" className="mt-2 inline-block text-sm text-[#3B82F6] hover:underline">
          Back to Forums
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/forums" className="transition-colors hover:text-foreground">
          Forums
        </Link>
        <ChevronRight className="size-3" />
        {category && (
          <>
            <Link href={`/forums/${category.slug}`} className="transition-colors hover:text-foreground">
              {category.name}
            </Link>
            <ChevronRight className="size-3" />
          </>
        )}
        <span className="line-clamp-1 text-foreground">{post.title}</span>
      </nav>

      <PostDetail postId={postId} />

      <div className="mt-6">
        <div className="glass rounded-xl p-6">
          <CommentTree postId={postId} />
        </div>
      </div>
    </div>
  );
}
