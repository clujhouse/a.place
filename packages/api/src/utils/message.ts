import type { AMessage } from "@acme/validators/message";

export const convertMessageToCoreMessage = (messages: AMessage[]) => {
  const formatted = messages.map((message) => {
    const textParts = message.parts.filter((part) => part.type === "text");

    return {
      role: message.role,
      content: textParts.map((part) => part.text).join(""),
    };
  });

  return formatted;
};
