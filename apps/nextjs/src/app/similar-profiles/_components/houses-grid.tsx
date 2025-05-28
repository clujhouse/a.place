"use client";

import { useQuery } from "@tanstack/react-query";

import { HouseCard } from "~/components/house-card";
import { NewHousePlaceholder } from "~/components/new-house-placeholder";
import { useTRPC } from "~/trpc/react";

export function HousesGrid() {
  const trpc = useTRPC();
  const { data: houses = [], isLoading } = useQuery(
    trpc.house.getAll.queryOptions(),
  );

  if (isLoading) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 border-r p-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
          />
        ))}
        <NewHousePlaceholder />
      </div>
    </div>
  );
}
