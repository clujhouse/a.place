"use client";

import { useEffect, useState } from "react";

import { authClient } from "@acme/auth/client";

export type SubscriptionPlan = "standard" | "pro" | "pro_exclusive";

interface UseSubscriptionReturn {
  currentPlan: SubscriptionPlan;
  isLoading: boolean;
  isActive: boolean;
  subscription: any | null;
  refetch: () => Promise<void>;
}

export function useSubscription(): UseSubscriptionReturn {
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan>("standard");
  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState<any | null>(null);
  const { data: session } = authClient.useSession();

  const fetchSubscription = async () => {
    if (!session?.user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      // Use better-auth's subscription.list method to get active subscriptions
      const { data: subscriptions } = await authClient.subscription.list();

      // Find the active subscription
      const activeSubscription = subscriptions?.find(
        (sub: any) => sub.status === "active" || sub.status === "trialing",
      );

      console.log("Active subscription:", activeSubscription);

      if (activeSubscription?.plan) {
        console.log("Plan from subscription:", activeSubscription.plan);
        setCurrentPlan(activeSubscription.plan as "pro" | "pro_exclusive");
        setSubscription(activeSubscription);
      } else {
        setCurrentPlan("standard");
        setSubscription(null);
      }
    } catch (error) {
      console.error("Failed to fetch subscription:", error);
      setCurrentPlan("standard");
      setSubscription(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [session?.user]);

  return {
    currentPlan,
    isLoading,
    isActive: currentPlan !== "standard",
    subscription,
    refetch: fetchSubscription,
  };
}
