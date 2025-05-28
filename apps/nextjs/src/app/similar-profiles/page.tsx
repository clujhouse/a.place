"use client";

import { Suspense, useState } from "react";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";

import { HouseSidebar } from "~/components/house-sidebar";
import { useTRPC } from "~/trpc/react";
import { HousesGrid } from "./_components/houses-grid";

const World = dynamic(() => import("./_components/globe"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center">
      <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-primary"></div>
    </div>
  ),
});

const globeConfig = {
  pointSize: 4,
  globeColor: "#062056",
  showAtmosphere: true,
  atmosphereColor: "#FFFFFF",
  atmosphereAltitude: 0.1,
  emissive: "#062056",
  emissiveIntensity: 0.1,
  shininess: 0.9,
  polygonColor: "rgba(255,255,255,0.7)",
  ambientLight: "#38bdf8",
  directionalLeftLight: "#ffffff",
  directionalTopLight: "#ffffff",
  pointLight: "#ffffff",
  arcTime: 1000,
  arcLength: 0.9,
  rings: 1,
  maxRings: 3,
  initialPosition: { lat: 22.3193, lng: 114.1694 },
  autoRotate: true,
  autoRotateSpeed: 0.5,
};

export default function SimilarProfilesPage() {
  const trpc = useTRPC();
  const [selectedHouseId, setSelectedHouseId] = useState<string | null>(null);
  const [isGlobeSidebarOpen, setIsGlobeSidebarOpen] = useState(false);

  const { data: houses = [], isLoading: housesLoading } = useQuery(
    trpc.house.getAll.queryOptions(),
  );

  const handleHouseClick = (house: any) => {
    setSelectedHouseId(house.id);
    setIsGlobeSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setIsGlobeSidebarOpen(false);
    setSelectedHouseId(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold text-foreground">
            Houses Around the World
          </h1>
          {housesLoading && (
            <p className="mt-2 text-sm text-muted-foreground">
              Loading houses...
            </p>
          )}
        </div>

        {/* Globe and Grid Side by Side */}
        <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div>
            <div className="h-[600px] w-full overflow-hidden rounded-lg border border-border">
              <Suspense
                fallback={
                  <div className="flex h-full items-center justify-center">
                    <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-primary"></div>
                  </div>
                }
              >
                <World
                  globeConfig={globeConfig}
                  data={[]}
                  houses={houses}
                  onHouseClick={handleHouseClick}
                />
              </Suspense>
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                Click on the colored dots to view house details
              </p>
            </div>
          </div>

          <div>
            <div className="h-[600px] overflow-y-auto pr-2">
              <HousesGrid />
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            {houses.length} house{houses.length !== 1 ? "s" : ""} available
          </p>
          {houses.length === 0 && !housesLoading && (
            <p className="mt-2 text-sm text-muted-foreground">
              No houses found. Create some houses to see them here!
            </p>
          )}
        </div>
      </div>

      {selectedHouseId && (
        <HouseSidebar
          houseId={selectedHouseId}
          open={isGlobeSidebarOpen}
          onOpenChange={handleCloseSidebar}
        />
      )}
    </div>
  );
}
