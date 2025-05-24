"use client";

import Link from "next/link";

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
import { AppSidebarChats } from "./app-sidebar-chats";
import { AppSidebarPlanIndicator } from "./app-sidebar-plan-indicator";
import { AppSidebarProfileCompletion } from "./app-sidebar-profile-completion";
import { AppSidebarUser } from "./app-sidebar-user";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <span className="text-base font-semibold">a.place</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/">the world is not that small</Link>
            </SidebarMenuButton>
            <SidebarMenuButton className="data-[slot=sidebar-menu-button]:!p-1.5">
              letters
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
        <div className="p-2">
          <UpgradeButton />
        </div>

        <AppSidebarPlanIndicator />

        <AppSidebarProfileCompletion />

        <AppSidebarUser />
      </SidebarFooter>
    </Sidebar>
  );
}
