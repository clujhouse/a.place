"use client";

import { Button } from "@acme/ui/button";
import { useSidebar } from "@acme/ui/sidebar";

export function HamburgerMenu() {
  const { toggleSidebar } = useSidebar();

  return (
    <div className="fixed left-4 top-4 z-50 block md:hidden">
      <Button
        variant="outline"
        size="icon"
        onClick={toggleSidebar}
        className="h-10 w-10 rounded-lg bg-background shadow-md hover:bg-accent"
      >
        <div className="flex flex-col items-center justify-center space-y-1">
          <div className="h-0.5 w-4 bg-current"></div>
          <div className="h-0.5 w-4 bg-current"></div>
          <div className="h-0.5 w-4 bg-current"></div>
        </div>
        <span className="sr-only">Toggle sidebar</span>
      </Button>
    </div>
  );
}
