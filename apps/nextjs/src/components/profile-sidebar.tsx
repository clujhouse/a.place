"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Mail, Plus, StickyNote, User } from "lucide-react";

import { authClient } from "@acme/auth/client";
import { Avatar, AvatarFallback, AvatarImage } from "@acme/ui/avatar";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";
import { Icon } from "@acme/ui/icon";
import { MarkdownContent } from "@acme/ui/markdown-content";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@acme/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@acme/ui/tooltip";

import { HouseBadge } from "~/components/house-badge";
import { MessageModal } from "~/components/message-modal";
import { ProfileNote } from "~/components/profile-note";
import { useSubscription } from "~/hooks/use-subscription";
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
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isRefetchingNotes, setIsRefetchingNotes] = useState(false);
  const { data: session } = authClient.useSession();
  const { currentPlan } = useSubscription();

  const { data: profile, isLoading } = useQuery(
    trpc.profile.getById.queryOptions(profileId),
  );

  const {
    data: notes,
    isLoading: isLoadingNotes,
    refetch: refetchNotes,
  } = useQuery({
    ...trpc.profileNote.getByReceivingUserId.queryOptions({
      receivingUserId: profileId,
    }),
    enabled: !!session?.user,
  });

  const handleRefetchNotes = async () => {
    setIsRefetchingNotes(true);
    await refetchNotes();
    setIsRefetchingNotes(false);
  };

  const canAddNote = useMemo(() => {
    if (!session?.user.id || !notes || currentPlan !== "pro_exclusive")
      return false;

    // Check if the current user has already added a note
    return !notes.some((note) => note.postingUserId === session.user.id);
  }, [notes, session?.user.id, currentPlan]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetHeader className="sr-only hidden">
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
              {session?.user ? (
                <MessageModal
                  receiverId={profileId}
                  receiverName={profileName}
                  trigger={
                    <Button
                      variant="outline"
                      size="md"
                      className="mr-8 w-fit gap-2"
                    >
                      <Icon as={Mail} />
                      Send Letter
                    </Button>
                  }
                />
              ) : (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="md"
                        className="mr-8 w-fit gap-2"
                        disabled
                      >
                        <Icon as={Mail} />
                        Send Letter
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Please log in to send letters</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-semibold">{profileName}</h2>
              <p className="text-sm text-muted-foreground">
                {profile?.shortBio}
              </p>
              {profile?.houseId && (
                <div className="mt-2">
                  <HouseBadge houseId={profile.houseId} size="md" />
                </div>
              )}
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

            {/* Notes Section */}
            <div className="space-y-3 border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Notes</h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Dialog
                          open={
                            isNoteModalOpen && canAddNote && !!session?.user
                          }
                          onOpenChange={(open) =>
                            canAddNote &&
                            !!session?.user &&
                            setIsNoteModalOpen(open)
                          }
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={
                                !session?.user ||
                                !canAddNote ||
                                isLoadingNotes ||
                                isRefetchingNotes
                              }
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Add Note
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="p-0 sm:max-w-md">
                            <ProfileNote
                              currentUser={session?.user}
                              receivingUserId={profileId}
                              onNoteAdded={() => {
                                setIsNoteModalOpen(false);
                                void handleRefetchNotes();
                              }}
                            />
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TooltipTrigger>
                    {!session?.user ? (
                      <TooltipContent>
                        <p>Please log in to add notes</p>
                      </TooltipContent>
                    ) : !canAddNote && currentPlan === "pro_exclusive" ? (
                      <TooltipContent>
                        <p>You can only add one note per profile</p>
                      </TooltipContent>
                    ) : (
                      <TooltipContent>
                        <p>Upgrade to Pro Exclusive (69$) to add notes</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="space-y-3">
                {!session?.user ? (
                  <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                    <StickyNote className="mb-2 h-8 w-8" />
                    <p>Log in to view notes</p>
                  </div>
                ) : isLoadingNotes || isRefetchingNotes ? (
                  <div className="h-20 animate-pulse rounded-lg bg-muted"></div>
                ) : notes && notes.length > 0 ? (
                  notes.map((note) => (
                    <ProfileNote
                      key={note.id}
                      note={note}
                      currentUser={session?.user}
                      receivingUserId={profileId}
                      onNoteUpdated={() => void handleRefetchNotes()}
                    />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                    <StickyNote className="mb-2 h-8 w-8" />
                    <p>No notes yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
