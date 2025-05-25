import type { TRPCRouterRecord } from "@trpc/server";
import { google } from "@ai-sdk/google";
import { generateText, smoothStream, streamText } from "ai";
import { eq, ne, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { VoyageAIClient } from "voyageai";
import { z } from "zod";

import type { AMessage, ProfilePart } from "@acme/validators/message";
import { chat, message, profile, user } from "@acme/db/schema";

import { createSystemPromptWithProfiles } from "../prompts/main";
import { checkSearchLimits } from "../rate-limit";
import { protectedProcedure } from "../trpc";
import { convertMessageToCoreMessage } from "../utils/message";
import { rerankWithVoyage } from "../utils/rerank";

export const mainRouter = {
  getSearchUsage: protectedProcedure.query(async ({ ctx }) => {
    // If user is not logged in, return null
    if (!ctx.session.user.id) {
      return null;
    }

    const userId = ctx.session.user.id;
    const stripeCustomerId = ctx.session.user.stripeCustomerId;

    // Check if user has an active subscription
    let activeSubscription = null;
    if (stripeCustomerId) {
      activeSubscription = await ctx.db.query.subscription.findFirst({
        where: (subscription, { eq, and }) =>
          and(
            eq(subscription.stripeCustomerId, stripeCustomerId),
            eq(subscription.status, "active"),
          ),
      });
    }

    // If user has an active subscription, they have unlimited searches
    if (activeSubscription) {
      return {
        type: "premium" as const,
        plan: activeSubscription.plan,
        unlimited: true,
      };
    }

    // For free users, check their current usage
    const { Ratelimit } = await import("@upstash/ratelimit");
    const { Redis } = await import("@upstash/redis");

    const ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, "1 d"), // 5 requests per day
      analytics: true,
    });

    const { remaining, reset } = await ratelimit.getRemaining(
      `search:${userId}`,
    );
    const limit = 5; // We know the limit is 5 searches per day

    return {
      type: "free" as const,
      limit,
      remaining,
      used: limit - remaining,
      reset,
    };
  }),

  chat: protectedProcedure
    .input(
      z.object({
        chatId: z.string(),
        input: z.string(),
      }),
    )
    .mutation(async function* ({ ctx, input }) {
      const { chatId, input: userInput } = input;

      // Check search limits for free users
      // await checkSearchLimits(ctx);

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
        .where(ne(profile.userId, ctx.session.user.id))
        .limit(20); // Increased limit to get more candidates for reranking

      const initialProfiles = await query;

      // Rerank the profiles using Voyage AI for better relevance
      const profileItems = initialProfiles.map((profile) => ({
        text: profile.text,
        data: profile,
      }));

      const similarProfiles = await rerankWithVoyage(
        client,
        userInput,
        profileItems,
        { 
          topK: 3, 
          relevanceThreshold: 0.3,
          model: "rerank-2"
        },
      );

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
