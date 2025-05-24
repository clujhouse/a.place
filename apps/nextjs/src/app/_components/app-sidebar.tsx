"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

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
} from "@acme/ui/sidebar";

import { UpgradeButton } from "~/components/upgrade-button";
import { useTRPC } from "~/trpc/react";
import { AppSidebarChats } from "./app-sidebar-chats";
import { AppSidebarPlanIndicator } from "./app-sidebar-plan-indicator";
import { AppSidebarProfileCompletion } from "./app-sidebar-profile-completion";
import { AppSidebarUser } from "./app-sidebar-user";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const trpc = useTRPC();

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

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <Link href="/" className="text-base font-semibold">a.place</Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/">the world is not that small</Link>
            </SidebarMenuButton>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link
                href="/letters"
                className="flex w-full items-center justify-between"
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
            >
              <Link href="/similar-profiles">find your people</Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>your chats</SidebarGroupLabel>
          <SidebarGroupContent>
            <AppSidebarChats />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <UpgradeButton />

        <AppSidebarPlanIndicator />

        <AppSidebarProfileCompletion />

        <AppSidebarUser />
      </SidebarFooter>
    </Sidebar>
  );
}
