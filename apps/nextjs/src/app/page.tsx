"use client";

import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { messageSchema } from "@acme/validators/message";

import { useTRPC } from "~/trpc/react";
import MainChat from "./_components/main-chat";

const Homepage = () => {
  const trpc = useTRPC();

  const { data: chat } = useQuery(trpc.chat.create.queryOptions("cool-chat"));

  const { data } = useQuery(
    trpc.chat.get.queryOptions("cool-chat", {
      enabled: !!chat,
    }),
  );

  const message = useMemo(() => {
    return data?.map((message) => messageSchema.parse(message));
  }, [data]);

  if (!chat || !message) return <div>Loading...</div>;
  return <MainChat messages={message} chatId={chat} />;
};

export default Homepage;
