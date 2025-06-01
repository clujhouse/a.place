"use client";

import React, { Suspense } from "react";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";

import { authClient } from "@acme/auth/client";

import { useCreateChat } from "~/hooks/use-create-chat";
import { useLoginDialog } from "~/hooks/use-login-dialog";
import MainChat from "./_components/main-chat";
import MainPresentation from "./_components/main-presentation";

const Homepage = () => {
  const router = useRouter();
  const { createChat } = useCreateChat();
  const { openLoginDialog } = useLoginDialog();
  const { data: session } = authClient.useSession();

  return (
    <div className="relative flex h-full flex-col">
      <div
        className="absolute inset-0 z-0 w-full"
        style={{
          backgroundImage: "url(/mask-test.png)", // Replace with your image path
          backgroundPosition: "center",
          backgroundSize: "cover",
          opacity: 0.4,
        }}
      />

      <MainPresentation />
      <Suspense fallback={null}>
        <MainChat
          isHomepage
          messages={[]}
          onSubmit={async (message) => {
            // Check if user is logged in
            if (!session?.user) {
              openLoginDialog("homepage_chat_submit");
              return;
            }

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
