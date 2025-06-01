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
