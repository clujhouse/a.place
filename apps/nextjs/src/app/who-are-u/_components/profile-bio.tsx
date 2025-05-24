import React from "react";
import { useQuery } from "@tanstack/react-query";

import { authClient } from "@acme/auth/client";
import { Avatar, AvatarFallback, AvatarImage } from "@acme/ui/avatar";
import { Badge } from "@acme/ui/badge";
import { MarkdownContent } from "@acme/ui/markdown-content";

import { useTRPC } from "~/trpc/react";

export const ProfileBio = () => {
  const trpc = useTRPC();
  const { data: profile, isLoading: isProfileLoading } = useQuery(
    trpc.profile.get.queryOptions(),
  );
  const { data: session, isPending: isSessionLoading } =
    authClient.useSession();

  if (isProfileLoading || isSessionLoading) {
    return <div className="h-48 animate-pulse rounded-lg bg-muted"></div>;
  }

  if (!session?.user) {
    return <div>Not logged in</div>;
  }

  return (
    <div className="flex h-screen flex-col gap-4 p-6">
      <Avatar className="h-24 w-24">
        <AvatarImage src={session.user.image ?? ""} alt={session.user.name} />
        <AvatarFallback>{session.user.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div>
        <p className="text-3xl font-semibold">{session.user.name}</p>
        <p className="text-muted-foreground">{session.user.email}</p>
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
