import React, { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { generateReactHelpers } from "@uploadthing/react";
import { Plus } from "lucide-react";

import type { RouterOutputs } from "@acme/api";
import { authClient } from "@acme/auth/client";
import { Avatar, AvatarFallback, AvatarImage } from "@acme/ui/avatar";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { MarkdownContent } from "@acme/ui/markdown-content";
import { toast } from "@acme/ui/toast";

import type { OurFileRouter } from "~/app/api/uploadthing/core";
import { cn } from "~/lib/utils";
import { useTRPC } from "~/trpc/react";

const { useUploadThing } = generateReactHelpers<OurFileRouter>();

type Profile = RouterOutputs["profile"]["get"];

export const ProfileBio = () => {
  const profileImageInputRef = useRef<HTMLInputElement>(null);
  const additionalImagesInputRef = useRef<HTMLInputElement>(null);
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

  const { mutate: updateProfileImage } = useMutation(
    trpc.profile.updateProfileImage.mutationOptions({
      onSuccess: () => {
        toast.success("Profile image updated successfully");
        void queryClient.invalidateQueries({
          queryKey: trpc.profile.get.queryKey(),
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

  const handleAdditionalImagesUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files);
    const remainingSlots = 3 - (profile?.images?.length ?? 0);

    if (files.length > remainingSlots) {
      toast.error(
        `You can only upload ${remainingSlots} more image${remainingSlots === 1 ? "" : "s"}`,
      );
      return;
    }

    try {
      setLoadingImageIndex(-2); // -2 for additional images
      const uploadedFiles = await startUpload(files);
      if (!uploadedFiles) return;

      const imageUrls = uploadedFiles.map((file) => file.url);
      updateAdditionalImages(imageUrls);
    } catch (err) {
      toast.error("Failed to upload additional images");
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
    return <div className="h-48 animate-pulse rounded-lg bg-muted"></div>;
  }

  if (!session?.user) {
    return <div>Not logged in</div>;
  }

  const canAddMoreImages = !profile?.images || profile.images.length < 3;

  return (
    <div className="flex h-screen flex-col gap-4 p-6">
      <div className="flex items-center gap-4">
        <div
          className="group relative cursor-pointer"
          onClick={() => profileImageInputRef.current?.click()}
        >
          <Avatar className="h-24 w-24">
            <AvatarImage
              src={profile?.profileImage ?? session.user.image ?? ""}
              alt={session.user.name}
            />
            <AvatarFallback>{session.user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center rounded-full bg-black/50",
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
            disabled={isUploading}
          />
        </div>
        <div>
          <p className="text-3xl font-semibold">{session.user.name}</p>
          <p className="text-muted-foreground">{session.user.email}</p>
        </div>
      </div>

      <div className="h-full min-h-0 overflow-y-auto">
        <MarkdownContent content={profile?.text ?? ""} id="bio" />
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
                  "group relative aspect-square cursor-pointer rounded-lg",
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
                      className="h-full w-full rounded-lg object-cover"
                    />
                    <div
                      className={cn(
                        "absolute inset-0 flex items-center justify-center rounded-lg bg-black/50",
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

      <div className="mt-auto flex flex-wrap gap-1">
        <Badge variant="outline">developer</Badge>
        <Badge variant="outline">brainrot</Badge>
        <Badge variant="outline">part of the team</Badge>
      </div>
    </div>
  );
};
