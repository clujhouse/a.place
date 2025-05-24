import { z } from "zod";

export const textPartSchema = z.object({
  id: z.string(),
  type: z.literal("text"),
  text: z.string(),
});

export const profilePartSchema = z.object({
  id: z.string(),
  type: z.literal("profile"),
  profiles: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
    }),
  ),
});

const attachmentSchema = z.object({
  type: z.literal("xddd"),
});

export const messageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant"]),

  chatId: z.string(),
  parts: z.array(z.union([textPartSchema, profilePartSchema])),
  attachments: z.array(attachmentSchema),

  createdAt: z.date(),
});

export type AMessage = z.infer<typeof messageSchema>;
export type TextPart = z.infer<typeof textPartSchema>;
export type ProfilePart = z.infer<typeof profilePartSchema>;
