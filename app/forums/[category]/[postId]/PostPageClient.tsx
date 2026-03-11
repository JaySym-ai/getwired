"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PostDetail } from "@/components/forums/PostDetail";
import { CommentTree } from "@/components/forums/CommentTree";
import { DEMO_POSTS, DEMO_CATEGORIES } from "@/lib/demo-data";
import { Separator } from "@/components/ui/separator";

interface PostPageClientProps {
  categorySlug: string;
  postIndex: number;
}

export function PostPageClient({ categorySlug, postIndex }: PostPageClientProps) {
  const post = DEMO_POSTS[postIndex];
  const category = DEMO_CATEGORIES.find((c) => c.slug === categorySlug);

  if (!post || postIndex < 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center text-muted-foreground">
        <p className="text-sm">Post not found</p>
        <Link href="/forums" className="text-[#3B82F6] text-sm hover:underline mt-2 inline-block">
          Back to Forums
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4 flex-wrap">
        <Link href="/forums" className="hover:text-white transition-colors">Forums</Link>
        <ChevronRight className="size-3" />
        {category && (
          <>
            <Link href={`/forums/${category.slug}`} className="hover:text-white transition-colors">
              {category.name}
            </Link>
            <ChevronRight className="size-3" />
          </>
        )}
        <span className="text-white line-clamp-1">{post.title}</span>
      </nav>

      {/* Post detail */}
      <PostDetail postIndex={postIndex} />

      {/* Comments section */}
      <div className="mt-6">
        <div className="glass rounded-xl p-6">
          <CommentTree postIndex={postIndex} />
        </div>
      </div>
    </div>
  );
}

