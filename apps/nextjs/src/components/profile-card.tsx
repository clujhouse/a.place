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
      <Card className="w-full max-w-[33%] py-3 px-2 gap-2">
        <CardHeader className="flex flex-row items-center p-0 pb-2">
          <Skeleton className="h-12 w-12 rounded-full" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayName = profile.name;
  const displayImage = data?.profileImage;
  const displayText = data?.text;

  return (
    <>
      <Card
        className="w-full cursor-pointer gap-2 p-3 hover:border-primary hover:bg-accent"
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
