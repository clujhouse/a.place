"use client";

import { Suspense, useState } from "react";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";

import { HouseSidebar } from "~/components/house-sidebar";
import { useTRPC } from "~/trpc/react";
import { HousesGrid } from "./_components/houses-grid";

const World = dynamic(() => import("./_components/globe"), {
  ssr: false,
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
    <div className="grid h-full grid-cols-2">
      {/* Globe and Grid Side by Side */}
      <HousesGrid />

      <Suspense>
        <World
          globeConfig={globeConfig}
          data={[]}
          houses={houses}
          onHouseClick={handleHouseClick}
        />
      </Suspense>

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
