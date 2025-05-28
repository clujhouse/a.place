import React, { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { generateReactHelpers } from "@uploadthing/react";
import { Plus } from "lucide-react";

import { authClient } from "@acme/auth/client";
import { Avatar, AvatarFallback, AvatarImage } from "@acme/ui/avatar";
import { MarkdownContent } from "@acme/ui/markdown-content";
import { Progress } from "@acme/ui/progress";
import { toast } from "@acme/ui/toast";

import type { OurFileRouter } from "~/app/api/uploadthing/core";
import { useAppContext } from "~/context/app-context";
import { cn } from "~/lib/utils";
import { useTRPC } from "~/trpc/react";
import { HouseSelector } from "./house-selector";

const { useUploadThing } = generateReactHelpers<OurFileRouter>();

export const ProfileBio = () => {
  const profileImageInputRef = useRef<HTMLInputElement>(null);
  const imageInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: profile, isLoading: isProfileLoading } = useQuery(
    trpc.profile.get.queryOptions(),
  );
  const { data: session, isPending: isSessionLoading } =
    authClient.useSession();

  const { startUpload, isUploading } = useUploadThing("profileImages");

  const [loadingImageIndex, setLoadingImageIndex] = useState<number | null>(
    null,
  );

  const { isProfileCreating } = useAppContext();

  const { mutate: updateProfileImage } = useMutation(
    trpc.profile.updateProfileImage.mutationOptions({
      onSuccess: (_data, url) => {
        toast.success("Profile image updated successfully");
        void authClient.updateUser({
          image: url,
        });
      },
      onError: () => {
        toast.error("Failed to update profile image");
      },
      onSettled: () => {
        setLoadingImageIndex(null);
      },
    }),
  );

  const { mutate: updateAdditionalImages } = useMutation(
    trpc.profile.updateAdditionalImages.mutationOptions({
      onSuccess: () => {
        toast.success("Additional images updated successfully");
        void queryClient.invalidateQueries({
          queryKey: trpc.profile.get.queryKey(),
        });
      },
      onError: () => {
        toast.error("Failed to update additional images");
      },
      onSettled: () => {
        setLoadingImageIndex(null);
      },
    }),
  );

  const { mutate: updateAdditionalImageAtIndex } = useMutation(
    trpc.profile.updateAdditionalImageAtIndex.mutationOptions({
      onSuccess: () => {
        toast.success("Image updated successfully");
        void queryClient.invalidateQueries({
          queryKey: trpc.profile.get.queryKey(),
        });
      },
      onError: () => {
        toast.error("Failed to update image");
      },
      onSettled: () => {
        setLoadingImageIndex(null);
      },
    }),
  );

  const handleProfileImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!e.target.files?.[0]) return;

    try {
      setLoadingImageIndex(-1); // -1 for profile image
      const uploadedFiles = await startUpload([e.target.files[0]]);
      if (!uploadedFiles?.[0]) return;

      updateProfileImage(uploadedFiles[0].url);
    } catch (err) {
      toast.error("Failed to upload profile image");
      setLoadingImageIndex(null);
    }
  };

  const handleUpdateSingleImage = async (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (!e.target.files?.[0]) return;

    try {
      setLoadingImageIndex(index);
      const uploadedFiles = await startUpload([e.target.files[0]]);
      if (!uploadedFiles?.[0]) return;

      if (!profile?.images?.[index]) {
        // If this is a new image, use updateAdditionalImages
        updateAdditionalImages([uploadedFiles[0].url]);
      } else {
        // If we're updating an existing image, use updateAdditionalImageAtIndex
        updateAdditionalImageAtIndex({
          imageUrl: uploadedFiles[0].url,
          index,
        });
      }
    } catch (err) {
      toast.error("Failed to update image");
      setLoadingImageIndex(null);
    }
  };

  if (isProfileLoading || isSessionLoading) {
    return <div className="h-48 animate-pulse bg-muted"></div>;
  }

  if (!session?.user) {
    return <div>Not logged in</div>;
  }

  return (
    <div className="flex h-screen flex-col gap-4 p-6">
      <div className="flex items-center gap-4">
        <div
          className="group relative cursor-pointer"
          onClick={() => profileImageInputRef.current?.click()}
        >
          <Avatar className="h-24 w-24">
            <AvatarImage
              src={session.user.image ?? ""}
              alt={session.user.name}
            />
            <AvatarFallback>{session.user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center bg-black/50",
              loadingImageIndex === -1
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-100",
            )}
          >
            <p className="text-sm text-white">
              {loadingImageIndex === -1 ? "Uploading..." : "Change"}
            </p>
          </div>
          <input
            ref={profileImageInputRef}
            type="file"
            className="hidden"
            onChange={handleProfileImageUpload}
            accept="image/*"
            disabled={isUploading || isProfileCreating}
          />
        </div>
        <div>
          <p className="text-3xl font-semibold">{session.user.name}</p>
          <p className="text-muted-foreground">{session.user.email}</p>
        </div>
      </div>

      {/* House Selector */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Your House</h3>
        <HouseSelector currentHouseId={profile?.houseId} />
      </div>
      {/* Profile Completion Section */}
      {(profile?.completionPercentage ?? 0) < 100 && (
        <div className="space-y-2 bg-background">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Profile Completion</h3>
            <span className="text-sm font-medium">
              {profile?.completionPercentage ?? 0}%
            </span>
          </div>
          <Progress
            value={profile?.completionPercentage ?? 0}
            className="h-2 w-full"
          />
        </div>
      )}

      <div className="h-full min-h-0 overflow-y-auto">
        {isProfileCreating ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <MarkdownContent content={profile?.text ?? ""} id="bio" />
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Additional Images</h3>

        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => {
            const image = profile?.images?.[i];
            const isPlaceholder = !image;

            return (
              <div
                key={i}
                className={cn(
                  "group relative aspect-square cursor-pointer",
                  isPlaceholder
                    ? "border-2 border-dashed border-muted-foreground/25"
                    : "",
                )}
                onClick={() =>
                  !isUploading && imageInputRefs.current[i]?.click()
                }
              >
                {isPlaceholder ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className={cn(
                        "flex flex-col items-center gap-2 text-muted-foreground/50",
                        loadingImageIndex === i && "opacity-50",
                      )}
                    >
                      <Plus className="h-8 w-8" />
                      <span className="text-sm">Add Image</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <img
                      src={image}
                      alt={`Additional image ${i + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <div
                      className={cn(
                        "absolute inset-0 flex items-center justify-center bg-black/50",
                        loadingImageIndex === i
                          ? "opacity-100"
                          : "opacity-0 group-hover:opacity-100",
                      )}
                    >
                      <p className="text-sm text-white">
                        {loadingImageIndex === i ? "Uploading..." : "Change"}
                      </p>
                    </div>
                  </>
                )}
                <input
                  ref={(el) => {
                    if (el) imageInputRefs.current[i] = el;
                  }}
                  type="file"
                  className="hidden"
                  onChange={(e) => handleUpdateSingleImage(e, i)}
                  accept="image/*"
                  disabled={isUploading}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
