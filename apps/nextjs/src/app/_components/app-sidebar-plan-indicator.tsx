"use client";

import { useState } from "react";
import { CircleFadingArrowUp } from "lucide-react";
import { usePostHog } from "posthog-js/react";

import { authClient } from "@acme/auth/client";
import { UpgradeModal } from "@acme/ui";
import { Button } from "@acme/ui/button";
import { Icon } from "@acme/ui/icon";

import { useSubscription } from "~/hooks/use-subscription";

const planConfig = {
  standard: {
    name: "you are our guest",
  },
  pro: {
    name: "we love u",
  },
  pro_exclusive: {
    name: "thank you king",
  },
};

export function AppSidebarPlanIndicator() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { currentPlan, isLoading } = useSubscription();
  const posthog = usePostHog();

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

  const handleOpenModal = () => {
    setIsModalOpen(true);
    posthog.capture("upgrade_modal_opened", {
      source: "plan_indicator",
      current_plan: currentPlan,
    });
  };

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled className="w-full">
        <div className="h-4 w-16 animate-pulse rounded bg-muted" />
      </Button>
    );
  }

  const config = planConfig[currentPlan];

  return (
    <>
      <Button
        onClick={handleOpenModal}
        variant="outline"
        size="sm"
        className="w-full justify-between text-xs"
      >
        {config.name}
        <Icon as={CircleFadingArrowUp} />
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
