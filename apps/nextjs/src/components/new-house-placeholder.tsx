"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";

export function NewHousePlaceholder() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <div
            className="group relative flex min-h-[220px] w-full cursor-pointer flex-col items-center justify-center gap-4 overflow-hidden p-6"
            onClick={() => setOpen(true)}
          >
            {/* Gradients and noise overlays */}
            <div
              className="absolute inset-0 z-0"
              style={{
                background: `radial-gradient(circle at 60% 40%, #e5e7eb33 0%, #e5e7ebcc 100%)`,
                opacity: 0.35,
              }}
            />
            <div
              className="absolute inset-0 z-0"
              style={{
                background: `linear-gradient(120deg, #e5e7eb22 0%, transparent 70%)`,
                opacity: 0.7,
                mixBlendMode: "screen",
              }}
            />
            <div
              className="absolute inset-0 z-0"
              style={{
                background: `radial-gradient(circle at 10% 90%, #fff3 0%, transparent 80%)`,
                opacity: 0.5,
                mixBlendMode: "soft-light",
              }}
            />
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
            <div className="z-20 flex h-24 w-24 items-center justify-center bg-muted/60 transition group-hover:bg-muted/80">
              <Plus className="h-12 w-12 text-muted-foreground" />
            </div>
            <div className="relative z-20 flex w-full flex-col items-center">
              <p className="text-center text-2xl font-bold tracking-tight">
                New House
              </p>
              <p className="mt-2 text-balance text-center text-sm text-muted-foreground">
                show your community
              </p>
            </div>
          </div>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>sharing light with my eyes</DialogTitle>
            <DialogDescription>
              yo just ping me at{" "}
              <a
                href="mailto:andrew@kairoskraft.so"
                className="text-primary underline"
              >
                andrew@kairoskraft.so
              </a>{" "}
              to add a new house.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
