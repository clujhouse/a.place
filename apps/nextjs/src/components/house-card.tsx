"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Card } from "@acme/ui/card";
import { Skeleton } from "@acme/ui/skeleton";

import { useTRPC } from "~/trpc/react";
import ClujhouseSimpleIcon from "./clujhouse";
import { HouseSidebar } from "./house-sidebar";

interface HouseCardProps {
  house: {
    id: string;
    name: string | null;
    description: string;
    locationName: string | null;
    color: string;
    logoImage: string | null;
  };
}

export function HouseCard({ house }: HouseCardProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const trpc = useTRPC();
  const { data, isLoading } = useQuery(
    trpc.house.getById.queryOptions(house.id),
  );

  if (isLoading) {
    return <HouseCardSkeleton />;
  }

  const displayColor = house.color;

  return (
    <>
      <Card
        onClick={() => setIsSidebarOpen(true)}
        className="relative flex cursor-pointer flex-col items-center justify-center gap-4 overflow-hidden p-6 hover:bg-accent/50"
      >
        <ClujhouseSimpleIcon className="h-24 w-24" />
        {/* Main radial gradient background */}
        <div
          className="absolute inset-0 z-0"
          style={{
            background: `radial-gradient(circle at 60% 40%, ${displayColor}33 0%, ${displayColor}cc 100%)`,
            opacity: 0.35,
          }}
        />
        {/* Additional linear gradient overlay */}
        <div
          className="absolute inset-0 z-0"
          style={{
            background: `linear-gradient(120deg, ${displayColor}22 0%, transparent 70%)`,
            opacity: 0.7,
            mixBlendMode: "screen",
          }}
        />
        {/* Additional radial gradient from bottom left */}
        <div
          className="absolute inset-0 z-0"
          style={{
            background: `radial-gradient(circle at 10% 90%, #fff3 0%, transparent 80%)`,
            opacity: 0.5,
            mixBlendMode: "soft-light",
          }}
        />
        {/* Noise texture overlay */}
        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            backgroundImage: "url(/house/house-noise.jpg)",
            backgroundSize: "cover",
            backgroundRepeat: "repeat",
            mixBlendMode: "overlay",
            opacity: 0.35,
          }}
        />
        <div className="relative flex flex-col">
          <p className="z-10 text-center text-3xl font-bold tracking-tight">
            {house.name}
          </p>

          <p className="text z-10 mt-2 text-balance text-center text-sm">
            united in art.
          </p>
        </div>
      </Card>

      <HouseSidebar
        houseId={house.id}
        open={isSidebarOpen}
        onOpenChange={setIsSidebarOpen}
      />
    </>
  );
}

export function HouseCardSkeleton() {
  return (
    <div className="relative flex min-h-[220px] w-full flex-col items-center justify-center gap-4 overflow-hidden p-6">
      {/* Gradients and noise overlays */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: `radial-gradient(circle at 60% 40%, #e5e7eb33 0%, #e5e7ebcc 100%)`,
          opacity: 0.35,
        }}
      />
      <div
        className="absolute inset-0 z-0"
        style={{
          background: `linear-gradient(120deg, #e5e7eb22 0%, transparent 70%)`,
          opacity: 0.7,
          mixBlendMode: "screen",
        }}
      />
      <div
        className="absolute inset-0 z-0"
        style={{
          background: `radial-gradient(circle at 10% 90%, #fff3 0%, transparent 80%)`,
          opacity: 0.5,
          mixBlendMode: "soft-light",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          backgroundImage: "url(/house/house-noise.jpg)",
          backgroundSize: "cover",
          backgroundRepeat: "repeat",
          mixBlendMode: "overlay",
          opacity: 0.35,
        }}
      />
      <Skeleton className="z-20 h-24 w-24 rounded-full" />
      <div className="relative z-20 flex w-full flex-col items-center">
        <Skeleton className="mb-2 h-8 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}
