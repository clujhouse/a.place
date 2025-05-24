"use client";

import React, { useMemo } from "react";
import { skipToken, useMutation, useQuery } from "@tanstack/react-query";
import { nanoid } from "nanoid";

import { messageSchema } from "@acme/validators/message";

import { useTRPC } from "~/trpc/react";
import MainChat from "./_components/main-chat";

const Homepage = () => {
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
        return mutateAsync(nanoid());
      }}
    />
  );
};

export default Homepage;
