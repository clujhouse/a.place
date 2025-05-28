"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronDown, Home, Plus, X } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu";
import { toast } from "@acme/ui/toast";

import { useTRPC } from "~/trpc/react";

interface HouseSelectorProps {
  currentHouseId?: string | null;
}

export function HouseSelector({ currentHouseId }: HouseSelectorProps) {
  const [open, setOpen] = useState(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: houses, isLoading: isHousesLoading } = useQuery(
    trpc.house.getAll.queryOptions(),
  );

  const { data: currentHouse } = useQuery({
    ...trpc.house.getById.queryOptions(currentHouseId ?? ""),
    enabled: !!currentHouseId,
  });

  const { mutate: updateHouse, isPending: isUpdating } = useMutation(
    trpc.profile.updateHouse.mutationOptions({
      onSuccess: () => {
        toast.success("House updated successfully");
        void queryClient.invalidateQueries({
          queryKey: trpc.profile.get.queryKey(),
        });
        setOpen(false);
      },
      onError: () => {
        toast.error("Failed to update house");
      },
    }),
  );

  const handleSelectHouse = (houseId: string | null) => {
    updateHouse(houseId);
  };

  if (currentHouse) {
    return (
      <div className="flex items-center gap-2">
        <Badge
          variant="outline"
          className="flex items-center gap-2 px-3 py-1.5"
          style={{
            borderColor: currentHouse.color,
            backgroundColor: currentHouse.color + "15",
            color: currentHouse.color,
          }}
        >
          <div
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: currentHouse.color }}
          />
          <Home className="h-3.5 w-3.5" />
          {currentHouse.name || "Unnamed House"}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleSelectHouse(null)}
          disabled={isUpdating}
          className="h-6 w-6 p-0"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="justify-between"
          disabled={isHousesLoading || isUpdating}
        >
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Your House
          </div>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {isHousesLoading ? (
          <DropdownMenuItem disabled>Loading houses...</DropdownMenuItem>
        ) : houses && houses.length > 0 ? (
          <>
            {houses.map((house) => (
              <DropdownMenuItem
                key={house.id}
                onClick={() => handleSelectHouse(house.id)}
                className="flex items-center gap-3 p-3"
              >
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: house.color }}
                />
                <div className="flex-1">
                  <div className="font-medium">
                    {house.name || "Unnamed House"}
                  </div>
                  {house.locationName && (
                    <div className="text-sm text-muted-foreground">
                      📍 {house.locationName}
                    </div>
                  )}
                </div>
                {currentHouseId === house.id && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
          </>
        ) : (
          <DropdownMenuItem disabled>No houses available</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
