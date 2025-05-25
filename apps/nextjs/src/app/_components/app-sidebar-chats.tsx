"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, Plus } from "lucide-react";

import { Icon } from "@acme/ui/icon";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  useSidebar,
} from "@acme/ui/sidebar";

import { useTRPC } from "~/trpc/react";
import { AppSidebarChatItem } from "./app-sidebar-chat-item";

interface Chat {
  id: string;
  title: string;
  userId: string;
  visibility: "public" | "private";
  createdAt: Date;
}

export const AppSidebarChats = () => {
  const trpc = useTRPC();
  const { isMobile, setOpenMobile } = useSidebar();

  const { data: chats, isLoading } = useQuery(trpc.chat.getAll.queryOptions());

  // Function to close sidebar on mobile when link is clicked
  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  if (isLoading) {
    return (
      <SidebarMenu>
        {Array.from({ length: 3 }).map((_, index) => (
          <SidebarMenuItem key={index}>
            <SidebarMenuSkeleton showIcon />
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <Link href="/" onClick={handleLinkClick}>
            <Icon as={Plus} size="xs" />
            new chat
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      {chats?.map((chat: Chat) => (
        <AppSidebarChatItem key={chat.id} chat={chat} />
      ))}

      {(!chats || chats.length === 0) && (
        <SidebarMenuItem>
          <div className="px-2 py-1 text-sm text-sidebar-foreground/50">
            No chats yet. Create your first chat!
          </div>
        </SidebarMenuItem>
      )}
    </SidebarMenu>
  );
};
