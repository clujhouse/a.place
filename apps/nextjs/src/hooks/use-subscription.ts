"use client";

import { useEffect } from "react";
import { atom, useAtom } from "jotai";

import { authClient } from "@acme/auth/client";

export type SubscriptionPlan = "standard" | "pro" | "pro_exclusive";

interface UseSubscriptionReturn {
  currentPlan: SubscriptionPlan;
  isLoading: boolean;
  isActive: boolean;
  subscription: any | null;
  refetch: () => Promise<void>;
}

// Atoms for subscription state
const subscriptionAtom = atom<any | null>(null);
const currentPlanAtom = atom<SubscriptionPlan>("standard");
const isLoadingAtom = atom<boolean>(true);
const hasInitializedAtom = atom<boolean>(false);

export function useSubscription(): UseSubscriptionReturn {
  const [subscription, setSubscription] = useAtom(subscriptionAtom);
  const [currentPlan, setCurrentPlan] = useAtom(currentPlanAtom);
  const [isLoading, setIsLoading] = useAtom(isLoadingAtom);
  const [hasInitialized, setHasInitialized] = useAtom(hasInitializedAtom);
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
    // Only fetch if we haven't initialized yet and we have a session
    if (!hasInitialized && session?.user) {
      setHasInitialized(true);
      fetchSubscription();
    } else if (!session?.user && hasInitialized) {
      // Reset state when user logs out
      setCurrentPlan("standard");
      setSubscription(null);
      setIsLoading(false);
      setHasInitialized(false);
    }
  }, [session?.user, hasInitialized, setHasInitialized]);

  return {
    currentPlan,
    isLoading,
    isActive: currentPlan !== "standard",
    subscription,
    refetch: fetchSubscription,
  };
}
