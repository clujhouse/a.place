"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

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
import { useTRPC } from "~/trpc/react";
import { AppSidebarChats } from "./app-sidebar-chats";
import { AppSidebarPlanIndicator } from "./app-sidebar-plan-indicator";
import { AppSidebarProfileCompletion } from "./app-sidebar-profile-completion";
import { AppSidebarUser } from "./app-sidebar-user";
import { CosmosLogo } from "./cosmos-logo";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const trpc = useTRPC();
  const { isMobile, setOpenMobile } = useSidebar();

  const { data: conversations } = useQuery({
    ...trpc.conversation.getConversations.queryOptions(),
    refetchInterval: 2000, // Refetch every 2 seconds for real-time updates
  });

  // Calculate total unread count
  const totalUnreadCount =
    conversations?.reduce(
      (total, conversation) => total + conversation.unreadCount,
      0,
    ) || 0;

  const pathname = usePathname();
  // Function to close sidebar on mobile when link is clicked
  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <Link href="/">
            <Button variant="ghost" size="icon" className="mb-4">
              <ClujhouseSimpleIcon className="h-6 w-6" />
            </Button>
          </Link>
          <SidebarMenuItem>
            <CosmosLogo href="/" />
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
              isActive={pathname === "/similar-profiles"}
            >
              <Link href="/similar-profiles">babel's tower </Link>
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
        <AppSidebarPlanIndicator />

        <AppSidebarProfileCompletion />

        <AppSidebarUser />
      </SidebarFooter>
    </Sidebar>
  );
}
