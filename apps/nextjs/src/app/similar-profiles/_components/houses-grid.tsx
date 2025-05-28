"use client";

import { useQuery } from "@tanstack/react-query";

import ClujhouseIcon from "~/components/clujhouse-icon";
import { HouseCard } from "~/components/house-card";
import { useTRPC } from "~/trpc/react";

export function HousesGrid() {
  const trpc = useTRPC();
  const { data: houses = [], isLoading } = useQuery(
    trpc.house.getAll.queryOptions(),
  );

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <ClujhouseIcon />
      </div>
    );
  }

  if (houses.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-muted-foreground">No houses found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
      {houses.map((house) => (
        <HouseCard
          key={house.id}
          house={{
            id: house.id,
            name: house.name,
            description: house.description,
            locationName: house.locationName,
            color: house.color,
            logoImage: house.logoImage,
          }}
          containerClassName="min-h-[180px]"
        />
      ))}
    </div>
  );
}
