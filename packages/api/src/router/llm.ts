import type { TRPCRouterRecord } from "@trpc/server";
import { google } from "@ai-sdk/google";
import { generateObject, smoothStream, streamText } from "ai";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { VoyageAIClient } from "voyageai";
import { z } from "zod";

import type { AMessage } from "@acme/validators/message";
import { message, profile } from "@acme/db/schema";

import { judgePrompt } from "../prompts/judge-prompt";
import {
  createLearnAboutYouPromptWithSuggestions,
  learnAboutYouPrompt,
} from "../prompts/learn-about-you";
import { profilePrompt, shortBioPrompt } from "../prompts/profile";
import { protectedProcedure } from "../trpc";
import { convertMessageToCoreMessage } from "../utils/message";

const validationResponseSchema = z.object({
  covered: z.boolean(),
  thoroughness: z.enum(["minimal", "adequate", "detailed"]),
  isGenuine: z.boolean(),
  excerpt: z.string(),
  completionPercentage: z.number().min(0).max(100),
  missingTopics: z.array(z.string()),
  suggestedFollowUpQuestions: z.array(z.string()),
});

export const llmRouter = {
  validateProfile: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: chatId }) => {
      // Get all messages from the chat
      const messages = await ctx.db.query.message.findMany({
        where: (message, { eq }) => eq(message.chatId, chatId),
        orderBy: (message, { asc }) => asc(message.createdAt),
      });

      // Convert messages to format expected by LLM
      const conversation = convertMessageToCoreMessage(messages as AMessage[]);

      // Get validation from LLM
      const result = await streamText({
        model: google("gemini-2.5-flash-preview-04-17"),
        prompt: `${judgePrompt}\n\n## Conversation to Analyze:\n${conversation.map((msg) => `${msg.role}: ${msg.content}`).join("\n")}`,
      });

      try {
        const rawText = await result.text;
        console.log("Raw validation result:", rawText);

        // Parse and validate the response
        const validation = validationResponseSchema.parse(
          JSON.parse(rawText.trim()),
        );
        console.log("Parsed validation:", JSON.stringify(validation, null, 2));

        // Update profile completion percentage
        await ctx.db
          .update(profile)
          .set({ completionPercentage: validation.completionPercentage })
          .where(eq(profile.userId, ctx.session.user.id));

        return validation;
      } catch (error) {
        console.error("Failed to parse LLM response:", error);
        console.error("Raw response:", await result.text);
        throw new Error("Failed to validate profile");
      }
    }),

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

      // Get the current profile to check for any existing validation results
      const currentProfile = await ctx.db.query.profile.findFirst({
        where: (profile, { eq }) => eq(profile.userId, ctx.session.user.id),
      });

      // Use the base prompt for now - suggested questions will be handled after validation
      const systemPrompt = learnAboutYouPrompt;

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

      // Store all messages for validation with proper content
      const messagesForValidation = allMessages.map((msg) => ({
        ...msg,
        parts: msg.parts.map((part) => {
          if (typeof part === "string") {
            return { type: "text" as const, text: part };
          }
          return part.type === "text"
            ? part
            : { type: "text" as const, text: "" };
        }),
      }));

      console.log(
        "Messages for validation:",
        JSON.stringify(messagesForValidation, null, 2),
      );

      const result = streamText({
        model: google("gemini-2.0-flash"),
        messages: convertMessageToCoreMessage(allMessages),
        experimental_telemetry: { isEnabled: true },
        system: systemPrompt,
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

      // Get all messages including the new ones for validation
      const allMessagesForValidation = await ctx.db.query.message.findMany({
        where: (message, { eq }) => eq(message.chatId, chatId),
        orderBy: (message, { asc }) => asc(message.createdAt),
      });

      // Convert messages to proper format for validation
      const conversationForValidation = convertMessageToCoreMessage(
        allMessagesForValidation as AMessage[],
      )
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join("\n");

      console.log(
        "Sending conversation for validation:",
        conversationForValidation,
      );

      // Run validation
      const validationResult = await generateObject({
        model: google("gemini-2.0-flash"),
        mode: "json",
        schema: validationResponseSchema,
        prompt: `${judgePrompt}\n\n## Conversation to Analyze:\n${conversationForValidation}`,
      });

      try {
        const validation = validationResult.object;
        console.log("Validation result:", JSON.stringify(validation, null, 2));

        // Ensure profile exists before updating completion percentage
        const profileForUpdate = await ctx.db.query.profile.findFirst({
          where: (profile, { eq }) => eq(profile.userId, ctx.session.user.id),
        });

        if (!profileForUpdate) {
          // Create profile if it doesn't exist
          await ctx.db.insert(profile).values({
            text: "",
            userId: ctx.session.user.id,
            embedding: Buffer.alloc(0),
            completionPercentage: validation.completionPercentage,
          });
          console.log("Created new profile for completion tracking");
        } else {
          // Update profile completion percentage
          await ctx.db
            .update(profile)
            .set({ completionPercentage: validation.completionPercentage })
            .where(eq(profile.userId, ctx.session.user.id));
        }

        console.log(
          "Updated profile completion percentage to:",
          validation.completionPercentage,
        );

        // Yield validation results
        yield {
          type: "validation" as const,
          validation,
        };
      } catch (error) {
        console.error("Failed to validate profile:", error);
        console.error(
          "Error details:",
          error instanceof Error ? error.message : String(error),
        );
      }

      const profielStream = streamText({
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

      let fullProfileText = "";

      for await (const chunk of profielStream.fullStream) {
        if (chunk.type === "text-delta") {
          fullProfileText += chunk.textDelta;
          yield {
            type: "profile" as const,
            chunk: chunk,
          };
        }
      }

      const profileText = await profielStream.text;

      // Generate short bio
      const shortBioStream = await streamText({
        model: google("gemini-2.5-flash-preview-04-17"),
        experimental_telemetry: { isEnabled: true },
        prompt: `${shortBioPrompt}\n\n## Conversation Context:\n${convertMessageToCoreMessage(
          allMessages,
        )
          .map((msg) => `${msg.role}: ${msg.content}`)
          .join("\n")}`,
      });

      const shortBioText = await shortBioStream.text;

      console.log("Generated short bio:", shortBioText);

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
      const existingProfile = await ctx.db.query.profile.findFirst({
        where: (profile, { eq }) => eq(profile.userId, ctx.session.user.id),
      });

      if (existingProfile) {
        // Update existing profile - preserve completion percentage
        await ctx.db
          .update(profile)
          .set({
            text: profileText,
            shortBio: shortBioText,
            embedding: buffered,
          })
          .where(eq(profile.userId, ctx.session.user.id));

        console.log("Updated existing profile with text and short bio");
      } else {
        // Create new profile
        await ctx.db.insert(profile).values({
          text: profileText,
          shortBio: shortBioText,
          userId: ctx.session.user.id,
          embedding: buffered,
          completionPercentage: 0, // Will be updated by validation
        });

        console.log("Created new profile with text and short bio");
      }

      // Verify the update
      const updatedProfile = await ctx.db.query.profile.findFirst({
        where: (profile, { eq }) => eq(profile.userId, ctx.session.user.id),
      });
      console.log("Profile after update:", updatedProfile);
    }),
} satisfies TRPCRouterRecord;
