"use client";

import { useQuery } from "@tanstack/react-query";

import { Badge } from "@acme/ui/badge";

import { useTRPC } from "~/trpc/react";

interface ProfileCardHouseProps {
  houseId?: string | null;
}

export function ProfileCardHouse({ houseId }: ProfileCardHouseProps) {
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

  return (
    <Badge
      className="absolute right-0 top-0"
      variant="outline"
      style={{
        borderColor: house.color,
        backgroundColor: house.color + "15",
        color: house.color,
      }}
    >
      <div style={{ backgroundColor: house.color }} />
      <span className="font-medium">{house.name || "Unnamed House"}</span>
    </Badge>
  );
}
