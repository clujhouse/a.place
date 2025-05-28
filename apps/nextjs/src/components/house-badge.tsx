"use client";

import { useQuery } from "@tanstack/react-query";
import { Home } from "lucide-react";

import { Badge } from "@acme/ui/badge";

import { useTRPC } from "~/trpc/react";

interface HouseBadgeProps {
  houseId?: string | null;
  size?: "sm" | "md" | "lg";
}

export function HouseBadge({ houseId, size = "sm" }: HouseBadgeProps) {
  const trpc = useTRPC();

  const { data: house } = useQuery({
    ...trpc.house.getById.queryOptions(houseId ?? ""),
    enabled: !!houseId,
  });

  if (!house || !houseId) {
    return null;
  }

  const sizeClasses = {
    sm: {
      badge: "px-2 py-1 text-xs",
      dot: "h-2 w-2",
      icon: "h-3 w-3",
    },
    md: {
      badge: "px-3 py-1.5 text-sm",
      dot: "h-2.5 w-2.5",
      icon: "h-3.5 w-3.5",
    },
    lg: {
      badge: "px-4 py-2 text-base",
      dot: "h-3 w-3",
      icon: "h-4 w-4",
    },
  };

  const classes = sizeClasses[size];

  return (
    <Badge
      variant="outline"
      className={`flex items-center gap-1.5 ${classes.badge}`}
      style={{
        borderColor: house.color,
        backgroundColor: house.color + "15",
        color: house.color,
      }}
    >
      <div
        className={`rounded-full ${classes.dot}`}
        style={{ backgroundColor: house.color }}
      />
      <Home className={classes.icon} />
      <span className="font-medium">{house.name || "Unnamed House"}</span>
    </Badge>
  );
}
