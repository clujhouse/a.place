"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { authClient } from "@acme/auth/client";

import { useTRPC } from "~/trpc/react";
import { OnboardingChat } from "./onboarding-chat/onboarding-chat";

export function OnboardingWrapper({ children }: { children: React.ReactNode }) {
  const trpc = useTRPC();

  const { data: session } = authClient.useSession();
  const { data: profile, isPending } = useQuery({
    ...trpc.profile.get.queryOptions(),
    enabled: !!session,
  });

  const shouldShowOnboarding = useMemo(() => {
    // Only show onboarding if user is logged in AND either:
    // 1. No profile exists yet (still loading or doesn't exist)
    // 2. Profile exists but user is not onboarded
    return session && !profile?.isOnboarded && !isPending;
  }, [session, profile, isPending]);

  return (
    <>
      {children}
      {shouldShowOnboarding && <OnboardingChat open={shouldShowOnboarding} />}
    </>
  );
}
