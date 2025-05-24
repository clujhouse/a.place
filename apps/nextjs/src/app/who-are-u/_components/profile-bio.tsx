import React from "react";
import { useQuery } from "@tanstack/react-query";

import { Badge } from "@acme/ui/badge";
import { MarkdownContent } from "@acme/ui/markdown-content";

import { useTRPC } from "~/trpc/react";

export const ProfileBio = () => {
  const trpc = useTRPC();
  const { data: profile, isLoading } = useQuery(
    trpc.profile.get.queryOptions(),
  );

  if (isLoading) {
    return <div className="h-48 animate-pulse rounded-lg bg-muted"></div>;
  }

  return (
    <div className="flex h-screen flex-col gap-4 p-6">
      <div className="h-24 w-24 bg-muted" />
      <div>
        <p className="text-3xl font-semibold">andrew</p>
        <p className="text-muted-foreground">cluj-napoca, romania</p>
      </div>

      <div className="h-full min-h-0 overflow-y-auto">
        <MarkdownContent content={profile?.text ?? ""} id="bio" />
      </div>

      <div className="mt-auto flex flex-wrap gap-1">
        <Badge variant="outline">developer</Badge>
        <Badge variant="outline">brainrot</Badge>
        <Badge variant="outline">part of the team</Badge>
      </div>
    </div>
  );
};
