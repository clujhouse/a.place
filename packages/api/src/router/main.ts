import type { TRPCRouterRecord } from "@trpc/server";
import { google } from "@ai-sdk/google";
import { generateText, smoothStream, streamText } from "ai";
import { eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { VoyageAIClient } from "voyageai";
import { z } from "zod";

import type { AMessage, ProfilePart } from "@acme/validators/message";
import { chat, message, profile, user } from "@acme/db/schema";

import { createSystemPromptWithProfiles } from "../prompts/main";
import { protectedProcedure } from "../trpc";
import { convertMessageToCoreMessage } from "../utils/message";

export const mainRouter = {
  chat: protectedProcedure
    .input(
      z.object({
        chatId: z.string(),
        input: z.string(),
      }),
    )
    .mutation(async function* ({ ctx, input }) {
      const { chatId, input: userInput } = input;

      // Create embedding for the user's message
      const client = new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY });
      const embedding = await client.embed({
        input: [userInput],
        model: "voyage-3-large",
      });

      const embeddingData = embedding.data?.[0]?.embedding;
      if (!embeddingData) {
        throw new Error("Failed to embed user message");
      }

      const query = ctx.db
        .select({ id: profile.userId, text: profile.text, name: user.name })
        .from(profile)
        .orderBy(
          sql`DISTANCE(TO_VECTOR(${JSON.stringify(embeddingData)}), ${profile.embedding}, 'L2_SQUARED')`,
        )
        .leftJoin(user, eq(profile.userId, user.id))
        .limit(10);

      // Write the SQL query to a file for debugging

      const similarProfiles = await query;

      // Get the current user's chat
      const userChat = await ctx.db.query.chat.findFirst({
        where: (chat, { eq }) => eq(chat.id, chatId),
      });

      if (!userChat) {
        throw new Error("Chat not found");
      }

      // Store the user message
      const userMessageData: Omit<AMessage, "id"> = {
        role: "user",
        chatId: chatId,
        attachments: [],
        parts: [{ id: nanoid(), type: "text", text: userInput }],
        createdAt: new Date(),
      };

      const insertResult = await ctx.db
        .insert(message)
        .values({
          ...userMessageData,
          id: nanoid(),
        })
        .$returningId();

      const aiMessageId = nanoid();
      yield { id: aiMessageId, type: "messageId" as const };

      if (!insertResult[0]) {
        throw new Error("Failed to insert user message");
      }

      // Get recent chat history
      const chatHistory = (await ctx.db.query.message.findMany({
        where: (message, { eq }) => eq(message.chatId, chatId),
        orderBy: (message, { asc }) => asc(message.createdAt),
        limit: 10,
      })) as AMessage[];

      // Stream the response
      const result = streamText({
        model: google("gemini-2.5-flash-preview-04-17"),
        messages: convertMessageToCoreMessage(chatHistory),
        experimental_telemetry: { isEnabled: true },
        system: createSystemPromptWithProfiles(similarProfiles),
        experimental_transform: smoothStream({
          delayInMs: 20, // optional: defaults to 10ms
          chunking: "word", // optional: defaults to 'word'
        }),
      });

      // Stream the response chunks
      const textPartId = nanoid();
      for await (const chunk of result.textStream)
        yield { id: textPartId, type: "text" as const, text: chunk };

      const textResponse = await result.text;

      // Store the final response with profiles if any were found
      const responseParts = [] as AMessage["parts"];

      // Add text part
      responseParts.push({ id: textPartId, type: "text", text: textResponse });

      // Add profile part if we have similar profiles
      if (similarProfiles.length > 0) {
        const profilePart: ProfilePart = {
          id: nanoid(),
          type: "profile",
          profiles: similarProfiles.map((p) => ({
            id: p.id,
            name: p.name ?? "Unknown",
          })),
        };
        responseParts.push(profilePart);

        yield profilePart;
      }

      await ctx.db.insert(message).values({
        id: aiMessageId,
        role: "assistant",
        parts: responseParts,
        chatId: chatId,
        attachments: [],
      });

      // Generate chat title if this is a new conversation (few messages)
      if (chatHistory.length <= 2) {
        const titleResult = await generateText({
          model: google("gemini-2.0-flash"),
          messages: [
            {
              role: "system",
              content:
                "Generate a short, descriptive title for this conversation. The title should be 3-7 words and capture the main topic or question. Return only the title without quotes or extra text.",
            },
            {
              role: "user",
              content: `Based on this conversation:\nUser: ${userInput}\nAssistant: ${textResponse}\n\nGenerate a title:`,
            },
          ],
        });

        // Update the chat title in the database
        await ctx.db
          .update(chat)
          .set({ title: titleResult.text })
          .where(eq(chat.id, chatId));

        // Yield the title update for client-side optimistic updates
        yield {
          type: "chatTitle" as const,
          title: titleResult.text,
          chatId: chatId,
        };
      }
    }),
} satisfies TRPCRouterRecord;
