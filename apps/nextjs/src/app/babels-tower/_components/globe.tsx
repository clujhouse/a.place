"use client";

import type { GlobeMethods } from "react-globe.gl";
import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { useTheme } from "next-themes";

import { selectedHouseAtom } from "~/lib/atoms";
import { useTRPC } from "~/trpc/react";

// Dynamically import Globe to prevent SSR issues
const Globe = dynamic(() => import("react-globe.gl"), {
  ssr: false,
});

// Add proper typing for country data
interface CountryProperties {
  ADMIN: string;
  ISO_A2: string;
  POP_EST: number;
}

interface CountryFeature {
  properties: CountryProperties;
  geometry: any;
  type: string;
}

interface CountriesData {
  features: CountryFeature[];
}

export interface GlobeConfig {
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
}

interface WorldProps {
  globeConfig: GlobeConfig;
  data: any[];
}

// Color scale function for population-based coloring (grey scale)
function getPopulationColor(
  population: number,
  minPop: number,
  maxPop: number,
  isLightMode = false,
): string {
  // Handle edge cases
  if (maxPop <= 0 || minPop < 0 || population <= 0) {
    return isLightMode ? "#C8C8C8" : "#323232";
  }

  // Normalize population to 0-1 range using logarithmic scale
  const normalized = Math.min(
    1,
    Math.max(0, Math.log(population + 1) / Math.log(maxPop + 1)),
  );

  // Define grey scale gradient based on theme
  let minGrey: number, maxGrey: number;

  if (isLightMode) {
    // Light mode: lighter colors overall
    minGrey = 240; // Very light grey for low population
    maxGrey = 120; // Medium grey for high population
  } else {
    // Dark mode: darker colors overall
    minGrey = 200; // Light grey for low population
    maxGrey = 40; // Dark grey for high population
  }

  // Interpolate between min and max grey values
  const greyValue = Math.round(minGrey - (minGrey - maxGrey) * normalized);

  // Return solid rgb color
  return `rgb(${greyValue}, ${greyValue}, ${greyValue})`;
}

export function World({ globeConfig }: WorldProps) {
  const trpc = useTRPC();
  const { data: houses = [] } = useQuery(trpc.house.getAll.queryOptions());
  const globeEl = useRef<GlobeMethods>(undefined);
  const [selectedHouse, setSelectedHouse] = useAtom(selectedHouseAtom);

  const { theme } = useTheme();
  const [globeReady, setGlobeReady] = useState(false);
  const [countries, setCountries] = useState<CountriesData>({ features: [] });
  const [populationRange, setPopulationRange] = useState({ min: 0, max: 0 });

  // Convert houses to points data for the globe
  const pointsData = houses
    .filter((house) => house.latitude && house.longitude)
    .map((house) => ({
      id: house.id,
      lat: parseFloat(house.latitude),
      lng: parseFloat(house.longitude),
      color: house.color,
      size: 0.8,
      house: house,
    }));

  // Load countries data and calculate population range
  useEffect(() => {
    void fetch("../datasets/countries.geojson")
      .then((res) => res.json())
      .then((data: CountriesData) => {
        setCountries(data);

        // Calculate min and max population for color scaling
        const populations = data.features
          .filter((d) => d.properties.ISO_A2 !== "AQ")
          .map((d) => d.properties.POP_EST)
          .filter((pop) => pop > 0);

        const minPop = Math.min(...populations);
        const maxPop = Math.max(...populations);
        setPopulationRange({ min: minPop, max: maxPop });
      });
  }, []);

  // Initialize globe settings
  useEffect(() => {
    if (globeEl.current && globeReady) {
      // Set initial camera position
      globeEl.current.pointOfView({
        lat: globeConfig.initialPosition?.lat || 46.7712,
        lng: globeConfig.initialPosition?.lng || 23.6236,
        altitude: 2.5,
      });

      // Enable auto-rotation if specified
      if (globeConfig.autoRotate) {
        globeEl.current.controls().autoRotate = false;
        globeEl.current.controls().autoRotateSpeed =
          globeConfig.autoRotateSpeed || 0.5;
      }
    }
  }, [globeReady, globeConfig]);

  // Handle point clicks directly
  const handlePointClick = (point: any) => {
    const house = point.house;
    if (house) {
      setSelectedHouse(house);
    }
  };

  // Focus globe on selected house
  useEffect(() => {
    if (
      globeEl.current &&
      globeReady &&
      selectedHouse &&
      selectedHouse.latitude &&
      selectedHouse.longitude
    ) {
      const lat = parseFloat(selectedHouse.latitude);
      const lng = parseFloat(selectedHouse.longitude);

      globeEl.current.pointOfView(
        {
          lat,
          lng,
          altitude: 1.5, // Zoom in closer to the selected house
        },
        1000,
      ); // Smooth transition over 1 second
    }
  }, [selectedHouse, globeReady]);

  // Reset selected house when globe is manually moved
  useEffect(() => {
    if (globeEl.current && globeReady) {
      const controls = globeEl.current.controls();

      const handleControlsChange = () => {
        // Only reset if there's a selected house and user is manually interacting
        if (selectedHouse && controls.autoRotate === false) {
          setSelectedHouse(null);
        }
      };

      controls.addEventListener("change", handleControlsChange);

      // Cleanup
      return () => {
        controls.removeEventListener("change", handleControlsChange);
      };
    }
  }, [globeReady, selectedHouse, setSelectedHouse]);

  // Custom polygon cap color function
  const getPolygonCapColor = (obj: any) => {
    const country = obj as CountryFeature;

    const population = country.properties.POP_EST;
    if (!population || population <= 0) {
      return theme === "light" ? "#B4B4B4" : "#646464"; // Default grey for countries with no population data
    }
    return getPopulationColor(
      population,
      populationRange.min,
      populationRange.max,
      theme === "light",
    );
  };

  const formattedHexPolygonsData = useMemo(() => {
    return houses.map((house) => ({
      ...house,
      color: house.color,
      type: "Feature",
    }));
  }, [houses]);

  const globeContainerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (globeContainerRef.current) {
      const { offsetWidth, offsetHeight } = globeContainerRef.current;
      setWidth(offsetWidth);
      setHeight(offsetHeight);
    }
  }, []);

  return (
    <div ref={globeContainerRef} className="w-full">
      <Globe
        width={width}
        height={height}
        ref={globeEl}
        globeImageUrl={
          theme === "light"
            ? "./globe/earth-light.jpg"
            : "//cdn.jsdelivr.net/npm/three-globe/example/img/earth-dark.jpg"
        }
        onGlobeReady={() => setGlobeReady(true)}
        // Globe appearance
        backgroundColor="rgba(0,0,0,0)" // Atmosphere settings
        showAtmosphere={globeConfig.showAtmosphere !== false}
        atmosphereColor={
          theme === "light"
            ? "#87CEEB"
            : globeConfig.atmosphereColor || "#FFFFFF"
        }
        atmosphereAltitude={globeConfig.atmosphereAltitude || 0.1}
        polygonAltitude={0.01}
        polygonsData={countries.features.filter(
          (d) => d.properties.ISO_A2 !== "AQ",
        )}
        polygonCapColor={getPolygonCapColor}
        polygonSideColor={() => (theme === "light" ? "#8C8C8C" : "#282828")}
        // Points (houses) configuration
        pointsData={pointsData}
        pointLat="lat"
        pointLng="lng"
        pointColor="color"
        pointRadius={(d: any) => d.size}
        pointsTransitionDuration={0}
        onPointClick={handlePointClick}
        // Point labels on hover

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
