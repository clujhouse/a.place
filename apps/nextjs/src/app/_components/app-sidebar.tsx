"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { authClient } from "@acme/auth/client";
import { Button } from "@acme/ui";
import { Badge } from "@acme/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@acme/ui/sidebar";

import ClujhouseSimpleIcon from "~/components/clujhouse";
import { SearchUsageIndicator } from "~/components/search-usage-indicator";
import { useTRPC } from "~/trpc/react";
import { AppSidebarChats } from "./app-sidebar-chats";
import { AppSidebarUser } from "./app-sidebar-user";
import { CosmosLogo } from "./cosmos-logo";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const trpc = useTRPC();
  const { isMobile, setOpenMobile } = useSidebar();

  const { data: session } = authClient.useSession();
  const { data: conversations } = useQuery({
    ...trpc.conversation.getConversations.queryOptions(),
    refetchInterval: 30000, // Refetch every 2 seconds for real-time updates
    enabled: !!session,
  });

  // Hide sidebar on public profile pages - AFTER all hooks are called
  if (pathname.startsWith("/profile/")) {
    return null;
  }

  // Calculate total unread count
  const totalUnreadCount =
    conversations?.reduce(
      (total, conversation) => total + conversation.unreadCount,
      0,
    ) || 0;

  // Function to close sidebar on mobile when link is clicked
  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="pt-4">
        <SidebarMenu>
          <Link href="/" onClick={handleLinkClick}>
            <Button variant="ghost" size="icon" className="mb-4">
              <ClujhouseSimpleIcon className="h-6 w-6" />
            </Button>
          </Link>
          <SidebarMenuItem>
            <CosmosLogo href="/" onClick={handleLinkClick} />
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
              isActive={pathname === "/letters"}
            >
              <Link
                href="/letters"
                className="flex w-full items-center justify-between"
                onClick={handleLinkClick}
              >
                <span>letters</span>
                {totalUnreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="ml-2 h-5 min-w-5 text-xs"
                  >
                    {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
                  </Badge>
                )}
              </Link>
            </SidebarMenuButton>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
              isActive={pathname === "/babels-tower"}
            >
              <Link href="/babels-tower" onClick={handleLinkClick}>
                babel's tower{" "}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>your history</SidebarGroupLabel>
          <SidebarGroupContent>
            <AppSidebarChats />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SearchUsageIndicator />

        {/* <AppSidebarPlanIndicator /> */}

        <AppSidebarUser />
      </SidebarFooter>
    </Sidebar>
  );
}
