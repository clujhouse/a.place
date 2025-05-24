"use client";

import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { messageSchema } from "@acme/validators/message";

import { useTRPC } from "~/trpc/react";
import ProfileChat from "./_components/profile-chat";

const WhoAreYouPage = () => {
  const trpc = useTRPC();

  const { data: profileChat } = useQuery(
    trpc.profile.getProfileChat.queryOptions(),
  );

  const { data } = useQuery(
    trpc.chat.get.queryOptions(profileChat?.id ?? "", {
      enabled: !!profileChat,
    }),
  );

  const message = useMemo(() => {
    return data?.map((message) => messageSchema.parse(message));
  }, [data]);

  if (!profileChat || !message) return <div>Loading...</div>;

  return (
    <div className="h-screen w-full">
      <ProfileChat messages={message} chatId={profileChat.id} />
    </div>
  );
};

export default WhoAreYouPage;
