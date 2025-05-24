import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { Progress } from "@acme/ui/progress";

import { useTRPC } from "~/trpc/react";

export const AppSidebarProfileCompletion = () => {
  const trpc = useTRPC();
  const { data } = useQuery(trpc.profile.get.queryOptions());

  // Use the completionPercentage directly from the profile data
  const completionPercentage = data?.completionPercentage ?? 0;

  return (
    <Link href="/who-are-u">
      <div className="space-y-3 border p-4 hover:bg-accent">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Profile Completion</h3>
          <span className="text-xs font-medium">{completionPercentage}%</span>
        </div>
        <Progress value={completionPercentage} className="h-2 w-full" />
        {completionPercentage < 100 && (
          <p className="text-xs text-muted-foreground">
            people really wanna know u, i know u might be an introvert, but
            trust me it really helps
          </p>
        )}
      </div>
    </Link>
  );
};
