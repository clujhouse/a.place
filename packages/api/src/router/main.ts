import type { TRPCRouterRecord } from "@trpc/server";
import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { VoyageAIClient } from "voyageai";
import { z } from "zod";

import type { AMessage } from "@acme/validators/message";
import { message, profile } from "@acme/db/schema";

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
        .select({ text: profile.text })
        .from(profile)
        .orderBy(
          sql`DISTANCE(TO_VECTOR(${JSON.stringify(embeddingData)}), ${profile.embedding}, 'L2_SQUARED')`,
        )
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
        parts: [{ type: "text", text: userInput }],
        createdAt: new Date(),
      };

      const insertResult = await ctx.db
        .insert(message)
        .values({
          ...userMessageData,
          id: nanoid(),
        })
        .$returningId();

      if (!insertResult[0]) {
        throw new Error("Failed to insert user message");
      }

      const userMessageId = insertResult[0].id;

      // Get recent chat history
      const chatHistory = (await ctx.db.query.message.findMany({
        where: (message, { eq }) => eq(message.chatId, chatId),
        orderBy: (message, { desc }) => desc(message.createdAt),
        limit: 10,
      })) as AMessage[];

      // Stream the response
      const result = streamText({
        model: google("gemini-2.0-flash"),
        messages: convertMessageToCoreMessage([
          ...chatHistory,
          { ...userMessageData, id: userMessageId } as AMessage,
        ]),
        experimental_telemetry: { isEnabled: true },
        system: `You are an interactive chat system that responds based on user profiles.
                Here are the most similar user profiles to reference:
                ${similarProfiles.map((profile) => profile.text).join("\n\n")}
                
                Respond in a friendly, conversational manner. Use information from the profiles when relevant, but be natural.
                Keep responses concise and engage with the user's specific interests and background.`,
      });

      // Stream the response chunks
      for await (const chunk of result.fullStream) yield chunk;

      const textResponse = await result.text;

      // Store the final response
      await ctx.db.insert(message).values({
        role: "assistant",
        parts: [{ type: "text", text: textResponse }],
        chatId: chatId,
        attachments: [],
      });
    }),
} satisfies TRPCRouterRecord;
