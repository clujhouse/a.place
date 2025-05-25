"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { authClient } from "@acme/auth/client";
import { UpgradeModal } from "@acme/ui";
import { Button } from "@acme/ui/button";
import { Progress } from "@acme/ui/progress";

import { useTRPC } from "~/trpc/react";

export function SearchUsageIndicator() {
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const trpc = useTRPC();

  const { data: searchUsage, isLoading } = useQuery({
    ...trpc.main.getSearchUsage.queryOptions(),
    refetchInterval: 30000, // Refetch every 30 seconds to keep usage up-to-date
  });

  const handleUpgrade = async (plan: "pro" | "pro_exclusive") => {
    try {
      // Use better-auth's subscription.upgrade method
      const result = await authClient.subscription.upgrade({
        plan,
        successUrl: `${window.location.origin}/dashboard?upgrade=success`,
        cancelUrl: `${window.location.origin}/dashboard?upgrade=cancelled`,
      });

      // Check if there was an error
      if (result.error) {
        console.error("Upgrade failed:", result.error);
        return;
      }

      // The upgrade method will redirect to Stripe Checkout
      setIsUpgradeModalOpen(false);
    } catch (error) {
      console.error("Upgrade failed:", error);
      // Handle error (show toast, etc.)
    }
  };

  if (isLoading || !searchUsage) {
    return (
      <div className="space-y-3 border p-4">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (searchUsage.type === "premium") {
    return (
      <div className="space-y-3 border p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Daily Searches</h3>
          <span className="text-lg font-medium text-yellow-500">∞</span>
        </div>
        <p className="text-xs text-muted-foreground">
          unlimited searches with your {searchUsage.plan} plan
        </p>
      </div>
    );
  }

  // Free plan
  const isNearLimit = searchUsage.remaining <= 1;
  const progressPercentage = (searchUsage.used / searchUsage.limit) * 100;

  return (
    <>
      <div className="border-b p-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Daily searches</span>
          <span className={isNearLimit ? "font-medium" : ""}>
            {searchUsage.used}/{searchUsage.limit}
          </span>
        </div>
        <Progress value={progressPercentage} className="mt-2 h-1" />
        {searchUsage.remaining === 0 ? (
          <p className="mt-2 text-xs">
            You've reached your daily limit! Upgrade for unlimited searches.
          </p>
        ) : isNearLimit ? (
          <p className="mt-2 text-xs">
            You're almost out of searches! Upgrade for unlimited access.
          </p>
        ) : (
          <p className="mt-2 text-xs">
            {searchUsage.remaining} searches remaining today
          </p>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 h-auto w-full justify-start p-0 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => setIsUpgradeModalOpen(true)}
        >
          Upgrade for unlimited searches →
        </Button>
      </div>

      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        onUpgrade={handleUpgrade}
        currentMembership="standard"
      />
    </>
  );
}
