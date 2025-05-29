import type { Config } from "tailwindcss";
import tailwindTypography from "@tailwindcss/typography";
import { fontFamily } from "tailwindcss/defaultTheme";

import baseConfig from "@acme/tailwind-config/web";

export default {
  // We need to append the path to the UI package to the content array so that
  // those classes are included correctly.
  content: [
    ...baseConfig.content,
    "../../packages/ui/src/*.{ts,tsx}",
    "../../packages/editor/src/*.{ts,tsx}",
  ],
  presets: [baseConfig],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-raleway)", ...fontFamily.sans],
        // mono: ["var(--font-geist-mono)", ...fontFamily.mono],
      },
      animation: {
        first: "moveVertical 30s ease infinite",
        second: "moveInCircle 20s reverse infinite",
        third: "moveInCircle 40s linear infinite",
        fourth: "moveHorizontal 40s ease infinite",
        fifth: "moveInCircle 20s ease infinite",
        marquee: "marquee var(--duration) linear infinite",
        "marquee-reverse": "marquee var(--duration) linear infinite reverse",
        "marquee-vertical": "marquee-vertical var(--duration) linear infinite",
      },
      keyframes: {
        moveHorizontal: {
          "0%": {
            transform: "translateX(-50%) translateY(-10%)",
          },
          "50%": {
            transform: "translateX(50%) translateY(10%)",
          },
          "100%": {
            transform: "translateX(-50%) translateY(-10%)",
          },
        },
        moveInCircle: {
          "0%": {
            transform: "rotate(0deg)",
          },
          "50%": {
            transform: "rotate(180deg)",
          },
          "100%": {
            transform: "rotate(360deg)",
          },
        },
        moveVertical: {
          "0%": {
            transform: "translateY(-50%)",
          },
          "50%": {
            transform: "translateY(50%)",
          },
          "100%": {
            transform: "translateY(-50%)",
          },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(calc(-100% - var(--gap)))" },
        },
        "marquee-vertical": {
          from: { transform: "translateY(0)" },
          to: { transform: "translateY(calc(-100% - var(--gap)))" },
        },
      },
    },
  },
  plugins: [
    tailwindTypography,
    function ({ addUtilities }: { addUtilities: any }) {
      addUtilities({
        ".scrollbar-hide": {
          /* Hide scrollbar for Chrome, Safari and Opera */
          "&::-webkit-scrollbar": {
            display: "none",
          },
          /* Hide scrollbar for IE, Edge and Firefox */
          "-ms-overflow-style": "none",
          "scrollbar-width": "none",
        },
        ".scrollbar-thin": {
          "&::-webkit-scrollbar": {
            height: "6px",
            width: "6px",
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "rgba(0, 0, 0, 0.1)",
            borderRadius: "3px",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            backgroundColor: "rgba(0, 0, 0, 0.2)",
          },
        },
        ".scrollbar-track-transparent": {
          "&::-webkit-scrollbar-track": {
            backgroundColor: "transparent",
          },
        },
        ".scrollbar-thumb-muted-foreground\\/20": {
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "hsl(var(--muted-foreground) / 0.2)",
          },
        },
        ".hover\\:scrollbar-thumb-muted-foreground\\/40:hover": {
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "hsl(var(--muted-foreground) / 0.4)",
          },
        },
      });
    },
  ],
} satisfies Config;
