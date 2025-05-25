"use client";

import { useQuery } from "@tanstack/react-query";

import { authClient } from "@acme/auth/client";

import { useTRPC } from "~/trpc/react";
import { OnboardingChat } from "./onboarding-chat/onboarding-chat";

export function OnboardingWrapper({ children }: { children: React.ReactNode }) {
  const trpc = useTRPC();

  const { data: session } = authClient.useSession();
  const { data: profile } = useQuery({
    ...trpc.profile.get.queryOptions(),
    enabled: !!session,
  });

  // Don't render children until we know if user is onboarded

  return (
    <>
      {children}
      {profile && !profile.isOnboarded && <OnboardingChat />}
    </>
  );
}
