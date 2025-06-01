"use client";

import { useQuery } from "@tanstack/react-query";

import { HouseCard } from "~/components/house/house-card";
import { NewHousePlaceholder } from "~/components/new-house-placeholder";
import { useTRPC } from "~/trpc/react";

export function HousesGrid() {
  const trpc = useTRPC();
  const { data: houses = [] } = useQuery(trpc.house.getAll.queryOptions());

  return (
    <div className="flex flex-col border-r">
      <div className="flex items-center justify-between border-b p-4">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          babel's tower
        </h1>
      </div>
      <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
        {houses.map((house) => (
          <HouseCard key={house.id} house={house} />
        ))}
        <NewHousePlaceholder />
      </div>
    </div>
  );
}
