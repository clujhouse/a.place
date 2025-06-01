"use client";

import Link from "next/link";
import { useAtom } from "jotai";

import type { RouterOutputs } from "@acme/api";
import { Card } from "@acme/ui/card";
import { Skeleton } from "@acme/ui/skeleton";

import { selectedHouseAtom } from "~/lib/atoms";
import { SvgIcon } from "../svg-icon";
import { HouseCardBackground } from "./house-card-background";

interface HouseCardProps {
  house: RouterOutputs["house"]["getAll"][number];
}

export function HouseCard({ house }: HouseCardProps) {
  const displayColor = house.color;
  const [selectedHouse, setSelectedHouse] = useAtom(selectedHouseAtom);

  return (
    <>
      <Link href={`/babels-tower/${house.slug}`}>
        <Card
          onClick={() => setSelectedHouse(house)}
          className="relative flex cursor-pointer flex-col items-center justify-center gap-4 overflow-hidden p-6 hover:bg-accent/50"
        >
          {house.logoUrl && (
            <SvgIcon
              src={house.logoUrl}
              alt={house.name}
              className="h-24 w-24 text-foreground"
              fallback={null}
            />
          )}

          <HouseCardBackground color={displayColor} />

          <div className="relative flex flex-col">
            <p className="z-10 text-center text-3xl font-bold tracking-tight">
              {house.name}
            </p>

            <p className="text z-10 mt-2 text-balance text-center text-sm">
              united in art.
            </p>
          </div>
        </Card>
      </Link>
    </>
  );
}

export function HouseCardSkeleton() {
  return (
    <div className="relative flex min-h-[220px] w-full flex-col items-center justify-center gap-4 overflow-hidden p-6">
      <HouseCardBackground color="#e5e7eb" />

      <Skeleton className="z-20 h-24 w-24 rounded-full" />
      <div className="relative z-20 flex w-full flex-col items-center">
        <Skeleton className="mb-2 h-8 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}
