interface HouseCardBackgroundProps {
  color: string;
  className?: string;
}

export function HouseCardBackground({
  color,
  className,
}: HouseCardBackgroundProps) {
  return (
    <div className={className}>
      {/* Main radial gradient background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: `radial-gradient(circle at 60% 40%, ${color}33 0%, ${color}cc 100%)`,
          opacity: 0.35,
        }}
      />
      {/* Additional linear gradient overlay */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: `linear-gradient(120deg, ${color}22 0%, transparent 70%)`,
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
    </div>
  );
}
