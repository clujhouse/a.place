import React, { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { generateReactHelpers } from "@uploadthing/react";
import { Plus } from "lucide-react";
import { usePostHog } from "posthog-js/react";

import { authClient } from "@acme/auth/client";
import { Avatar, AvatarFallback, AvatarImage } from "@acme/ui/avatar";
import { MarkdownContent } from "@acme/ui/markdown-content";
import { Progress } from "@acme/ui/progress";
import { toast } from "@acme/ui/toast";

import type { OurFileRouter } from "~/app/api/uploadthing/core";
import { ShareProfileButton } from "~/components/share-profile-button";
import { useAppContext } from "~/context/app-context";
import { cn } from "~/lib/utils";
import { useTRPC } from "~/trpc/react";

const { useUploadThing } = generateReactHelpers<OurFileRouter>();

export const ProfileBio = () => {
  const profileImageInputRef = useRef<HTMLInputElement>(null);
  const imageInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const posthog = usePostHog();

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

  // Track profile view
  React.useEffect(() => {
    if (profile && session?.user) {
      posthog.capture("profile_viewed", {
        profile_completion: profile.completionPercentage,
        is_onboarded: profile.isOnboarded,
        has_house: !!profile.houseId,
        has_additional_images: (profile.images?.length || 0) > 0,
        profile_text_length: profile.text?.length || 0,
        source: "profile_page",
      });
    }
  }, [profile, session, posthog]);

  const { mutate: updateProfileImage } = useMutation(
    trpc.profile.updateProfileImage.mutationOptions({
      onSuccess: (_data, url) => {
        toast.success("Profile image updated successfully");

        posthog.capture("profile_image_updated", {
          image_type: "profile_picture",
          profile_completion: profile?.completionPercentage || 0,
          source: "profile_page",
        });

        void authClient.updateUser({
          image: url,
        });
      },
      onError: () => {
        toast.error("Failed to update profile image");

        posthog.capture("profile_image_update_failed", {
          image_type: "profile_picture",
          error_type: "upload_failed",
          source: "profile_page",
        });
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

        posthog.capture("profile_image_updated", {
          image_type: "additional_image",
          profile_completion: profile?.completionPercentage || 0,
          total_additional_images: (profile?.images?.length || 0) + 1,
          source: "profile_page",
        });

        void queryClient.invalidateQueries({
          queryKey: trpc.profile.get.queryKey(),
        });
      },
      onError: () => {
        toast.error("Failed to update additional images");

        posthog.capture("profile_image_update_failed", {
          image_type: "additional_image",
          error_type: "upload_failed",
          source: "profile_page",
        });
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

        posthog.capture("profile_image_updated", {
          image_type: "additional_image_replacement",
          profile_completion: profile?.completionPercentage || 0,
          total_additional_images: profile?.images?.length || 0,
          source: "profile_page",
        });

        void queryClient.invalidateQueries({
          queryKey: trpc.profile.get.queryKey(),
        });
      },
      onError: () => {
        toast.error("Failed to update image");

        posthog.capture("profile_image_update_failed", {
          image_type: "additional_image_replacement",
          error_type: "upload_failed",
          source: "profile_page",
        });
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

    const file = e.target.files[0];

    // Check file size before upload (4MB limit)
    const maxSizeInBytes = 4 * 1024 * 1024; // 4MB
    if (file.size > maxSizeInBytes) {
      toast.error(
        "Image is too large. Please choose an image smaller than 4MB.",
      );
      return;
    }

    posthog.capture("profile_image_upload_attempted", {
      image_type: "profile_picture",
      file_size: file.size,
      file_type: file.type,
      source: "profile_page",
    });

    try {
      setLoadingImageIndex(-1); // -1 for profile image
      const uploadedFiles = await startUpload([file]);
      if (!uploadedFiles?.[0]) return;

      updateProfileImage(uploadedFiles[0].url);
    } catch (err: any) {
      // Check if it's a file size error
      if (
        err?.message?.includes("size") ||
        err?.message?.includes("large") ||
        err?.code === "TOO_LARGE"
      ) {
        toast.error(
          "Image is too large. Please choose an image smaller than 4MB.",
        );
      } else if (
        err?.message?.includes("type") ||
        err?.message?.includes("format")
      ) {
        toast.error("Invalid file type. Please upload a valid image file.");
      } else {
        toast.error("Failed to upload profile image. Please try again.");
      }
      setLoadingImageIndex(null);

      posthog.capture("profile_image_upload_failed", {
        image_type: "profile_picture",
        error_type: "upload_error",
        source: "profile_page",
      });
    }
  };

  const handleUpdateSingleImage = async (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (!e.target.files?.[0]) return;

    const file = e.target.files[0];

    // Check file size before upload (4MB limit)
    const maxSizeInBytes = 4 * 1024 * 1024; // 4MB
    if (file.size > maxSizeInBytes) {
      toast.error(
        "Image is too large. Please choose an image smaller than 4MB.",
      );
      return;
    }

    posthog.capture("profile_image_upload_attempted", {
      image_type: "additional_image",
      file_size: file.size,
      file_type: file.type,
      image_index: index,
      source: "profile_page",
    });

    try {
      setLoadingImageIndex(index);
      const uploadedFiles = await startUpload([file]);
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
    } catch (err: any) {
      // Check if it's a file size error
      if (
        err?.message?.includes("size") ||
        err?.message?.includes("large") ||
        err?.code === "TOO_LARGE"
      ) {
        toast.error(
          "Image is too large. Please choose an image smaller than 4MB.",
        );
      } else if (
        err?.message?.includes("type") ||
        err?.message?.includes("format")
      ) {
        toast.error("Invalid file type. Please upload a valid image file.");
      } else {
        toast.error("Failed to upload image. Please try again.");
      }
      setLoadingImageIndex(null);

      posthog.capture("profile_image_upload_failed", {
        image_type: "additional_image",
        error_type: "upload_error",
        image_index: index,
        source: "profile_page",
      });
    }
  };

  if (isProfileLoading || isSessionLoading) {
    return <div className="h-48 animate-pulse bg-muted"></div>;
  }

  if (!session?.user) {
    return <div>Not logged in</div>;
  }

  return (
    <div className="flex h-dvh flex-col gap-4 p-6">
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
        <div className="flex-1">
          <p className="text-3xl font-semibold">{session.user.name}</p>
          <p className="text-muted-foreground">{session.user.email}</p>
          {/* <div className="mt-2">
            <ShareProfileButton
              userId={session.user.id}
              userName={session.user.name}
            />
          </div> */}
        </div>
      </div>

      {/* House Selector */}
      {/* <div className="space-y-2">
        <h3 className="text-lg font-semibold">Your House</h3>
        <HouseSelector currentHouseId={profile?.houseId} />
      </div> */}
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
