"use client";

import { useQuery } from "@tanstack/react-query";
import { Mail, User } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@acme/ui/avatar";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { MarkdownContent } from "@acme/ui/markdown-content";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@acme/ui/sheet";

import { MessageModal } from "~/components/message-modal";
import { useTRPC } from "~/trpc/react";

interface ProfileSidebarProps {
  profileId: string;
  profileName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileSidebar({
  profileId,
  profileName,
  open,
  onOpenChange,
}: ProfileSidebarProps) {
  const trpc = useTRPC();
  const { data: profile, isLoading } = useQuery(
    trpc.profile.getById.queryOptions(profileId),
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full max-w-md overflow-y-auto sm:max-w-lg">
        <SheetHeader className="pb-4">
          <SheetTitle>Profile Details</SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="h-48 animate-pulse rounded-lg bg-muted"></div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                {profile?.profileImage ? (
                  <AvatarImage src={profile.profileImage} alt={profileName} />
                ) : (
                  <AvatarFallback>
                    <User className="h-10 w-10 object-cover" />
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold">{profileName}</h2>
                <div className="mt-2">
                  <MessageModal
                    receiverId={profileId}
                    receiverName={profileName}
                    trigger={
                      <Button variant="outline" size="sm" className="w-full">
                        <Mail className="mr-2 h-4 w-4" />
                        Send Letter
                      </Button>
                    }
                  />
                </div>
              </div>
            </div>

            <div className="pr-4">
              <h3 className="mb-2 text-lg font-medium">About</h3>
              <MarkdownContent
                content={profile?.text ?? "No profile description available"}
                id="profile-view"
              />
            </div>

            {profile?.images && profile.images.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-medium">Gallery</h3>
                <div className="grid grid-cols-3 gap-4">
                  {profile.images.map((image, i) => (
                    <div
                      key={i}
                      className="relative aspect-square overflow-hidden rounded-lg"
                    >
                      <img
                        src={image}
                        alt={`Additional image ${i + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-auto flex flex-wrap gap-1">
              <Badge variant="outline">developer</Badge>
              <Badge variant="outline">brainrot</Badge>
              <Badge variant="outline">part of the team</Badge>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
