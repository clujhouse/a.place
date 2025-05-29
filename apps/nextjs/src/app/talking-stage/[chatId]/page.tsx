"use client";

import React, { useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { messageSchema } from "@acme/validators/message";

import MainChat from "~/app/_components/main-chat";
import ClujhouseIcon from "~/components/clujhouse-icon";
import { useTRPC } from "~/trpc/react";

const Homepage = () => {
  const trpc = useTRPC();
  const { chatId } = useParams();

  const { data } = useQuery(
    trpc.chat.get.queryOptions(chatId as string, {
      enabled: !!chatId,
    }),
  );

  // Get all chats to find the current chat's title
  const { data: allChats } = useQuery(trpc.chat.getAll.queryOptions());

  // Find the current chat to get its title
  const currentChat = allChats?.find((chat) => chat.id === chatId);

  const message = useMemo(() => {
    return data?.map((message) => messageSchema.parse(message));
  }, [data]);

  // Update document title when chat title is available
  useEffect(() => {
    if (currentChat?.title) {
      document.title = currentChat.title.toLowerCase();
    }
  }, [currentChat?.title]);

  if (!message) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <ClujhouseIcon />
      </div>
    );
  }
  return <MainChat messages={message} chatId={chatId as string} />;
};

export default Homepage;
