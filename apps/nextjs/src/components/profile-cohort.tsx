import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { authClient } from "@acme/auth/client";
import { Badge } from "@acme/ui/badge";

import { useTRPC } from "~/trpc/react";

export function ProfileCohort() {
  const trpc = useTRPC();
  const { data: session } = authClient.useSession();

  // Fetch all cohorts and count active ones
  const { data: cohorts = [] } = useQuery({
    ...trpc.cohort.getAll.queryOptions(),
    enabled: !!session,
  });

  // Count active cohorts
  const activeCohorts = cohorts.filter(
    (cohort) => cohort.status === "active" || cohort.status === "in progress",
  );
  const activeCohortsCount = activeCohorts.length;

  return (
    <Link href="/cohorts" className="block">
      <div className="relative cursor-pointer border bg-background p-3 transition-colors hover:bg-accent/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Gardens & Gatherings</span>
            {activeCohortsCount > 0 && (
              <Badge
                variant="secondary"
                className="h-5 px-1.5 text-xs font-semibold"
              >
                {activeCohortsCount}
              </Badge>
            )}
          </div>
          {activeCohortsCount > 0 && (
            <div className="absolute -right-1 -top-1 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary"></span>
            </div>
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {activeCohortsCount === 0
            ? "Seeds waiting for spring"
            : activeCohortsCount === 1
              ? "One garden blooming"
              : `${activeCohortsCount} gardens in bloom`}
        </p>
      </div>
    </Link>
  );
}
