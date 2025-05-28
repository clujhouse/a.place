import { useCallback, useState } from "react";
import { match } from "ts-pattern";

import type { AMessage, TextPart } from "@acme/validators/message";

type StreamPart =
  | { type: "text"; id: string; text: string }
  | { type: "messageId"; id: string }
  | { type: "step"; step?: string }
  | { type: "extracted"; data: any }
  | { type: "profileGenerating"; status: "generating" | "complete" };

interface UseStreamingMessagesOptions {
  onStep?: (step: string) => void;
  onExtracted?: (data: any) => void;
  onProfileGenerating?: (status: "generating" | "complete") => void;
}

export function useStreamingMessages(options?: UseStreamingMessagesOptions) {
  const [messages, setMessages] = useState<AMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addUserMessage = useCallback((content: string) => {
    const userMessage: AMessage = {
      id: crypto.randomUUID(),
      role: "user",
      chatId: "", // This will need to be provided by the component
      parts: [
        {
          id: crypto.randomUUID(),
          type: "text",
          text: content,
        },
      ],
      attachments: [],
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    return userMessage;
  }, []);

  const processStreamPart = useCallback(
    (
      part: StreamPart,
      messageState: { id: string; textPartId: string; content: string },
    ) => {
      match(part)
        .with({ type: "text" }, ({ text }) => {
          messageState.content += text;
          setMessages((prev) => {
            const existingMessage = prev.find(
              (msg) => msg.id === messageState.id,
            );
            if (existingMessage) {
              return prev.map((msg) => {
                if (msg.id === messageState.id) {
                  // Update the text part content
                  const updatedParts = msg.parts.map((p) => {
                    if (p.type === "text" && p.id === messageState.textPartId) {
                      return { ...p, text: messageState.content };
                    }
                    return p;
                  });
                  return { ...msg, parts: updatedParts };
                }
                return msg;
              });
            } else {
              // Create new message with text part
              const textPart: TextPart = {
                id: messageState.textPartId,
                type: "text",
                text: messageState.content,
              };
              return [
                ...prev,
                {
                  id: messageState.id,
                  role: "assistant" as const,
                  chatId: "",
                  parts: [textPart],
                  attachments: [],
                  createdAt: new Date(),
                },
              ];
            }
          });
        })
        .with({ type: "messageId" }, ({ id }) => {
          messageState.id = id;
          messageState.textPartId = crypto.randomUUID();
          messageState.content = "";
          // Create empty message with empty text part
          const textPart: TextPart = {
            id: messageState.textPartId,
            type: "text",
            text: "",
          };
          setMessages((prev) => [
            ...prev,
            {
              id,
              role: "assistant" as const,
              chatId: "",
              parts: [textPart],
              attachments: [],
              createdAt: new Date(),
            },
          ]);
        })
        .with({ type: "step" }, ({ step }) => {
          if (step && options?.onStep) {
            options.onStep(step);
          }
        })
        .with({ type: "extracted" }, ({ data }) => {
          if (options?.onExtracted) {
            options.onExtracted(data);
          }
        })
        .with({ type: "profileGenerating" }, ({ status }) => {
          if (options?.onProfileGenerating) {
            options.onProfileGenerating(status);
          }
        })
        .exhaustive();
    },
    [options],
  );

  const processStream = useCallback(
    async (stream: AsyncIterable<StreamPart>) => {
      setIsLoading(true);
      const messageState = { id: "", textPartId: "", content: "" };

      try {
        for await (const part of stream) {
          processStreamPart(part, messageState);
        }
      } finally {
        setIsLoading(false);
      }

      return messageState;
    },
    [processStreamPart],
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const removeMessage = useCallback((id: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
  }, []);

  return {
    messages,
    isLoading,
    setIsLoading,
    addUserMessage,
    processStream,
    processStreamPart,
    clearMessages,
    removeMessage,
  };
}
