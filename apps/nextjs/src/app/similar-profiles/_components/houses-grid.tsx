"use client";

import { useQuery } from "@tanstack/react-query";

import { HouseCard } from "~/components/house-card";
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
      <h1 className="text-3xl font-bold">
        Global houses full of cracked people
      </h1>
      <div className="flex flex-wrap gap-2">
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
      </div>
    </div>
  );
}
