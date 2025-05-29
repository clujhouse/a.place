"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePostHog } from "posthog-js/react";

import { authClient } from "@acme/auth/client";
import { UpgradeModal } from "@acme/ui";
import { Progress } from "@acme/ui/progress";

import { useTRPC } from "~/trpc/react";

export function SearchUsageIndicator() {
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const trpc = useTRPC();
  const { data: session } = authClient.useSession();
  const posthog = usePostHog();

  const { data: searchUsage, isLoading } = useQuery({
    ...trpc.main.getSearchUsage.queryOptions(),
    refetchInterval: 30000, // Refetch every 30 seconds to keep usage up-to-date
    enabled: !!session,
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

  const handleOpenUpgradeModal = () => {
    setIsUpgradeModalOpen(true);
    posthog.capture("upgrade_modal_opened", {
      source: "search_usage_indicator",
      remaining_searches: searchUsage?.remaining,
      used_searches: searchUsage?.used,
      limit: searchUsage?.limit,
    });
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
      <div
        className="cursor-pointer border bg-background p-3 hover:bg-accent"
        onClick={handleOpenUpgradeModal}
      >
        <div className="flex items-center justify-between text-sm">
          <span>Daily searches</span>
          <span className={isNearLimit ? "font-medium" : ""}>
            {searchUsage.used}/{searchUsage.limit}
          </span>
        </div>
        <Progress value={progressPercentage} className="mt-2 h-1" />
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
