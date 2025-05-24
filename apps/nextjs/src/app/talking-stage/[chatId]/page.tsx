"use client";

import React, { useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { messageSchema } from "@acme/validators/message";

import MainChat from "~/app/_components/main-chat";
import { useTRPC } from "~/trpc/react";

const Homepage = () => {
  const trpc = useTRPC();
  const { chatId } = useParams();

  const { data } = useQuery(
    trpc.chat.get.queryOptions(chatId as string, {
      enabled: !!chatId,
    }),
  );

  const message = useMemo(() => {
    return data?.map((message) => messageSchema.parse(message));
  }, [data]);

  if (!message) return <div>Loading...</div>;
  return <MainChat messages={message} chatId={chatId as string} />;
};

export default Homepage;
