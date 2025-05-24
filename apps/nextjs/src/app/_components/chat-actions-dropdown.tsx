"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Trash2 } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu";
import { Icon } from "@acme/ui/icon";

import { useTRPC } from "~/trpc/react";

interface Chat {
  id: string;
  title: string;
  userId: string;
  visibility: "public" | "private";
  createdAt: Date;
}

interface ChatActionsDropdownProps {
  chat: Chat;
  isVisible: boolean;
}

export const ChatActionsDropdown = ({
  chat,
  isVisible,
}: ChatActionsDropdownProps) => {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { mutate: deleteChat, isPending } = useMutation(
    trpc.chat.delete.mutationOptions({
      onSuccess: () => {
        // Invalidate and refetch the chats list
        queryClient.invalidateQueries({
          queryKey: trpc.chat.getAll.queryKey(),
        });

        // Navigate to home if we're currently viewing this chat
        const currentPath = window.location.pathname;
        if (currentPath.includes(chat.id)) {
          router.push("/");
        }
      },
    }),
  );

  const handleDeleteChat = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    deleteChat(chat.id);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={`flex size-5 items-center justify-center rounded-md transition-opacity hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus:opacity-100 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <Icon as={MoreHorizontal} size="sm" />
        <span className="sr-only">Chat actions</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="right">
        <DropdownMenuItem
          onClick={handleDeleteChat}
          disabled={isPending}
          className="text-destructive focus:text-destructive"
        >
          <Icon as={Trash2} size="sm" />
          <span>{isPending ? "Deleting..." : "Delete chat"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
