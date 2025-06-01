"use client";

import { useState } from "react";

import { cn } from "@acme/ui";

interface SvgIconSafeProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
}

export function SvgIconSafe({
  src,
  alt,
  className,
  fallback,
}: SvgIconSafeProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (hasError) {
    return (
      fallback || (
        <div
          className={cn(
            "flex items-center justify-center rounded bg-muted",
            className,
          )}
          aria-label={`Failed to load ${alt}`}
        >
          <span className="text-xs text-muted-foreground">?</span>
        </div>
      )
    );
  }

  return (
    <div className={cn("flex items-center justify-center", className)}>
      {isLoading && (
        <div
          className={cn("absolute animate-pulse rounded bg-muted", className)}
          aria-label={`Loading ${alt}`}
        />
      )}
      <img
        src={src}
        alt={alt}
        className={cn("object-contain", isLoading && "opacity-0", className)}
        style={{
          filter: "brightness(0) saturate(100%) invert(var(--tw-invert, 0))",
        }}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
      />
    </div>
  );
}
