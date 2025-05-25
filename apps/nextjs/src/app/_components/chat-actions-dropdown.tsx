"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Trash2 } from "lucide-react";

import { Button } from "@acme/ui";
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
        asChild
        className={` ${isVisible ? "opacity-100" : "opacity-0"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <Icon as={MoreHorizontal} size="sm" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="bottom">
        <DropdownMenuItem
          className="gap-2"
          onClick={handleDeleteChat}
          disabled={isPending}
        >
          <Icon as={Trash2} size="sm" />
          <span>{isPending ? "Deleting..." : "Delete chat"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
