"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";

import { Separator } from "@acme/ui";

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
  autoRotate: true,
  autoRotateSpeed: 0.5,
};

export default function BabelsTowerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid h-full grid-cols-1 md:grid-cols-2">
      {children}
      <Suspense fallback={null}>
        <World globeConfig={globeConfig} data={[]} />
      </Suspense>
    </div>
  );
}
