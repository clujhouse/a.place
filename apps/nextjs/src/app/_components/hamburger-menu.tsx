"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import { Button } from "@acme/ui";
import { useSidebar } from "@acme/ui/sidebar";

export function HamburgerMenu() {
  const pathname = usePathname();
  const { toggleSidebar } = useSidebar();

  // Hide hamburger menu on public profile pages - AFTER all hooks are called
  if (pathname.startsWith("/profile/") || pathname.startsWith("/letters/")) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="fixed left-4 top-4 z-50 md:hidden"
      onClick={toggleSidebar}
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
}
