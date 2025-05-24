"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { User } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@acme/ui/avatar";
import { Card, CardContent, CardHeader } from "@acme/ui/card";
import { Skeleton } from "@acme/ui/skeleton";

import { useTRPC } from "~/trpc/react";
import { ProfileSidebar } from "./profile-sidebar";

interface ProfileCardProps {
  profile: {
    id: string;
    name: string;
  };
}

export function ProfileCard({ profile }: ProfileCardProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const trpc = useTRPC();
  const { data, isLoading } = useQuery(
    trpc.profile.getById.queryOptions(profile.id),
  );

  if (isLoading) {
    return (
      <Card className="flex w-full min-w-0 flex-col gap-2 p-3">
        <CardHeader className="flex flex-row items-center gap-4 p-0">
          <Skeleton className="h-12 w-12" />
        </CardHeader>
        <CardContent className="p-0">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="mt-2 h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  const displayName = profile.name;
  const displayImage = data?.profileImage;
  const displayText = data?.shortBio;

  return (
    <>
      <Card
        className="flex w-full cursor-pointer flex-col gap-2 p-3 transition-all hover:border-primary hover:bg-accent"
        onClick={() => setIsSidebarOpen(true)}
      >
        <CardHeader className="flex flex-row items-center gap-4 p-0">
          <Avatar className="h-12 w-12 border border-secondary">
            {displayImage ? (
              <AvatarImage
                src={displayImage}
                alt={displayName}
                className="object-cover"
              />
            ) : (
              <AvatarFallback>
                <User className="h-6 w-6" />
              </AvatarFallback>
            )}
          </Avatar>
        </CardHeader>
        <CardContent className="p-0">
          <p className="truncate text-lg font-semibold" title={displayName}>
            {displayName}
          </p>
          {displayText ? (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {displayText.slice(0, 100)}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              No profile description available
            </p>
          )}
        </CardContent>
      </Card>

      <ProfileSidebar
        profileId={profile.id}
        profileName={profile.name}
        open={isSidebarOpen}
        onOpenChange={setIsSidebarOpen}
      />
    </>
  );
}
