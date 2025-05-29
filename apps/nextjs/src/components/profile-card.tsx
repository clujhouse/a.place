"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { User } from "lucide-react";

import { cn } from "@acme/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@acme/ui/avatar";
import { Card, CardContent, CardHeader } from "@acme/ui/card";
import { Skeleton } from "@acme/ui/skeleton";

import { useTRPC } from "~/trpc/react";
import { ProfileCardHouse } from "./profile-card-house";
import { ProfileSidebar } from "./profile-sidebar";

interface ProfileCardProps {
  profileId: string;
  profileImageDisplay?: "full" | "icon";
  containerClassName?: string;
}

export function ProfileCard({
  profileId,
  containerClassName,
  profileImageDisplay = "icon",
}: ProfileCardProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const trpc = useTRPC();
  const { data, isLoading } = useQuery(
    trpc.profile.getById.queryOptions(profileId),
  );

  if (isLoading || !data) {
    return (
      <Card
        className={cn(
          "flex w-full min-w-0 flex-col gap-2 p-3",
          containerClassName,
        )}
      >
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

  const displayName = data.user.name;
  const displayImage = data.user.image;

  const displayText = data.shortBio;

  return (
    <>
      <Card
        className={cn(
          "relative flex h-full min-h-0 w-full cursor-pointer flex-col gap-2 p-3 transition-all hover:border-primary hover:bg-accent",
          containerClassName,
        )}
        onClick={() => setIsSidebarOpen(true)}
      >
        <CardHeader className="flex flex-row items-center gap-4 p-0">
          <Avatar
            className={cn(
              "border border-secondary",
              profileImageDisplay === "full" ? "h-24 w-full" : "h-12 w-12",
            )}
          >
            {displayImage ? (
              <AvatarImage
                src={displayImage}
                alt={displayName}
                className="object-cover grayscale-0"
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
          {/* {data.houseId && <ProfileCardHouse houseId={data.houseId} />} */}
          {displayText && (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {displayText.slice(0, 100)}
            </p>
          )}
        </CardContent>
      </Card>

      <ProfileSidebar
        profileId={profileId}
        profileName={data.user.name}
        open={isSidebarOpen}
        onOpenChange={setIsSidebarOpen}
      />
    </>
  );
}
