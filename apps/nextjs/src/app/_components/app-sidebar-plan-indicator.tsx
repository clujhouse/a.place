"use client";

import { Crown, Sparkles, User } from "lucide-react";

import { useSubscription } from "~/hooks/use-subscription";

const planConfig = {
  standard: {
    name: "Standard",
    icon: User,
  },
  pro: {
    name: "Pro",
    icon: Crown,
  },
  pro_exclusive: {
    name: "Pro Exclusive",
    icon: Sparkles,
  },
};

export function AppSidebarPlanIndicator() {
  const { currentPlan, isLoading } = useSubscription();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 border p-3">
        <div className="h-4 w-4 animate-pulse rounded bg-muted" />
        <span className="text-sm text-muted-foreground">Loading plan...</span>
      </div>
    );
  }

  const config = planConfig[currentPlan];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2 border p-3">
      <Icon className="h-4 w-4" />
      <span className="text-sm font-medium">{config.name}</span>
    </div>
  );
}
