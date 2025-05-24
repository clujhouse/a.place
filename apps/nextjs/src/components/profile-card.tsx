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
      <Card className="w-full max-w-sm">
        <CardHeader className="flex flex-row items-center gap-4 pb-2">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
          </div>
        </CardHeader>
        <CardContent>
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
        className="w-full max-w-[33%] transition-all cursor-pointer hover:border-gray-300 hover:bg-gray-50"
        onClick={() => setIsSidebarOpen(true)}
      >
        <CardHeader className="flex flex-row items-center gap-4 pb-2">
          <Avatar className="h-12 w-12">
            {displayImage ? (
              <AvatarImage 
                src={displayImage} 
                alt={displayName} 
              />
            ) : (
              <AvatarFallback>
                <User className="h-6 w-6" />
              </AvatarFallback>
            )}
          </Avatar>
          <h3 className="text-lg font-semibold truncate max-w-[100%]" title={displayName}>
              {displayName}
          </h3>
        </CardHeader>
        <CardContent>
          {displayText ? (
            <p className="text-sm text-muted-foreground">
              {displayText.length > 80 
                ? `${displayText.slice(0, 80)}...` 
                : displayText}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">No profile description available</p>
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
