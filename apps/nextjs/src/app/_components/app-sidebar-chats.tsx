"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSkeleton,
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

  const { data: chats, isLoading } = useQuery(trpc.chat.getAll.queryOptions());

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
