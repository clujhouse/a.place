import React from "react";
import ReactMarkdown from "react-markdown";

import type { AMessage } from "@acme/validators/message";
import { cn } from "@acme/ui";

interface ChatMessageProps {
  message: AMessage;
}

export const ChatMessage = ({ message }: ChatMessageProps) => {
  return (
    <div className="flex flex-col gap-2 text-lg">
      <div className="flex items-center gap-2">
        <span className="text-gray-500">
          {message.role === "user" ? "you" : "dylan"}
        </span>
      </div>
      <div className={cn("flex flex-col gap-2")}>
        <ReactMarkdown>
          {message.parts.map((part) => part.text).join("")}
        </ReactMarkdown>
      </div>
    </div>
  );
};
