"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { authClient } from "@acme/auth/client";

import { useTRPC } from "~/trpc/react";

export function useSearchLimits() {
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const trpc = useTRPC();
  const { data: session } = authClient.useSession();

  const { data: searchUsage, isLoading } = useQuery({
    ...trpc.main.getSearchUsage.queryOptions(),
    refetchInterval: 30000, // Refetch every 30 seconds
    enabled: !!session,
  });

  const handleUpgrade = async (plan: "pro" | "pro_exclusive") => {
    try {
      const result = await authClient.subscription.upgrade({
        plan,
        successUrl: `${window.location.origin}?upgrade=success`,
        cancelUrl: `${window.location.origin}?upgrade=cancelled`,
      });

      // Check if there was an error
      if (result.error) {
        console.error("Upgrade failed:", result.error);
        return;
      }

      // The upgrade method will redirect to Stripe Checkout
      setIsUpgradeModalOpen(false);
    } catch (error) {
      console.error("Failed to upgrade subscription:", error);
    }
  };

  const checkLimitsBeforeSearch = (): boolean => {
    // If loading or no usage data, allow search (will be caught by backend)
    if (isLoading || !searchUsage) {
      return true;
    }

    // If user has unlimited searches (premium plan), allow
    if (searchUsage.type === "premium" && searchUsage.unlimited) {
      return true;
    }

    // If user has reached their limit, show upgrade modal
    if (searchUsage.type === "free" && searchUsage.remaining === 0) {
      setIsUpgradeModalOpen(true);
      return false;
    }

    // User has remaining searches
    return true;
  };

  return {
    searchUsage,
    isLoading,
    isUpgradeModalOpen,
    setIsUpgradeModalOpen,
    handleUpgrade,
    checkLimitsBeforeSearch,
  };
}
