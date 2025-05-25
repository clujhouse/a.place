"use client";

import { useQuery } from "@tanstack/react-query";
import { Mail, User } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@acme/ui/avatar";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Icon } from "@acme/ui/icon";
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
      <SheetHeader className="sr-only">
        <SheetTitle>Profile Details</SheetTitle>
      </SheetHeader>
      <SheetContent className="w-full max-w-md overflow-y-auto p-8 sm:max-w-lg">
        {isLoading ? (
          <div className="h-48 animate-pulse rounded-lg bg-muted"></div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between gap-4">
              <Avatar className="h-20 w-20">
                {profile?.profileImage ? (
                  <AvatarImage src={profile.profileImage} alt={profileName} />
                ) : (
                  <AvatarFallback>
                    <User className="h-10 w-10 object-cover" />
                  </AvatarFallback>
                )}
              </Avatar>
              <MessageModal
                receiverId={profileId}
                receiverName={profileName}
                trigger={
                  <Button variant="outline" size="sm" className="w-fit gap-2">
                    <Icon as={Mail} />
                    Send Letter
                  </Button>
                }
              />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-semibold">{profileName}</h2>
              <p className="text-sm text-muted-foreground">
                {profile?.shortBio}
              </p>
            </div>
            <div>
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
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
