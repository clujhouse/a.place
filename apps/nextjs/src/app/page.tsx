"use client";

import React, { Suspense } from "react";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";

import { useCreateChat } from "~/hooks/use-create-chat";
import MainChat from "./_components/main-chat";
import MainPresentation from "./_components/main-presentation";

const Homepage = () => {
  const router = useRouter();
  const { createChat } = useCreateChat();

  return (
    <div className="flex h-full flex-col">
      <MainPresentation />
      <Suspense fallback={null}>
        <MainChat
          isHomepage
          messages={[]}
          onSubmit={async (message) => {
            const chatId = nanoid();
            await createChat(chatId);

            router.push(`/talking-stage/${chatId}?query=${message}`);
          }}
        />
      </Suspense>
    </div>
  );
};

export default Homepage;
