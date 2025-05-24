import React from "react";
import ReactMarkdown from "react-markdown";
import { match } from "ts-pattern";

import type { AMessage } from "@acme/validators/message";
import { cn } from "@acme/ui";

import { ProfileCard } from "./profile-card";

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
        {message.parts.map((part) => {
          return match(part)
            .with({ type: "text" }, (textPart) => {
              return (
                <ReactMarkdown key={part.id}>{textPart.text}</ReactMarkdown>
              );
            })
            .with({ type: "profile" }, (profilePart) => {
              return (
                <div key={part.id} className="flex flex-row gap-2">
                  {profilePart.profiles.map((profile) => (
                    <ProfileCard profile={profile} />
                  ))}
                </div>
              );
            })
            .exhaustive();
        })}
      </div>
    </div>
  );
};
