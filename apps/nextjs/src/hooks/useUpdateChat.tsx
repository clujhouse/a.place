import { useQueryClient } from "@tanstack/react-query";
import { nanoid } from "nanoid";
import { match } from "ts-pattern";

import type { AMessage } from "@acme/validators/message";

import { useTRPC } from "~/trpc/react";

export const createBotMessage = (
  id: string,
  part: AMessage["parts"][number],
  chatId: string,
) =>
  ({
    id,
    role: "assistant",
    parts: [part],
    chatId,
    attachments: [],
    createdAt: new Date(),
  }) satisfies AMessage;

export const createUserMessage = (input: string, chatId: string) => {
  const message: AMessage = {
    role: "user",
    parts: [{ id: nanoid(), type: "text", text: input }],
    id: nanoid(),
    chatId,
    attachments: [],
    createdAt: new Date(),
  };
  return message;
};

export const useUpdateChat = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const updateChat = (
    messageId: string,
    part: AMessage["parts"][number],
    chatId: string,
  ) => {
    queryClient.setQueryData(trpc.chat.get.queryKey(chatId), (old) => {
      if (!old) return [];

      const oldMessage = old.find((msg) => msg.id === messageId);
      if (!oldMessage)
        return [...old, createBotMessage(messageId, part, chatId)];

      return old.map((msg) => {
        if (msg.id === messageId) {
          return match(part)
            .with({ type: "text" }, (textPart) => {
              const parts = msg.parts;

              return {
                ...msg,
                parts: parts.map((currentPart) => {
                  if (part.id === textPart.id && currentPart.type === "text") {
                    return {
                      ...part,
                      text: currentPart.text + textPart.text,
                    };
                  }
                  return part;
                }),
              } satisfies AMessage;
            })
            .with({ type: "profile" }, (profilePart) => {
              return {
                ...msg,
                parts: [...msg.parts, profilePart],
              } satisfies AMessage;
            })
            .exhaustive();
        }
        return msg;
      });
    });
  };
  return { updateChat };
};
