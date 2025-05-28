"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

// Dynamically import Globe to prevent SSR issues
const Globe = dynamic(() => import("react-globe.gl"), {
  ssr: false,
});

type House = {
  id: string;
  name: string | null;
  description: string;
  locationName: string | null;
  latitude: string | null;
  longitude: string | null;
  color: string;
  logoImage: string | null;
  images: string[] | null;
  ownerId: string;
  createdAt: Date;
};

export type GlobeConfig = {
  pointSize?: number;
  globeColor?: string;
  showAtmosphere?: boolean;
  atmosphereColor?: string;
  atmosphereAltitude?: number;
  emissive?: string;
  emissiveIntensity?: number;
  shininess?: number;
  polygonColor?: string;
  ambientLight?: string;
  directionalLeftLight?: string;
  directionalTopLight?: string;
  pointLight?: string;
  arcTime?: number;
  arcLength?: number;
  rings?: number;
  maxRings?: number;
  initialPosition?: {
    lat: number;
    lng: number;
  };
  autoRotate?: boolean;
  autoRotateSpeed?: number;
};

interface WorldProps {
  globeConfig: GlobeConfig;
  data: any[];
  houses?: House[];
  onHouseClick?: (house: House) => void;
}

export function World({ globeConfig, houses = [], onHouseClick }: WorldProps) {
  const globeEl = useRef<any>(undefined);
  const [globeReady, setGlobeReady] = useState(false);

  // Convert houses to points data for the globe
  const pointsData = houses
    .filter((house) => house.latitude && house.longitude)
    .map((house) => ({
      id: house.id,
      lat: parseFloat(house.latitude!),
      lng: parseFloat(house.longitude!),
      color: house.color,
      size: 0.8,
      house: house,
    }));

  // Initialize globe settings
  useEffect(() => {
    if (globeEl.current && globeReady) {
      // Set initial camera position
      globeEl.current.pointOfView({
        lat: globeConfig.initialPosition?.lat || 22.3193,
        lng: globeConfig.initialPosition?.lng || 114.1694,
        altitude: 2.5,
      });

      // Enable auto-rotation if specified
      if (globeConfig.autoRotate) {
        globeEl.current.controls().autoRotate = true;
        globeEl.current.controls().autoRotateSpeed =
          globeConfig.autoRotateSpeed || 0.5;
      }
    }
  }, [globeReady, globeConfig]);

  // Handle point clicks directly
  const handlePointClick = (point: any) => {
    if (onHouseClick && point.house) {
      onHouseClick(point.house);
    }
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Globe
        ref={globeEl}
        onGlobeReady={() => setGlobeReady(true)}
        // Globe appearance
        globeImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg"
        backgroundColor={globeConfig.globeColor || "#062056"}
        // Atmosphere settings
        showAtmosphere={globeConfig.showAtmosphere !== false}
        atmosphereColor={globeConfig.atmosphereColor || "#FFFFFF"}
        atmosphereAltitude={globeConfig.atmosphereAltitude || 0.1}
        // Points (houses) configuration
        pointsData={pointsData}
        pointLat="lat"
        pointLng="lng"
        pointColor="color"
        pointAltitude={0.01}
        pointRadius={(d: any) => d.size}
        onPointClick={handlePointClick}
        // Point labels on hover
        pointLabel={(d: any) => `
          <div style="
            background: rgba(0,0,0,0.8); 
            color: white; 
            padding: 8px; 
            border-radius: 4px;
            border: 2px solid ${d.color};
          ">
            <strong>${d.house.name || "Unnamed House"}</strong><br/>
            ${d.house.locationName ? `<small>${d.house.locationName}</small><br/>` : ""}
            ${d.house.description.slice(0, 80)}${d.house.description.length > 80 ? "..." : ""}<br/>
            <small>Click to view details</small>
          </div>
        `}
        // Rings around houses
        ringsData={pointsData}
        ringLat="lat"
        ringLng="lng"
        ringColor="color"
        ringMaxRadius={2}
        ringPropagationSpeed={3}
        ringRepeatPeriod={2000}
        // Controls
        enablePointerInteraction={true}
      />
    </div>
  );
}

// Export the main World component
export default World;
