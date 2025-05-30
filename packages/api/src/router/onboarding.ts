import type { TRPCRouterRecord } from "@trpc/server";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";

import type { AMessage } from "@acme/validators/message";
import {
  generateTextResponse,
  onboardingWithContext,
  profilePrompt,
  shortBioPrompt,
  streamSmoothText,
} from "@acme/ai";
import { onboardingState, profile, user } from "@acme/db/schema";

import { protectedProcedure } from "../trpc";
import { convertMessageToCoreMessage } from "../utils/message";

const extractedInfoSchema = z.object({
  name: z.string().nullable(),
  location: z.string().nullable(),
  story: z.string().nullable(),
});

export const onboardingRouter = {
  getState: protectedProcedure.query(async ({ ctx }) => {
    const state = await ctx.db.query.onboardingState.findFirst({
      where: (onboardingState, { eq }) =>
        eq(onboardingState.userId, ctx.session.user.id),
    });

    return state;
  }),

  getInitialMessage: protectedProcedure.mutation(async function* ({ ctx }) {
    // Get or create onboarding state
    let state = await ctx.db.query.onboardingState.findFirst({
      where: (onboardingState, { eq }) =>
        eq(onboardingState.userId, ctx.session.user.id),
    });

    if (!state) {
      await ctx.db.insert(onboardingState).values({
        userId: ctx.session.user.id,
        currentStep: "initial",
      });
      state = await ctx.db.query.onboardingState.findFirst({
        where: (onboardingState, { eq }) =>
          eq(onboardingState.userId, ctx.session.user.id),
      });
    }
    if (!state) throw new Error("Failed to create onboarding state");

    // Generate AI greeting based on current state
    const aiMessageId = nanoid();

    yield { type: "messageId" as const, id: aiMessageId };

    const textPartId = nanoid();
    let assistantText = "";

    // Create context about what we already know
    const contextInfo = {
      currentStep: state.currentStep,
      extractedName: state.extractedName,
      extractedLocation: state.extractedLocation,
      extractedOneLiner: state.extractedOneLiner,
    };

    const result = await streamSmoothText({
      system: onboardingWithContext(state.currentStep, contextInfo),
    });

    for await (const chunk of result.textStream) {
      assistantText += chunk;
      yield {
        type: "text" as const,
        id: textPartId,
        text: chunk,
      };
    }

    yield {
      type: "step" as const,
      step: state.currentStep,
    };

    // Save the initial greeting to conversation history
    await ctx.db
      .update(onboardingState)
      .set({
        conversationHistory: [
          {
            role: "assistant" as const,
            content: assistantText,
            timestamp: new Date().toISOString(),
          },
        ],
      })
      .where(eq(onboardingState.userId, ctx.session.user.id));
  }),

  chat: protectedProcedure
    .input(
      z.object({
        input: z.string(),
        messages: z.array(
          z.object({
            role: z.enum(["user", "assistant"]),
            content: z.string(),
          }),
        ),
      }),
    )
    .mutation(async function* ({ ctx, input: { input, messages } }) {
      // Get or create onboarding state
      let state = await ctx.db.query.onboardingState.findFirst({
        where: (onboardingState, { eq }) =>
          eq(onboardingState.userId, ctx.session.user.id),
      });

      if (!state) {
        await ctx.db.insert(onboardingState).values({
          userId: ctx.session.user.id,
          currentStep: "initial",
        });
        state = await ctx.db.query.onboardingState.findFirst({
          where: (onboardingState, { eq }) =>
            eq(onboardingState.userId, ctx.session.user.id),
        });
      }
      if (!state) throw new Error("Failed to create onboarding state");

      // Convert messages to AMessage format for processing
      const formattedMessages: AMessage[] = messages.map((msg) => ({
        id: nanoid(),
        role: msg.role,
        chatId: "onboarding",
        parts: [{ id: nanoid(), type: "text", text: msg.content }],
        attachments: [],
        createdAt: new Date(),
      }));

      // Add current user message
      const userMessage: AMessage = {
        id: nanoid(),
        role: "user",
        chatId: "onboarding",
        parts: [{ id: nanoid(), type: "text", text: input }],
        attachments: [],
        createdAt: new Date(),
      };
      const allMessages = [...formattedMessages, userMessage];

      // Generate AI response
      const aiMessageId = nanoid();
      yield { type: "messageId" as const, id: aiMessageId };
      const textPartId = nanoid();
      let assistantText = "";

      // Create context about what we already know
      const contextInfo = {
        currentStep: state.currentStep,
        extractedName: state.extractedName,
        extractedLocation: state.extractedLocation,
        extractedOneLiner: state.extractedOneLiner,
      };

      const result = await streamSmoothText({
        messages: convertMessageToCoreMessage(allMessages),
        system: onboardingWithContext(state.currentStep, contextInfo),
      });

      for await (const chunk of result.textStream) {
        assistantText += chunk;
        yield {
          type: "text" as const,
          id: textPartId,
          text: chunk,
        };
      }

      // Add assistant message for extraction
      const assistantMessage: AMessage = {
        id: aiMessageId,
        role: "assistant",
        chatId: "onboarding",
        parts: [{ id: textPartId, type: "text", text: assistantText }],
        attachments: [],
        createdAt: new Date(),
      };
      const updatedMessages = [...allMessages, assistantMessage];

      // Extract information from the conversation
      const extractionResult = await generateObject({
        model: google("gemini-2.0-flash"),
        schema: extractedInfoSchema,
        prompt: `Extract the following information from this conversation:\n- name: The user's name if they mentioned it\n- location: Where they're from or based if mentioned\n- story: Their story, what they're building, or what they're passionate about\n\nConversation:\n${convertMessageToCoreMessage(
          updatedMessages,
        )
          .map((m) => `${m.role}: ${m.content}`)
          .join("\n")}\n\nReturn null for any field not mentioned.`,
      });

      // Determine next step based on current step and what info we have
      // Steps can only move forward: initial -> name -> location -> story -> image -> complete
      let nextStep = state.currentStep;

      if (state.currentStep === "initial" && extractionResult.object.name) {
        nextStep = "name";
      } else if (
        state.currentStep === "name" &&
        extractionResult.object.location
      ) {
        nextStep = "location";
      } else if (
        state.currentStep === "location" &&
        extractionResult.object.story
      ) {
        nextStep = "story";
      } else if (state.currentStep === "story") {
        // Always move to image step after story, regardless of extraction
        nextStep = "image";
      } else if (state.currentStep === "image") {
        // Always move to complete after image step
        nextStep = "complete";
      }

      // Only update extracted info if we don't already have it (prevent overwriting)
      const updatedExtractedName =
        state.extractedName || extractionResult.object.name;
      const updatedExtractedLocation =
        state.extractedLocation || extractionResult.object.location;
      const updatedExtractedStory =
        state.extractedOneLiner || extractionResult.object.story;

      // Prepare updated conversation history
      const existingHistory = state.conversationHistory || [];
      const updatedHistory = [
        ...existingHistory,
        {
          role: "user" as const,
          content: input,
          timestamp: new Date().toISOString(),
        },
        {
          role: "assistant" as const,
          content: assistantText,
          timestamp: new Date().toISOString(),
        },
      ];

      // Update user's name in the database if extracted and not already set
      if (extractionResult.object.name && !state.extractedName) {
        await ctx.db
          .update(user)
          .set({ name: extractionResult.object.name })
          .where(eq(user.id, ctx.session.user.id));
      }

      // Update state with extracted information
      await ctx.db
        .update(onboardingState)
        .set({
          currentStep: nextStep,
          extractedName: updatedExtractedName,
          extractedLocation: updatedExtractedLocation,
          extractedOneLiner: updatedExtractedStory,
          conversationHistory: updatedHistory,
          completedAt: nextStep === "complete" ? new Date() : null,
        })
        .where(eq(onboardingState.userId, ctx.session.user.id));

      // If we've reached the complete step, automatically complete onboarding
      if (nextStep === "complete") {
        // Yield profile generation start
        yield {
          type: "profileGenerating" as const,
          status: "generating" as const,
        };

        // Create a conversation context from the onboarding data for AI generation
        const conversationContext = [];

        // First, add the conversation history from the database
        if (updatedHistory.length > 0) {
          conversationContext.push(
            ...updatedHistory.map((msg) => `${msg.role}: ${msg.content}`),
          );
        } else {
          // Fallback to extracted data if no conversation history
          if (updatedExtractedName) {
            conversationContext.push(
              `user: My name is ${updatedExtractedName}`,
            );
          }

          if (updatedExtractedLocation) {
            conversationContext.push(
              `user: I'm from ${updatedExtractedLocation}`,
            );
          }

          if (updatedExtractedStory) {
            conversationContext.push(`user: ${updatedExtractedStory}`);
          }
        }

        // Generate profile content using AI if we have any onboarding data
        let profileText = "";
        let shortBio = "";

        if (conversationContext.length > 0) {
          // Generate full profile text and short bio in parallel using AI
          const [generatedProfileText, generatedShortBio] = await Promise.all([
            generateTextResponse({
              prompt: `${profilePrompt}\n\n## Conversation Context:\n${conversationContext.join("\n")}`,
              model: "gemini-2.5-flash-preview-04-17",
            }),
            generateTextResponse({
              prompt: `${shortBioPrompt}\n\n## Conversation Context:\n${conversationContext.join("\n")}`,
              model: "gemini-2.5-flash-preview-04-17",
            }),
          ]);

          profileText = generatedProfileText.text;
          shortBio = generatedShortBio.text;
        } else {
          // Fallback to default content if no onboarding data
          profileText = `# ${updatedExtractedName || "Welcome"}\n\nI'm excited to be part of this community and looking forward to connecting with others!`;
          shortBio = "New member excited to connect and share experiences.";
        }

        // Upsert profile with AI-generated content
        await ctx.db
          .insert(profile)
          .values({
            userId: ctx.session.user.id,
            completionPercentage: 100,
            isOnboarded: true,
            text: profileText,
            shortBio: shortBio,
          })
          .onDuplicateKeyUpdate({
            set: {
              isOnboarded: true,
              text: profileText,
              shortBio: shortBio,
              completionPercentage: 100,
            },
          });

        // Yield profile generation complete
        yield {
          type: "profileGenerating" as const,
          status: "complete" as const,
        };
      }

      yield {
        type: "step" as const,
        step: nextStep,
      };

      yield {
        type: "extracted" as const,
        data: {
          name: updatedExtractedName,
          location: updatedExtractedLocation,
          story: updatedExtractedStory,
        },
      };
    }),
} satisfies TRPCRouterRecord;
