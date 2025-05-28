"use client";

import { useState } from "react";
import { Check, Copy, Share } from "lucide-react";

import { Button } from "@acme/ui/button";
import { toast } from "@acme/ui/toast";

interface ShareProfileButtonProps {
  userId: string;
  userName?: string;
}

export function ShareProfileButton({
  userId,
  userName,
}: ShareProfileButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const profileUrl = `${window.location.origin}/profile/${userId}`;

    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      toast.success(
        userName
          ? `${userName}'s profile link copied to clipboard`
          : "Profile link copied to clipboard",
      );

      // Reset the copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy link to clipboard");
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
      {copied ? (
        <>
          <Check className="h-4 w-4" />
          Copied!
        </>
      ) : (
        <>
          <Share className="h-4 w-4" />
          Share Profile
        </>
      )}
    </Button>
  );
}
