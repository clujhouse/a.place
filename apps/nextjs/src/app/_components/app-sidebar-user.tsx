import React, { useCallback } from "react";
import Link from "next/link";

import { authClient } from "@acme/auth/client";
import { Avatar, AvatarFallback, AvatarImage } from "@acme/ui/avatar";
import { Button } from "@acme/ui/button";
import { useSidebar } from "@acme/ui/sidebar";

import { useSubscription } from "~/hooks/use-subscription";

const planConfig = {
  standard: {
    name: "you are our guest",
  },
  pro: {
    name: "we love u",
  },
  pro_exclusive: {
    name: "thank you king",
  },
};

export const AppSidebarUser = () => {
  const { data: userClientData, isPending } = authClient.useSession();
  const { currentPlan } = useSubscription();

  const { isMobile, setOpenMobile } = useSidebar();

  // Function to close sidebar on mobile when link is clicked
  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };
  const config = planConfig[currentPlan];

  const handleLogout = useCallback(async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.reload();
        },
      },
    });
  }, []);

  if (isPending || !userClientData)
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Link href="/login" className="w-full" onClick={handleLinkClick}>
          <Button className="w-full">log in</Button>
        </Link>
      </div>
    );

  return (
    <div className="flex flex-col gap-2">
      <Link
        href="/who-are-u"
        onClick={handleLinkClick}
        className="flex items-center gap-2 border bg-background p-3 hover:bg-accent"
      >
        <Avatar>
          {userClientData.user.image && (
            <AvatarImage
              src={userClientData.user.image}
              className="grayscale hover:grayscale-0"
            />
          )}
          <AvatarFallback>
            {userClientData.user.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">{userClientData.user.name}</p>
          <p className="text-xs text-muted-foreground">{config.name}</p>
        </div>
      </Link>

      <Button variant="outline" className="w-full" onClick={handleLogout}>
        log out
      </Button>
    </div>
  );
};
