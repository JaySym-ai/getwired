"use client";

import { Share2, Link2, Twitter, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface ShareButtonsProps {
  url: string;
  title: string;
}

export function ShareButtons({ url, title }: ShareButtonsProps) {
  const fullUrl = typeof window !== "undefined" ? `${window.location.origin}${url}` : url;
  const encodedUrl = encodeURIComponent(fullUrl);
  const encodedTitle = encodeURIComponent(title);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-xs" className="text-muted-foreground hover:text-foreground">
            <Share2 className="size-3.5" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" sideOffset={4}>
        <DropdownMenuItem onClick={handleCopyLink}>
          <Link2 className="size-4 mr-2" />
          Copy link
        </DropdownMenuItem>
        <DropdownMenuItem
          render={
            <a
              href={`https://x.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
              target="_blank"
              rel="noopener noreferrer"
            />
          }
        >
          <Twitter className="size-4 mr-2" />
          Share to X
        </DropdownMenuItem>
        <DropdownMenuItem
          render={
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
              target="_blank"
              rel="noopener noreferrer"
            />
          }
        >
          <Linkedin className="size-4 mr-2" />
          Share to LinkedIn
        </DropdownMenuItem>
        <DropdownMenuItem
          render={
            <a
              href={`https://bsky.app/intent/compose?text=${encodedTitle}%20${encodedUrl}`}
              target="_blank"
              rel="noopener noreferrer"
            />
          }
        >
          <Share2 className="size-4 mr-2" />
          Share to Bluesky
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

