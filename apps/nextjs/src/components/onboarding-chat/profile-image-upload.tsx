"use client";

import React, { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { generateReactHelpers } from "@uploadthing/react";
import { Camera, User } from "lucide-react";

import { authClient } from "@acme/auth/client";
import { Avatar, AvatarFallback, AvatarImage } from "@acme/ui/avatar";
import { Button } from "@acme/ui/button";
import { toast } from "@acme/ui/toast";

import type { OurFileRouter } from "~/app/api/uploadthing/core";
import { cn } from "~/lib/utils";
import { useTRPC } from "~/trpc/react";

const { useUploadThing } = generateReactHelpers<OurFileRouter>();

interface ProfileImageUploadProps {
  onImageUploaded?: (imageUrl: string) => void;
}

export const ProfileImageUpload = ({
  onImageUploaded,
}: ProfileImageUploadProps) => {
  const profileImageInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [hideImage, setHideImage] = useState(false);

  const trpc = useTRPC();

  const { data: session } = authClient.useSession();

  const { startUpload } = useUploadThing("profileImages");

  const { mutate: updateProfileImage } = useMutation(
    trpc.profile.updateProfileImage.mutationOptions({
      onSuccess: (_, imageUrl) => {
        toast.success("Profile image uploaded successfully!");

        onImageUploaded?.(imageUrl);

        void authClient.updateUser({
          image: imageUrl,
        });
        setIsUploading(false);
        setHideImage(true);
      },
      onError: () => {
        toast.error("Failed to update profile image");
        setIsUploading(false);
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

    try {
      setIsUploading(true);
      const uploadedFiles = await startUpload([file]);
      if (!uploadedFiles?.[0]) {
        toast.error("Failed to upload image");
        setIsUploading(false);
        return;
      }

      updateProfileImage(uploadedFiles[0].ufsUrl);
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
      setIsUploading(false);
    }
  };

  const currentImage = session?.user.image;

  if (hideImage) return null;

  return (
    <div className="flex flex-col items-center space-y-6 p-6">
      <div className="space-y-2 text-center">
        <h3 className="text-lg font-semibold">Add a profile picture</h3>
        <p className="text-muted-foreground">
          Help others recognize you by uploading a profile picture
        </p>
      </div>

      <div
        className="group relative cursor-pointer"
        onClick={() => !isUploading && profileImageInputRef.current?.click()}
      >
        <div className="flex h-32 w-32 items-center justify-center border-4 border-dashed border-muted-foreground/25 transition-all group-hover:border-primary">
          <User className="h-12 w-12 text-muted-foreground" />
        </div>

        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center bg-black/50 transition-opacity",
            isUploading
              ? "opacity-100"
              : currentImage
                ? "opacity-0 group-hover:opacity-100"
                : "opacity-100",
          )}
        >
          {isUploading ? (
            <div className="flex flex-col items-center space-y-2">
              <div className="h-6 w-6 animate-spin border-2 border-white border-t-transparent" />
              <p className="text-xs text-white">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <Camera className="h-6 w-6 text-white" />
              <p className="text-xs text-white">
                {currentImage ? "Change" : "Upload"}
              </p>
            </div>
          )}
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

      <div className="flex justify-center">
        <Button
          onClick={() => profileImageInputRef.current?.click()}
          disabled={isUploading}
          size="lg"
        >
          {currentImage ? "Change Photo" : "Upload Photo"}
        </Button>
      </div>
    </div>
  );
};
