"use client";

import type { GlobeMethods } from "react-globe.gl";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";

// Dynamically import Globe to prevent SSR issues
const Globe = dynamic(() => import("react-globe.gl"), {
  ssr: false,
});

interface House {
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
}

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
  houses?: House[];
  onHouseClick?: (house: House) => void;
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
    return isLightMode ? "rgba(200, 200, 200, 0.3)" : "rgba(50, 50, 50, 0.3)";
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

  // Return rgba with consistent opacity
  return `rgba(${greyValue}, ${greyValue}, ${greyValue}, 0.6)`;
}

export function World({ globeConfig, houses = [], onHouseClick }: WorldProps) {
  const globeEl = useRef<GlobeMethods>(undefined);

  const { theme } = useTheme();
  const [globeReady, setGlobeReady] = useState(false);
  const [countries, setCountries] = useState<CountriesData>({ features: [] });
  const [populationRange, setPopulationRange] = useState({ min: 0, max: 0 });

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
    if (onHouseClick && point.house) {
      onHouseClick(point.house);
    }
  };

  // Custom polygon cap color function
  const getPolygonCapColor = (obj: any) => {
    const country = obj as CountryFeature;

    console.log(country);
    const population = country.properties.POP_EST;
    if (!population || population <= 0) {
      return theme === "light"
        ? "rgba(180, 180, 180, 0.3)"
        : "rgba(100, 100, 100, 0.3)"; // Default grey for countries with no population data
    }
    return getPopulationColor(
      population,
      populationRange.min,
      populationRange.max,
      theme === "light",
    );
  };

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

  console.log(width, height);

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
        hexPolygonsData={houses}
        hexPolygonResolution={3}
        hexPolygonMargin={0.3}
        hexPolygonUseDots={true}
        hexPolygonColor={() =>
          `#${Math.round(Math.random() * Math.pow(2, 24))
            .toString(16)
            .padStart(6, "0")}`
        }
        polygonsData={countries.features.filter(
          (d) => d.properties.ISO_A2 !== "AQ",
        )}
        polygonCapColor={getPolygonCapColor}
        polygonSideColor={() =>
          theme === "light"
            ? "rgba(140, 140, 140, 0.15)"
            : "rgba(40, 40, 40, 0.15)"
        }
        // Points (houses) configuration
        pointsData={pointsData}
        pointLat="lat"
        pointLng="lng"
        pointColor="color"
        pointAltitude={0.01}
        pointRadius={(d: any) => d.size}
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
