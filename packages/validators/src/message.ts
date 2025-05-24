import { z } from "zod";

export const textPartSchema = z.object({
  type: z.literal("text"),
  text: z.string(),
});

const attachmentSchema = z.object({
  type: z.literal("xddd"),
});

export const messageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant"]),

  chatId: z.string(),
  parts: z.array(textPartSchema),
  attachments: z.array(attachmentSchema),

  createdAt: z.date(),
});

export type AMessage = z.infer<typeof messageSchema>;
