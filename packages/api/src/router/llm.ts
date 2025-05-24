import type { TRPCRouterRecord } from "@trpc/server";
import { google } from "@ai-sdk/google";
import { smoothStream, streamText } from "ai";
import { nanoid } from "nanoid";
import { VoyageAIClient } from "voyageai";
import { z } from "zod";

import type { AMessage } from "@acme/validators/message";
import { message, profile } from "@acme/db/schema";

import { learnAboutYouPrompt } from "../prompts/learn-about-you";
import { profilePrompt } from "../prompts/profile";
import { protectedProcedure } from "../trpc";
import { convertMessageToCoreMessage } from "../utils/message";

export const llmRouter = {
  learnAboutYou: protectedProcedure
    .input(
      z.object({
        chatId: z.string(),
        input: z.string(),
      }),
    )
    .mutation(async function* ({ ctx, input: { chatId, input } }) {
      const lastMessages = await ctx.db.query.message.findMany({
        where: (message, { eq }) => eq(message.chatId, chatId),
        orderBy: (message, { asc }) => asc(message.createdAt),
      });

      const userMessage = {
        id: nanoid(),
        role: "user" as const,
        chatId: chatId,
        attachments: [],
        parts: [{ id: nanoid(), type: "text", text: input }],
      };

      const userMessageId = await ctx.db
        .insert(message)
        .values(userMessage)
        .$returningId();

      const allMessages = [
        ...lastMessages,
        { ...userMessage, id: userMessageId },
      ] as AMessage[];

      const result = streamText({
        model: google("gemini-2.0-flash"),
        messages: convertMessageToCoreMessage(allMessages),
        experimental_telemetry: { isEnabled: true },
        system: learnAboutYouPrompt,
      });

      const aiMessageId = nanoid();

      yield {
        type: "learnAboutYou" as const,
        chunk: { type: "messageId" as const, id: aiMessageId },
      };

      const learnAboutYouPartId = nanoid();
      for await (const chunk of result.textStream) {
        yield {
          type: "learnAboutYou" as const,
          chunk: {
            id: learnAboutYouPartId,
            type: "text" as const,
            text: chunk,
          },
        };
      }

      const responseText = await result.text;

      await ctx.db.insert(message).values({
        id: aiMessageId,
        role: "assistant",
        parts: [{ id: learnAboutYouPartId, type: "text", text: responseText }],
        chatId: chatId,
        attachments: [],
      });

      const profielStream = streamText({
        model: google("gemini-2.5-flash-preview-04-17"),
        experimental_telemetry: { isEnabled: true },
        prompt: `${profilePrompt}\n\n## Conversation Context:\n${convertMessageToCoreMessage(allMessages).map(msg => `${msg.role}: ${msg.content}`).join('\n')}`,
        experimental_transform: smoothStream({
          delayInMs: 20, // optional: defaults to 10ms
          chunking: "word", // optional: defaults to 'word'
        }),
      });

      for await (const chunk of profielStream.fullStream) {
        yield {
          type: "profile" as const,
          chunk: chunk,
        };
      }

      const profileText = await profielStream.text;

      const client = new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY });
      const embedding = await client.embed({
        input: [profileText],
        model: "voyage-3-large",
      });

      const embeddingData = embedding.data?.[0]?.embedding;
      if (!embeddingData) {
        throw new Error("Failed to embed profile text");
      }

      const buffered = Buffer.from(new Float32Array(embeddingData).buffer);

      await ctx.db
        .insert(profile)
        .values({
          text: profileText,
          userId: ctx.session.user.id,
          embedding: buffered,
        })
        .onDuplicateKeyUpdate({
          set: {
            text: profileText,
            embedding: buffered,
          },
        });
    }),
} satisfies TRPCRouterRecord;
