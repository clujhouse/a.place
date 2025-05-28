"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Home, User } from "lucide-react";

import { cn } from "@acme/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@acme/ui/avatar";
import { Card, CardContent, CardHeader } from "@acme/ui/card";
import { Skeleton } from "@acme/ui/skeleton";

import { useTRPC } from "~/trpc/react";
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
  containerClassName?: string;
}

export function HouseCard({ house, containerClassName }: HouseCardProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const trpc = useTRPC();
  const { data, isLoading } = useQuery(
    trpc.house.getById.queryOptions(house.id),
  );

  if (isLoading) {
    return (
      <Card
        className={cn(
          "flex w-full min-w-0 flex-col gap-2 p-3",
          containerClassName,
        )}
      >
        <CardHeader className="flex flex-row items-center gap-4 p-0">
          <Skeleton className="h-12 w-12" />
        </CardHeader>
        <CardContent className="p-0">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="mt-2 h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  const displayDescription = house.description;
  const displayImage = house.logoImage;
  const displayColor = house.color;

  return (
    <>
      <Card
        className={cn(
          "flex h-full min-h-0 w-full cursor-pointer flex-col gap-4 p-6 transition-all hover:border-primary hover:bg-accent",
          containerClassName,
        )}
        onClick={() => setIsSidebarOpen(true)}
        style={{ borderColor: displayColor }}
      >
        <CardHeader className="flex flex-row items-center gap-6 p-0">
          <Avatar
            className="h-16 w-16 border border-secondary"
            style={{ borderColor: displayColor }}
          >
            {displayImage ? (
              <AvatarImage
                src={displayImage}
                alt={displayDescription}
                className="object-cover"
              />
            ) : (
              <AvatarFallback style={{ backgroundColor: displayColor + "20" }}>
                <Home className="h-8 w-8" style={{ color: displayColor }} />
              </AvatarFallback>
            )}
          </Avatar>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex items-center gap-3">
            <div
              className="h-4 w-4 rounded-full"
              style={{ backgroundColor: displayColor }}
            />
            <p
              className="truncate text-xl font-semibold"
              title={house.name || "Unnamed House"}
            >
              {house.name || "Unnamed House"}
            </p>
          </div>
          {house.locationName && (
            <p className="mb-3 mt-1 text-sm text-muted-foreground">
              {house.locationName}
            </p>
          )}
          {displayDescription ? (
            <p className="line-clamp-3 text-base text-muted-foreground">
              {displayDescription.slice(0, 150)}
            </p>
          ) : (
            <p className="text-base text-muted-foreground">
              No house description available
            </p>
          )}
        </CardContent>
      </Card>

      <HouseSidebar
        houseId={house.id}
        open={isSidebarOpen}
        onOpenChange={setIsSidebarOpen}
      />
    </>
  );
}
