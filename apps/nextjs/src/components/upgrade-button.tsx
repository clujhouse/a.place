"use client";

import { useState } from "react";
import { Crown } from "lucide-react";

import { authClient } from "@acme/auth/client";
import { UpgradeModal } from "@acme/ui";
import { Button } from "@acme/ui/button";
import { Icon } from "@acme/ui/icon";

import { useSubscription } from "~/hooks/use-subscription";

export function UpgradeButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { currentPlan, isLoading } = useSubscription();

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
      setIsModalOpen(false);
    } catch (error) {
      console.error("Upgrade failed:", error);
      // Handle error (show toast, etc.)
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled className="w-full">
        <Crown className="h-4 w-4 animate-pulse" />
        Loading...
      </Button>
    );
  }

  // Don't show upgrade button if user already has pro_exclusive
  if (currentPlan === "pro_exclusive") {
    return null;
  }

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        variant="outline"
        size="sm"
        className="flex w-full items-center gap-2"
      >
        <Icon as={Crown} />
        {currentPlan === "pro" ? "Upgrade to Pro Exclusive" : "Upgrade Plan"}
      </Button>

      <UpgradeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpgrade={handleUpgrade}
        currentMembership={currentPlan}
      />
    </>
  );
}
