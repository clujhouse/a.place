"use client";

import { useQuery } from "@tanstack/react-query";
import { Home, User } from "lucide-react";

import { authClient } from "@acme/auth/client";
import { Avatar, AvatarFallback, AvatarImage } from "@acme/ui/avatar";
import { Badge } from "@acme/ui/badge";
import { MarkdownContent } from "@acme/ui/markdown-content";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@acme/ui/sheet";

import { useTRPC } from "~/trpc/react";

interface HouseSidebarProps {
  houseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HouseSidebar({
  houseId,
  open,
  onOpenChange,
}: HouseSidebarProps) {
  const trpc = useTRPC();
  const { data: session } = authClient.useSession();

  const { data: house, isLoading } = useQuery(
    trpc.house.getById.queryOptions(houseId),
  );

  // Get the owner's profile
  const { data: ownerProfile, isLoading: isOwnerLoading } = useQuery({
    ...trpc.profile.getById.queryOptions(house?.ownerId ?? ""),
    enabled: !!house?.ownerId,
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetHeader className="sr-only hidden">
        <SheetTitle>House Details</SheetTitle>
      </SheetHeader>
      <SheetContent className="w-full max-w-md overflow-y-auto p-8 sm:max-w-lg">
        {isLoading ? (
          <div className="h-48 animate-pulse rounded-lg bg-muted"></div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between gap-4">
              <Avatar
                className="h-20 w-20 border-2"
                style={{ borderColor: house?.color }}
              >
                {house?.logoImage ? (
                  <AvatarImage src={house.logoImage} alt="House Logo" />
                ) : (
                  <AvatarFallback
                    style={{ backgroundColor: house?.color + "20" }}
                  >
                    <Home
                      className="h-10 w-10"
                      style={{ color: house?.color }}
                    />
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: house?.color }}
                  />
                  <h2 className="text-xl font-semibold">
                    {house?.name || "Unnamed House"}
                  </h2>
                </div>
                {house?.locationName && (
                  <p className="mb-1 text-base text-foreground">
                    📍 {house.locationName}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  {house?.latitude && house?.longitude
                    ? `Coordinates: ${parseFloat(house.latitude).toFixed(4)}, ${parseFloat(house.longitude).toFixed(4)}`
                    : "Location coordinates not specified"}
                </p>
              </div>
            </div>

            {house?.description && (
              <div className="space-y-3">
                <h3 className="text-lg font-medium">Description</h3>
                <MarkdownContent
                  content={house.description}
                  id={`house-${houseId}`}
                />
              </div>
            )}

            {house?.images && house.images.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-medium">Gallery</h3>
                <div className="grid grid-cols-3 gap-4">
                  {house.images.map((image, i) => (
                    <div
                      key={i}
                      className="relative aspect-square overflow-hidden rounded-lg"
                    >
                      <img
                        src={image}
                        alt={`House image ${i + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Owner Section */}
            {house?.ownerId && (
              <div className="space-y-3 border-t border-border pt-4">
                <h3 className="text-lg font-medium">Owner</h3>
                {isOwnerLoading ? (
                  <div className="h-12 animate-pulse rounded-lg bg-muted"></div>
                ) : ownerProfile ? (
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      {ownerProfile.profileImage ? (
                        <AvatarImage
                          src={ownerProfile.profileImage}
                          alt="Owner"
                        />
                      ) : (
                        <AvatarFallback>
                          <User className="h-6 w-6" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <p className="font-medium">House Owner</p>
                      {ownerProfile.shortBio && (
                        <p className="text-sm text-muted-foreground">
                          {ownerProfile.shortBio.slice(0, 50)}...
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Owner information not available
                  </p>
                )}
              </div>
            )}

            {/* Color Badge */}
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                style={{
                  borderColor: house?.color,
                  backgroundColor: house?.color + "10",
                  color: house?.color,
                }}
              >
                House Color: {house?.color}
              </Badge>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
