"use client";

import React, { useMemo, useState } from "react";
import { skipToken, useQuery } from "@tanstack/react-query";
import { nanoid } from "nanoid";

import { messageSchema } from "@acme/validators/message";

import { useCreateChat } from "~/hooks/use-create-chat";
import { useTRPC } from "~/trpc/react";
import MainChat from "./_components/main-chat";

const Homepage = () => {
  const [chatId, setChatId] = useState<string | null>(null);
  const trpc = useTRPC();
  const { createChat, createdChat } = useCreateChat();

  const { data } = useQuery(
    trpc.chat.get.queryOptions(createdChat ?? skipToken),
  );

  const message = useMemo(() => {
    return data?.map((message) => messageSchema.parse(message));
  }, [data]);

  return (
    <MainChat
      messages={message ?? []}
      chatId={() => {
        if (chatId) return chatId;

        const id = nanoid();
        setChatId(id);
        return createChat(id);
      }}
    />
  );
};

export default Homepage;
