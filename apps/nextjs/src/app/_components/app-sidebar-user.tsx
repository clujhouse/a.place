import React from "react";
import Link from "next/link";

import { authClient } from "@acme/auth/client";
import { Button } from "@acme/ui/button";
import { useSidebar } from "@acme/ui/sidebar";

export const AppSidebarUser = () => {
  const { data, isPending } = authClient.useSession();
  const { isMobile, setOpenMobile } = useSidebar();

  // Function to close sidebar on mobile when link is clicked
  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  if (isPending || !data)
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Link href="/login" className="w-full" onClick={handleLinkClick}>
          <Button className="w-full">log in</Button>
        </Link>
      </div>
    );

  return null;
};
