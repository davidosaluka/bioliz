"use client";

import { useEffect } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

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
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h2 className="mb-2 text-3xl font-bold text-white">Something went wrong</h2>
      <p className="mb-6 max-w-md text-muted-foreground">
        We&apos;re sorry, but an unexpected error occurred. Please try again.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <a href="/shop" className={cn(buttonVariants({ variant: "outline" }))}>
          Continue shopping
        </a>
      </div>
    </div>
  );
}
