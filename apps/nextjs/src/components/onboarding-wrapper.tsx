"use client";

import { useQuery } from "@tanstack/react-query";

import { OnboardingChat } from "~/components/onboarding-chat/onboarding-chat";
import { useTRPC } from "~/trpc/react";

export function OnboardingWrapper({ children }: { children: React.ReactNode }) {
  const trpc = useTRPC();

  const { data: profile, isLoading } = useQuery({
    ...trpc.profile.get.queryOptions(),
  });

  // Don't render children until we know if user is onboarded
  if (isLoading) {
    return null;
  }

  return (
    <>
      {children}
      {profile && !profile.isOnboarded && <OnboardingChat />}
    </>
  );
}
