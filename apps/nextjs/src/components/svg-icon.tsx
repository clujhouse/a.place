"use client";

import { useEffect, useState } from "react";

import { cn } from "@acme/ui";

interface SvgIconProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
}

// Safe SVG sanitization without external dependencies
function sanitizeSvg(svgText: string): string {
  // Remove dangerous elements and attributes
  const dangerous = [
    /<script[^>]*>.*?<\/script>/gi,
    /<style[^>]*>.*?<\/style>/gi,
    /on\w+\s*=\s*["'][^"']*["']/gi, // onclick, onload, etc.
    /javascript:/gi,
    /data:/gi,
    /vbscript:/gi,
    /<embed[^>]*>/gi,
    /<object[^>]*>.*?<\/object>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /<link[^>]*>/gi,
    /<meta[^>]*>/gi,
  ];

  let cleaned = svgText;

  // Remove dangerous content
  dangerous.forEach((pattern) => {
    cleaned = cleaned.replace(pattern, "");
  });

  // Only allow SVG elements we trust
  const allowedElements = [
    "svg",
    "g",
    "path",
    "circle",
    "rect",
    "line",
    "polyline",
    "polygon",
    "ellipse",
    "text",
    "tspan",
    "defs",
    "clipPath",
    "mask",
    "pattern",
    "linearGradient",
    "radialGradient",
    "stop",
    "use",
    "symbol",
  ];

  // Validate it's actually an SVG
  if (!cleaned.includes("<svg")) {
    throw new Error("Not a valid SVG");
  }

  return cleaned;
}

export function SvgIcon({ src, alt, className, fallback }: SvgIconProps) {
  const [svgContent, setSvgContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const fetchSvg = async () => {
      try {
        setIsLoading(true);
        setHasError(false);

        const response = await fetch(src);
        if (!response.ok) {
          throw new Error(`Failed to fetch SVG: ${response.status}`);
        }

        const text = await response.text();

        // Sanitize the SVG content
        const sanitized = sanitizeSvg(text);

        // Clean up the SVG content to make it styleable
        const cleanedSvg = sanitized
          .replace(/fill="[^"]*"/g, 'fill="currentColor"')
          .replace(/stroke="[^"]*"/g, 'stroke="currentColor"')
          .replace(/<svg/, `<svg class="${cn("inline-block", className)}"`);

        setSvgContent(cleanedSvg);
      } catch (error) {
        console.error("Error loading SVG:", error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    if (src) {
      fetchSvg();
    }
  }, [src, className]);

  if (isLoading) {
    return (
      <div
        className={cn("animate-pulse rounded bg-muted", className)}
        aria-label={`Loading ${alt}`}
      />
    );
  }

  if (hasError || !svgContent) {
    return (
      fallback || (
        <div
          className={cn(
            "flex items-center justify-center rounded bg-muted",
            className,
          )}
          aria-label={`Failed to load ${alt}`}
        >
          <span className="text-xs text-muted-foreground">?</span>
        </div>
      )
    );
  }

  return (
    <div
      className={cn("flex items-center justify-center", className)}
      dangerouslySetInnerHTML={{ __html: svgContent }}
      aria-label={alt}
    />
  );
}
