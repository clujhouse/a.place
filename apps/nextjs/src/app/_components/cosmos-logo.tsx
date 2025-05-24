"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

import { cn } from "~/lib/utils";

interface CosmosLogoProps {
  href?: string;
}

// Predefined star configurations to avoid random generation on each render
const STAR_VARIANTS = [
  {
    id: 0,
    size: 1.5,
    delay: 0,
    duration: 4,
    positions: {
      x: [20, -30, 40],
      y: [10, -5, 12],
    },
  },
  {
    id: 1,
    size: 2,
    delay: 0.5,
    duration: 5,
    positions: {
      x: [-25, 35, -20],
      y: [-8, 15, -10],
    },
  },
  {
    id: 2,
    size: 1,
    delay: 1,
    duration: 3.5,
    positions: {
      x: [45, -10, 30],
      y: [5, -12, 8],
    },
  },
  {
    id: 3,
    size: 2.5,
    delay: 1.5,
    duration: 4.5,
    positions: {
      x: [-40, 25, -35],
      y: [12, -3, 10],
    },
  },
  {
    id: 4,
    size: 1.8,
    delay: 2,
    duration: 5.5,
    positions: {
      x: [30, -45, 20],
      y: [-10, 8, -5],
    },
  },
  {
    id: 5,
    size: 1.2,
    delay: 0.8,
    duration: 4.2,
    positions: {
      x: [-15, 40, -25],
      y: [8, -14, 6],
    },
  },
];

export function CosmosLogo({ href = "/" }: CosmosLogoProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link href={href}>
      <div
        className={cn(
          "group relative flex h-9 w-full items-center justify-start overflow-hidden rounded-md border border-yellow-800/40 bg-gradient-to-br from-gray-500/10 via-yellow-400/10 to-amber-500/10 pl-3 transition-all duration-300 hover:border-yellow-500/50 hover:from-gray-500/20 hover:via-yellow-400/20 hover:to-amber-500/20",
          !isActive && "opacity-80",
        )}
      >
        {/* Animated background glow */}
        <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-yellow-400/20 to-amber-500/20 blur-xl" />
        </div>

        {/* Floating stars/particles */}
        {STAR_VARIANTS.map((star) => (
          <motion.div
            key={star.id}
            className="absolute h-px w-px rounded-full bg-yellow-200"
            initial={{
              x: star.positions.x[0],
              y: star.positions.y[0],
              opacity: 0,
            }}
            animate={{
              x: star.positions.x,
              y: star.positions.y,
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: star.duration,
              delay: star.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              width: star.size,
              height: star.size,
              boxShadow: `0 0 ${star.size * 2}px rgba(251, 191, 36, 0.8)`,
            }}
          />
        ))}

        {/* Main text with gradient */}
        <motion.span
          className="relative z-10 bg-gradient-to-r from-yellow-500 to-amber-600 bg-clip-text text-sm font-bold tracking-wider text-transparent"
          initial={{ opacity: 0.8 }}
          animate={{
            opacity: isActive ? 1 : 0.8,
          }}
          whileHover={{
            scale: 1.05,
            opacity: 1,
          }}
          transition={{ duration: 0.2 }}
        >
          a place
        </motion.span>

        {/* Active indicator */}
        {isActive && (
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-yellow-500 to-amber-600"
            layoutId="cosmos-active-indicator"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </div>
    </Link>
  );
}
