"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, Plus } from "lucide-react";

import { Icon } from "@acme/ui/icon";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from "@acme/ui/sidebar";

import { useTRPC } from "~/trpc/react";

interface Chat {
  id: string;
  title: string;
  userId: string;
  visibility: "public" | "private";
  createdAt: Date;
}

export const AppSidebarChats = () => {
  const trpc = useTRPC();
  const router = useRouter();

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
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={() => {
            router.push("/");
          }}
          className="text-sidebar-foreground/70"
        >
          <Icon as={Plus} size="sm" />
          <span>New Chat</span>
        </SidebarMenuButton>
      </SidebarMenuItem>

      {chats?.map((chat: Chat) => (
        <SidebarMenuItem key={chat.id}>
          <SidebarMenuButton asChild>
            <Link href={`/talking-stage/${chat.id}`}>
              <Icon as={MessageCircle} size="sm" />
              <span className="truncate">{chat.title}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
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
