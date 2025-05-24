"use client";

import React, { useMemo, useState } from "react";
import { skipToken, useMutation, useQuery } from "@tanstack/react-query";
import { nanoid } from "nanoid";

import { messageSchema } from "@acme/validators/message";

import { useTRPC } from "~/trpc/react";
import MainChat from "./_components/main-chat";

const Homepage = () => {
  const [chatId, setChatId] = useState<string | null>(null);
  const trpc = useTRPC();

  const { data: chat, mutateAsync } = useMutation(
    trpc.chat.create.mutationOptions(),
  );

  const { data } = useQuery(trpc.chat.get.queryOptions(chat ?? skipToken));

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
        return mutateAsync(id);
      }}
    />
  );
};

export default Homepage;
