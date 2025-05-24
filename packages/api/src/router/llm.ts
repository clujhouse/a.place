import type { TRPCRouterRecord } from "@trpc/server";
import { google } from "@ai-sdk/google";
import { generateObject, generateText, smoothStream, streamText } from "ai";
import { nanoid } from "nanoid";
import { VoyageAIClient } from "voyageai";
import { z } from "zod";

import type { AMessage } from "@acme/validators/message";
import { message, profile } from "@acme/db/schema";

import { judgePrompt } from "../prompts/judge-prompt";
import { learnWithRemainingQuestionsEmphasized } from "../prompts/learn-about-you";
import { profilePrompt, shortBioPrompt } from "../prompts/profile";
import { protectedProcedure } from "../trpc";
import { convertMessageToCoreMessage } from "../utils/message";

const validationResponseSchema = z.object({
  covered: z.boolean(),
  thoroughness: z.enum(["minimal", "adequate", "detailed"]),
  completionPercentage: z.number().min(0).max(100),
  missingTopics: z.array(z.string()),
  suggestedFollowUpQuestions: z.array(z.string()),
});

export const llmRouter = {
  learnAboutYou: protectedProcedure
    .input(
      z.object({
        chatId: z.string(),
        input: z.string(),
      }),
    )
    .mutation(async function* ({ ctx, input: { chatId, input } }) {
      // Get all messages from the chat with their full content
      const lastMessages = await ctx.db.query.message.findMany({
        where: (message, { eq }) => eq(message.chatId, chatId),
        orderBy: (message, { asc }) => asc(message.createdAt),
      });

      // Use the base prompt for now - suggested questions will be handled after validation

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

      const conversationForValidation = allMessages
        .map(
          (msg) =>
            `${msg.role}: ${msg.parts
              .filter((p) => p.type === "text")
              .map((p) => p.text)
              .join(" ")}`,
        )
        .join("\n");

      // Run validation
      const validation = await generateObject({
        model: google("gemini-2.0-flash"),
        mode: "json",
        schema: validationResponseSchema,
        prompt: `${judgePrompt}\n\n## Conversation to Analyze:\n${conversationForValidation}`,
      });

      yield {
        type: "completionPercentage" as const,
        validation: validation.object.completionPercentage,
      };

      const customPrompt = learnWithRemainingQuestionsEmphasized(
        validation.object.suggestedFollowUpQuestions,
      );
      const aiMessageId = nanoid();
      const result = streamText({
        model: google("gemini-2.0-flash"),
        messages: convertMessageToCoreMessage(allMessages),
        experimental_telemetry: { isEnabled: true },
        system: customPrompt,
      });

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

      // Convert messages to proper format for validation

      const profileStream = streamText({
        model: google("gemini-2.5-flash-preview-04-17"),
        experimental_telemetry: { isEnabled: true },
        prompt: `${profilePrompt}\n\n## Conversation Context:\n${convertMessageToCoreMessage(
          allMessages,
        )
          .map((msg) => `${msg.role}: ${msg.content}`)
          .join("\n")}`,
        experimental_transform: smoothStream({
          delayInMs: 20, // optional: defaults to 10ms
          chunking: "word", // optional: defaults to 'word'
        }),
      });

      for await (const chunk of profileStream.fullStream) {
        if (chunk.type === "text-delta") {
          yield {
            type: "profile" as const,
            chunk: chunk,
          };
        }
      }

      const profileText = await profileStream.text;
      // Generate short bio
      const { text: shortBioText } = await generateText({
        model: google("gemini-2.0-flash"),
        experimental_telemetry: { isEnabled: true },
        prompt: `${shortBioPrompt}\n\n## Conversation Context:\n${convertMessageToCoreMessage(
          allMessages,
        )
          .map((msg) => `${msg.role}: ${msg.content}`)
          .join("\n")}`,
      });

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
      // First check if a profile exists

      await ctx.db
        .insert(profile)
        .values({
          text: profileText,
          shortBio: shortBioText,
          userId: ctx.session.user.id,
          embedding: buffered,
        })
        .onDuplicateKeyUpdate({
          set: {
            text: profileText,
            shortBio: shortBioText,
            embedding: buffered,
            completionPercentage: validation.object.completionPercentage,
          },
        });
    }),
} satisfies TRPCRouterRecord;
