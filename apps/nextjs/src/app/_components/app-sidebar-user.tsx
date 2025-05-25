import React, { useCallback } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { authClient } from "@acme/auth/client";
import { Avatar, AvatarFallback, AvatarImage } from "@acme/ui/avatar";
import { Button } from "@acme/ui/button";
import { Progress } from "@acme/ui/progress";
import { useSidebar } from "@acme/ui/sidebar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@acme/ui/tooltip";

import { useSubscription } from "~/hooks/use-subscription";
import { useTRPC } from "~/trpc/react";
import { useRouter } from "next/navigation";

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
  const { currentPlan, isLoading } = useSubscription();

  const trpc = useTRPC();
  const { isMobile, setOpenMobile } = useSidebar();
  const { data } = useQuery(trpc.profile.get.queryOptions());
  const router = useRouter();

  // Use the completionPercentage directly from the profile data
  const completionPercentage = data?.completionPercentage ?? 0;

  // Function to close sidebar on mobile when link is clicked
  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };
  const config = planConfig[currentPlan];

  const handleLogout = useCallback(async () => {
    await authClient.signOut({fetchOptions: {
      onSuccess: () => {
        window.location.reload();
      }
    }});
  }, [router]);

  if (isPending || !data)
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Link href="/login" className="w-full">
          <Button className="w-full">log in</Button>
        </Link>
      </div>
    );

  // Profile link component to be wrapped conditionally by tooltip
  const ProfileLink = (
    <Link
      href="/who-are-u"
      onClick={handleLinkClick}
      className="flex flex-col gap-2 border bg-background p-3 hover:bg-accent"
    >
      <div className="flex items-center gap-2">
        <Avatar>
          <AvatarImage src={data.profileImage ?? ""} />
          <AvatarFallback>
            {userClientData?.user.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">{userClientData?.user.name}</p>
          <p className="text-xs text-muted-foreground">{config.name}</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <h3 className="text-sm">completion%</h3>
        <span className="text-xs">{completionPercentage}%</span>
      </div>
      <Progress value={completionPercentage} className="h-2 w-full" />
      {completionPercentage < 100 && (
        <p className="text-xs text-muted-foreground">
          people really wanna know u, i know u might be an introvert, but
          trust me it really helps
        </p>
      )}
    </Link>
  );

  return (
    <div className="flex flex-col gap-2">
      {completionPercentage < 100 ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>{ProfileLink}</TooltipTrigger>
            <TooltipContent side="right" className="font-medium">
              please complete your profile
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        ProfileLink
      )}

      <Button variant="outline" className="w-full" onClick={handleLogout}>
        log out
      </Button>
    </div>
  );
};
