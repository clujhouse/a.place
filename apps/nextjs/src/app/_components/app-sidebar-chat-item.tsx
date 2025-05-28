"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@acme/ui/sidebar";

// import { ChatActionsDropdown } from "./chat-actions-dropdown";

interface Chat {
  id: string;
  title: string;
  userId: string;
  visibility: "public" | "private";
  createdAt: Date;
}

interface AppSidebarChatItemProps {
  chat: Chat;
}

export const AppSidebarChatItem = ({ chat }: AppSidebarChatItemProps) => {
  const [displayedTitle, setDisplayedTitle] = useState(chat.title);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const previousTitleRef = useRef(chat.title);
  const pathname = usePathname();

  const isSelected = pathname === `/talking-stage/${chat.id}`;
  const { isMobile, setOpenMobile } = useSidebar();

  // Function to close sidebar on mobile when link is clicked
  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  useEffect(() => {
    // Only start streaming if the title actually changed
    if (chat.title !== previousTitleRef.current) {
      previousTitleRef.current = chat.title;
      setIsStreaming(true);
      setDisplayedTitle("");

      let currentIndex = 0;
      const streamInterval = setInterval(() => {
        if (currentIndex < chat.title.length) {
          setDisplayedTitle(chat.title.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          setIsStreaming(false);
          clearInterval(streamInterval);
        }
      }, 50); // Adjust speed as needed

      return () => clearInterval(streamInterval);
    }
  }, [chat.title]); // Only depend on chat.title, not displayedTitle

  return (
    <SidebarMenuItem
      className="relative"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <SidebarMenuButton asChild isActive={isSelected}>
        <Link href={`/talking-stage/${chat.id}`} onClick={handleLinkClick}>
          {/* <Icon as={MessageCircle} size="sm" /> */}
          <span className="truncate">
            {displayedTitle}
            {isStreaming && (
              <span className="ml-1 inline-block h-4 w-2 animate-pulse bg-current opacity-75" />
            )}
          </span>
        </Link>
      </SidebarMenuButton>
      {/* <div className="absolute right-0 top-1/2 -translate-y-1/2">
        <ChatActionsDropdown chat={chat} isVisible={isHovering} />
      </div> */}
    </SidebarMenuItem>
  );
};
