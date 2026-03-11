"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex size-16 items-center justify-center rounded-full bg-red-500/10">
        <AlertTriangle className="size-8 text-red-500" />
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">Something Went Wrong</h1>
      <p className="text-muted-foreground mb-6 max-w-md">
        A wire got crossed somewhere. Don&apos;t worry — try again and things
        should reconnect.
      </p>
      <Button
        onClick={reset}
        className="gap-2 bg-[#3B82F6] text-white hover:bg-[#3B82F6]/80 font-semibold"
      >
        <RotateCcw className="size-4" />
        Try Again
      </Button>
    </main>
  );
}

